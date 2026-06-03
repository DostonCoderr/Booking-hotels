// backend/src/controllers/message.controller.ts
import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../types'

const prisma = new PrismaClient()

// Helper function to ensure string type
const ensureString = (value: string | string[] | undefined): string => {
  if (!value) throw new Error('Value is required')
  return Array.isArray(value) ? value[0] : value
}

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = ensureString(req.userId)
    
    // Get all messages where user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: { 
          select: { id: true, name: true, avatar: true, phone: true }
        },
        receiver: { 
          select: { id: true, name: true, avatar: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Group by conversation partner
    const conversationsMap = new Map()

    for (const msg of messages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender
      
      if (!conversationsMap.has(otherId)) {
        conversationsMap.set(otherId, {
          user: {
            id: otherUser.id,
            name: otherUser.name,
            avatar: otherUser.avatar,
            phone: otherUser.phone
          },
          lastMessage: {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
            senderId: msg.senderId
          },
          unreadCount: 0
        })
      }
    }

    // Get unread counts
    const unreadMessages = await prisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: userId,
        isRead: false
      },
      _count: {
        id: true
      }
    })

    // Update unread counts
    for (const unread of unreadMessages) {
      if (conversationsMap.has(unread.senderId)) {
        const conv = conversationsMap.get(unread.senderId)
        conv.unreadCount = unread._count.id
      }
    }

    const conversations = Array.from(conversationsMap.values())
    
    // Sort by last message date
    conversations.sort((a, b) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    )

    res.json(conversations)
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({ message: 'Xatolik yuz berdi' })
  }
}

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = ensureString(req.userId)
    const otherUserId = ensureString(req.params.userId)

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        },
        receiver: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    })

    res.json(messages)
  } catch (error) {
    console.error('Get messages error:', error)
    res.status(500).json({ message: 'Xatolik yuz berdi' })
  }
}

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const senderId = ensureString(req.userId)
    const { receiverId, content } = req.body
    
    const receiverIdStr = ensureString(receiverId)

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Xabar matni bo\'sh bo\'lishi mumkin emas' })
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: senderId,
        receiverId: receiverIdStr
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        },
        receiver: {
          select: { id: true, name: true, avatar: true }
        }
      }
    })

    // Emit via socket if available
    const { io } = req.app.locals
    if (io) {
      io.to(receiverIdStr).emit('newMessage', message)
      io.to(senderId).emit('newMessage', message)
    }

    res.status(201).json(message)
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ message: 'Xabar yuborishda xatolik' })
  }
}

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const messageId = ensureString(req.params.messageId)

    await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Mark as read error:', error)
    res.status(500).json({ message: 'Xatolik yuz berdi' })
  }
}

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = ensureString(req.userId)
    
    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    })

    res.json({ count })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ message: 'Xatolik yuz berdi' })
  }
}