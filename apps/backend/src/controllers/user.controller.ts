import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AppError } from '../middleware/error.middleware'
import { AuthRequest } from '../types'

const prisma = new PrismaClient()

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.params.id as string

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatar: true,
      isHost: true,
      isVerified: true,
      createdAt: true,
      listings: {
        where: { isActive: true },
        select: { id: true, title: true, images: true, price: true, city: true }
      },
      reviews: {
        select: { rating: true }
      }
    }
  })

  if (!user) throw new AppError('Foydalanuvchi topilmadi', 404)

  const avgRating = user.reviews.length > 0
    ? user.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / user.reviews.length
    : 0

  const { reviews, ...userData } = user
  res.json({ ...userData, avgRating, reviewCount: reviews.length })
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { name, phone } = req.body
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { name, phone },
    select: { id: true, name: true, email: true, avatar: true, phone: true, isHost: true }
  })
  res.json(user)
}

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new AppError('Rasm yuklanmadi', 400)
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { avatar: req.file.path },
    select: { id: true, name: true, avatar: true }
  })
  res.json(user)
}
