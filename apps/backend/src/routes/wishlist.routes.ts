import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { getWishlist, addToWishlist, removeFromWishlist, checkWishlist } from '../controllers/wishlist.controller'

const router = Router()

router.use(authMiddleware)

router.get('/', getWishlist)
router.post('/', addToWishlist)
router.delete('/:listingId', removeFromWishlist)
router.get('/check/:listingId', checkWishlist)

export default router