// backend/src/routes/upload.routes.ts

import { Router } from 'express'
import { 
  uploadSingle, 
  uploadMultiple, 
  uploadImage, 
  uploadMultipleImages 
} from '../controllers/upload.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)

// Single image upload - /upload (asosiy endpoint)
router.post('/', uploadSingle, uploadImage)

// Multiple images upload - /upload/multiple
router.post('/multiple', uploadMultiple, uploadMultipleImages)

export default router