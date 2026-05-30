import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCartStore } from '@/stores/cartStore'
import { formatRupiah } from '@/lib/format'
import { X, Banknote, CreditCard, QrCode, Smartphone, Tag, Check, Printer, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { Database } from '@coffeeshop/shared/supabase/database.types'

// 1. Definisikan tipe data diskon dari baris database asli
type DiscountRow = Database['public']['Tables']['discounts']['Row']

// Generate 6-digit access code
const generateAccessCode = (): string => {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Tunai', icon: Banknote },
  { id: 'qris', label: 'QRIS', icon: QrCode },
  { id: 'debit', label: 'Debit', icon: CreditCard },
  { id: 'credit', label: 'Kredit', icon: Smartphone },
] as const; // tambahkan as const agar string terbaca sebagai literal union type

export default function CheckoutModal({ onClose }: { onClose: () => void }) {
  const { items, discount, subtotal, discountAmount, total, clearCart, setDiscount } = useCartStore()
  // 2. Berikan pengetikan eksplisit pada status metode pembayaran agar cocok dengan tipe data Enum Supabase Anda
  const [payMethod, setPayMethod] = useState<Database['public']['Tables']['orders']['Row']['payment_method']>('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [discountCode, setDiscountCode] = useState('')
  const [loadingDiscount, setLoadingDiscount] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ orderNumber: string; accessCode: string; orderData?: any } | null>(null)

  const change = payMethod === 'cash' ? Math.max(0, Number(amountPaid) - total()) : 0
  const isPaid = payMethod !== 'cash' || Number(amountPaid) >= total()

  const applyDiscount = async () => {
    if (!discountCode.trim()) return
    setLoadingDiscount(true)
    const { data } = await supabase
      .from('discounts')
      .select('*')
      .eq('code', discountCode.trim().toUpperCase())
      .eq('is_active', true)
      .single()

    // 3. Konversi tipenya ke skema database asli
    const discountData = data as DiscountRow | null

    if (!discountData) { toast.error('Kode diskon tidak valid'); setLoadingDiscount(false); return }
    if (discountData.valid_until && new Date(discountData.valid_until) < new Date()) { toast.error('Diskon sudah kadaluarsa'); setLoadingDiscount(false); return }
    if (discountData.max_uses && discountData.used_count >= discountData.max_uses) { toast.error('Kuota diskon habis'); setLoadingDiscount(false); return }
    if (discountData.min_order && subtotal() < discountData.min_order) { toast.error(`Minimum order ${formatRupiah(discountData.min_order)}`); setLoadingDiscount(false); return }

    setDiscount(discountData as any)
    toast.success(`Diskon ${discountData.name} berhasil!`)
    setLoadingDiscount(false)
  }

  const handleCheckout = async () => {
    if (!isPaid) { toast.error('Nominal pembayaran kurang'); return }
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate order number
      const orderNum = 'CS-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 9999)).padStart(4, '0')
      const sub = subtotal()
      const discAmt = discountAmount()
      const tot = total()

      // 4. Pastikan objek payload insert mematuhi tipe skema order secara aman
      const orderPayload: Database['public']['Tables']['orders']['Insert'] = {
        order_number: orderNum,
        cashier_id: user.id,
        subtotal: sub,
        discount_id: discount?.id ?? null,
        discount_amount: discAmt,
        tax_amount: 0,
        total: tot,
        payment_method: payMethod,
        amount_paid: payMethod === 'cash' ? Number(amountPaid) : tot,
        change_amount: change,
        status: 'paid',
        notes: null,
      }

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert([orderPayload] as any)
        .select()
        .single() as any

      if (orderErr) throw orderErr
      if (!order) throw new Error('Gagal membuat data order')

      // 5. Masukkan data ke order_items
      const orderItemsPayload: Database['public']['Tables']['order_items']['Insert'][] = items.map(i => ({
        order_id: (order as any).id,
        product_id: i.product.id,
        product_name: i.product.name,
        product_price: i.product.price,
        quantity: i.quantity,
        subtotal: i.product.price * i.quantity,
        notes: i.notes ?? null,
      }))

      await supabase.from('order_items').insert(orderItemsPayload as any)

      // Create photo session with access code
      const token = crypto.randomUUID()
      const accessCode = generateAccessCode()
      const boothUrl = import.meta.env.VITE_BOOTH_BASE_URL || 'http://localhost:5174'
      const tokenUrl = `${boothUrl}/session/${token}`
      const accessCodeUrl = `${boothUrl}/access/${accessCode}`

      const sessionPayload: Database['public']['Tables']['photo_sessions']['Insert'] = {
        order_id: (order as any).id,
        token,
        token_url: tokenUrl,
        access_code: accessCode,
        with_photo: true,
        background_id: null,
        photo_url: null,
        thumbnail_url: null,
        processed_photo_url: null,
        receipt_image_url: null,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60000).toISOString(),
        used_at: null,
        printed_at: null,
      }

      await supabase.from('photo_sessions').insert([sessionPayload] as any)

      setSuccess({ 
        orderNumber: orderNum, 
        accessCode,
        orderData: {
          items,
          subtotal: sub,
          discountAmount: discAmt,
          total: tot,
          payMethod,
          amountPaid: payMethod === 'cash' ? Number(amountPaid) : tot,
          change,
          discount
        }
      })
      clearCart()
      toast.success('Transaksi berhasil!')
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses transaksi')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──────────────────────────────────────
  if (success) {
    const copyToClipboard = () => {
      navigator.clipboard.writeText(success.accessCode)
      toast.success('Kode berhasil disalin!')
    }

    const printReceipt = () => {
      const w = window.open('', '', 'width=400,height=600')
      if (!w) return
      
      const orderData = success.orderData
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: monospace; margin: 0; padding: 10px; width: 280px; }
            .header { text-align: center; margin-bottom: 10px; }
            .header h1 { margin: 0; font-size: 16px; font-weight: bold; }
            .header p { margin: 2px 0; font-size: 11px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .items { font-size: 12px; }
            .item { display: flex; justify-content: space-between; margin: 4px 0; }
            .item-name { flex: 1; }
            .item-price { text-align: right; }
            .totals { font-size: 12px; margin-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin: 4px 0; }
            .total-label { font-weight: bold; }
            .total-amount { font-weight: bold; text-align: right; }
            .access-code { text-align: center; margin: 15px 0; }
            .code-box { font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 10px 0; }
            .footer { text-align: center; font-size: 10px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>COFFEE SHOP</h1>
            <p>STRUK PEMBELIAN</p>
            <p>${success.orderNumber}</p>
          </div>
          
          <div class="divider"></div>
          
          <div class="items">
            ${orderData.items.map((item: any) => `
              <div class="item">
                <div class="item-name">${item.product.name} ×${item.quantity}</div>
                <div class="item-price">${formatRupiah(item.product.price * item.quantity)}</div>
              </div>
            `).join('')}
          </div>
          
          <div class="divider"></div>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${formatRupiah(orderData.subtotal)}</span>
            </div>
            ${orderData.discount ? `
              <div class="total-row">
                <span>Diskon (${orderData.discount.code})</span>
                <span>-${formatRupiah(orderData.discountAmount)}</span>
              </div>
            ` : ''}
            <div class="total-row">
              <span class="total-label">TOTAL</span>
              <span class="total-amount">${formatRupiah(orderData.total)}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="access-code">
            <p style="margin: 5px 0; font-size: 12px;">Kode Akses Photobooth:</p>
            <div class="code-box">${success.accessCode}</div>
            <p style="margin: 5px 0; font-size: 10px;">Berlaku 30 menit</p>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <p>Terima kasih atas kunjungan Anda</p>
            <p>${new Date().toLocaleString('id-ID')}</p>
          </div>
        </body>
        </html>
      `
      w.document.write(receiptHTML)
      w.document.close()
      w.print()
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
        <div className="card w-full max-w-sm p-8 text-center animate-slide-in">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-display font-bold text-slate-800 mb-1">Pembayaran Berhasil!</h2>
          <p className="text-sm text-slate-500 mb-6">#{success.orderNumber}</p>

          <div className="bg-surface-muted rounded-2xl p-5 mb-6">
            <p className="text-xs text-slate-500 mb-3">Kode Akses Photobooth</p>
            <div className="bg-white rounded-xl p-6 mb-3 border-2 border-brand-200">
              <p className="text-4xl font-bold font-mono text-brand-700 tracking-widest">{success.accessCode}</p>
            </div>
            <button
              onClick={copyToClipboard}
              className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <Copy size={12} />
              Salin kode
            </button>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Berikan kode ini ke pelanggan.<br />Berlaku 30 menit.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={printReceipt}
              className="btn-secondary flex-1 justify-center"
            >
              <Printer size={16} />
              Cetak Struk
            </button>
            <button onClick={onClose} className="btn-primary flex-1 justify-center">
              Selesai
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Checkout form ──────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 animate-fade-in">
      <div className="card w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl animate-slide-in overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="font-display font-semibold text-slate-800">Pembayaran</h2>
          <button onClick={onClose} className="btn-icon btn-ghost"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Order summary */}
          <div className="bg-surface-muted rounded-xl p-4 space-y-2 text-sm">
            {items.map(i => (
              <div key={i.product.id} className="flex justify-between">
                <span className="text-slate-600">{i.product.name} ×{i.quantity}</span>
                <span className="font-medium">{formatRupiah(i.product.price * i.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-surface-border pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal())}</span>
              </div>
              {discount && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon ({discount.code})</span>
                  <span>-{formatRupiah(discountAmount())}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-brand-700 text-base">
                <span>Total</span>
                <span>{formatRupiah(total())}</span>
              </div>
            </div>
          </div>

          {/* Discount code */}
          <div>
            <label className="label">Kode Diskon (opsional)</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Contoh: WELCOME10"
                value={discountCode}
                onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                disabled={!!discount}
              />
              {discount ? (
                <button onClick={() => { setDiscount(null); setDiscountCode(''); }} className="btn-secondary btn-sm px-3">
                  <X size={14} />
                </button>
              ) : (
                <button onClick={applyDiscount} disabled={loadingDiscount || !discountCode} className="btn-secondary btn-sm">
                  <Tag size={14} />
                  Pakai
                </button>
              )}
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="label">Metode Pembayaran</label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setPayMethod(m.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${payMethod === m.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-surface-border hover:border-brand-300'
                    }`}
                >
                  <m.icon size={18} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash input */}
          {payMethod === 'cash' && (
            <div>
              <label className="label">Uang Diterima</label>
              <input
                type="number"
                className="input"
                placeholder="Masukkan nominal..."
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
              />
              {Number(amountPaid) > 0 && (
                <div className="mt-2 flex justify-between text-sm bg-surface-muted rounded-xl px-4 py-3">
                  <span className="text-slate-500">Kembalian</span>
                  <span className={`font-bold ${change < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {formatRupiah(change)}
                  </span>
                </div>
              )}
              {/* Quick amount buttons */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {[total(), Math.ceil(total() / 10000) * 10000, Math.ceil(total() / 50000) * 50000, 100000].filter((v, i, a) => a.indexOf(v) === i).map(v => (
                  <button key={v} onClick={() => setAmountPaid(String(v))}
                    className="badge badge-blue cursor-pointer hover:bg-brand-100 transition-colors text-xs py-1 px-2 rounded-lg">
                    {formatRupiah(v)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleCheckout}
            disabled={loading || !isPaid}
            className="btn-primary btn-lg w-full justify-center"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : `Bayar ${formatRupiah(total())}`}
          </button>
        </div>
      </div>
    </div>
  )
}