// backend/src/routes/notification.routes.ts

import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireHost } from '../middleware/role.middleware'
import { 
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getHostNotifications,
  getHostUnreadCount,
  getNotificationSettings,
  updateNotificationSettings,
  createTripReminder,
  saveTelegramChatId,
  getTelegramChatId,
  deleteTelegramConnection
} from '../controllers/notification.controller'

const router = Router()

router.use(authMiddleware)

// ============================================
// USER NOTIFICATION ROUTES
// ============================================
router.get('/', getNotifications)
router.get('/unread/count', getUnreadCount)
router.put('/:id/read', markAsRead)
router.put('/read/all', markAllAsRead)

// ============================================
// HOST NOTIFICATION ROUTES
// ============================================
router.get('/host', requireHost, getHostNotifications)
router.get('/host/unread/count', requireHost, getHostUnreadCount)
router.put('/host/:id/read', requireHost, markAsRead)
router.put('/host/read/all', requireHost, markAllAsRead)

// ============================================
// SETTINGS & TELEGRAM (User + Host)
// ============================================
router.get('/settings', getNotificationSettings)
router.put('/settings', updateNotificationSettings)
router.post('/telegram-chat', saveTelegramChatId)
router.get('/telegram-chat', getTelegramChatId)
router.delete('/telegram-chat', deleteTelegramConnection)

// ============================================
// TRIP REMINDER
// ============================================
router.post('/trip-reminder', createTripReminder)

export default router