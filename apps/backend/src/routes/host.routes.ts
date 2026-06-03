// backend/src/routes/host.routes.ts

import { Router } from 'express'
import { requireHost } from '../middleware/role.middleware'
import { authMiddleware } from '../middleware/auth.middleware'
import {
  getMyListings,
  createListing,
  updateListing,
  deleteListing,
  getHostStats,
  getListingById,
  getHostReviews,
  getHostRatingSummary,
  getHostBookings,
  updateBookingStatus,
  getHostProfile,      // ✅ QO'SHILDI
  updateHostProfile 
} from '../controllers/host.controller'

const router = Router()

// All host routes require authentication and host role
router.use(authMiddleware)
router.use(requireHost)

// Dashboard
router.get('/stats', getHostStats)


// Profile (YANGI)
router.get('/profile', getHostProfile)      // ✅ HOST PROFILE GET
router.put('/profile', updateHostProfile)    // ✅ HOST PROFILE UPDATE


// Listings management
router.get('/listings', getMyListings)
router.get('/listings/:id', getListingById)
router.post('/listings', createListing)
router.put('/listings/:id', updateListing)
router.delete('/listings/:id', deleteListing)
router.get('/reviews', getHostReviews)
router.get('/rating-summary', getHostRatingSummary)

// Bookings
router.get('/bookings', getHostBookings)
router.patch('/bookings/:id/status', updateBookingStatus)
export default router