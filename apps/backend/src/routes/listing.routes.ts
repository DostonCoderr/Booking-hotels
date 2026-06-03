// backend/src/routes/listing.routes.ts

import { Router } from 'express'
import { 
  createListing, 
  getListings, 
  getListingById, 
  updateListing, 
  deleteListing, 
  searchListings, 
  getBookedDates,
  getHostListings,
  getPendingListings,
  approveListing,
  rejectListing
} from '../controllers/listing.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireHost, requireAdmin } from '../middleware/role.middleware'
import { upload } from '../middleware/upload.middleware'

const router = Router()

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================
router.get('/search', searchListings)
router.get('/', getListings)
router.get('/:id', getListingById)
router.get('/:id/booked-dates', getBookedDates)

// ============================================
// HOST ROUTES (Authentication + Host role required)
// ============================================
router.post('/', authMiddleware, requireHost, upload.array('images', 10), createListing)
router.put('/:id', authMiddleware, requireHost, updateListing)
router.delete('/:id', authMiddleware, requireHost, deleteListing)
router.get('/host/my-listings', authMiddleware, requireHost, getHostListings)

// ============================================
// ADMIN ROUTES (Authentication + Admin role required)
// ============================================
router.get('/admin/pending', authMiddleware, requireAdmin, getPendingListings)
router.patch('/admin/:id/approve', authMiddleware, requireAdmin, approveListing)
router.patch('/admin/:id/reject', authMiddleware, requireAdmin, rejectListing)

export default router