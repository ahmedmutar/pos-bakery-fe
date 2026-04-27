import api from '../lib/api'

export interface Shift {
  id: string
  outletId: string
  userId: string
  openedAt: string
  closedAt: string | null
  openingCash: number
  closingCash: number | null
  cashDiff: number | null
  outlet: { name: string }
}

export interface TransactionItem {
  productId: string
  quantity: number
  unitPrice: number
  notes?: string
}

export interface CreateTransactionPayload {
  shiftId: string
  outletId: string
  items: TransactionItem[]
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER' | 'SPLIT'
  paidAmount: number
  discount?: number
  notes?: string
}

export interface Transaction {
  id: string
  total: number
  paymentMethod: string
  paidAmount: number
  changeAmount: number
  discount: number
  isVoided: boolean
  notes: string | null
  paymentProof: string | null
  createdAt: string
  items: {
    id: string
    quantity: number
    unitPrice: number
    subtotal: number
    product: { name: string }
  }[]
  user: { name: string }
  outlet: { name: string }
}

export const transactionApi = {
  openShift: async (outletId: string, openingCash: number, forceClose?: boolean): Promise<Shift> => {
    const res = await api.post('/transactions/shifts/open', { outletId, openingCash, forceClose })
    return res.data
  },

  forceCloseShift: async (shiftId: string): Promise<void> => {
    await api.post(`/transactions/shifts/${shiftId}/force-close`)
  },

  closeShift: async (shiftId: string, closingCash: number, notes?: string) => {
    const res = await api.post(`/transactions/shifts/${shiftId}/close`, { closingCash, notes })
    return res.data
  },

  activeShift: async (): Promise<Shift | null> => {
    const res = await api.get('/transactions/shifts/active')
    return res.data
  },

  create: async (payload: CreateTransactionPayload): Promise<Transaction> => {
    const res = await api.post('/transactions', payload)
    return res.data
  },

  list: async (params?: { from?: string; to?: string; outletId?: string; shiftId?: string }): Promise<Transaction[]> => {
    const res = await api.get('/transactions', { params })
    return res.data
  },

  get: async (id: string): Promise<Transaction> => {
    const res = await api.get(`/transactions/${id}`)
    return res.data
  },

  void: async (id: string): Promise<Transaction> => {
    const res = await api.post(`/transactions/${id}/void`)
    return res.data
  },
}
