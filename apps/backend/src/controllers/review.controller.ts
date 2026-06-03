import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AppError } from '../middleware/error.middleware'
import { AuthRequest } from '../types'

const prisma = new PrismaClient()

export const createReview = async (req: AuthRequest, res: Response) => {
  const listingId = req.params.listingId as string
  const { rating, comment } = req.body

  const booking = await prisma.booking.findFirst({
    where: {
      listingId,
      guestId: req.userId,
      status: 'confirmed',
      checkOut: { lt: new Date() }
    }
  })
  if (!booking) throw new AppError('Avval bron qilib, sayohatni yakunlagan bo\'lishingiz kerak', 400)

  const existing = await prisma.review.findFirst({
    where: { listingId, authorId: req.userId }
  })
  if (existing) throw new AppError('Siz allaqachon sharh qoldirgansiz', 400)

  const review = await prisma.review.create({
    data: { rating, comment, listingId, authorId: req.userId! },
    include: { author: { select: { id: true, name: true, avatar: true } } }
  })

  res.status(201).json(review)
}

export const getListingReviews = async (req: AuthRequest, res: Response) => {
  const listingId = req.params.listingId as string

  const reviews = await prisma.review.findMany({
    where: { listingId },
    include: { author: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' }
  })
  res.json(reviews)
}
