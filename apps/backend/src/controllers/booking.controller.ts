// backend/src/controllers/booking.controller.ts

import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AppError } from '../middleware/error.middleware'
import { AuthRequest } from '../types'
import {
  createBookingNotificationForHost,
  createBookingApprovalNotifications,
  createBookingRejectionNotifications,
  createPaymentReceivedNotification
} from './notification.controller'
import Stripe from 'stripe'

const prisma = new PrismaClient()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' as any })

// Helper function - MUHIM!
const ensureString = (value: string | string[] | undefined): string => {
  if (!value) {
    throw new AppError('Parameter required', 400)
  }
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

// ============================================
// 1. Faqat PaymentIntent yaratish (bron yaratmaydi!)
// ============================================
export const createPaymentIntent = async (req: AuthRequest, res: Response) => {
  const { listingId, checkIn, checkOut, guests } = req.body

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing) throw new AppError('Listing topilmadi', 404)
  if (guests > listing.maxGuests) throw new AppError('Mehmonlar soni ko\'p', 400)

  // Faqat confirmed bronlarni tekshirish
  const conflicting = await prisma.booking.findFirst({
    where: {
      listingId,
      status: 'confirmed',
      OR: [
        { checkIn: { lte: new Date(checkOut) }, checkOut: { gte: new Date(checkIn) } }
      ]
    }
  })
  if (conflicting) throw new AppError('Bu sanalar band', 409)

  const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
  
  const basePrice = nights * listing.price
  const cleaningFee = basePrice * 0.1
  const serviceFee = basePrice * 0.05
  const totalPrice = basePrice + cleaningFee + serviceFee

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalPrice * 100),
    currency: 'usd',
    metadata: {
      listingId,
      checkIn,
      checkOut,
      guests: guests.toString(),
      userId: req.userId!,
      basePrice: basePrice.toString(),
      cleaningFee: cleaningFee.toString(),
      serviceFee: serviceFee.toString(),
      totalPrice: totalPrice.toString()
    }
  })

  res.json({ 
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    totalPrice: totalPrice
  })
}

// ============================================
// 2. To'lov muvaffaqiyatli bo'lgandan keyin bron yaratish
// ============================================
export const createBookingAfterPayment = async (req: AuthRequest, res: Response) => {
  const { paymentIntentId } = req.body

  if (!paymentIntentId) {
    throw new AppError('PaymentIntent ID kerak', 400)
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  
  if (paymentIntent.status !== 'succeeded') {
    throw new AppError('To\'lov amalga oshmadi', 400)
  }

  const { listingId, checkIn, checkOut, guests, userId } = paymentIntent.metadata

  if (!listingId || !checkIn || !checkOut || !guests || !userId) {
    throw new AppError('To\'lov ma\'lumotlari to\'liq emas', 400)
  }

  const conflicting = await prisma.booking.findFirst({
    where: {
      listingId,
      status: 'confirmed',
      OR: [
        { checkIn: { lte: new Date(checkOut) }, checkOut: { gte: new Date(checkIn) } }
      ]
    }
  })
  if (conflicting) throw new AppError('Bu sanalar band', 409)

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing) throw new AppError('Listing topilmadi', 404)

  const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
  const totalPrice = nights * listing.price

  const booking = await prisma.booking.create({
    data: {
      listingId,
      guestId: userId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests: parseInt(guests),
      totalPrice,
      status: 'confirmed',
      stripePaymentId: paymentIntentId
    },
    include: {
      listing: { select: { id: true, title: true, images: true, address: true, city: true, country: true } },
      guest: { select: { id: true, name: true, email: true } }
    }
  })

  // Hostga yangi bron haqida notification yuborish
  await createBookingNotificationForHost(
    booking.id,
    listing.hostId,
    booking.guest?.name || 'Mehmon',
    listing.title,
    booking.checkIn,
    booking.guests,
    booking.totalPrice
  )

  // To'lov qabul qilingani haqida notification (agar to'lov bo'lsa)
  await createPaymentReceivedNotification(
    booking.id,
    listing.hostId,
    listing.title,
    booking.totalPrice
  )

  res.status(201).json(booking)
}

