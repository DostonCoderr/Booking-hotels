// backend/src/middleware/validate.middleware.ts

import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const error = result.error as ZodError
      return res.status(400).json({
        message: 'Ma\'lumotlar noto\'g\'ri',
        errors: error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message
        }))
      })
    }
    req.body = result.data
    next()
  }
}