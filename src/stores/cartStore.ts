import { create } from 'zustand'
import type { Product } from '../services/productService'
import type { Customer } from '../services/customerService'

export type CartProduct = Pick<Product, 'id' | 'name' | 'price' | 'categoryId' | 'imageUrl'>

export interface CartItem {
  product: CartProduct
  variantId?: string      // ID variant jika dipilih
  variantName?: string    // nama variant (denormalized)
  variantPrice?: number   // harga variant (override product.price)
  quantity: number
  notes: string
}

export interface AppliedVoucher {
  code: string
  description: string | null
  discountType: 'FLAT' | 'PERCENT'
  discountValue: number
  discountAmount: number
}

interface CartState {
  items: CartItem[]
  discount: number
  voucher: AppliedVoucher | null
  // Customer loyalty
  customer: Customer | null
  redeemPoints: number       // jumlah poin yang ditukar
  pointsDiscount: number     // nilai Rp dari poin yang ditukar
  activeShiftId: string | null
  activeOutletId: string | null

  addItem: (product: CartProduct, variant?: { id: string; name: string; price: number }) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  updateNotes: (productId: string, notes: string, variantId?: string) => void
  setDiscount: (discount: number) => void
  applyVoucher: (voucher: AppliedVoucher) => void
  removeVoucher: () => void
  setCustomer: (customer: Customer | null) => void
  setRedeemPoints: (points: number, valuePerPoint: number) => void
  clearCustomer: () => void
  setActiveShift: (shiftId: string, outletId: string) => void
  clearShift: () => void
  clearCart: () => void

  subtotal: () => number
  total: () => number
}

// Composite key untuk item: productId + variantId (atau productId jika no variant)
function itemKey(productId: string, variantId?: string) {
  return variantId ? `${productId}:${variantId}` : productId
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  discount: 0,
  voucher: null,
  customer: null,
  redeemPoints: 0,
  pointsDiscount: 0,
  activeShiftId: null,
  activeOutletId: null,

  addItem: (product: CartProduct, variant?: { id: string; name: string; price: number }) => {
    const key = itemKey(product.id, variant?.id)
    const existing = get().items.find(i => itemKey(i.product.id, i.variantId) === key)
    if (existing) {
      set((s) => ({
        items: s.items.map((i) =>
          itemKey(i.product.id, i.variantId) === key ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }))
    } else {
      set((s) => ({
        items: [...s.items, {
          product,
          variantId:    variant?.id,
          variantName:  variant?.name,
          variantPrice: variant?.price,
          quantity: 1,
          notes: '',
        }],
      }))
    }
  },

  removeItem: (productId, variantId) => {
    const key = itemKey(productId, variantId)
    set((s) => ({ items: s.items.filter(i => itemKey(i.product.id, i.variantId) !== key) }))
  },

  updateQuantity: (productId, quantity, variantId) => {
    const key = itemKey(productId, variantId)
    if (quantity <= 0) {
      get().removeItem(productId, variantId)
      return
    }
    set((s) => ({
      items: s.items.map((i) => itemKey(i.product.id, i.variantId) === key ? { ...i, quantity } : i),
    }))
  },

  updateNotes: (productId, notes, variantId) => {
    const key = itemKey(productId, variantId)
    set((s) => ({
      items: s.items.map((i) => itemKey(i.product.id, i.variantId) === key ? { ...i, notes } : i),
    }))
  },

  setDiscount: (discount) => set({ discount, voucher: null }),

  applyVoucher: (voucher) => set({ voucher, discount: voucher.discountAmount }),

  removeVoucher: () => set({ voucher: null, discount: 0 }),

  setCustomer: (customer) => set({ customer }),

  setRedeemPoints: (points, valuePerPoint) =>
    set({ redeemPoints: points, pointsDiscount: points * valuePerPoint }),

  clearCustomer: () => set({ customer: null, redeemPoints: 0, pointsDiscount: 0 }),

  setActiveShift: (shiftId, outletId) =>
    set({ activeShiftId: shiftId, activeOutletId: outletId }),

  clearShift: () => set({ activeShiftId: null, activeOutletId: null }),

  clearCart: () => set({ items: [], discount: 0, voucher: null, customer: null, redeemPoints: 0, pointsDiscount: 0 }),

  subtotal: () => get().items.reduce((sum, i) => sum + (i.variantPrice ?? i.product.price) * i.quantity, 0),

  total: () => {
    const sub = get().subtotal()
    const disc = get().discount + get().pointsDiscount
    return Math.max(0, sub - disc)
  },
}))
