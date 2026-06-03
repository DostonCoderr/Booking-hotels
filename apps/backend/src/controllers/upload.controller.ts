// backend/src/controllers/upload.controller.ts

import { Request, Response } from 'express'
import cloudinary from '../config/cloudinary'
import { AppError } from '../middleware/error.middleware'
import multer from 'multer'
import { AuthRequest } from '../types'

// Multer memory storage (faylni diskga saqlamasdan)
const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Faqat rasm fayllari yuklanadi') as any, false)
    }
  }
})

export const uploadSingle = upload.single('image')
export const uploadMultiple = upload.array('images', 10)

// Single image upload
export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      throw new AppError('Rasm yuklanmadi', 400)
    }

    // Convert buffer to base64
    const base64 = req.file.buffer.toString('base64')
    const dataURI = `data:${req.file.mimetype};base64,${base64}`

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'airbnb-clone/listings',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
      ]
    })

    res.json({ 
      success: true, 
      url: result.secure_url,
      publicId: result.public_id 
    })
  } catch (error) {
    console.error('Upload error:', error)
    throw new AppError('Rasm yuklashda xatolik', 500)
  }
}

// Multiple images upload
export const uploadMultipleImages = async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
      throw new AppError('Rasmlar yuklanmadi', 400)
    }

    const uploadPromises = files.map(async (file) => {
      const base64 = file.buffer.toString('base64')
      const dataURI = `data:${file.mimetype};base64,${base64}`
      
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'airbnb-clone/listings',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit', quality: 'auto' }
        ]
      })
      return result.secure_url
    })

    const urls = await Promise.all(uploadPromises)
    res.json({ success: true, urls })
  } catch (error) {
    console.error('Upload error:', error)
    throw new AppError('Rasmlar yuklashda xatolik', 500)
  }
}