// backend/src/services/telegram.service.ts

import TelegramBot from 'node-telegram-bot-api'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
let bot: TelegramBot | null = null

export const initTelegramBot = () => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  
  if (!botToken) {
    console.log('⚠️ Telegram bot token topilmadi')
    return null
  }

  if (bot) {
    return bot
  }

  try {
    bot = new TelegramBot(botToken, { polling: true })
    
    // /start command - parol tiklash uchun
    bot.onText(/\/start reset_(.+)/, async (msg, match) => {
      const chatId = msg.chat.id
      const email = match?.[1]
      const firstName = msg.chat.first_name || 'Mehmon'
      
      if (email) {
        // Find user by email
        const user = await prisma.user.findUnique({ where: { email } })
        
        if (user) {
          // Save telegram chat ID
          await prisma.user.update({
            where: { id: user.id },
            data: { telegramChatId: chatId.toString() }
          })
          
          // Generate reset code
          const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
          const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000)
          
          await prisma.user.update({
            where: { id: user.id },
            data: { resetCode, resetCodeExpiry }
          })
          
          bot?.sendMessage(chatId, `
🔐 *PAROLNI TIKLASH KODI* 🔐

Hurmatli ${firstName},

Sizning parolni tiklash kodingiz:

*${resetCode}*

Ushbu kod *15 daqiqa* davomida amal qiladi.

Kodni ilovaga kiriting va yangi parol o'rnating.

---
🏠 Airbnb Clone ilovasi
          `, { parse_mode: 'Markdown' })
        } else {
          bot?.sendMessage(chatId, `
❌ *XATOLIK* ❌

"${email}" manzili tizimda topilmadi.

Iltimos, to'g'ri email manzilini kiriting yoki avval ro'yxatdan o'ting.

---
🏠 Airbnb Clone ilovasi
          `, { parse_mode: 'Markdown' })
        }
      } else {
        bot?.sendMessage(chatId, `
🤖 *XUSH KELIBSIZ!* ${firstName}

Parolni tiklash uchun quyidagi link orqali keling:

👉 /start reset_sizning_email@example.com

Misol: /start reset_user@example.com

---
🏠 Airbnb Clone ilovasi
        `, { parse_mode: 'Markdown' })
      }
    })
    
    // Simple /start command
    bot.onText(/\/start$/, (msg) => {
      const chatId = msg.chat.id
      const firstName = msg.chat.first_name || 'Mehmon'
      
      bot?.sendMessage(chatId, `
🤖 *XUSH KELIBSIZ!* ${firstName}

🔐 Parolni tiklash uchun:
/start reset_sizning_email@example.com

📱 Ilovaga ulanish uchun:
Ilovadagi "Telegram ulash" bo'limiga o'ting va quyidagi chat ID ni kiriting:

*${chatId}*

⚠️ Bu kod faqat sizga tegishli!

---
🏠 Airbnb Clone ilovasi
      `, { parse_mode: 'Markdown' })
      
      // Save chat ID if user exists
      // Bu yerda user ni topish va chat ID ni saqlash
    })
    
    bot.on('polling_error', (error) => {
      console.error('❌ Telegram polling error:', error)
    })
    
    console.log('🤖 Telegram bot ishga tushdi')
  } catch (error) {
    console.error('❌ Telegram bot start error:', error)
  }
  
  return bot
}

export const sendTelegramMessage = async (chatId: string, message: string, parseMode: 'Markdown' | 'HTML' = 'Markdown') => {
  if (!bot) {
    console.log('❌ Telegram bot ishlamayapti')
    return false
  }
  
  try {
    await bot.sendMessage(chatId, message, { parse_mode: parseMode })
    return true
  } catch (error) {
    console.error('❌ Telegram send error:', error)
    return false
  }
}

export const stopTelegramBot = () => {
  if (bot) {
    bot.stopPolling()
    bot = null
    console.log('🛑 Telegram bot stopped')
  }
}