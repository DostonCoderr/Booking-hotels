// backend/src/controllers/notification.controller.ts

import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../types'
import TelegramBot from 'node-telegram-bot-api'

const prisma = new PrismaClient()

// Helper function to ensure string type
const ensureString = (value: string | string[] | undefined): string => {
  if (!value) throw new Error('Parameter required')
  return Array.isArray(value) ? value[0] : value
}

// Telegram bot
let bot: TelegramBot | null = null

export const initTelegramBot = () => {
  if (bot) return bot
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    console.log('⚠️ Telegram bot token topilmadi')
    return null
  }

  try {
    bot = new TelegramBot(botToken, { polling: true })
    
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id
      const firstName = msg.chat.first_name || 'Mehmon'
      
      bot?.sendMessage(chatId, `
🤖 Hotel Reminding Botga xush kelibsiz! ${firstName}

Sayohat eslatmalarini olish uchun quyidagi chat ID ni ilovaga kiriting:

<b>${chatId}</b>

⚠️ Diqqat: Bu kod faqat sizga tegishli!

👇 Ilovada "Telegram ulash" bo'limiga o'tib, shu kodni kiriting.
      `, { parse_mode: 'HTML' })
      
      console.log(`✅ Telegram: User started - Chat ID: ${chatId}`)
    })
    
    bot.on('polling_error', (error) => {
      console.error('❌ Telegram polling error:', error)
    })
    
    console.log('🤖 Telegram bot ishga tushdi')
  } catch (error) {
    console.error('❌ Telegram bot start error:', error)
  }
  
  return bot
}

// Send Telegram notification
export const sendTelegramNotification = async (chatId: string, title: string, message: string) => {
  if (!bot) {
    console.log('❌ Telegram bot ishlamayapti')
    return false
  }
  
  try {
    await bot.sendMessage(chatId, `
🔔 *${title}* 🔔

${message}

---
🏠 Airbnb Clone ilovasi
    `, { parse_mode: 'Markdown' })
    console.log('✅ Telegram notification sent to:', chatId)
    return true
  } catch (error) {
    console.error('❌ Telegram send error:', error)
    return false
  }
}

// ============================================
// USER NOTIFICATIONS
// ============================================

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    res.json(notifications)
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const id = ensureString(req.params.id) // ✅ FIXED: ensureString ishlatildi
    
    await prisma.notification.updateMany({
      where: { id, userId: req.userId! },
      data: { isRead: true }
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Mark as read error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId!, isRead: false },
      data: { isRead: true }
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Mark all as read error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.userId!, isRead: false }
    })
    res.json({ count })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// ============================================
// HOST NOTIFICATIONS
// ============================================

