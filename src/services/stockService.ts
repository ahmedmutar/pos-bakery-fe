import api from '../lib/api'

export interface StockAdjustment {
  id: string
  ingredientId: string
  previousQty: number
  newQty: number
  difference: number
  reason: string
  createdAt: string
  ingredient: { name: string; baseUnit: string }
  user: { name: string }
}

export interface OpnameItem {
  id: string
  ingredientId: string
  systemQty: number
  physicalQty: number | null
  difference: number | null
  notes: string | null
  ingredient: { name: string; baseUnit: string; type: string }
}

export interface StockOpname {
  id: string
  notes: string | null
  status: 'DRAFT' | 'FINISHED'
  createdAt: string
  finishedAt: string | null
  user: { name: string }
  items: OpnameItem[]
}

export const stockApi = {
  // Adjustment
  adjust: async (data: { ingredientId: string; newQty: number; reason: string }) =>
    (await api.post('/stock/adjust', data)).data,

  adjustments: async (ingredientId?: string): Promise<StockAdjustment[]> =>
    (await api.get('/stock/adjustments', { params: ingredientId ? { ingredientId } : {} })).data,

  // Opname
  listOpname: async (): Promise<StockOpname[]> =>
    (await api.get('/stock/opname')).data,

  createOpname: async (notes?: string): Promise<StockOpname> =>
    (await api.post('/stock/opname', { notes })).data,

  getOpname: async (id: string): Promise<StockOpname> =>
    (await api.get(`/stock/opname/${id}`)).data,

  updateItems: async (id: string, items: { id: string; physicalQty: number; notes?: string }[]) =>
    (await api.patch(`/stock/opname/${id}/items`, { items })).data,

  finishOpname: async (id: string): Promise<StockOpname> =>
    (await api.post(`/stock/opname/${id}/finish`)).data,
}