// ============================================
// 3. Eski createBooking (backward compatibility)
// ============================================
export const createBooking = async (req: AuthRequest, res: Response) => {
  const { listingId, checkIn, checkOut, guests } = req.body

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing) throw new AppError('Listing topilmadi', 404)
  if (guests > listing.maxGuests) throw new AppError('Mehmonlar soni ko\'p', 400)

  const conflicting = await prisma.booking.findFirst({
    where: {
      listingId,
      status: { in: ['confirmed', 'pending'] },
      OR: [
        { checkIn: { lte: new Date(checkOut) }, checkOut: { gte: new Date(checkIn) } }
      ]
    }
  })
  if (conflicting) throw new AppError('Bu sanalar band', 409)

  const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
  const totalPrice = nights * listing.price

  const booking = await prisma.booking.create({
    data: {
      listingId, 
      guestId: req.userId!,
      checkIn: new Date(checkIn), 
      checkOut: new Date(checkOut),
      guests, 
      totalPrice, 
      status: 'pending'
    },
    include: { 
      listing: { select: { title: true, images: true, address: true, hostId: true } },
      guest: { select: { id: true, name: true, email: true } }
    }
  })

  // Hostga yangi bron haqida notification yuborish (pending holatda)
  await createBookingNotificationForHost(
    booking.id,
    booking.listing.hostId,
    booking.guest?.name || 'Mehmon',
    booking.listing.title,
    booking.checkIn,
    booking.guests,
    booking.totalPrice
  )

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalPrice * 100),
    currency: 'usd',
    metadata: { bookingId: booking.id }
  })

  res.status(201).json({ booking, clientSecret: paymentIntent.client_secret })
}

// ============================================
// 4. CONFIRM BOOKING
// ============================================
export const confirmBooking = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)
  const { paymentIntentId } = req.body

  const booking = await prisma.booking.findUnique({ 
    where: { id },
    include: { listing: true, guest: true }
  })
  if (!booking) throw new AppError('Bron topilmadi', 404)

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (paymentIntent.status !== 'succeeded') throw new AppError('To\'lov amalga oshmadi', 400)

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'confirmed', stripePaymentId: paymentIntentId }
  })

  // Tasdiqlash notificationlari
  await createBookingApprovalNotifications(
    booking.id,
    booking.listing.hostId,
    booking.guestId,
    booking.listing.title
  )

  // To'lov qabul qilingani haqida notification
  await createPaymentReceivedNotification(
    booking.id,
    booking.listing.hostId,
    booking.listing.title,
    booking.totalPrice
  )

  res.json({ message: 'Bron tasdiqlandi', booking: updated })
}

// ============================================
// 5. CANCEL BOOKING (USER)
// ============================================
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)

  const booking = await prisma.booking.findUnique({ 
    where: { id },
    include: { listing: true }
  })
  if (!booking) throw new AppError('Bron topilmadi', 404)
  if (booking.guestId !== req.userId) throw new AppError('Ruxsat yo\'q', 403)

  await prisma.booking.update({
    where: { id },
    data: { status: 'cancelled' }
  })

  // To'lovni qaytarish
  if (booking.stripePaymentId) {
    await stripe.refunds.create({
      payment_intent: booking.stripePaymentId,
      amount: booking.totalPrice * 100
    })
  }

  // Bekor qilish notificationi
  await createBookingRejectionNotifications(
    booking.id,
    booking.listing.hostId,
    req.userId!,
    booking.listing.title,
    'Foydalanuvchi tomonidan bekor qilindi'
  )

  res.json({ message: 'Bron bekor qilindi va to\'lov qaytarildi' })
}

// ============================================
// 6. GET MY BOOKINGS (USER)
// ============================================
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  const bookings = await prisma.booking.findMany({
    where: { guestId: req.userId },
    include: { listing: { select: { id: true, title: true, images: true, address: true, city: true, country: true } } },
    orderBy: { createdAt: 'desc' }
  })
  res.json(bookings)
}

// ============================================
// 7. GET BOOKING BY ID
// ============================================
export const getBookingById = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)
  
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: {
        select: { 
          id: true,
          title: true, 
          images: true, 
          address: true, 
          city: true, 
          country: true,
          hostId: true
        }
      }
    }
  })
  
  if (!booking) throw new AppError('Bron topilmadi', 404)
  
  if (booking.guestId !== req.userId && booking.listing.hostId !== req.userId) {
    throw new AppError('Ruxsat yo\'q', 403)
  }
  
  res.json(booking)
}

// ============================================
// 8. HOST: GET ALL BOOKINGS (Host o'z listinglaridagi bronlar)
// ============================================
export const getHostBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) {
      throw new AppError('Foydalanuvchi topilmadi', 401)
    }

    const { status } = req.query
    
    console.log('🔍 getHostBookings called')
    console.log('📝 userId:', userId)
    console.log('📝 status query:', status)
    console.log('📝 full URL:', req.originalUrl)

    const where: any = {
      listing: { hostId: userId }
    }
    
    if (status && status !== 'all' && status !== '') {
      where.status = status as string
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        listing: {
          select: { 
            id: true, 
            title: true, 
            images: true, 
            address: true, 
            city: true, 
            country: true 
          }
        },
        guest: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            avatar: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`✅ Found ${bookings.length} bookings for host ${userId}`)
    res.json(bookings)
  } catch (error) {
    console.error('❌ Error in getHostBookings:', error)
    res.status(500).json({ error: 'Server xatoligi' })
  }
}

