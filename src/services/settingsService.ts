import api from '../lib/api'

export interface TenantProfile {
  id: string
  name: string
  slug: string
  plan: string
  logoUrl: string | null
  createdAt: string
}

export interface StaffUser {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'CASHIER' | 'PRODUCTION'
  isActive: boolean
  createdAt: string
}

export interface Outlet {
  id: string
  tenantId: string
  name: string
  address: string | null
  isActive: boolean
}

export const settingsApi = {
  getProfile: async (): Promise<TenantProfile> => {
    const res = await api.get('/settings/profile')
    return res.data
  },

  uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
    const form = new FormData()
    form.append('logo', file)
    const res = await api.post('/settings/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  deleteLogo: async (): Promise<void> => {
    await api.delete('/settings/logo')
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const form = new FormData()
    form.append('avatar', file)
    const res = await api.post('/settings/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  deleteAvatar: async (): Promise<void> => {
    await api.delete('/settings/avatar')
  },

  updateProfile: async (name: string): Promise<TenantProfile> => {
    const res = await api.patch('/settings/profile', { name })
    return res.data
  },

  getUsers: async (): Promise<StaffUser[]> => {
    const res = await api.get('/settings/users')
    return res.data
  },

  createUser: async (payload: {
    name: string
    email: string
    password: string
    role: StaffUser['role']
  }): Promise<StaffUser> => {
    const res = await api.post('/settings/users', payload)
    return res.data
  },

  updateUser: async (id: string, payload: {
    name?: string
    role?: StaffUser['role']
    isActive?: boolean
  }): Promise<StaffUser> => {
    const res = await api.patch(`/settings/users/${id}`, payload)
    return res.data
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/settings/change-password', { currentPassword, newPassword })
  },

  getOutlets: async (): Promise<Outlet[]> => {
    const res = await api.get('/settings/outlets')
    return res.data
  },

  createOutlet: async (payload: { name: string; address?: string }): Promise<Outlet> => {
    const res = await api.post('/settings/outlets', payload)
    return res.data
  },

  updateOutlet: async (id: string, payload: {
    name?: string
    address?: string
    isActive?: boolean
  }): Promise<Outlet> => {
    const res = await api.patch(`/settings/outlets/${id}`, payload)
    return res.data
  },
}
