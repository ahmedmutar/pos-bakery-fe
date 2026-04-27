import api from '../lib/api'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  tenantName: string
  slug: string
  ownerName: string
  email: string
  password: string
  otp: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'CASHIER' | 'PRODUCTION'
  tenantId: string
  tenantName: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', payload)
    return res.data
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', payload)
    return res.data
  },

  me: async (): Promise<AuthUser> => {
    const res = await api.get('/auth/me')
    return res.data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout').catch(() => {})
  },
}