export const getHostNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { 
        userId: req.userId!,
        type: { 
          in: ['booking', 'booking_approved', 'booking_rejected', 'host_review', 'payment_received', 'listing_approved', 'listing_rejected', 'system'] 
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    res.json(notifications)
  } catch (error) {
    console.error('Get host notifications error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getHostUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: { 
        userId: req.userId!, 
        isRead: false,
        type: { 
          in: ['booking', 'booking_approved', 'booking_rejected', 'host_review', 'payment_received', 'listing_approved', 'listing_rejected', 'system'] 
        }
      }
    })
    res.json({ count })
  } catch (error) {
    console.error('Get host unread count error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const markHostNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const id = ensureString(req.params.id) // ✅ FIXED: ensureString ishlatildi
    
    await prisma.notification.updateMany({
      where: { id, userId: req.userId! },
      data: { isRead: true }
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Mark host notification as read error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const markAllHostNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { 
        userId: req.userId!, 
        isRead: false,
        type: { 
          in: ['booking', 'booking_approved', 'booking_rejected', 'host_review', 'payment_received', 'listing_approved', 'listing_rejected', 'system'] 
        }
      },
      data: { isRead: true }
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Mark all host notifications as read error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// ============================================
// CREATE NOTIFICATIONS
// ============================================

// Create notification for new booking (to host)
export const createBookingNotificationForHost = async (
  bookingId: string,
  hostId: string,
  guestName: string,
  listingTitle: string,
  checkIn: Date,
  guests: number,
  totalPrice: number
) => {
  try {
    await prisma.notification.create({
      data: {
        userId: hostId,
        title: '🆕 Yangi bron!',
        message: `${guestName} mehmoni "${listingTitle}" turar joyingizga ${guests} mehmon uchun bron qildi. Narx: $${totalPrice}`,
        type: 'booking',
        data: { bookingId, guestName, listingTitle, checkIn, guests, totalPrice }
      }
    })
    console.log('✅ Host notification created for booking:', bookingId)
  } catch (error) {
    console.error('❌ Failed to create host notification:', error)
  }
}

// Create notification for booking approval (to guest and host)
export const createBookingApprovalNotifications = async (
  bookingId: string,
  hostId: string,
  guestId: string,
  listingTitle: string
) => {
  try {
    // To guest
    await prisma.notification.create({
      data: {
        userId: guestId,
        title: '✅ Bron tasdiqlandi!',
        message: `Sizning "${listingTitle}" turar joyingiz uchun broningiz tasdiqlandi. Xush kelibsiz!`,
        type: 'booking_approved',
        data: { bookingId, listingTitle }
      }
    })
    
    // To host
    await prisma.notification.create({
      data: {
        userId: hostId,
        title: '✅ Bron tasdiqlandi',
        message: `Siz "${listingTitle}" turar joyingiz uchun bronni tasdiqladingiz.`,
        type: 'booking_approved',
        data: { bookingId, listingTitle }
      }
    })
    
    console.log('✅ Approval notifications created for booking:', bookingId)
  } catch (error) {
    console.error('❌ Failed to create approval notifications:', error)
  }
}

// Create notification for booking rejection (to guest and host)
export const createBookingRejectionNotifications = async (
  bookingId: string,
  hostId: string,
  guestId: string,
  listingTitle: string,
  reason: string
) => {
  try {
    // To guest
    await prisma.notification.create({
      data: {
        userId: guestId,
        title: '❌ Bron rad etildi',
        message: `Sizning "${listingTitle}" turar joyingiz uchun broningiz rad etildi. Sabab: ${reason}. To'lovingiz qaytariladi.`,
        type: 'booking_rejected',
        data: { bookingId, listingTitle, reason }
      }
    })
    
    // To host
    await prisma.notification.create({
      data: {
        userId: hostId,
        title: '❌ Bron rad etildi',
        message: `Siz "${listingTitle}" turar joyingiz uchun bronni rad etdingiz. Sabab: ${reason}`,
        type: 'booking_rejected',
        data: { bookingId, listingTitle, reason }
      }
    })
    
    console.log('✅ Rejection notifications created for booking:', bookingId)
  } catch (error) {
    console.error('❌ Failed to create rejection notifications:', error)
  }
}

// Create notification for listing approval (to host)
export const createListingApprovalNotification = async (
  listingId: string,
  hostId: string,
  listingTitle: string,
  status: 'APPROVED' | 'REJECTED'
) => {
  try {
    const title = status === 'APPROVED' ? '✅ Listing tasdiqlandi!' : '❌ Listing rad etildi'
    const message = status === 'APPROVED' 
      ? `Sizning "${listingTitle}" listingiz tasdiqlandi va endi foydalanuvchilarga ko\'rinadi.`
      : `Sizning "${listingTitle}" listingiz rad etildi. Iltimos, ma\'lumotlarni tekshirib, qayta yuboring.`
    
    await prisma.notification.create({
      data: {
        userId: hostId,
        title,
        message,
        type: status === 'APPROVED' ? 'listing_approved' : 'listing_rejected',
        data: { listingId, listingTitle }
      }
    })
    
    console.log(`✅ Listing ${status} notification created for host:`, hostId)
  } catch (error) {
    console.error('❌ Failed to create listing approval notification:', error)
  }
}

// Create notification for host review
export const createHostReviewNotification = async (
  hostId: string,
  guestName: string,
  listingTitle: string,
  rating: number,
  comment: string
) => {
  try {
    await prisma.notification.create({
      data: {
        userId: hostId,
        title: '⭐ Yangi sharh qoldirildi',
        message: `${guestName} mehmoni "${listingTitle}" turar joyingizga ${rating} ★ sharh qoldirdi: "${comment.substring(0, 100)}"`,
        type: 'host_review',
        data: { guestName, listingTitle, rating, comment }
      }
    })
    console.log('✅ Host review notification created for:', hostId)
  } catch (error) {
    console.error('❌ Failed to create host review notification:', error)
  }
}

// Create notification for payment received (to host)
export const createPaymentReceivedNotification = async (
  bookingId: string,
  hostId: string,
  listingTitle: string,
  amount: number
) => {
  try {
    await prisma.notification.create({
      data: {
        userId: hostId,
        title: '💰 To\'lov qabul qilindi',
        message: `"${listingTitle}" turar joyingiz uchun $${amount} miqdorida to\'lov qabul qilindi.`,
        type: 'payment_received',
        data: { bookingId, listingTitle, amount }
      }
    })
    console.log('✅ Payment notification created for host:', hostId)
  } catch (error) {
    console.error('❌ Failed to create payment notification:', error)
  }
}

// ============================================
// SETTINGS & TELEGRAM
// ============================================

export const getNotificationSettings = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { telegramChatId: true, email: true, name: true }
    })
    
    res.json({
      emailEnabled: true,
      telegramEnabled: !!user?.telegramChatId,
      telegramChatId: user?.telegramChatId || null,
      email: user?.email,
      name: user?.name
    })
  } catch (error) {
    console.error('Get notification settings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateNotificationSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { emailEnabled, telegramEnabled } = req.body
    res.json({ success: true, message: 'Sozlamalar saqlandi' })
  } catch (error) {
    console.error('Update notification settings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const createTripReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body
    
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: true,
        guest: true
      }
    })
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }
    
    const daysUntil = Math.ceil((new Date(booking.checkIn).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    const isToday = daysUntil === 0
    const isTomorrow = daysUntil === 1
    
    let title, message
    if (isToday) {
      title = "✈️ Sayohat boshlanadi!"
      message = `Hurmatli mehmon, bugun "${booking.listing.title}" da sayohatingiz boshlanadi. Yaxshi dam oling!`
    } else if (isTomorrow) {
      title = "📅 Sayohatga 1 kun qoldi!"
      message = `Hurmatli mehmon, ertaga "${booking.listing.title}" da sayohatingiz boshlanadi. Tayyor bo'ling!`
    } else {
      title = "📅 Sayohatga eslatma"
      message = `${daysUntil} kundan keyin "${booking.listing.title}" da sayohatingiz bor. Unutmang!`
    }
    
    const notification = await prisma.notification.create({
      data: {
        userId: booking.guestId,
        title,
        message,
        type: 'booking',
        data: { bookingId, daysUntil }
      }
    })
    
    if (booking.guest?.telegramChatId) {
      let telegramMessage
      if (isToday) {
        telegramMessage = `✈️ *SAYOHAT BOSHLANADI!* ✈️\n\nHurmatli mehmon, bugun *"${booking.listing.title}"* da sayohatingiz boshlanadi!\n\n📍 *Manzil:* ${booking.listing.address}\n📅 *Sana:* ${new Date(booking.checkIn).toLocaleDateString()}\n👥 *Mehmonlar:* ${booking.guests}\n\n🎉 Yaxshi dam oling!`
      } else if (isTomorrow) {
        telegramMessage = `📅 *SAYOHATGA 1 KUN QOLDI!* 📅\n\nHurmatli mehmon, ertaga *"${booking.listing.title}"* da sayohatingiz boshlanadi!\n\n📍 *Manzil:* ${booking.listing.address}\n📅 *Sana:* ${new Date(booking.checkIn).toLocaleDateString()}\n👥 *Mehmonlar:* ${booking.guests}\n\n⚠️ Tayyor bo'ling!`
      } else {
        telegramMessage = `📅 *SAYOHATGA ESLATMA* 📅\n\nHurmatli mehmon, *${daysUntil} kundan keyin* "${booking.listing.title}" da sayohatingiz boshlanadi!\n\n📍 *Manzil:* ${booking.listing.address}\n📅 *Sana:* ${new Date(booking.checkIn).toLocaleDateString()}\n👥 *Mehmonlar:* ${booking.guests}\n\n⚠️ Unutmang!`
      }
      
      await sendTelegramNotification(booking.guest.telegramChatId, title, telegramMessage)
    }
    
    res.json({ success: true, notification })
  } catch (error) {
    console.error('Create trip reminder error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const saveTelegramChatId = async (req: AuthRequest, res: Response) => {
  try {
    const { chatId } = req.body
    
    if (!chatId || !chatId.match(/^\d+$/)) {
      return res.status(400).json({ error: 'Invalid chat ID' })
    }
    
    await prisma.user.update({
      where: { id: req.userId! },
      data: { telegramChatId: chatId }
    })
    
    if (bot) {
      await bot.sendMessage(chatId, `
✅ *Tasdiqlandi!*

Sizning Telegram chattingiz Airbnb Clone ilovasiga ulandi.

Endi sayohat eslatmalarini Telegram orqali olasiz.

🎉 Yaxshi dam oling!
      `, { parse_mode: 'Markdown' })
    }
    
    res.json({ success: true, message: 'Telegram ulandi!' })
  } catch (error) {
    console.error('Save telegram chat ID error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getTelegramChatId = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { telegramChatId: true }
    })
    res.json({ chatId: user?.telegramChatId || null })
  } catch (error) {
    console.error('Get telegram chat ID error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteTelegramConnection = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { telegramChatId: true }
    })
    
    if (user?.telegramChatId && bot) {
      await bot.sendMessage(user.telegramChatId, `
⚠️ *Telegram ulanish uzildi*

Sizning Telegram chattingiz Airbnb Clone ilovasidan uzildi.

Qayta ulanish uchun ilovadagi "Telegram ulash" tugmasini bosing.
      `, { parse_mode: 'Markdown' })
    }
    
    await prisma.user.update({
      where: { id: req.userId! },
      data: { telegramChatId: null }
    })
    
    res.json({ success: true, message: 'Telegram ulanish uzildi' })
  } catch (error) {
    console.error('Delete telegram connection error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}