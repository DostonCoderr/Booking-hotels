import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AppError } from '../middleware/error.middleware'
import { AuthRequest } from '../types'

const prisma = new PrismaClient()

// Get user's wishlist
export const getWishlist = async (req: AuthRequest, res: Response) => {
  const wishlist = await prisma.wishlist.findMany({
    where: { userId: req.userId! },
    include: {
      listing: {
        include: {
          host: { select: { id: true, name: true, avatar: true } },
          reviews: { select: { rating: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const wishlistWithRating = wishlist.map((item: any) => {
    const reviews = item.listing.reviews
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0
    const { reviews: _, ...listing } = item.listing
    return {
      id: item.id,
      listing: { ...listing, avgRating, reviewCount: reviews.length },
      createdAt: item.createdAt
    }
  })

  res.json(wishlistWithRating)
}

// Add to wishlist
export const addToWishlist = async (req: AuthRequest, res: Response) => {
  const { listingId } = req.body

  if (!listingId) {
    throw new AppError('Listing ID kerak', 400)
  }

  // Check if listing exists
  const listing = await prisma.listing.findUnique({
    where: { id: listingId as string }
  })

  if (!listing) {
    throw new AppError('Listing topilmadi', 404)
  }

  const existing = await prisma.wishlist.findFirst({
    where: { 
      userId: req.userId!, 
      listingId: listingId as string 
    }
  })

  if (existing) {
    throw new AppError('Bu listing allaqachon saqlangan', 400)
  }

  const wishlist = await prisma.wishlist.create({
    data: { 
      userId: req.userId!, 
      listingId: listingId as string 
    },
    include: { listing: true }
  })

  res.status(201).json(wishlist)
}

// Remove from wishlist
export const removeFromWishlist = async (req: AuthRequest, res: Response) => {
  const { listingId } = req.params

  const wishlist = await prisma.wishlist.findFirst({
    where: { 
      userId: req.userId!, 
      listingId: listingId as string 
    }
  })

  if (!wishlist) {
    throw new AppError('Listing saqlanganlar ro\'yxatida topilmadi', 404)
  }

  await prisma.wishlist.delete({ where: { id: wishlist.id } })

  res.json({ message: 'Listing saqlanganlardan o\'chirildi' })
}

// Check if listing is in wishlist
export const checkWishlist = async (req: AuthRequest, res: Response) => {
  const { listingId } = req.params

  const wishlist = await prisma.wishlist.findFirst({
    where: { 
      userId: req.userId!, 
      listingId: listingId as string 
    }
  })

  res.json({ isWishlisted: !!wishlist })
}