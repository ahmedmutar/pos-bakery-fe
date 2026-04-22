import api from '../lib/api'

export interface Category {
  id: string
  tenantId: string
  name: string
}

export const categoryApi = {
  list: async (): Promise<Category[]> => {
    const res = await api.get('/categories')
    return res.data
  },

  create: async (name: string): Promise<Category> => {
    const res = await api.post('/categories', { name })
    return res.data
  },

  update: async (id: string, name: string): Promise<Category> => {
    const res = await api.patch(`/categories/${id}`, { name })
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`)
  },
}
