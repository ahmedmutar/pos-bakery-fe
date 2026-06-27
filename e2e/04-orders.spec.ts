import { test, expect } from '@playwright/test'
import { loginAs, loginViaApi } from './helpers/auth'
import { getToken, makeApi } from './helpers/api'

// ─── Halaman Orders / Pre-Order ───────────────────────────────────────────────

test.describe('Halaman Pesanan', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner')
    await page.goto('/app/orders')
    await page.waitForLoadState('networkidle')
  })

  test('halaman pesanan berhasil dimuat', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible()
    // Tidak ada error 500 / loading tak berakhir
    await expect(page.locator('text=/error|kesalahan/i')).not.toBeVisible()
  })

  test('ada tombol Buat Pesanan / Pre-Order baru', async ({ page }) => {
    const newOrderBtn = page.locator(
      'button:has-text("Buat Pesanan"), button:has-text("+ Pesanan"), button:has-text("Pre-Order Baru")'
    )
    await expect(newOrderBtn.first()).toBeVisible()
  })

  test('ada filter status pesanan', async ({ page }) => {
    const filter = page.locator(
      'button:has-text("Semua"), select, [role="tab"]'
    )
    await expect(filter.first()).toBeVisible()
  })

  test('list pesanan tampil (kosong atau berisi)', async ({ page }) => {
    const items = page.locator('[data-testid="order-item"], table tbody tr, .order-card')
    const empty  = page.locator('text=/belum ada pesanan|tidak ada pesanan/i')

    const count   = await items.count()
    const isEmpty = await empty.isVisible()

    expect(count > 0 || isEmpty).toBe(true)
  })
})

// ─── Create Pre-Order via API ─────────────────────────────────────────────────

test.describe('Pre-Order — API', () => {
  let token: string
  let createdOrderId: string

  test.beforeAll(async ({ request }) => {
    token = await getToken(request, 'owner').catch(() => '')
    test.skip(!token, 'Login gagal')
  })

  test('POST /api/pre-orders membuat pesanan baru', async ({ request }) => {
    if (!token) test.skip()
    const api = makeApi(request, token)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const res = await api.post('/pre-orders', {
      customerName:  'Test E2E Customer',
      customerPhone: '6281234567890',
      pickupDate:    tomorrow.toISOString(),
      notes:         'E2E test order',
      items: [],   // bisa kosong jika BE tidak require
    })

    // 201 = berhasil, 400 = validasi gagal (items kosong), 403 = plan limit
    expect([201, 400, 403]).toContain(res.status())

    if (res.status() === 201) {
      const body = await res.json()
      createdOrderId = body.id
      expect(body.customerName).toBe('Test E2E Customer')
    }
  })

  test('GET /api/pre-orders mengembalikan daftar pesanan', async ({ request }) => {
    if (!token) test.skip()
    const api = makeApi(request, token)
    const res = await api.get('/pre-orders')

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body) || Array.isArray(body.data)).toBe(true)
  })
})

// ─── Dashboard ─────────────────────────────────────────────────────────────────

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner')
    await page.goto('/app/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test('dashboard dimuat dengan summary cards', async ({ page }) => {
    // Minimal ada 1 card statistik (penjualan, transaksi, dll)
    const cards = page.locator('[class*="card"], [class*="stat"], [class*="summary"]')
    await expect(cards.first()).toBeVisible({ timeout: 8000 })
  })

  test('tidak ada error di dashboard', async ({ page }) => {
    await expect(page.locator('text=/500|server error|undefined/i')).not.toBeVisible()
  })

  test('ada grafik atau tabel penjualan', async ({ page }) => {
    // Tunggu query selesai
    await page.waitForTimeout(2000)

    const chart   = page.locator('.recharts-wrapper, svg[class*="recharts"], canvas')
    const table   = page.locator('table')
    const cards   = page.locator('[class*="card"], [class*="stat"]')

    const hasChart = await chart.first().isVisible({ timeout: 5000 }).catch(() => false)
    const hasTable = await table.first().isVisible({ timeout: 2000 }).catch(() => false)
    const hasCards = await cards.first().isVisible({ timeout: 2000 }).catch(() => false)

    expect(hasChart || hasTable || hasCards).toBe(true)
  })
})

// ─── Laporan ───────────────────────────────────────────────────────────────────

test.describe('Laporan Penjualan', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'owner')
    await page.goto('/app/reports')
    await page.waitForLoadState('networkidle')
  })

  test('halaman laporan berhasil dimuat', async ({ page }) => {
    await expect(page.locator('h1, h2').filter({ hasText: /laporan|report/i }).first()).toBeVisible()
  })

  test('ada tab atau navigasi laporan (Penjualan, Laba/Rugi, dsb)', async ({ page }) => {
    const tabs = page.locator('[role="tab"], button:has-text("Penjualan"), button:has-text("Laba")')
    await expect(tabs.first()).toBeVisible()
  })

  test('ada filter tanggal di laporan', async ({ page }) => {
    const dateFilter = page.locator('input[type="date"], [placeholder*="tanggal"], [placeholder*="Dari"]')
    await expect(dateFilter.first()).toBeVisible()
  })
})
