import api from '../lib/api'

export type POStatus = 'DRAFT' | 'ORDERED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'

export interface Supplier {
  id: string
  tenantId: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
}

export interface POItem {
  id: string
  purchaseId: string
  ingredientId: string
  quantity: number
  unit: string
  unitFactor: number
  pricePerUnit: number
  receivedQty: number
  ingredient: { id: string; name: string; baseUnit: string; currentStock?: number }
}

export interface PurchaseOrder {
  id: string
  tenantId: string
  supplierId: string | null
  poNumber: string | null
  status: POStatus
  totalAmount: number
  date: string
  orderedAt: string | null
  receivedAt: string | null
  notes: string | null
  createdAt: string
  supplier: { id: string; name: string; phone: string | null } | null
  items: POItem[]
}

export const supplierApi = {
  list: async (includeInactive?: boolean): Promise<Supplier[]> => {
    const res = await api.get('/suppliers', { params: { includeInactive: includeInactive ? '1' : undefined } })
    return res.data
  },
  create: async (data: Partial<Supplier>): Promise<Supplier> => {
    const res = await api.post('/suppliers', data)
    return res.data
  },
  update: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    const res = await api.patch(`/suppliers/${id}`, data)
    return res.data
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`)
  },
}

export interface CreatePOPayload {
  supplierId?: string | null
  poNumber?: string | null
  date?: string
  notes?: string | null
  items: {
    ingredientId: string
    quantity: number
    unit: string
    unitFactor: number
    pricePerUnit: number
  }[]
}

export const poApi = {
  list: async (params?: { status?: POStatus; supplierId?: string; from?: string; to?: string }): Promise<PurchaseOrder[]> => {
    const res = await api.get('/purchase-orders', { params })
    return res.data
  },
  get: async (id: string): Promise<PurchaseOrder> => {
    const res = await api.get(`/purchase-orders/${id}`)
    return res.data
  },
  create: async (data: CreatePOPayload): Promise<PurchaseOrder> => {
    const res = await api.post('/purchase-orders', data)
    return res.data
  },
  update: async (id: string, data: Partial<CreatePOPayload>): Promise<PurchaseOrder> => {
    const res = await api.patch(`/purchase-orders/${id}`, data)
    return res.data
  },
  order: async (id: string): Promise<PurchaseOrder> => {
    const res = await api.post(`/purchase-orders/${id}/order`)
    return res.data
  },
  receive: async (id: string, items: { itemId: string; receivedQty: number }[], notes?: string): Promise<PurchaseOrder> => {
    const res = await api.post(`/purchase-orders/${id}/receive`, { items, notes })
    return res.data
  },
  cancel: async (id: string): Promise<PurchaseOrder> => {
    const res = await api.post(`/purchase-orders/${id}/cancel`)
    return res.data
  },
}
