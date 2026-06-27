import { type APIRequestContext } from '@playwright/test'
import { TEST_USERS, type UserRole } from './auth'

const BASE = 'http://localhost:3000/api'

/**
 * Ambil access token langsung dari API — untuk setup/teardown data test
 */
export async function getToken(request: APIRequestContext, role: UserRole): Promise<string> {
  const user = TEST_USERS[role]
  const res = await request.post(`${BASE}/auth/login`, {
    data: { email: user.email, password: user.password },
  })
  if (!res.ok()) throw new Error(`getToken gagal untuk ${role}: ${res.status()}`)
  const body = await res.json() as { token?: string; accessToken?: string }
  return body.token ?? body.accessToken ?? ''
}

/**
 * Helper GET/POST dengan auth header
 */
export function makeApi(request: APIRequestContext, token: string) {
  const headers = { Authorization: `Bearer ${token}` }

  return {
    get:    (path: string)              => request.get(`${BASE}${path}`, { headers }),
    post:   (path: string, data: object) => request.post(`${BASE}${path}`, { headers, data }),
    patch:  (path: string, data: object) => request.patch(`${BASE}${path}`, { headers, data }),
    delete: (path: string)              => request.delete(`${BASE}${path}`, { headers }),
  }
}
