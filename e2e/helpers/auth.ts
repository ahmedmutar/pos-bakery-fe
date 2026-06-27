import { type Page, expect } from '@playwright/test'

// Kredensial test — harus ada di database test/dev
// Password default: TestPass1! (min 8, uppercase, angka, simbol)
export const TEST_USERS = {
  owner: {
    email: process.env.E2E_OWNER_EMAIL    ?? 'owner@test.com',
    password: process.env.E2E_OWNER_PASS ?? 'TestPass1!',
    role: 'OWNER',
  },
  cashier: {
    email: process.env.E2E_CASHIER_EMAIL    ?? 'kasir@test.com',
    password: process.env.E2E_CASHIER_PASS ?? 'TestPass1!',
    role: 'CASHIER',
  },
  // Basic plan hanya support 2 staff — production user menggunakan kasir account
  // untuk testing role-based access (kasir juga tidak memiliki akses produksi)
  production: {
    email: process.env.E2E_PROD_EMAIL    ?? 'kasir@test.com',
    password: process.env.E2E_PROD_PASS ?? 'TestPass1!',
    role: 'CASHIER',
  },
}

export type UserRole = keyof typeof TEST_USERS

/**
 * Login via UI dan tunggu redirect ke dashboard
 */
export async function loginAs(page: Page, role: UserRole) {
  const user = TEST_USERS[role]

  await page.goto('/login')
  await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()

  await page.locator('input[type="email"], input[name="email"]').first().fill(user.email)
  await page.locator('input[type="password"]').fill(user.password)
  await page.locator('button[type="submit"]').click()

  // Tunggu redirect ke /app/*
  await page.waitForURL(/\/app\//, { timeout: 10_000 })
}

/**
 * Login cepat via API (set localStorage langsung) — skip UI form
 */
export async function loginViaApi(page: Page, role: UserRole) {
  const user = TEST_USERS[role]

  const res = await page.request.post('http://localhost:3000/api/auth/login', {
    data: { email: user.email, password: user.password },
  })

  if (!res.ok()) {
    throw new Error(`Login API gagal untuk ${role}: ${res.status()} — pastikan user ${user.email} ada di DB`)
  }

  const body = await res.json() as { token?: string; accessToken?: string; user?: object }
  const jwtToken = body.token ?? body.accessToken ?? ''
  const authUser = (body as any).user ?? {}

  // Set ke auth-storage sesuai format Zustand persist
  await page.goto('/')
  await page.evaluate(({ t, u }) => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { token: t, user: u, isAuthenticated: true },
      version: 0,
    }))
  }, { t: jwtToken, u: authUser })
}

/**
 * Logout
 */
export async function logout(page: Page) {
  await page.locator('button:has-text("Keluar"), button:has-text("Logout")').click()
  await page.waitForURL('/login')
}
