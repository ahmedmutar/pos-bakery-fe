import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, formatDate } from '../lib/utils'

// ─── cn (className merger) ────────────────────────────────────────────────────

describe('cn', () => {
  it('returns a single class unchanged', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  it('merges multiple class strings', () => {
    const result = cn('px-4', 'py-2', 'rounded')
    expect(result).toBe('px-4 py-2 rounded')
  })

  it('resolves Tailwind conflicts — last value wins', () => {
    // tailwind-merge should pick the latter padding
    const result = cn('px-2', 'px-4')
    expect(result).toBe('px-4')
  })

  it('removes falsy values', () => {
    const result = cn('base', false && 'hidden', undefined, null, 'extra')
    expect(result).toBe('base extra')
  })

  it('handles conditional classes with ternary', () => {
    const isActive = true
    const result = cn('btn', isActive ? 'btn-primary' : 'btn-secondary')
    expect(result).toBe('btn btn-primary')
  })

  it('handles array of classes', () => {
    const result = cn(['px-4', 'py-2'])
    expect(result).toBe('px-4 py-2')
  })

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('')
  })
})

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats zero as Rp 0', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
    expect(result.toLowerCase()).toContain('rp')
  })

  it('formats 50000 as Rp 50.000', () => {
    const result = formatCurrency(50000)
    // Intl formats with Indonesian locale using . as thousand separator
    expect(result).toContain('50.000')
  })

  it('formats 1000000 with correct thousand separators', () => {
    const result = formatCurrency(1000000)
    expect(result).toContain('1.000.000')
  })

  it('does not include decimal digits', () => {
    const result = formatCurrency(15000)
    expect(result).not.toContain(',')
  })

  it('formats negative values (discount/loss)', () => {
    const result = formatCurrency(-5000)
    expect(result).toContain('5.000')
  })

  it('formats large amounts correctly', () => {
    const result = formatCurrency(299000000)
    expect(result).toContain('299.000.000')
  })
})

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a Date object to Indonesian locale', () => {
    const result = formatDate(new Date('2026-06-15'))
    // Indonesian format: "15 Juni 2026"
    expect(result).toContain('2026')
    expect(result).toContain('15')
  })

  it('accepts a date string', () => {
    const result = formatDate('2026-01-01')
    expect(result).toContain('2026')
  })

  it('includes the month name in Bahasa Indonesia', () => {
    const result = formatDate(new Date('2026-06-15'))
    expect(result).toContain('Juni')
  })

  it('formats January correctly', () => {
    const result = formatDate(new Date('2026-01-01'))
    expect(result).toContain('Januari')
  })

  it('formats December correctly', () => {
    const result = formatDate(new Date('2026-12-31'))
    expect(result).toContain('Desember')
  })
})
