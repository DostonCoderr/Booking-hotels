import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await sgMail.send({
      to,
      from: process.env.EMAIL_FROM!,
      subject,
      html
    })
  } catch (error) {
    console.error('Email yuborishda xatolik:', error)
  }
}

export const sendWelcomeEmail = async (email: string, name: string) => {
  await sendEmail(
    email,
    'Airbnb Clone ga xush kelibsiz! 🎉',
    `<h1>Salom ${name}!</h1><p>Platformamizga xush kelibsiz. Sayohatingizni rejalashtirishni boshlang!</p>`
  )
}

export const sendBookingConfirmation = async (email: string, details: any) => {
  await sendEmail(
    email,
    '✅ Bron tasdiqlandi',
    `<h1>Bron tasdiqlandi!</h1>
     <p><strong>${details.listingTitle}</strong></p>
     <p>📅 ${details.checkIn} - ${details.checkOut}</p>
     <p>💰 Jami: $${details.totalPrice}</p>`
  )
}
