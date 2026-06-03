// backend/src/controllers/auth.controller.ts

import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { AppError } from '../middleware/error.middleware'
import { AuthRequest } from '../types'
import crypto from 'crypto'
import { initTelegramBot, sendTelegramMessage } from '../services/telegram.service'

const prisma = new PrismaClient()

// Helper function to ensure string type
const ensureString = (value: string | string[] | undefined): string => {
  if (!value) throw new Error('Value is required')
  return Array.isArray(value) ? value[0] : value
}

// Token yaratish
const createToken = (user: { id: string; email: string; role: string }) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )
}

// Refresh token yaratish
const createRefreshToken = (user: { id: string }) => {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '30d' }
  )
}

// ============================================
// REGISTER
// ============================================
export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new AppError('Bu email allaqachon ro\'yxatdan o\'tgan', 400)
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { 
      name, 
      email, 
      password: hashedPassword,
      role: 'USER'
    },
    select: { id: true, name: true, email: true, avatar: true, role: true, phone: true }
  })

  const token = createToken({ id: user.id, email: user.email, role: user.role })
  const refreshToken = createRefreshToken({ id: user.id })

  res.status(201).json({ user, token, refreshToken })
}

// ============================================
// LOGIN
// ============================================
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new AppError('Email yoki parol noto\'g\'ri', 401)
  if (!user.password) throw new AppError('Bu hisob Google orqali yaratilgan', 400)

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) throw new AppError('Email yoki parol noto\'g\'ri', 401)

  const token = createToken({ id: user.id, email: user.email, role: user.role })
  const refreshToken = createRefreshToken({ id: user.id })

  res.json({
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      avatar: user.avatar, 
      role: user.role,
      phone: user.phone
    },
    token,
    refreshToken
  })
}

// ============================================
// GOOGLE AUTH
// ============================================
export const googleAuth = async (req: Request, res: Response) => {
  const { email, name, avatar } = req.body

  let user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    user = await prisma.user.create({
      data: { 
        email, 
        name, 
        avatar, 
        password: null, 
        role: 'USER' 
      }
    })
  }

  const token = createToken({ id: user.id, email: user.email, role: user.role })
  const refreshToken = createRefreshToken({ id: user.id })

  res.json({
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      avatar: user.avatar, 
      role: user.role,
      phone: user.phone
    },
    token,
    refreshToken
  })
}

// ============================================
// REFRESH TOKEN
// ============================================
export const refreshTokenHandler = async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  if (!refreshToken) throw new AppError('Refresh token kerak', 400)

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) throw new AppError('Foydalanuvchi topilmadi', 404)

    const newToken = createToken({ id: user.id, email: user.email, role: user.role })
    const newRefreshToken = createRefreshToken({ id: user.id })

    res.json({ token: newToken, refreshToken: newRefreshToken })
  } catch {
    throw new AppError('Refresh token yaroqsiz', 401)
  }
}

// ============================================
// GET CURRENT USER
// ============================================
export const me = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.userId)
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      avatar: true, 
      phone: true, 
      role: true, 
      isVerified: true,
      isActive: true
    }
  })
  if (!user) throw new AppError('Foydalanuvchi topilmadi', 404)
  
  if (!user.isActive) {
    throw new AppError('Hisobingiz bloklangan. Admin bilan bog\'laning', 403)
  }
  
  res.json(user)
}

// ============================================
// REQUEST HOST ROLE
// ============================================
export const requestHostRole = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.userId)

  // Check if already host
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.role === 'HOST') {
    throw new AppError('Siz allaqachon hostsiz', 400)
  }

  // Create notification for admin
  await prisma.notification.create({
    data: {
      userId: userId,
      title: 'Yangi Host so\'rovi',
      message: `${user?.name} host bo\'lishni so\'rayapti`,
      type: 'host_request',
      data: { userId }
    }
  })

  res.json({ message: 'So\'rovingiz yuborildi. Admin tekshirgandan so\'ng habar beramiz.' })
}

// ============================================
// ADMIN: APPROVE HOST ROLE
// ============================================
export const approveHostRole = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.params.userId)
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: 'HOST' }
  })

  // Notification yuborish
  await prisma.notification.create({
    data: {
      userId: userId,
      title: 'Tabriklaymiz!',
      message: 'Siz Host bo\'ldingiz. Endi listinglar qo\'sha olasiz.',
      type: 'role_approved'
    }
  })

  res.json({ message: 'Foydalanuvchi Host qilindi', user })
}

// ============================================
// ADMIN: REJECT HOST ROLE
// ============================================
export const rejectHostRole = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.params.userId)
  const { reason } = req.body

  await prisma.notification.create({
    data: {
      userId: userId,
      title: 'Host so\'rovi rad etildi',
      message: reason || 'Sizning so\'rovingiz rad etildi. Qaytadan urinib ko\'ring.',
      type: 'role_rejected'
    }
  })

  res.json({ message: 'So\'rov rad etildi' })
}



export const checkEmailExists = async (req: Request, res: Response) => {
  const { email } = req.body

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, telegramChatId: true }
  })

  if (!user) {
    throw new AppError('Email topilmadi', 404)
  }

  res.json({ 
    exists: true, 
    email: user.email,
    name: user.name
  })
}

