// backend/src/controllers/listing.controller.ts

import { Request, Response } from 'express'
import { PrismaClient, Prisma } from '@prisma/client'
import { AppError } from '../middleware/error.middleware'
import { AuthRequest } from '../types'

const prisma = new PrismaClient()

// Helper function to ensure string type
const ensureString = (value: string | string[] | undefined): string => {
  if (!value) throw new Error('Value is required')
  return Array.isArray(value) ? value[0] : value
}

// ============================================
// CREATE LISTING (HOST only)
// ============================================
export const createListing = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.userId)
  
  // Check if user is HOST or ADMIN
  if (req.user?.role !== 'HOST' && req.user?.role !== 'ADMIN') {
    throw new AppError('Listing yaratish uchun Host bo\'lishingiz kerak', 403)
  }

  const {
    title, description, price, category, type,
    address, city, country, latitude, longitude,
    maxGuests, bedrooms, beds, bathrooms, amenities
  } = req.body

  const files = req.files as any
  const images = files?.map((f: any) => f.path) || []

  const listing = await prisma.listing.create({
    data: {
      title, description,
      price: parseFloat(price), category, type,
      address, city, country,
      latitude: parseFloat(latitude), longitude: parseFloat(longitude),
      maxGuests: parseInt(maxGuests), bedrooms: parseInt(bedrooms),
      beds: parseInt(beds), bathrooms: parseFloat(bathrooms),
      images, amenities: JSON.parse(amenities || '[]'),
      hostId: userId,
      status: 'PENDING' // Admin tasdiqlashi kerak
    }
  })

  // Agar foydalanuvchi HOST roliga ega bo'lmasa, uni HOST qilish
  if (req.user?.role !== 'HOST' && req.user?.role !== 'ADMIN') {
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'HOST' }
    })
  }

  // Adminlarga habar yuborish
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Yangi listing qo\'shildi',
        message: `${req.user?.name || 'Host'} yangi listing qo\'shdi: ${listing.title}`,
        type: 'new_listing',
        data: { listingId: listing.id, hostId: userId }
      }
    })
  }

  res.status(201).json({ 
    listing, 
    message: 'Listing yuborildi. Admin tasdiqlagandan so\'ng ko\'rinadi.' 
  })
}

// ============================================
// GET ALL LISTINGS (Only APPROVED)
// ============================================
export const getListings = async (req: Request, res: Response) => {
  const {
    city, country, category, type,
    minPrice, maxPrice, guests,
    page = '1', limit = '20'
  } = req.query

  const where: Prisma.ListingWhereInput = { 
    isActive: true,
    status: 'APPROVED'  // Faqat tasdiqlangan listinglar
  }

  if (city) where.city = { contains: city as string, mode: 'insensitive' }
  if (country) where.country = country as string
  if (category) where.category = category as string
  if (type) where.type = type as string
  if (minPrice || maxPrice) {
    where.price = {}
    if (minPrice) where.price.gte = parseFloat(minPrice as string)
    if (maxPrice) where.price.lte = parseFloat(maxPrice as string)
  }
  if (guests) where.maxGuests = { gte: parseInt(guests as string) }

  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        host: { select: { id: true, name: true, avatar: true } },
        reviews: { select: { rating: true } }
      },
      skip, take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.listing.count({ where })
  ])

  const listingsWithRating = listings.map((listing: any) => {
    const avgRating = listing.reviews.length > 0
      ? listing.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / listing.reviews.length
      : 0
    const { reviews, ...rest } = listing
    return { ...rest, avgRating: Math.round(avgRating * 10) / 10, reviewCount: reviews.length }
  })

  res.json({
    listings: listingsWithRating,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
  })
}

// ============================================
// GET LISTING BY ID (Only if APPROVED or owner)
// ============================================
export const getListingById = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, name: true, avatar: true, isVerified: true, role: true } },
      reviews: {
        include: { author: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!listing) throw new AppError('Listing topilmadi', 404)

  // Check if listing is approved OR user is owner OR user is admin
  const isOwner = req.userId === listing.hostId
  const isAdmin = req.user?.role === 'ADMIN'
  const isApproved = listing.status === 'APPROVED'

  if (!isApproved && !isOwner && !isAdmin) {
    throw new AppError('Bu listing hali tasdiqlanmagan', 403)
  }

  res.json(listing)
}

