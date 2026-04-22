import api from '../lib/api'

export interface DashboardSummary {
  todaySales: number
  transactionCount: number
  totalProduced: number
  totalWaste: number
  lowStockCount: number
  lowStockItems: {
    id: string
    name: string
    currentStock: number
    minimumStock: number
    baseUnit: string
  }[]
}

export interface TopProduct {
  product: { id: string; name: string; price: number }
  totalSold: number
  totalRevenue: number
}

export const reportApi = {
  dashboard: async (): Promise<DashboardSummary> => {
    const res = await api.get('/reports/dashboard')
    return res.data
  },

  topProducts: async (params?: { from?: string; to?: string; limit?: number }): Promise<TopProduct[]> => {
    const res = await api.get('/reports/top-products', { params })
    return res.data
  },

  salesSummary: async (params?: { from?: string; to?: string }) => {
    const res = await api.get('/reports/sales-summary', { params })
    return res.data
  },

  waste: async (params?: { from?: string; to?: string }) => {
    const res = await api.get('/reports/waste', { params })
    return res.data
  },
}
