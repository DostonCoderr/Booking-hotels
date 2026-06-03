// backend/src/middleware/role.middleware.ts

import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Tizimga kiring' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Ruxsat etilmagan. Kerakli rol: ${roles.join(', ')}` 
      })
    }

    next()
  }
}

// Qulaylik uchun helperlar
export const requireAuth = requireRole('USER', 'HOST', 'ADMIN')
export const requireHost = requireRole('HOST', 'ADMIN')
export const requireAdmin = requireRole('ADMIN')