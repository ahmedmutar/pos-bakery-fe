import api from '../lib/api'

export interface OutletProductConfig {
  productId: string
  name: string
  defaultPrice: number
  imageUrl: string | null
  category: { id: string; name: string } | null
  isAvailable: boolean
  priceOverride: number | null
  stock: number | null
  effectivePrice: number
}

export interface CashierProduct {
  id: string
  name: string
  price: number
  imageUrl: string | null
  category: { id: string; name: string } | null
  stock: number | null
}

export const outletProductApi = {
  list: async (outletId: string): Promise<OutletProductConfig[]> => {
    const res = await api.get(`/outlet-products/${outletId}`)
    return res.data
  },

  listForCashier: async (outletId: string): Promise<CashierProduct[]> => {
    const res = await api.get(`/outlet-products/${outletId}/cashier`)
    return res.data
  },

  bulkUpdate: async (
    outletId: string,
    products: { productId: string; isAvailable: boolean; priceOverride: number | null; stock: number | null }[]
  ): Promise<void> => {
    await api.put(`/outlet-products/${outletId}`, { products })
  },

  updateOne: async (
    outletId: string,
    productId: string,
    data: { isAvailable?: boolean; priceOverride?: number | null; stock?: number | null }
  ): Promise<void> => {
    await api.patch(`/outlet-products/${outletId}/${productId}`, data)
  },
}
