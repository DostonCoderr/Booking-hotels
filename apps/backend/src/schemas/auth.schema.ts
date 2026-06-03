// backend/src/schemas/auth.schema.ts

import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Ism kamida 2 ta harf').max(50, 'Ism 50 ta harfdan oshmasin'),
  email: z.string().email('To\'g\'ri email kiriting'),
  password: z.string().min(6, 'Parol kamida 6 ta belgi').max(50),
})

export const loginSchema = z.object({
  email: z.string().email('To\'g\'ri email kiriting'),
  password: z.string().min(1, 'Parolni kiriting'),
})

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>