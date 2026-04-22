import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export interface TenantSummary {
  id: string
  name: string
  slug: string
  plan: string
  isActive: boolean
  createdAt: string
  userCount: number
  productCount: number
  transactionCount: number
  outletCount: number
  monthlyRevenue: number
  lastActivityAt: string | null
}

function adminApi(key: string) {
  return axios.create({
    baseURL: BASE_URL,
    headers: { 'X-Admin-Key': key },
  })
}

export const adminService = {
  getTenants: async (key: string): Promise<TenantSummary[]> => {
    const res = await adminApi(key).get('/settings/admin/tenants')
    return res.data
  },

  updateTenant: async (key: string, id: string, payload: { isActive?: boolean; plan?: string }): Promise<void> => {
    await adminApi(key).patch(`/settings/admin/tenants/${id}`, payload)
  },
}
