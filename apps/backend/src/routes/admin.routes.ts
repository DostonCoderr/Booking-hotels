// backend/src/routes/admin.routes.ts

import { Router } from 'express'
import { requireAdmin } from '../middleware/role.middleware'
import { authMiddleware } from '../middleware/auth.middleware'
import {
  getStats,
  getAllUsers,
  toggleUserStatus,
  getAllListings,
  getPendingListings,
  getApprovedListings,
  getRejectedListings,
  approveListing,
  rejectListing,
  deleteListing,
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getHostRequests,
  approveHostRequest,
  rejectHostRequest
} from '../controllers/admin.controller'

const router = Router()

// All admin routes require authentication and admin role
router.use(authMiddleware)
router.use(requireAdmin)

// Dashboard stats
router.get('/stats', getStats)

// User management
router.get('/users', getAllUsers)
router.patch('/users/:userId/toggle', toggleUserStatus)

// Listing management
router.get('/listings', getAllListings)
router.get('/listings/pending', getPendingListings)
router.get('/listings/approved', getApprovedListings)
router.get('/listings/rejected', getRejectedListings)
router.patch('/listings/:id/approve', approveListing)
router.patch('/listings/:id/reject', rejectListing)
router.delete('/listings/:id', deleteListing)

// Notifications
router.get('/notifications', getAdminNotifications)
router.patch('/notifications/:id/read', markNotificationAsRead)
router.patch('/notifications/read-all', markAllNotificationsAsRead)

// Host requests
router.get('/host-requests', getHostRequests)
router.patch('/host-requests/:notificationId/:userId/approve', approveHostRequest)
router.patch('/host-requests/:notificationId/:userId/reject', rejectHostRequest)

export default router