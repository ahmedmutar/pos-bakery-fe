import api from '../lib/api'
import type { Product } from './productService'

export interface RecipeItem {
  ingredientId: string
  amount: number
  unit: string
  unitFactor: number
}

export interface RecipePayload {
  batchSize: number
  notes?: string
  instructions?: string
  items: RecipeItem[]
}

export interface ProductWithRecipe extends Product {
  recipe: {
    id: string
    batchSize: number
    notes: string | null
    instructions: string | null
    items: {
      id: string
      amount: number
      unit: string
      unitFactor: number
      ingredient: {
        id: string
        name: string
        baseUnit: string
        currentPrice: number
        currentStock: number
      }
    }[]
  } | null
}

export const recipeApi = {
  list: async (): Promise<ProductWithRecipe[]> => {
    const res = await api.get('/recipes')
    return res.data
  },

  get: async (productId: string): Promise<ProductWithRecipe> => {
    const res = await api.get(`/recipes/${productId}`)
    return res.data
  },

  save: async (productId: string, payload: RecipePayload): Promise<ProductWithRecipe> => {
    const res = await api.put(`/recipes/${productId}`, payload)
    return res.data
  },

  remove: async (productId: string): Promise<void> => {
    await api.delete(`/recipes/${productId}`)
  },

  duplicate: async (productId: string, targetProductId?: string) => {
    const res = await api.post(`/recipes/${productId}/duplicate`, { targetProductId })
    return res.data as { recipe: unknown; targetProduct: { id: string; name: string } }
  },
}
