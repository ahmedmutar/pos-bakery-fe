import api from '../lib/api'

export type ResellerTier = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM'

export interface Reseller {
  id: string
  tenantId: string
  name: string
  phone: string
  email: string | null
  notes: string | null
  tier: ResellerTier
  discountPct: number
  commissionPct: number
  totalSales: number
  totalCommission: number
  isActive: boolean
  createdAt: string
}

export interface ResellerDetail extends Reseller {
  preOrders: {
    id: string
    customerName: string
    total: number
    status: string
    source: string
    createdAt: string
  }[]
}

export interface CreateResellerPayload {
  name: string
  phone: string
  email?: string
  notes?: string
  tier?: ResellerTier
  discountPct?: number
  commissionPct?: number
}

export const TIER_CONFIG: Record<ResellerTier, { label: string; color: string; defaultCommission: number }> = {
  STANDARD:  { label: 'Standard',  color: 'bg-surface-100 text-muted-600',    defaultCommission: 0  },
  SILVER:    { label: 'Silver',    color: 'bg-gray-100 text-gray-700',         defaultCommission: 5  },
  GOLD:      { label: 'Gold',      color: 'bg-amber-100 text-amber-700',       defaultCommission: 10 },
  PLATINUM:  { label: 'Platinum',  color: 'bg-blue-100 text-blue-700',         defaultCommission: 15 },
}

export const resellerApi = {
  list: async (includeInactive?: boolean): Promise<Reseller[]> => {
    const res = await api.get('/resellers', { params: { includeInactive: includeInactive ? '1' : undefined } })
    return res.data
  },

  get: async (id: string): Promise<ResellerDetail> => {
    const res = await api.get(`/resellers/${id}`)
    return res.data
  },

  create: async (data: CreateResellerPayload): Promise<Reseller> => {
    const res = await api.post('/resellers', data)
    return res.data
  },

  update: async (id: string, data: Partial<CreateResellerPayload> & { tier?: ResellerTier; discountPct?: number; commissionPct?: number }): Promise<Reseller> => {
    const res = await api.patch(`/resellers/${id}`, data)
    return res.data
  },

  toggleActive: async (id: string): Promise<Reseller> => {
    const res = await api.patch(`/resellers/${id}/toggle-active`)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/resellers/${id}`)
  },

  stats: async (): Promise<{
    totalResellers: number
    topResellers: Pick<Reseller, 'id' | 'name' | 'tier' | 'totalSales' | 'totalCommission' | 'commissionPct'>[]
    recentOrders: number
  }> => {
    const res = await api.get('/resellers/stats/summary')
    return res.data
  },
}
