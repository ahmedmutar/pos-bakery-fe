import { describe, it, expect } from 'vitest'
import { CMD, row, buildReceiptBytes } from '../lib/escpos'

const ESC = 0x1b
const GS  = 0x1d
const LF  = 0x0a

// ─── CMD byte builders ────────────────────────────────────────────────────────

describe('CMD', () => {
  it('init() returns ESC @ bytes', () => {
    const bytes = CMD.init()
    expect(bytes).toEqual(new Uint8Array([ESC, 0x40]))
  })

  it('alignCenter() returns ESC a 1', () => {
    expect(CMD.alignCenter()).toEqual(new Uint8Array([ESC, 0x61, 0x01]))
  })

  it('alignLeft() returns ESC a 0', () => {
    expect(CMD.alignLeft()).toEqual(new Uint8Array([ESC, 0x61, 0x00]))
  })

  it('alignRight() returns ESC a 2', () => {
    expect(CMD.alignRight()).toEqual(new Uint8Array([ESC, 0x61, 0x02]))
  })

  it('boldOn() returns ESC E 1', () => {
    expect(CMD.boldOn()).toEqual(new Uint8Array([ESC, 0x45, 0x01]))
  })

  it('boldOff() returns ESC E 0', () => {
    expect(CMD.boldOff()).toEqual(new Uint8Array([ESC, 0x45, 0x00]))
  })

  it('cut() returns GS V 66 3', () => {
    expect(CMD.cut()).toEqual(new Uint8Array([GS, 0x56, 0x42, 0x03]))
  })

  it('cutFull() returns GS V 0', () => {
    expect(CMD.cutFull()).toEqual(new Uint8Array([GS, 0x56, 0x00]))
  })

  it('lf() returns single LF byte', () => {
    expect(CMD.lf()).toEqual(new Uint8Array([LF]))
  })

  it('lf2() returns two LF bytes', () => {
    expect(CMD.lf2()).toEqual(new Uint8Array([LF, LF]))
  })

  it('lf3() returns three LF bytes', () => {
    expect(CMD.lf3()).toEqual(new Uint8Array([LF, LF, LF]))
  })

  it('line() appends LF after text', () => {
    const bytes = CMD.line('hello')
    const str = new TextDecoder().decode(bytes)
    expect(str).toBe('hello\n')
  })

  it('divider() returns 32 dashes + LF', () => {
    const str = new TextDecoder().decode(CMD.divider())
    expect(str).toBe('-'.repeat(32) + '\n')
  })

  it('returns Uint8Array for all CMD functions', () => {
    for (const [name, fn] of Object.entries(CMD)) {
      const result = (fn as () => Uint8Array)()
      expect(ArrayBuffer.isView(result), `CMD.${name}() should be ArrayBufferView`).toBe(true)
    }
  })
})

// ─── row() ────────────────────────────────────────────────────────────────────

describe('row()', () => {
  it('returns a Uint8Array', () => {
    expect(ArrayBuffer.isView(row('Total', 'Rp 50.000'))).toBe(true)
  })

  it('decoded output ends with newline', () => {
    const str = new TextDecoder().decode(row('Total', 'Rp 50.000'))
    expect(str.at(-1)).toBe('\n')
  })

  it('contains both left and right text', () => {
    const str = new TextDecoder().decode(row('Total', 'Rp 50.000'))
    expect(str).toContain('Total')
    expect(str).toContain('Rp 50.000')
  })

  it('total length equals width + 1 (newline) by default', () => {
    const str = new TextDecoder().decode(row('A', 'B'))
    // 'A' + spaces + 'B' + '\n' = 32 + 1 = 33 chars (if both fit)
    expect(str.length).toBe(33)
  })

  it('respects custom width parameter', () => {
    const str = new TextDecoder().decode(row('A', 'B', 48))
    expect(str.length).toBe(49) // 48 + newline
  })

  it('left is left-aligned and right is right-aligned', () => {
    const str = new TextDecoder().decode(row('TOTAL', 'Rp100'))
    expect(str.startsWith('TOTAL')).toBe(true)
    // Right side should appear before the newline
    expect(str.trimEnd().endsWith('Rp100')).toBe(true)
  })
})

// ─── buildReceiptBytes() ──────────────────────────────────────────────────────

