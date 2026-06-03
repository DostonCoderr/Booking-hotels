// backend/src/routes/booking.routes.ts

import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireHost } from '../middleware/role.middleware'
import { 
  createBooking,
  createPaymentIntent,
  createBookingAfterPayment,
  confirmBooking, 
  cancelBooking, 
  getMyBookings, 
  getHostBookings, 
  confirmArrival, 
  getBookingById,
  hostApproveBooking,
  hostRejectBooking,
  updateBookingStatus
} from '../controllers/booking.controller'

const router = Router()

router.use(authMiddleware)

// ============================================
// USER ROUTES
// ============================================
router.post('/create-payment-intent', createPaymentIntent)
router.post('/create-after-payment', createBookingAfterPayment)
router.post('/', createBooking)
router.post('/:id/confirm', confirmBooking)
router.post('/:id/cancel', cancelBooking)
router.get('/my', getMyBookings)
router.get('/:id', getBookingById)

// ============================================
// HOST ROUTES (requireHost middleware bilan)
// ============================================
router.get('/host/listings', requireHost, getHostBookings)
router.patch('/host/:id/approve', requireHost, hostApproveBooking)
router.patch('/host/:id/reject', requireHost, hostRejectBooking)
router.patch('/host/:id/status', requireHost, updateBookingStatus)
router.post('/host/:id/confirm-arrival', requireHost, confirmArrival)

export default router