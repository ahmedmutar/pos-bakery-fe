import api from '../lib/api'

export interface PaymentToken {
  simulation: boolean
  orderId: string
  token: string
  redirectUrl: string | null
  amount: number
  paymentMethod: string
}

export interface PaymentStatus {
  orderId: string
  status: 'pending' | 'settlement' | 'capture' | 'expire' | 'cancel' | 'deny'
  paymentType: string
  amount: number
  simulation: boolean
}

export type PaymentMethod = 'QRIS' | 'TRANSFER' | 'CARD' | 'ALL'

export const paymentApi = {
  createToken: async (payload: {
    amount: number
    customerName: string
    customerEmail?: string
    items: { id: string; name: string; price: number; quantity: number }[]
    paymentMethod: PaymentMethod
  }): Promise<PaymentToken> => {
    const res = await api.post('/payment/token', payload)
    return res.data
  },

  checkStatus: async (orderId: string): Promise<PaymentStatus> => {
    const res = await api.get(`/payment/status/${orderId}`)
    return res.data
  },
}
