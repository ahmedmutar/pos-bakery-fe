import { useEffect, useCallback } from 'react'

interface ShortcutHandlers {
  onSearch: () => void           // / — focus search
  onPay: () => void              // Enter — process payment
  onDiscount: () => void         // D — toggle discount
  onClearCart: () => void        // Escape — clear cart
  onHistory: () => void          // H — show history
  onOpenShift: () => void        // S — open shift
  onNumeric: (n: number) => void // 1-9 — quick select product by index
}

export function useCashierShortcuts(handlers: ShortcutHandlers, enabled = true) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    // Don't fire if user is typing in an input/textarea
    const tag = (e.target as HTMLElement).tagName
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

    // Search — / (only when not in input)
    if (e.key === '/' && !isInput) {
      e.preventDefault()
      handlers.onSearch()
      return
    }

    // Pay — Enter (only when not in input)
    if (e.key === 'Enter' && !isInput) {
      e.preventDefault()
      handlers.onPay()
      return
    }

    // Clear cart — Escape (only when not in input)
    if (e.key === 'Escape' && !isInput) {
      handlers.onClearCart()
      return
    }

    // Discount — D (only when not in input)
    if (e.key === 'd' && !isInput) {
      e.preventDefault()
      handlers.onDiscount()
      return
    }

    // History — H (only when not in input)
    if (e.key === 'h' && !isInput) {
      e.preventDefault()
      handlers.onHistory()
      return
    }

    // Open/close shift — S (only when not in input)
    if (e.key === 's' && !isInput) {
      e.preventDefault()
      handlers.onOpenShift()
      return
    }

    // Numeric shortcuts 1-9 — select product by position
    if (!isInput && e.key >= '1' && e.key <= '9') {
      e.preventDefault()
      handlers.onNumeric(parseInt(e.key))
      return
    }
  }, [handlers, enabled])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])
}

export const SHORTCUT_LABELS = [
  { key: '/', label: 'Cari produk' },
  { key: '1–9', label: 'Pilih produk ke-N' },
  { key: 'Enter', label: 'Proses pembayaran' },
  { key: 'D', label: 'Tambah/hapus diskon' },
  { key: 'H', label: 'Riwayat transaksi' },
  { key: 'S', label: 'Buka/tutup shift' },
  { key: 'Esc', label: 'Bersihkan keranjang' },
]
