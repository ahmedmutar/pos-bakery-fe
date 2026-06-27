import api from '../lib/api'

export interface ProductVariant {
  id: string
  productId: string
  name: string
  price: number
  isActive: boolean
  sortOrder: number
}

export const variantApi = {
  list: async (productId: string): Promise<ProductVariant[]> => {
    const res = await api.get('/variants', { params: { productId } })
    return res.data
  },
  create: async (data: { productId: string; name: string; price: number; isActive?: boolean; sortOrder?: number }): Promise<ProductVariant> => {
    const res = await api.post('/variants', data)
    return res.data
  },
  update: async (id: string, data: Partial<{ name: string; price: number; isActive: boolean; sortOrder: number }>): Promise<ProductVariant> => {
    const res = await api.patch(`/variants/${id}`, data)
    return res.data
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/variants/${id}`)
  },
}