// ============================================
// 9. HOST: APPROVE BOOKING (Tasdiqlash)
// ============================================
export const hostApproveBooking = async (req: AuthRequest, res: Response) => {
  const bookingId = ensureString(req.params.id)
  const userId = ensureString(req.userId)

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      listing: { hostId: userId }
    },
    include: {
      listing: true,
      guest: true
    }
  })

  if (!booking) throw new AppError('Booking topilmadi', 404)
  if (booking.status !== 'pending') throw new AppError('Bu bron allaqachon tasdiqlangan', 400)

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'confirmed' }
  })

  // ✅ Notification yuborish (yangi notification controller orqali)
  await createBookingApprovalNotifications(
    bookingId,
    userId,
    booking.guestId,
    booking.listing.title
  )

  res.json({ message: 'Bron tasdiqlandi', booking: updated })
}

// ============================================
// 10. HOST: REJECT BOOKING (Rad etish va to'lovni qaytarish)
// ============================================
export const hostRejectBooking = async (req: AuthRequest, res: Response) => {
  const bookingId = ensureString(req.params.id)
  const { reason } = req.body
  const userId = ensureString(req.userId)

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      listing: { hostId: userId }
    },
    include: {
      listing: true,
      guest: true
    }
  })

  if (!booking) throw new AppError('Booking topilmadi', 404)
  if (booking.status !== 'pending') throw new AppError('Bu bron allaqachon tasdiqlangan', 400)

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'cancelled' }
  })

  // TO'LOVNI QAYTARISH
  if (booking.stripePaymentId) {
    try {
      await stripe.refunds.create({
        payment_intent: booking.stripePaymentId,
        amount: booking.totalPrice * 100,
        reason: 'requested_by_customer',
        metadata: { bookingId, reason: reason || 'Host tomonidan rad etildi' }
      })
      console.log('✅ Refund created for booking:', bookingId)
    } catch (error) {
      console.error('❌ Refund error:', error)
    }
  }

  // ✅ Notification yuborish (yangi notification controller orqali)
  await createBookingRejectionNotifications(
    bookingId,
    userId,
    booking.guestId,
    booking.listing.title,
    reason || 'Sabab ko\'rsatilmagan'
  )

  res.json({ message: 'Bron rad etildi va to\'lov qaytarildi', booking: updated })
}

// ============================================
// 11. HOST: UPDATE BOOKING STATUS (eski usul)
// ============================================
export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  const bookingId = ensureString(req.params.id)
  const { status } = req.body
  const userId = ensureString(req.userId)

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      listing: { hostId: userId }
    },
    include: { listing: true, guest: true }
  })

  if (!booking) throw new AppError('Booking topilmadi', 404)

  if (status === 'confirmed') {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'confirmed' }
    })
    
    await createBookingApprovalNotifications(
      bookingId,
      userId,
      booking.guestId,
      booking.listing.title
    )
    
  } else if (status === 'cancelled') {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' }
    })
    
    if (booking.stripePaymentId) {
      await stripe.refunds.create({
        payment_intent: booking.stripePaymentId,
        amount: booking.totalPrice * 100
      })
    }
    
    await createBookingRejectionNotifications(
      bookingId,
      userId,
      booking.guestId,
      booking.listing.title,
      'Host tomonidan bekor qilindi'
    )
  }

  res.json({ message: 'Bron holati yangilandi' })
}

// ============================================
// 12. HOST: CONFIRM ARRIVAL
// ============================================
export const confirmArrival = async (req: AuthRequest, res: Response) => {
  const bookingId = ensureString(req.params.id)
  const userId = ensureString(req.userId)

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      listing: { hostId: userId }
    },
    include: { listing: true }
  })

  if (!booking) throw new AppError('Bron topilmadi', 404)
  if (booking.status !== 'confirmed') throw new AppError('Bron tasdiqlanmagan', 400)

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'completed' }
  })

  res.json({ message: 'Kelish tasdiqlandi' })
}

// ============================================
// 13. CLEANUP EXPIRED BOOKINGS (Cron job uchun)
// ============================================
export const cleanupExpiredBookings = async () => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
  
  const expiredBookings = await prisma.booking.deleteMany({
    where: {
      status: 'pending',
      createdAt: { lt: fifteenMinutesAgo }
    }
  })
  
  console.log(`🧹 Cleaned up ${expiredBookings.count} expired bookings`)
  return expiredBookings.count
}