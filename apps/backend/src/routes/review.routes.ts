import { Router } from 'express'
import { createReview, getListingReviews } from '../controllers/review.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.get('/listing/:listingId', getListingReviews)
router.post('/listing/:listingId', authMiddleware, createReview)

export default router
