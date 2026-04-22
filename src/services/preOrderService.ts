import api from '../lib/api'

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_PRODUCTION' | 'READY' | 'COMPLETED' | 'CANCELLED'

export interface PreOrderItem {
  productId: string
  quantity: number
  unitPrice: number
  customNotes?: string
}

export interface CreatePreOrderPayload {
  customerName: string
  customerPhone: string
  pickupDate: string
  dpAmount?: number
  notes?: string
  items: PreOrderItem[]
}

export interface PreOrder {
  id: string
  customerName: string
  customerPhone: string
  pickupDate: string
  total: number
  dpAmount: number
  remainingAmount: number
  status: OrderStatus
  notes: string | null
  createdAt: string
  items: {
    id: string
    quantity: number
    unitPrice: number
    subtotal: number
    customNotes: string | null
    product: { name: string; imageUrl: string | null }
  }[]
}

export const preOrderApi = {
  list: async (params?: { status?: OrderStatus; from?: string; to?: string }): Promise<PreOrder[]> => {
    const res = await api.get('/pre-orders', { params })
    return res.data
  },

  get: async (id: string): Promise<PreOrder> => {
    const res = await api.get(`/pre-orders/${id}`)
    return res.data
  },

  create: async (payload: CreatePreOrderPayload): Promise<PreOrder> => {
    const res = await api.post('/pre-orders', payload)
    return res.data
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<PreOrder> => {
    const res = await api.patch(`/pre-orders/${id}/status`, { status })
    return res.data
  },

  payRemaining: async (id: string, amount: number): Promise<PreOrder> => {
    const res = await api.post(`/pre-orders/${id}/pay-remaining`, { amount })
    return res.data
  },
}
