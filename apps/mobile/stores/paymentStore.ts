import { create } from 'zustand'
import { paymentService, PaymentMethod } from '@/services/payment.service'

interface PaymentStore {
  paymentMethods: PaymentMethod[]
  isLoading: boolean
  fetchPaymentMethods: () => Promise<void>
  addPaymentMethod: (method: PaymentMethod) => void
  removePaymentMethod: (id: string) => Promise<void>
  setDefault: (id: string) => Promise<void>
}

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  paymentMethods: [],
  isLoading: false,

  fetchPaymentMethods: async () => {
    set({ isLoading: true })
    try {
      const methods = await paymentService.getPaymentMethods()
      set({ paymentMethods: methods, isLoading: false })
    } catch (error) {
      console.error('Fetch payment methods error:', error)
      set({ isLoading: false })
    }
  },

  addPaymentMethod: (method: PaymentMethod) => {
    set((state) => ({
      paymentMethods: [...state.paymentMethods, method]
    }))
  },

  removePaymentMethod: async (id: string) => {
    try {
      await paymentService.deletePaymentMethod(id)
      set((state) => ({
        paymentMethods: state.paymentMethods.filter(m => m.id !== id)
      }))
    } catch (error) {
      console.error('Remove payment method error:', error)
    }
  },

  setDefault: async (id: string) => {
    try {
      await paymentService.setDefaultPaymentMethod(id)
      set((state) => ({
        paymentMethods: state.paymentMethods.map(m => ({
          ...m,
          isDefault: m.id === id
        }))
      }))
    } catch (error) {
      console.error('Set default payment method error:', error)
    }
  },
}))