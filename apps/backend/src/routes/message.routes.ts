// backend/src/routes/message.routes.ts
import { Router } from 'express'
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  markAsRead,
  getUnreadCount 
} from '../controllers/message.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

// Barcha routelar auth middleware bilan himoyalangan
router.use(authMiddleware)

// Conversation va message routelari
router.get('/conversations', getConversations)
router.get('/unread/count', getUnreadCount)
router.get('/:userId', getMessages)
router.post('/', sendMessage)
router.put('/:messageId/read', markAsRead)

export default router