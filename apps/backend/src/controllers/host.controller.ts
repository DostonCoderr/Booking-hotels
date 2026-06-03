// backend/src/controllers/host.controller.ts

import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../types'
import { AppError } from '../middleware/error.middleware'

const prisma = new PrismaClient()

// Helper function to ensure string type
const ensureString = (value: string | string[] | undefined): string => {
  if (!value) throw new Error('Value is required')
  return Array.isArray(value) ? value[0] : value
}

// ============================================
// HOST: GET MY LISTINGS
// ============================================
export const getMyListings = async (req: AuthRequest, res: Response) => {
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
// HOST: CREATE LISTING (Pending status)
// ============================================
export const createListing = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.userId)
  const data = req.body
  
  const images = Array.isArray(data.images) ? data.images : []
  
  const listing = await prisma.listing.create({
    data: {
      title: data.title,
      description: data.description,
      price: parseFloat(data.price),
      category: data.category,
      type: data.type,
      address: data.address,
      city: data.city,
      country: data.country,
      latitude: data.latitude || 41.2995,
      longitude: data.longitude || 69.2401,
      maxGuests: parseInt(data.maxGuests),
      bedrooms: parseInt(data.bedrooms),
      beds: parseInt(data.beds) || parseInt(data.bedrooms),
      bathrooms: parseFloat(data.bathrooms),
      images: images,
      amenities: data.amenities || [],
      hostId: userId,
      status: 'PENDING'
    }
  })

  // Adminlarga habar yuborish
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Yangi listing qo\'shildi',
        message: `${req.user?.name} yangi listing qo\'shdi: ${listing.title}`,
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
// HOST: UPDATE LISTING
// ============================================
export const updateListing = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)
  const userId = ensureString(req.userId)
  const data = req.body

  const existing = await prisma.listing.findFirst({
    where: { id, hostId: userId }
  })
  if (!existing) throw new AppError('Listing topilmadi', 404)

  const listing = await prisma.listing.update({
    where: { id },
    data: { ...data, status: 'PENDING' }
  })

  // Adminlarga habar yuborish
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Listing tahrirlandi',
        message: `${req.user?.name} listingni tahrirladi: ${listing.title}`,
        type: 'listing_updated',
        data: { listingId: listing.id, hostId: userId }
      }
    })
  }

  res.json({ listing, message: 'O\'zgarishlar saqlandi. Admin tekshiradi.' })
}

// ============================================
// HOST: DELETE LISTING
// ============================================
export const deleteListing = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)
  const userId = ensureString(req.userId)

  const existing = await prisma.listing.findFirst({
    where: { id, hostId: userId }
  })
  if (!existing) throw new AppError('Listing topilmadi', 404)

  await prisma.listing.delete({ where: { id } })

  res.json({ message: 'Listing o\'chirildi' })
}

// ============================================
// HOST: GET STATISTICS
// ============================================
export const getHostStats = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.userId)
  
  const [
    totalListings,
    approvedListings,
    pendingListings,
    rejectedListings,
    totalBookings,
    totalRevenue,
    recentBookings
  ] = await Promise.all([
    prisma.listing.count({ where: { hostId: userId } }),
    prisma.listing.count({ where: { hostId: userId, status: 'APPROVED' } }),
    prisma.listing.count({ where: { hostId: userId, status: 'PENDING' } }),
    prisma.listing.count({ where: { hostId: userId, status: 'REJECTED' } }),
    prisma.booking.count({ where: { listing: { hostId: userId } } }),
    prisma.booking.aggregate({
      where: { listing: { hostId: userId }, status: 'confirmed' },
      _sum: { totalPrice: true }
    }),
    prisma.booking.findMany({
      where: { listing: { hostId: userId } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        guest: { select: { name: true, avatar: true } },
        listing: { select: { title: true } }
      }
    })
  ])

  res.json({
    listings: {
      total: totalListings,
      approved: approvedListings,
      pending: pendingListings,
      rejected: rejectedListings
    },
    bookings: {
      total: totalBookings,
      recent: recentBookings
    },
    revenue: totalRevenue._sum.totalPrice || 0
  })
}

