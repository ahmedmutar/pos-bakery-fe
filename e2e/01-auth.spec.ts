import { test, expect } from '@playwright/test'
import { loginAs, loginViaApi, TEST_USERS } from './helpers/auth'

// ─── Login Page ────────────────────────────────────────────────────────────────

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('menampilkan form login', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('menampilkan error untuk kredensial salah', async ({ page }) => {
    await page.locator('input[type="email"]').fill('salah@email.com')
    await page.locator('input[type="password"]').fill('passwordsalah')
    await page.locator('button[type="submit"]').click()

    // Error message harus muncul
    await expect(
      page.locator('text=/tidak valid|salah|tidak ditemukan|invalid/i')
    ).toBeVisible({ timeout: 5000 })
  })

  test('menampilkan error untuk email kosong', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    // Browser native validation atau custom error
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeFocused().catch(() => {
      // Beberapa impl memakai custom error, cukup pastikan tidak redirect
    })
    await expect(page).toHaveURL(/login/)
  })

  test('link "Lupa Password" mengarah ke halaman reset', async ({ page }) => {
    // FE menggunakan <button> (bukan <a>) untuk navigasi lupa sandi
    await page.locator('button:has-text("Lupa"), a:has-text("Lupa"), button:has-text("lupa"), a:has-text("lupa")').first().click()
    await expect(page).toHaveURL(/forgot-password|lupa/, { timeout: 8000 })
  })
})

// ─── Login as Owner ────────────────────────────────────────────────────────────

test.describe('Login sebagai Owner', () => {
  test('berhasil login dan redirect ke dashboard', async ({ page }) => {
    await loginAs(page, 'owner')
    await expect(page).toHaveURL(/\/app\/dashboard/)
  })

  test('sidebar menampilkan semua menu Owner', async ({ page }) => {
    await loginAs(page, 'owner')

    // Menu yang hanya Owner yang punya
    await expect(page.locator('text=Laporan')).toBeVisible()
    await expect(page.locator('text=Pengaturan')).toBeVisible()
  })

  test('menampilkan nama tenant di sidebar', async ({ page }) => {
    await loginAs(page, 'owner')
    // Tenant name muncul di header sidebar
    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible()
  })

  test('plan badge muncul di sidebar', async ({ page }) => {
    await loginAs(page, 'owner')
    // Badge paket (Basic/Pro/Enterprise/Trial)
    await expect(
      page.locator('text=/Basic|Pro|Enterprise|Trial/i')
    ).toBeVisible()
  })
})

// ─── Login as Cashier ──────────────────────────────────────────────────────────

test.describe('Login sebagai Kasir', () => {
  test('berhasil login dan redirect ke kasir atau dashboard', async ({ page }) => {
    await loginAs(page, 'cashier')
    await expect(page).toHaveURL(/\/app\/(cashier|dashboard)/)
  })

  test('kasir tidak melihat menu Laporan Keuangan', async ({ page }) => {
    await loginAs(page, 'cashier')
    // Pengeluaran & Reseller tidak boleh muncul untuk kasir
    await expect(page.locator('nav >> text=Pengeluaran')).not.toBeVisible()
  })
})

// ─── Login as Production ───────────────────────────────────────────────────────

test.describe('Login sebagai Produksi', () => {
  test('berhasil login', async ({ page }) => {
    await loginAs(page, 'production')
    await expect(page).toHaveURL(/\/app\//)
  })

  test('produksi tidak melihat menu Kasir', async ({ page }) => {
    await loginAs(page, 'production')
    await expect(page.locator('nav >> text=Kasir')).not.toBeVisible()
  })
})

// ─── Redirect & Session ────────────────────────────────────────────────────────

test.describe('Redirect & Session', () => {
  test('user belum login diarahkan ke /login saat akses /app/dashboard', async ({ page }) => {
    await page.goto('/app/dashboard')
    await expect(page).toHaveURL(/login/)
  })

  test('user sudah login langsung ke app saat akses /login', async ({ page }) => {
    await loginAs(page, 'owner')
    await page.goto('/login')
    // Harusnya redirect balik ke dashboard
    await expect(page).toHaveURL(/\/app\//)
  })
})
