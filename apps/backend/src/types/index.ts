// backend/src/types/index.ts

import { Request } from 'express'

export interface AuthRequest extends Request {
  userId?: string
  user?: {
    id: string
    email: string
    role: string
    name?: string
  }
}

export interface TokenPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}