// ============================================
// GENERATE AND SEND RESET CODE VIA TELEGRAM
// ============================================
export const sendResetCode = async (req: Request, res: Response) => {
  const { email } = req.body

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw new AppError('Email topilmadi', 404)
  }

  // Generate 6-digit code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
  const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  // Save reset code to database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetCode,
      resetCodeExpiry
    }
  })

  // Send via Telegram if user has chat ID
  if (user.telegramChatId) {
    const telegramBot = initTelegramBot()
    if (telegramBot) {
      await telegramBot.sendMessage(user.telegramChatId, `
🔐 *PAROLNI TIKLASH KODI* 🔐

Hurmatli ${user.name || 'foydalanuvchi'},

Sizning parolni tiklash kodingiz:

*${resetCode}*

Ushbu kod *15 daqiqa* davomida amal qiladi.

Agar bu so\'rov siz tomoningizdan bo\'lmagan bo\'lsa, ushbu xabarni e\'tiborsiz qoldiring.

---
🏠 Airbnb Clone ilovasi
      `, { parse_mode: 'Markdown' })
    }
  } else {
    // Agar Telegram chat ID bo'lmasa, xatolik qaytaramiz
    throw new AppError('Telegram ulanishi topilmadi. Iltimos, avval Telegram botga ulaning.', 400)
  }

  res.json({ 
    success: true, 
    message: 'Tasdiqlash kodi Telegram orqali yuborildi',
    hasTelegram: !!user.telegramChatId
  })
}

// ============================================
// VERIFY RESET CODE
// ============================================
export const verifyResetCode = async (req: Request, res: Response) => {
  const { email, code } = req.body

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw new AppError('Email topilmadi', 404)
  }

  if (!user.resetCode || user.resetCode !== code) {
    throw new AppError('Noto\'g\'ri kod', 400)
  }

  if (user.resetCodeExpiry && new Date() > user.resetCodeExpiry) {
    throw new AppError('Kod muddati o\'tgan. Qaytadan urinib ko\'ring.', 400)
  }

  // Generate temporary reset token
  const resetToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '10m' }
  )

  res.json({ 
    valid: true, 
    token: resetToken
  })
}

// ============================================
// RESET PASSWORD
// ============================================
export const resetPassword = async (req: Request, res: Response) => {
  const { email, token, newPassword } = req.body

  // Verify token
  let decoded: any
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    throw new AppError('Token yaroqsiz yoki muddati o\'tgan', 401)
  }

  if (decoded.email !== email) {
    throw new AppError('Noto\'g\'ri ma\'lumotlar', 400)
  }

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw new AppError('Foydalanuvchi topilmadi', 404)
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12)

  // Update password and clear reset code
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetCode: null,
      resetCodeExpiry: null
    }
  })

  // Send confirmation via Telegram
  if (user.telegramChatId) {
    const telegramBot = initTelegramBot()
    if (telegramBot) {
      await telegramBot.sendMessage(user.telegramChatId, `
✅ *PAROLINGIZ TIKLANDI* ✅

Hurmatli ${user.name || 'foydalanuvchi'},

Parolingiz muvaffaqiyatli tiklandi.

Endi yangi parol bilan tizimga kirishingiz mumkin.

Agar bu so\'rov siz tomoningizdan bo\'lmagan bo\'lsa, darhol qo\'llab-quvvatlash xizmatiga murojaat qiling.

---
🏠 Airbnb Clone ilovasi
      `, { parse_mode: 'Markdown' })
    }
  }

  res.json({ 
    success: true, 
    message: 'Parol muvaffaqiyatli tiklandi' 
  })
}



export const clerkSync = async (req: Request, res: Response) => {
  const { clerkId, email, name, avatar, provider } = req.body

  console.log('🔐 Clerk sync request:', { clerkId, email, name, provider })

  if (!clerkId) {
    throw new AppError('Clerk ID kerak', 400)
  }

  // ✅ findUnique o'rniga findFirst ishlatamiz (chunki clerkId unique bo'lsa ham)
  let user = await prisma.user.findFirst({
    where: { clerkId }
  })

  // Agar topilmasa, email bo'yicha qidirish
  if (!user && email) {
    user = await prisma.user.findFirst({
      where: { email }
    })
  }

  // Agar user topilmasa, yangi user yaratish (FAQAT USER roli)
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        email: email || `${clerkId}@clerk.user`,
        name: name || 'User',
        avatar: avatar || null,
        role: 'USER',
        password: null,
      },
    })
    console.log('✅ New user created via Clerk:', user.id)
  } else {
    // Agar user mavjud bo'lsa, clerkId ni yangilash (agar bo'sh bo'lsa)
    if (!user.clerkId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { clerkId }
      })
      console.log('✅ Clerk ID updated for user:', user.id)
    }
  }

  const token = createToken({ id: user.id, email: user.email, role: user.role })
  const refreshToken = createRefreshToken({ id: user.id })

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      phone: user.phone,
    },
    token,
    refreshToken,
  })
}