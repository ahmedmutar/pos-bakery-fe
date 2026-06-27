import api from '../lib/api'

export interface Customer {
  id: string
  tenantId: string
  name: string
  phone: string
  email: string | null
  notes: string | null
  totalPoints: number
  lifetimeSales: number
  createdAt: string
}

export interface LoyaltyTransaction {
  id: string
  customerId: string
  type: 'EARN' | 'REDEEM' | 'ADJUST'
  points: number
  txId: string | null
  note: string | null
  createdAt: string
}

export interface CustomerListResponse {
  customers: Customer[]
  total: number
  page: number
  limit: number
}

export const customerApi = {
  list: async (params?: { search?: string; page?: number; limit?: number }): Promise<CustomerListResponse> => {
    const res = await api.get('/customers', { params })
    return res.data
  },

  lookup: async (phone: string): Promise<Customer | null> => {
    const res = await api.get('/customers/lookup', { params: { phone } })
    return res.data
  },

  get: async (id: string): Promise<Customer & { transactions: unknown[]; loyaltyTx: LoyaltyTransaction[] }> => {
    const res = await api.get(`/customers/${id}`)
    return res.data
  },

  create: async (data: { name: string; phone: string; email?: string; notes?: string }): Promise<Customer> => {
    const res = await api.post('/customers', data)
    return res.data
  },

  update: async (id: string, data: Partial<{ name: string; phone: string; email: string; notes: string }>): Promise<Customer> => {
    const res = await api.patch(`/customers/${id}`, data)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`)
  },

  adjustPoints: async (id: string, points: number, note?: string): Promise<Customer> => {
    const res = await api.post(`/customers/${id}/adjust-points`, { points, note })
    return res.data
  },

  loyaltyHistory: async (id: string): Promise<{ customer: Customer; history: LoyaltyTransaction[] }> => {
    const res = await api.get(`/customers/${id}/loyalty`)
    return res.data
  },
}
