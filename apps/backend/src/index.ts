import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'
import app from './app'
import { setupSocket } from './socket'
import { PrismaClient } from '@prisma/client'
import { initTelegramBot } from './controllers/notification.controller'

const prisma = new PrismaClient()
const PORT = process.env.PORT || 3000

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    credentials: true
  }
})

setupSocket(io)

// Telegram botni ishga tushirish
initTelegramBot()

async function main() {
  try {
    await prisma.$connect()
    console.log('✅ PostgreSQL ulandi')

    server.listen(PORT, () => {
      console.log(`🚀 Server: http://localhost:${PORT}`)
      console.log(`📊 Health: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('❌ Server start xatosi:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

main()