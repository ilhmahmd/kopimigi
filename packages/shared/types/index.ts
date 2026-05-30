// ─── Users & Auth ────────────────────────────────────────────────────────────
export type UserRole = 'owner' | 'manager' | 'cashier'

export interface AppUser {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  is_active: boolean
  created_at: string
}

// ─── Categories & Products ───────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  icon?: string
  color?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  category_id: string
  category?: Category
  name: string
  description?: string
  price: number
  image_url?: string
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// ─── Discounts ───────────────────────────────────────────────────────────────
export type DiscountType = 'percentage' | 'fixed'

export interface Discount {
  id: string
  code: string
  name: string
  type: DiscountType
  value: number          // percentage (0–100) or fixed Rupiah
  min_order?: number
  max_uses?: number
  used_count: number
  is_active: boolean
  valid_from?: string
  valid_until?: string
  created_at: string
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled'
export type PaymentMethod = 'cash' | 'qris' | 'debit' | 'credit'

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product?: Product
  product_name: string   // snapshot at time of order
  product_price: number  // snapshot
  quantity: number
  subtotal: number
  notes?: string
}

export interface Order {
  id: string
  order_number: string   // e.g. "CS-20240801-0042"
  cashier_id: string
  cashier?: AppUser
  items: OrderItem[]
  subtotal: number
  discount_id?: string
  discount?: Discount
  discount_amount: number
  tax_amount: number     // PPN if applicable
  total: number
  payment_method: PaymentMethod
  amount_paid: number
  change_amount: number
  status: OrderStatus
  notes?: string
  created_at: string
  updated_at: string
}

// ─── Photo Sessions ──────────────────────────────────────────────────────────
export type PhotoSessionStatus = 'pending' | 'used' | 'expired'

export interface PhotoSession {
  id: string
  order_id: string
  order?: Order
  token: string          // unique UUID, embedded in QR code
  token_url: string      // full URL: https://booth.domain/session/{token}
  status: PhotoSessionStatus
  photo_url?: string     // Supabase Storage URL after photo taken
  thumbnail_url?: string // smaller version for receipt
  expires_at: string     // default 30 min after creation
  used_at?: string
  created_at: string
}

// ─── Reports / Analytics ─────────────────────────────────────────────────────
export interface DailySummary {
  date: string
  total_orders: number
  total_revenue: number
  total_discount: number
  orders_by_payment: Record<PaymentMethod, number>
  top_products: Array<{ product_name: string; quantity: number; revenue: number }>
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
export interface CartItem {
  product: Product
  quantity: number
  notes?: string
}
