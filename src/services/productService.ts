import api from '../lib/api'

export interface Product {
  id: string
  tenantId: string
  categoryId: string | null
  name: string
  price: number
  imageUrl: string | null
  isActive: boolean
  createdAt: string
  category: { id: string; name: string } | null
  recipe: Recipe | null
}

export interface Recipe {
  id: string
  batchSize: number
  notes: string | null
  items: RecipeItem[]
}

export interface RecipeItem {
  id: string
  amount: number
  unit: string
  unitFactor: number
  ingredient: { id: string; name: string; baseUnit: string; currentPrice: number }
}

export interface FoodCost {
  productId: string
  productName: string
  sellingPrice: number
  batchSize: number
  totalBatchCost: number
  costPerPcs: number
  margin: number
  marginPercent: number
  items: { ingredient: string; amount: number; unit: string; costContribution: number }[]
}

export interface CreateProductPayload {
  name: string
  price: number
  categoryId?: string
  imageUrl?: string
}

export const productApi = {
  list: async (params?: { categoryId?: string; isActive?: boolean; search?: string }): Promise<Product[]> => {
    const res = await api.get('/products', { params })
    return res.data
  },

  get: async (id: string): Promise<Product> => {
    const res = await api.get(`/products/${id}`)
    return res.data
  },

  create: async (payload: CreateProductPayload): Promise<Product> => {
    const res = await api.post('/products', payload)
    return res.data
  },

  update: async (id: string, payload: Partial<CreateProductPayload> & { isActive?: boolean }): Promise<Product> => {
    const res = await api.patch(`/products/${id}`, payload)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`)
  },

  foodCost: async (id: string): Promise<FoodCost> => {
    const res = await api.get(`/products/${id}/food-cost`)
    return res.data
  },
}