// ============================================
// HOST: GET SINGLE LISTING (BY ID)
// ============================================
export const getListingById = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)
  const userId = ensureString(req.userId)

  const listing = await prisma.listing.findFirst({
    where: { 
      id: id,
      hostId: userId 
    },
    include: {
      bookings: {
        orderBy: { createdAt: 'desc' },
        include: {
          guest: { select: { name: true, email: true, phone: true } }
        }
      },
      reviews: {
        include: { author: { select: { name: true, avatar: true } } }
      }
    }
  })

  if (!listing) throw new AppError('Listing topilmadi', 404)

  res.json(listing)
}



// ============================================
// HOST: GET REVIEWS AND RATING
// ============================================
export const getHostReviews = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.userId)

  const reviews = await prisma.review.findMany({
    where: {
      listing: {
        hostId: userId
      }
    },
    include: {
      author: {
        select: { id: true, name: true, avatar: true }
      },
      listing: {
        select: { id: true, title: true, images: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  res.json(reviews)
}

// ============================================
// HOST: GET RATING SUMMARY
// ============================================
export const getHostRatingSummary = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.userId)

  const reviews = await prisma.review.findMany({
    where: {
      listing: {
        hostId: userId
      }
    },
    select: { rating: true }
  })

  const totalReviews = reviews.length
  let avgRating = 0
  
  if (totalReviews > 0) {
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    avgRating = sum / totalReviews
  }

  const distribution = {
    five: reviews.filter(r => r.rating === 5).length,
    four: reviews.filter(r => r.rating === 4).length,
    three: reviews.filter(r => r.rating === 3).length,
    two: reviews.filter(r => r.rating === 2).length,
    one: reviews.filter(r => r.rating === 1).length
  }

  res.json({
    avgRating: Number(avgRating.toFixed(1)),
    totalReviews,
    distribution
  })
}




// ============================================
// HOST: GET BOOKINGS (Hostning listinglaridagi bronlar)
// ============================================
export const getHostBookings = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.userId)

  const bookings = await prisma.booking.findMany({
    where: {
      listing: {
        hostId: userId
      }
    },
    include: {
      listing: {
        select: { id: true, title: true, images: true, address: true, city: true }
      },
      guest: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  res.json(bookings)
}

// ============================================
// HOST: UPDATE BOOKING STATUS
// ============================================
export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)
  const { status } = req.body
  const userId = ensureString(req.userId)

  // Check if booking belongs to host's listing (with include)
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      listing: {
        hostId: userId
      }
    },
    include: {
      listing: {
        select: { id: true, title: true }
      }
    }
  })

  if (!booking) throw new AppError('Booking topilmadi yoki ruxsat yo\'q', 404)

  const updated = await prisma.booking.update({
    where: { id },
    data: { status }
  })

  // Send notification to guest
  await prisma.notification.create({
    data: {
      userId: booking.guestId,
      title: status === 'confirmed' ? 'Bron tasdiqlandi! ✅' : 'Bron bekor qilindi ❌',
      message: `Sizning "${booking.listing?.title || 'listing'}" broningiz ${status === 'confirmed' ? 'tasdiqlandi' : 'bekor qilindi'}`,
      type: 'booking_update',
      data: { bookingId: booking.id, status }
    }
  })

  res.json({ message: 'Bron holati yangilandi', booking: updated })
}



// ============================================
// HOST: GET PROFILE (QO'SHIMCHA)
// ============================================
export const getHostProfile = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.userId)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      createdAt: true,
      telegramChatId: true,
      isHost: true,
      isVerified: true,
    }
  })

  if (!user) throw new AppError('Foydalanuvchi topilmadi', 404)

  res.json(user)
}

// ============================================
// HOST: UPDATE PROFILE (QO'SHIMCHA)
// ============================================
export const updateHostProfile = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.userId)
  const { name, phone, bio, location, website } = req.body

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || undefined,
      phone: phone || null,
      bio: bio || null,
      location: location || null,
      website: website || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      role: true,
      isHost: true,
      isVerified: true,
    }
  })

  res.json(user)
}