// ============================================
// UPDATE LISTING (Owner only)
// ============================================
export const updateListing = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)
  const userId = ensureString(req.userId)

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) throw new AppError('Listing topilmadi', 404)
  
  // Only owner or admin can update
  if (listing.hostId !== userId && req.user?.role !== 'ADMIN') {
    throw new AppError('Ruxsat yo\'q', 403)
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: { 
      ...req.body,
      status: 'PENDING'  // Qayta tasdiqlash kerak
    }
  })

  // Adminlarga habar yuborish (tahrir qilinganligi haqida)
  if (req.user?.role !== 'ADMIN') {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Listing tahrirlandi',
          message: `${req.user?.name} listingni tahrirladi: ${listing.title}`,
          type: 'listing_updated',
          data: { listingId: listing.id }
        }
      })
    }
  }

  res.json({ listing: updated, message: 'O\'zgarishlar saqlandi. Admin tekshiradi.' })
}

// ============================================
// DELETE LISTING (Soft delete - set isActive false)
// ============================================
export const deleteListing = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)
  const userId = ensureString(req.userId)

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) throw new AppError('Listing topilmadi', 404)
  
  // Only owner or admin can delete
  if (listing.hostId !== userId && req.user?.role !== 'ADMIN') {
    throw new AppError('Ruxsat yo\'q', 403)
  }

  await prisma.listing.update({
    where: { id },
    data: { isActive: false }
  })

  res.json({ message: 'Listing o\'chirildi' })
}

// ============================================
// SEARCH LISTINGS (Only APPROVED)
// ============================================
export const searchListings = async (req: Request, res: Response) => {
  const { q } = req.query
  if (!q) throw new AppError('Qidiruv so\'zi kerak', 400)

  const listings = await prisma.listing.findMany({
    where: {
      isActive: true,
      status: 'APPROVED',  // Faqat tasdiqlangan listinglar
      OR: [
        { title: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
        { city: { contains: q as string, mode: 'insensitive' } },
        { country: { contains: q as string, mode: 'insensitive' } },
        { address: { contains: q as string, mode: 'insensitive' } }
      ]
    },
    include: { host: { select: { id: true, name: true, avatar: true } } },
    take: 20
  })

  res.json(listings)
}

// ============================================
// GET BOOKED DATES FOR LISTING
// ============================================
export const getBookedDates = async (req: Request, res: Response) => {
  const listingId = ensureString(req.params.id)
  
  const bookings = await prisma.booking.findMany({
    where: {
      listingId: listingId,
      status: { in: ['confirmed', 'pending'] }
    },
    select: { checkIn: true, checkOut: true }
  })
  
  const bookedDates: string[] = []
  bookings.forEach(booking => {
    let current = new Date(booking.checkIn)
    const end = new Date(booking.checkOut)
    while (current <= end) {
      bookedDates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
  })
  
  res.json(bookedDates)
}

// ============================================
// GET HOST LISTINGS (For Host Panel)
// ============================================
export const getHostListings = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.userId)

  const listings = await prisma.listing.findMany({
    where: { hostId: userId },
    include: {
      bookings: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          guest: { select: { name: true, avatar: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  res.json(listings)
}

// ============================================
// GET PENDING LISTINGS (For Admin)
// ============================================
export const getPendingListings = async (req: AuthRequest, res: Response) => {
  // Only admin can access
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Ruxsat yo\'q', 403)
  }

  const listings = await prisma.listing.findMany({
    where: { status: 'PENDING' },
    include: {
      host: { select: { id: true, name: true, email: true, phone: true, avatar: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  res.json(listings)
}

// ============================================
// APPROVE LISTING (For Admin)
// ============================================
export const approveListing = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)

  // Only admin can approve
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Ruxsat yo\'q', 403)
  }

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) throw new AppError('Listing topilmadi', 404)

  const updated = await prisma.listing.update({
    where: { id },
    data: { status: 'APPROVED' }
  })

  // Hostga habar yuborish
  await prisma.notification.create({
    data: {
      userId: listing.hostId,
      title: 'Listing tasdiqlandi!',
      message: `Sizning "${listing.title}" listing-ingiz tasdiqlandi va endi foydalanuvchilarga ko\'rinadi.`,
      type: 'listing_approved',
      data: { listingId: listing.id }
    }
  })

  res.json({ message: 'Listing tasdiqlandi', listing: updated })
}

// ============================================
// REJECT LISTING (For Admin)
// ============================================
export const rejectListing = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)
  const { reason } = req.body

  // Only admin can reject
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('Ruxsat yo\'q', 403)
  }

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) throw new AppError('Listing topilmadi', 404)

  await prisma.listing.update({
    where: { id },
    data: { status: 'REJECTED', rejectReason: reason || 'Noma\'lum sabab' }
  })

  // Hostga sabab bilan habar yuborish
  await prisma.notification.create({
    data: {
      userId: listing.hostId,
      title: 'Listing rad etildi',
      message: `Sizning "${listing.title}" listing-ingiz rad etildi. Sabab: ${reason || 'Noma\'lum'}`,
      type: 'listing_rejected',
      data: { listingId: listing.id, reason }
    }
  })

  res.json({ message: 'Listing rad etildi' })
}



