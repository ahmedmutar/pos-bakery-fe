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

export interface OrdersReport {
  totalOrders: number
  totalValue: number
  totalDP: number
  totalRemaining: number
  totalCompleted: number
  totalCancelled: number
  completionRate: number
  byStatus: { status: string; count: number; total: number }[]
  topProducts: { name: string; qty: number; revenue: number }[]
  orders: {
    id: string
    customerName: string
    customerPhone: string
    status: string
    total: number
    dpAmount: number
    remainingAmount: number
    pickupDate: string
    createdAt: string
    itemCount: number
  }[]
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

  ordersReport: async (params?: { from?: string; to?: string }): Promise<OrdersReport> => {
    const res = await api.get('/reports/orders', { params })
    return res.data
  },

  waste: async (params?: { from?: string; to?: string }) => {
    const res = await api.get('/reports/waste', { params })
    return res.data
  },
}
