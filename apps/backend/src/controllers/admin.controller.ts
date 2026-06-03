// backend/src/controllers/admin.controller.ts

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
// STATISTICS
// ============================================
export const getStats = async (req: AuthRequest, res: Response) => {
  const [
    totalUsers,
    totalHosts,
    totalAdmins,
    totalListings,
    pendingListings,
    approvedListings,
    rejectedListings,
    totalBookings,
    totalRevenue,
    recentBookings
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'HOST' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: 'PENDING' } }),
    prisma.listing.count({ where: { status: 'APPROVED' } }),
    prisma.listing.count({ where: { status: 'REJECTED' } }),
    prisma.booking.count(),
    prisma.booking.aggregate({ _sum: { totalPrice: true } }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        guest: { select: { name: true, email: true } },
        listing: { select: { title: true } }
      }
    })
  ])

  res.json({
    users: { total: totalUsers, hosts: totalHosts, admins: totalAdmins },
    listings: { total: totalListings, pending: pendingListings, approved: approvedListings, rejected: rejectedListings },
    bookings: { total: totalBookings, recent: recentBookings },
    revenue: totalRevenue._sum.totalPrice || 0
  })
}

// ============================================
// GET ALL USERS
// ============================================
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: { listings: true, bookings: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  res.json(users)
}

// ============================================
// TOGGLE USER STATUS (Block/Unblock)
// ============================================
export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.params.userId)
  
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError('Foydalanuvchi topilmadi', 404)

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive }
  })

  res.json({ 
    message: `Foydalanuvchi ${updated.isActive ? 'aktivlashtirildi' : 'bloklandi'}`, 
    user: updated 
  })
}

// ============================================
// GET ALL LISTINGS (with optional status filter)
// ============================================
export const getAllListings = async (req: AuthRequest, res: Response) => {
  const { status } = req.query
  
  const where: any = {}
  if (status && status !== 'all' && status !== '') {
    where.status = status as string
  }

  const listings = await prisma.listing.findMany({
    where,
    include: {
      host: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  res.json(listings)
}

// ============================================
// GET PENDING LISTINGS
// ============================================
export const getPendingListings = async (req: AuthRequest, res: Response) => {
  const listings = await prisma.listing.findMany({
    where: { status: 'PENDING' },
    include: {
      host: {
        select: { id: true, name: true, email: true, phone: true, avatar: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  res.json(listings)
}

// ============================================
// GET APPROVED LISTINGS
// ============================================
export const getApprovedListings = async (req: AuthRequest, res: Response) => {
  const listings = await prisma.listing.findMany({
    where: { status: 'APPROVED' },
    include: {
      host: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  res.json(listings)
}

// ============================================
// GET REJECTED LISTINGS
// ============================================
export const getRejectedListings = async (req: AuthRequest, res: Response) => {
  const listings = await prisma.listing.findMany({
    where: { status: 'REJECTED' },
    include: { host: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  })
  res.json(listings)
}

// ============================================
// APPROVE LISTING
// ============================================
export const approveListing = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) throw new AppError('Listing topilmadi', 404)

  const updated = await prisma.listing.update({
    where: { id },
    data: { status: 'APPROVED' }
  })

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
// REJECT LISTING
// ============================================
export const rejectListing = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)
  const { reason } = req.body

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) throw new AppError('Listing topilmadi', 404)

  const updated = await prisma.listing.update({
    where: { id },
    data: { status: 'REJECTED', rejectReason: reason || 'Noma\'lum sabab' }
  })

  await prisma.notification.create({
    data: {
      userId: listing.hostId,
      title: 'Listing rad etildi',
      message: `Sizning "${listing.title}" listing-ingiz rad etildi. Sabab: ${reason || 'Noma\'lum'}`,
      type: 'listing_rejected',
      data: { listingId: listing.id, reason }
    }
  })

  res.json({ message: 'Listing rad etildi', listing: updated })
}

// ============================================
// DELETE LISTING
// ============================================
export const deleteListing = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) throw new AppError('Listing topilmadi', 404)

  await prisma.listing.delete({ where: { id } })

  res.json({ message: 'Listing o\'chirildi' })
}

// ============================================
// ADMIN: GET ALL NOTIFICATIONS
// ============================================
export const getAdminNotifications = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.userId)

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  res.json(notifications)
}

// ============================================
// ADMIN: MARK NOTIFICATION AS READ
// ============================================
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  const id = ensureString(req.params.id)

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  })

  res.json({ success: true })
}

// ============================================
// ADMIN: MARK ALL NOTIFICATIONS AS READ
// ============================================
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.userId)

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })

  res.json({ success: true })
}

// ============================================
// ADMIN: GET HOST REQUESTS
// ============================================
export const getHostRequests = async (req: AuthRequest, res: Response) => {
  const userId = ensureString(req.userId)

  const hostRequests = await prisma.notification.findMany({
    where: { 
      type: 'host_request',
      isRead: false 
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  res.json(hostRequests)
}

// ============================================
// ADMIN: APPROVE HOST REQUEST
// ============================================
export const approveHostRequest = async (req: AuthRequest, res: Response) => {
  const notificationId = ensureString(req.params.notificationId)
  const userId = ensureString(req.params.userId)

  // Update user role to HOST
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: 'HOST' }
  })

  // Mark notification as read
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  })

  // Create success notification for user
  await prisma.notification.create({
    data: {
      userId: userId,
      title: 'Tabriklaymiz! 🎉',
      message: 'Sizning host so\'rovingiz tasdiqlandi. Endi listinglar qo\'sha olasiz.',
      type: 'host_approved'
    }
  })

  res.json({ message: 'Host so\'rovi tasdiqlandi', user })
}

// ============================================
// ADMIN: REJECT HOST REQUEST
// ============================================
export const rejectHostRequest = async (req: AuthRequest, res: Response) => {
  const notificationId = ensureString(req.params.notificationId)
  const userId = ensureString(req.params.userId)
  const { reason } = req.body

  // Mark notification as read
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  })

  // Create rejection notification for user
  await prisma.notification.create({
    data: {
      userId: userId,
      title: 'Host so\'rovi rad etildi',
      message: reason || 'Sizning host so\'rovingiz rad etildi. Qaytadan urinib ko\'ring.',
      type: 'host_rejected'
    }
  })

  res.json({ message: 'Host so\'rovi rad etildi' })
}