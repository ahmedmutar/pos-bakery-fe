import { create } from 'zustand'
import type { Product } from '../services/productService'

export type CartProduct = Pick<Product, 'id' | 'name' | 'price' | 'categoryId' | 'imageUrl'>

export interface CartItem {
  product: CartProduct
  quantity: number
  notes: string
}

interface CartState {
  items: CartItem[]
  discount: number
  activeShiftId: string | null
  activeOutletId: string | null

  addItem: (product: CartProduct) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateNotes: (productId: string, notes: string) => void
  setDiscount: (discount: number) => void
  setActiveShift: (shiftId: string, outletId: string) => void
  clearShift: () => void
  clearCart: () => void

  subtotal: () => number
  total: () => number
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  discount: 0,
  activeShiftId: null,
  activeOutletId: null,

  addItem: (product: CartProduct) => {
    const existing = get().items.find((i) => i.product.id === product.id)
    if (existing) {
      set((s) => ({
        items: s.items.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }))
    } else {
      set((s) => ({ items: [...s.items, { product, quantity: 1, notes: '' }] }))
    }
  },

  removeItem: (productId) =>
    set((s) => ({ items: s.items.filter((i) => i.product.id !== productId) })),

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    set((s) => ({
      items: s.items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
    }))
  },

  updateNotes: (productId, notes) =>
    set((s) => ({
      items: s.items.map((i) => (i.product.id === productId ? { ...i, notes } : i)),
    })),

  setDiscount: (discount) => set({ discount }),

  setActiveShift: (shiftId, outletId) =>
    set({ activeShiftId: shiftId, activeOutletId: outletId }),

  clearShift: () => set({ activeShiftId: null, activeOutletId: null }),

  clearCart: () => set({ items: [], discount: 0 }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

  total: () => {
    const sub = get().subtotal()
    return Math.max(0, sub - get().discount)
  },
}))
