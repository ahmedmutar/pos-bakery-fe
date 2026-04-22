import api from '../lib/api'

export interface ProductionPlanItem {
  id: string
  productId: string
  targetQty: number
  actualQty: number
  wasteQty: number
  wasteCategory: string | null
  unsoldQty: number
  product: {
    id: string
    name: string
    price: number
    imageUrl: string | null
    recipe?: {
      batchSize: number
      items: {
        amount: number
        unit: string
        unitFactor: number
        ingredient: {
          id: string
          name: string
          baseUnit: string
          currentStock: number
          currentPrice: number
        }
      }[]
    } | null
  }
}

export interface ProductionPlan {
  id: string
  date: string
  notes: string | null
  items: ProductionPlanItem[]
}

export interface MaterialCheck {
  planId: string
  allSufficient: boolean
  materials: {
    ingredient: { id: string; name: string; baseUnit: string; currentStock: number }
    needed: number
    available: number
    sufficient: boolean
  }[]
}

export const productionApi = {
  list: async (params?: { from?: string; to?: string }): Promise<ProductionPlan[]> => {
    const res = await api.get('/production', { params })
    return res.data
  },

  today: async (): Promise<ProductionPlan | null> => {
    const res = await api.get('/production/today')
    return res.data
  },

  get: async (id: string): Promise<ProductionPlan> => {
    const res = await api.get(`/production/${id}`)
    return res.data
  },

  create: async (payload: {
    date: string
    notes?: string
    items: { productId: string; targetQty: number }[]
  }): Promise<ProductionPlan> => {
    const res = await api.post('/production', payload)
    return res.data
  },

  updateItem: async (
    planId: string,
    itemId: string,
    payload: {
      actualQty?: number
      wasteQty?: number
      wasteCategory?: string
      unsoldQty?: number
    }
  ): Promise<ProductionPlanItem & {
    stockDeducted: boolean
    stockReturned: boolean
    delta: number
    deductionSummary: { ingredientName: string; unit: string; deducted: number }[]
  }> => {
    const res = await api.patch(`/production/${planId}/items/${itemId}`, payload)
    return res.data
  },

  materialCheck: async (planId: string): Promise<MaterialCheck> => {
    const res = await api.get(`/production/${planId}/material-check`)
    return res.data
  },
}
