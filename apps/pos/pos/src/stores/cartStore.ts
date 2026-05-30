import { create } from 'zustand'
import type { Product, CartItem, Discount } from '@coffeeshop/shared/types'

interface CartStore {
  items: CartItem[]
  discount: Discount | null
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  updateNotes: (productId: string, notes: string) => void
  setDiscount: (discount: Discount | null) => void
  clearCart: () => void
  subtotal: () => number
  discountAmount: () => number
  total: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  discount: null,

  addItem: (product) => set(state => {
    const existing = state.items.find(i => i.product.id === product.id)
    if (existing) {
      return {
        items: state.items.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
    }
    return { items: [...state.items, { product, quantity: 1 }] }
  }),

  removeItem: (productId) => set(state => ({
    items: state.items.filter(i => i.product.id !== productId)
  })),

  updateQty: (productId, qty) => set(state => {
    if (qty <= 0) return { items: state.items.filter(i => i.product.id !== productId) }
    return { items: state.items.map(i => i.product.id === productId ? { ...i, quantity: qty } : i) }
  }),

  updateNotes: (productId, notes) => set(state => ({
    items: state.items.map(i => i.product.id === productId ? { ...i, notes } : i)
  })),

  setDiscount: (discount) => set({ discount }),

  clearCart: () => set({ items: [], discount: null }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

  discountAmount: () => {
    const { discount, subtotal } = get()
    if (!discount) return 0
    if (discount.type === 'percentage') return Math.round(subtotal() * discount.value / 100)
    return Math.min(discount.value, subtotal())
  },

  total: () => get().subtotal() - get().discountAmount(),
}))
