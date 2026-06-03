import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../types'
import { stripe } from '../config/stripe'

const prisma = new PrismaClient()

// Get user's saved payment methods
export const getPaymentMethods = async (req: AuthRequest, res: Response) => {
  const userId = req.userId as string
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true }
  })

  if (!user?.stripeCustomerId) {
    return res.json([])
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: user.stripeCustomerId,
    type: 'card',
  })

  const savedMethods = await prisma.paymentMethod.findMany({
    where: { userId }
  })

  const formattedMethods = paymentMethods.data.map((method: any) => {
    const saved = savedMethods.find(s => s.stripePaymentMethodId === method.id)
    return {
      id: saved?.id || method.id,
      stripePaymentMethodId: method.id,
      last4: method.card.last4,
      brand: method.card.brand,
      expiryMonth: method.card.exp_month,
      expiryYear: method.card.exp_year,
      isDefault: saved?.isDefault || false,
      createdAt: saved?.createdAt || new Date(),
    }
  })

  res.json(formattedMethods)
}

// Create PAYMENT INTENT (not setup intent) for adding card
export const createPaymentIntent = async (req: AuthRequest, res: Response) => {
  const userId = req.userId as string
  
  let user = await prisma.user.findUnique({
    where: { id: userId }
  })

  // Create Stripe customer if not exists
  if (!user?.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user?.email,
      name: user?.name,
      metadata: { userId }
    })
    
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id }
    })
    
    user = await prisma.user.findUnique({
      where: { id: userId }
    })
  }

  // Create a PaymentIntent with minimal amount (test)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 100, // $1.00 test amount
    currency: 'usd',
    customer: user!.stripeCustomerId!,
    setup_future_usage: 'off_session',
    metadata: { userId, type: 'setup_card' }
  })

  res.json({ clientSecret: paymentIntent.client_secret })
}

// Save payment method after successful payment
export const savePaymentMethod = async (req: AuthRequest, res: Response) => {
  const userId = req.userId as string
  const { paymentMethodId, last4, brand, expiryMonth, expiryYear, isDefault } = req.body

  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user?.stripeCustomerId) {
    throw new Error('Customer not found')
  }

  // Check if payment method already exists
  const existing = await prisma.paymentMethod.findFirst({
    where: { stripePaymentMethodId: paymentMethodId }
  })

  if (existing) {
    return res.json(existing)
  }

  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: user.stripeCustomerId,
  })

  // If this is the first payment method, make it default
  const paymentMethodsCount = await prisma.paymentMethod.count({
    where: { userId }
  })

  const shouldBeDefault = isDefault || paymentMethodsCount === 0

  if (shouldBeDefault) {
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })
  }

  // Save to database
  const savedCard = await prisma.paymentMethod.create({
    data: {
      userId,
      stripePaymentMethodId: paymentMethodId,
      last4,
      brand,
      expiryMonth: parseInt(expiryMonth),
      expiryYear: parseInt(expiryYear),
      isDefault: shouldBeDefault,
    }
  })

  // If this is default, update others
  if (shouldBeDefault) {
    await prisma.paymentMethod.updateMany({
      where: { 
        userId,
        id: { not: savedCard.id }
      },
      data: { isDefault: false }
    })
  }

  res.json(savedCard)
}

// Delete payment method
export const deletePaymentMethod = async (req: AuthRequest, res: Response) => {
  const userId = req.userId as string
  const { id } = req.params

  const paymentMethod = await prisma.paymentMethod.findFirst({
    where: { 
      id: id as string, 
      userId 
    }
  })

  if (!paymentMethod) {
    throw new Error('Payment method not found')
  }

  await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId)
  await prisma.paymentMethod.delete({ 
    where: { id: paymentMethod.id } 
  })

  if (paymentMethod.isDefault) {
    const anotherMethod = await prisma.paymentMethod.findFirst({
      where: { userId }
    })
    
    if (anotherMethod) {
      await prisma.paymentMethod.update({
        where: { id: anotherMethod.id },
        data: { isDefault: true }
      })
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (user?.stripeCustomerId) {
        await stripe.customers.update(user.stripeCustomerId, {
          invoice_settings: { default_payment_method: anotherMethod.stripePaymentMethodId },
        })
      }
    }
  }

  res.json({ success: true })
}

// Set default payment method
export const setDefaultPaymentMethod = async (req: AuthRequest, res: Response) => {
  const userId = req.userId as string
  const { id } = req.params

  const paymentMethod = await prisma.paymentMethod.findFirst({
    where: { 
      id: id as string, 
      userId 
    }
  })

  if (!paymentMethod) {
    throw new Error('Payment method not found')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (user?.stripeCustomerId) {
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethod.stripePaymentMethodId },
    })
  }

  await prisma.paymentMethod.updateMany({
    where: { userId },
    data: { isDefault: false }
  })

  await prisma.paymentMethod.update({
    where: { id: paymentMethod.id },
    data: { isDefault: true }
  })

  res.json({ success: true })
}


// Get payment intent by ID
export const getPaymentIntent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    
    // id ni stringga aylantirish
    const paymentIntentId = typeof id === 'string' ? id : id[0]
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'PaymentIntent ID required' })
    }
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    res.json({
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret
    })
  } catch (error: any) {
    console.error('Get payment intent error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}