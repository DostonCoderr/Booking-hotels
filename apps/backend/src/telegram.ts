import TelegramBot from 'node-telegram-bot-api'

let bot: TelegramBot | null = null

export const initTelegramBot = () => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  
  if (!botToken) {
    console.log('⚠️ Telegram bot token topilmadi')
    return null
  }

  // Agar bot allaqachon yaratilgan bo'lsa, qayta yaratma
  if (bot) {
    console.log('🤖 Telegram bot already running')
    return bot
  }

  try {
    bot = new TelegramBot(botToken, { polling: true })
    
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id
      const firstName = msg.chat.first_name || 'Mehmon'
      
      bot?.sendMessage(chatId, `
🤖 *Hotel Reminding Botga xush kelibsiz!* ${firstName}

Sayohat eslatmalarini olish uchun quyidagi chat ID ni ilovaga kiriting:

\`${chatId}\`

⚠️ *Diqqat:* Bu kod faqat sizga tegishli!

👇 Ilovada "Telegram ulash" bo'limiga o'tib, shu kodni kiriting.
      `, { parse_mode: 'Markdown' })
      
      console.log(`✅ Telegram: User started - Chat ID: ${chatId}`)
    })
    
    bot.on('polling_error', (error) => {
      console.error('❌ Telegram error:', error)
    })
    
    console.log('🤖 Telegram bot ishga tushdi')
  } catch (error) {
    console.error('❌ Telegram bot start error:', error)
  }
  
  return bot
}

// Botni o'chirish funksiyasi
export const stopTelegramBot = () => {
  if (bot) {
    bot.stopPolling()
    bot = null
    console.log('🛑 Telegram bot stopped')
  }
}