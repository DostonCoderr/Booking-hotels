import { api } from './api'

export interface PaymentMethod {
  id: string
  stripePaymentMethodId: string
  last4: string
  brand: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
  createdAt: string
}

export const paymentService = {
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const { data } = await api.get('/payments/methods')
    return data
  },

  createPaymentIntent: async (): Promise<{ clientSecret: string }> => {
    const { data } = await api.post('/payments/create-payment-intent')
    console.log('Payment intent response:', data)
    return data
  },

  savePaymentMethod: async (params: {
    paymentMethodId: string
    last4: string
    brand: string
    expiryMonth: number
    expiryYear: number
    isDefault?: boolean
  }): Promise<PaymentMethod> => {
    const { data } = await api.post('/payments/save-method', params)
    return data
  },

  deletePaymentMethod: async (id: string): Promise<void> => {
    await api.delete(`/payments/methods/${id}`)
  },

  setDefaultPaymentMethod: async (id: string): Promise<void> => {
    await api.put(`/payments/methods/${id}/default`)
  },
}