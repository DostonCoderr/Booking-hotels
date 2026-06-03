import { Server, Socket } from 'socket.io'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Notification yaratish funksiyasi
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  data: any = {},
  io: Server
) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      data
    }
  })
  
  // Real-time yuborish
  io.to(`user:${userId}`).emit('new_notification', notification)
  
  return notification
}

export const setupSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    const token = socket.handshake.auth.token
    let userId: string | null = null

    // Token dan userId ni olish
    try {
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(token, process.env.JWT_SECRET!)
      userId = decoded.userId
    } catch (error) {
      socket.disconnect()
      return
    }

    if (!userId) {
      socket.disconnect()
      return
    }

    socket.join(`user:${userId}`)
    console.log(`🟢 User connected: ${userId}`)

    // Send message
    socket.on('send_message', async ({ receiverId, content }) => {
      try {
        const message = await prisma.message.create({
          data: {
            senderId: userId,
            receiverId,
            content
          },
          include: {
            sender: {
              select: { id: true, name: true, avatar: true }
            }
          }
        })

        // Send message to receiver
        io.to(`user:${receiverId}`).emit('new_message', message)
        socket.emit('message_sent', message)

        // Create notification for receiver
        await createNotification(
          receiverId,
          'Yangi xabar',
          `Sizga yangi xabar keldi`,
          'message',
          { messageId: message.id, senderId: userId },
          io
        )
      } catch (error) {
        socket.emit('error', { message: 'Xabar yuborishda xatolik' })
      }
    })

    // Mark messages as read
    socket.on('mark_read', async ({ senderId }) => {
      await prisma.message.updateMany({
        where: {
          senderId,
          receiverId: userId,
          isRead: false
        },
        data: { isRead: true }
      })
      io.to(`user:${senderId}`).emit('messages_read', { by: userId })
    })

    socket.on('disconnect', () => {
      console.log(`🔴 User disconnected: ${userId}`)
    })
  })
}