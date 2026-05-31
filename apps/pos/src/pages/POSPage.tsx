import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/stores/cartStore'
import { formatRupiah } from '@/lib/format'
import type { Product, Category } from '@coffeeshop/shared/types'
import {
  Search, Plus, Minus, Trash2, ChevronRight,
  ShoppingBag
} from 'lucide-react'

const renderProductPlaceholder = (product: Product) => {
  if (product.category?.icon) return product.category.icon
  return product.name?.slice(0, 2).toUpperCase() || '☕'
}

import toast from 'react-hot-toast'
import CheckoutModal from '@/components/pos/CheckoutModal'

export default function POSPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeCat, setActiveCat] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const { items, addItem, removeItem, updateQty, subtotal, discountAmount, total, discount } = useCartStore()

  useEffect(() => {
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => data && setCategories(data as Category[]))
    supabase.from('products').select('*, categories(*)').eq('is_available', true).order('sort_order')
      .then(({ data }) => data && setProducts(data as Product[]))
  }, [])

  const filtered = products.filter(p => {
    const matchCat = activeCat === 'all' || p.category_id === activeCat
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="flex h-full">
      {/* ── Left: Product grid ─────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="px-6 pt-6 pb-4 bg-white border-b border-surface-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-display font-bold text-slate-800">Kasir</h1>
              <p className="text-xs text-slate-500">Pilih menu untuk tambah ke keranjang</p>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10"
              placeholder="Cari menu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 px-6 py-3 overflow-x-auto border-b border-surface-border bg-white scrollbar-hide">
          {[{ id: 'all', name: 'Semua', icon: '🍽️' }, ...categories].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`
                flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all
                ${activeCat === cat.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-surface-muted text-slate-600 hover:bg-surface-border'}
              `}
            >
              <span>{(cat as any).icon || '📦'}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <ShoppingBag size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Tidak ada menu ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(p => {
                const inCart = items.find(i => i.product.id === p.id)
                return (
                  <div
                    key={p.id}
                    onClick={() => { addItem(p); }}
                    className={`product-card relative ${inCart ? 'border-brand-300 ring-1 ring-brand-200' : ''}`}
                  >
                    {inCart && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-600 text-white text-2xs font-bold rounded-full flex items-center justify-center animate-pop">
                        {inCart.quantity}
                      </span>
                    )}
                    {/* Generated white background image or uploaded image */}
                    <div className="w-full aspect-square rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center mb-2.5 text-3xl text-slate-700">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                      ) : renderProductPlaceholder(p)}
                    </div>
                    <p className="text-xs font-medium text-slate-800 leading-snug line-clamp-2 mb-1">{p.name}</p>
                    <p className="text-sm font-bold text-brand-700">{formatRupiah(p.price)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart ─────────────────────────────────── */}
      <div className="w-80 xl:w-96 flex flex-col border-l border-surface-border bg-white">
        {/* Cart header */}
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-brand-600" />
            <span className="font-display font-semibold text-slate-800">Pesanan</span>
            {itemCount > 0 && (
              <span className="badge badge-blue">{itemCount} item</span>
            )}
          </div>
          {items.length > 0 && (
            <button
              onClick={() => useCartStore.getState().clearCart()}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Hapus semua
            </button>
          )}
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-300">
              <ShoppingBag size={48} className="mb-3" />
              <p className="text-sm text-slate-400">Keranjang kosong</p>
              <p className="text-xs text-slate-300 mt-1">Klik menu untuk menambahkan</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted group">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                  {(item.product as any).category?.icon || '☕'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{item.product.name}</p>
                  <p className="text-xs text-brand-600 font-semibold">{formatRupiah(item.product.price * item.quantity)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-surface-border flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors"
                  >
                    {item.quantity === 1 ? <Trash2 size={12} className="text-red-400" /> : <Minus size={12} className="text-slate-500" />}
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-700">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.product.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center hover:bg-brand-700 transition-colors"
                  >
                    <Plus size={12} className="text-white" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary & checkout */}
        {items.length > 0 && (
          <div className="p-4 border-t border-surface-border space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal())}</span>
              </div>
              {discount && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1">
                    <span className="badge badge-green text-2xs">{discount.code}</span>
                  </span>
                  <span>-{formatRupiah(discountAmount())}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-800 text-base pt-1 border-t border-surface-border">
                <span>Total</span>
                <span className="text-brand-700">{formatRupiah(total())}</span>
              </div>
            </div>

            <button
              onClick={() => setShowCheckout(true)}
              className="btn-primary btn-lg w-full justify-center"
            >
              <ChevronRight size={18} />
              Proses Pembayaran
            </button>
          </div>
        )}
      </div>

      {showCheckout && <CheckoutModal onClose={() => setShowCheckout(false)} />}
    </div>
  )
}
