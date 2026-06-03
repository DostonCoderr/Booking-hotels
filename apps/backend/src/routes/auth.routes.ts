// backend/src/routes/auth.routes.ts

import { Router } from 'express'
import { validate } from '../middleware/validate.middleware'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/role.middleware'
import {
  register,
  login,
  googleAuth,
  refreshTokenHandler,
  me,
  requestHostRole,
  approveHostRole,
  rejectHostRole,
  checkEmailExists,
  sendResetCode,
  verifyResetCode,
  resetPassword,
  clerkSync
} from '../controllers/auth.controller'
import { registerSchema, loginSchema } from '../schemas/auth.schema'

const router = Router()

// Public routes
router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/google', googleAuth)
router.post('/refresh', refreshTokenHandler)

// ✅ Clerk sync route (USER uchun)
router.post('/clerk-sync', clerkSync)

// Forgot password routes
router.post('/check-email', checkEmailExists)
router.post('/send-reset-code', sendResetCode)
router.post('/verify-reset-code', verifyResetCode)
router.post('/reset-password', resetPassword)

// Protected routes
router.get('/me', authMiddleware, me)

// Host role requests
router.post('/become-host', authMiddleware, requestHostRole)
router.post('/host-requests/:userId/approve', authMiddleware, requireAdmin, approveHostRole)
router.post('/host-requests/:userId/reject', authMiddleware, requireAdmin, rejectHostRole)

export default router