const SAMPLE_RECEIPT = {
  tenantName:    'TOKO ROTI BU SARI',
  transactionId: 'txn-abcd-efgh-1234',
  date:          new Date('2026-06-22T08:30:00'),
  cashierName:   'Ahmad',
  outletName:    'Cabang Utama',
  items: [
    { name: 'Croissant Coklat', quantity: 2, unitPrice: 15000, subtotal: 30000 },
    { name: 'Roti Tawar',       quantity: 1, unitPrice: 12000, subtotal: 12000 },
  ],
  discount:      2000,
  total:         40000,
  paymentMethod: 'CASH',
  paidAmount:    50000,
  change:        10000,
}

describe('buildReceiptBytes()', () => {
  it('returns a Uint8Array', () => {
    const bytes = buildReceiptBytes(SAMPLE_RECEIPT)
    expect(bytes).toBeInstanceOf(Uint8Array)
  })

  it('output has substantial length (not empty)', () => {
    const bytes = buildReceiptBytes(SAMPLE_RECEIPT)
    expect(bytes.length).toBeGreaterThan(100)
  })

  it('starts with ESC @ (init printer command)', () => {
    const bytes = buildReceiptBytes(SAMPLE_RECEIPT)
    expect(bytes[0]).toBe(ESC)
    expect(bytes[1]).toBe(0x40)
  })

  it('ends with paper cut command', () => {
    const bytes = buildReceiptBytes(SAMPLE_RECEIPT)
    const last4 = bytes.slice(-4)
    expect(last4).toEqual(new Uint8Array([GS, 0x56, 0x42, 0x03]))
  })

  it('contains tenant name in output', () => {
    const bytes = buildReceiptBytes(SAMPLE_RECEIPT)
    const text = new TextDecoder().decode(bytes)
    expect(text.toUpperCase()).toContain('TOKO ROTI BU SARI')
  })

  it('contains item names', () => {
    const bytes = buildReceiptBytes(SAMPLE_RECEIPT)
    const text = new TextDecoder().decode(bytes)
    expect(text).toContain('Croissant Coklat')
    expect(text).toContain('Roti Tawar')
  })

  it('contains total amount', () => {
    const bytes = buildReceiptBytes(SAMPLE_RECEIPT)
    const text = new TextDecoder().decode(bytes)
    expect(text).toContain('40.000')
  })

  it('contains change amount when change > 0', () => {
    const bytes = buildReceiptBytes(SAMPLE_RECEIPT)
    const text = new TextDecoder().decode(bytes)
    expect(text).toContain('10.000')
  })

  it('does NOT include change line when change is 0', () => {
    const bytes = buildReceiptBytes({ ...SAMPLE_RECEIPT, change: 0, paidAmount: 40000 })
    const text = new TextDecoder().decode(bytes)
    // "Kembali" should not appear
    expect(text).not.toContain('Kembali')
  })

  it('does NOT include discount line when discount is 0', () => {
    const bytes = buildReceiptBytes({ ...SAMPLE_RECEIPT, discount: 0 })
    const text = new TextDecoder().decode(bytes)
    expect(text).not.toContain('Diskon')
  })

  it('contains cashier name when provided', () => {
    const bytes = buildReceiptBytes(SAMPLE_RECEIPT)
    const text = new TextDecoder().decode(bytes)
    expect(text).toContain('Ahmad')
  })

  it('contains outlet name when provided', () => {
    const bytes = buildReceiptBytes(SAMPLE_RECEIPT)
    const text = new TextDecoder().decode(bytes)
    expect(text).toContain('Cabang Utama')
  })

  it('contains Powered by Sajiin footer', () => {
    const bytes = buildReceiptBytes(SAMPLE_RECEIPT)
    const text = new TextDecoder().decode(bytes)
    expect(text).toContain('Sajiin')
  })

  it('payment method CASH renders as "Tunai"', () => {
    const bytes = buildReceiptBytes({ ...SAMPLE_RECEIPT, paymentMethod: 'CASH' })
    const text = new TextDecoder().decode(bytes)
    expect(text).toContain('Tunai')
  })

  it('payment method QRIS renders as "QRIS"', () => {
    const bytes = buildReceiptBytes({ ...SAMPLE_RECEIPT, paymentMethod: 'QRIS' })
    const text = new TextDecoder().decode(bytes)
    expect(text).toContain('QRIS')
  })

  it('works without optional cashierName and outletName', () => {
    const bytes = buildReceiptBytes({
      ...SAMPLE_RECEIPT,
      cashierName: undefined,
      outletName:  undefined,
    })
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(50)
  })
})
