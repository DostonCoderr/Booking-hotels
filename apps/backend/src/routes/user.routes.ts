import { Router } from 'express'
import { getUserProfile, updateProfile, uploadAvatar } from '../controllers/user.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { upload } from '../middleware/upload.middleware'

const router = Router()

router.get('/:id', getUserProfile)
router.put('/profile', authMiddleware, updateProfile)
router.post('/avatar', authMiddleware, upload.single('avatar'), uploadAvatar)

export default router
