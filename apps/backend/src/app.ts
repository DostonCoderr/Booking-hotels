import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import 'express-async-errors'

import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import listingRoutes from './routes/listing.routes'
import bookingRoutes from './routes/booking.routes'
import reviewRoutes from './routes/review.routes'
import messageRoutes from './routes/message.routes'
import wishlistRoutes from './routes/wishlist.routes'
import paymentRoutes from './routes/payment.routes'
import adminRoutes from './routes/admin.routes'      // YANGI
import hostRoutes from './routes/host.routes'  
import uploadRoutes from './routes/upload.routes'
import notificationRoutes from './routes/notification.routes'
import { errorMiddleware } from './middleware/error.middleware'




const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/listings', listingRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/admin', adminRoutes)        // YANGI - Admin routelari
app.use('/api/host', hostRoutes) 




app.use('/api/upload', uploadRoutes)
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(errorMiddleware)

export default app
