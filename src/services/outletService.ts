import api from '../lib/api'

export interface Outlet {
  id: string
  tenantId: string
  name: string
  address: string | null
  isActive: boolean
}

export const outletApi = {
  list: async (): Promise<Outlet[]> => {
    const res = await api.get('/outlets')
    return res.data
  },
}
