export type IngredientType = 'INGREDIENT' | 'EQUIPMENT' | 'PACKAGING'

import api from '../lib/api'

export interface Ingredient {
  id: string
  tenantId?: string
  name: string
  type: IngredientType
  baseUnit: string
  currentStock: number
  minimumStock: number
  currentPrice: number
  notes: string | null
}

export interface PurchaseItem {
  ingredientId: string
  quantity: number
  unit: string
  unitFactor: number
  pricePerUnit: number
}

export interface CreatePurchasePayload {
  supplierId?: string
  date?: string
  notes?: string
  items: PurchaseItem[]
}

export const inventoryApi = {
  ingredients: async (type?: IngredientType, params?: { lowStock?: boolean }): Promise<Ingredient[]> => {
    const res = await api.get('/inventory/ingredients', { params: { ...params, ...(type ? { type } : {}) } })
    return res.data
  },

  createIngredient: async (payload: {
    name: string
    type?: IngredientType
    baseUnit: string
    currentStock?: number
    minimumStock?: number
    currentPrice?: number
    notes?: string
  }): Promise<Ingredient> => {
    const res = await api.post('/inventory/ingredients', payload)
    return res.data
  },

  updateIngredient: async (id: string, payload: Partial<Ingredient>): Promise<Ingredient> => {
    const res = await api.patch(`/inventory/ingredients/${id}`, payload)
    return res.data
  },

  adjustStock: async (id: string, actualStock: number, notes?: string): Promise<Ingredient & { adjustment: number }> => {
    const res = await api.post(`/inventory/ingredients/${id}/adjust`, { actualStock, notes })
    return res.data
  },

  createPurchase: async (payload: CreatePurchasePayload) => {
    const res = await api.post('/inventory/purchases', payload)
    return res.data
  },

  purchases: async () => {
    const res = await api.get('/inventory/purchases')
    return res.data
  },
}
