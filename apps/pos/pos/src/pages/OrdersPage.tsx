import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatDate } from '@/lib/format'
import { Search, Eye, RefreshCw, Receipt } from 'lucide-react'

const STATUS_BADGE: Record<string, string> = {
  pending:   'badge-amber',
  paid:      'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-red',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', paid: 'Dibayar', completed: 'Selesai', cancelled: 'Dibatalkan',
}
const PM_LABEL: Record<string, string> = {
  cash: 'Tunai', qris: 'QRIS', debit: 'Debit', credit: 'Kredit',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<any>(null)

  const fetchOrders = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*, app_users(full_name), order_items(*), photo_sessions(*)')
      .order('created_at', { ascending: false })
      .limit(100)
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const filtered = orders.filter(o =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.app_users?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-800">Riwayat Transaksi</h1>
          <p className="text-xs text-slate-500">{orders.length} transaksi tercatat</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary btn-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Cari nomor order..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>No. Order</th>
                <th>Waktu</th>
                <th>Kasir</th>
                <th>Pembayaran</th>
                <th>Total</th>
                <th>Photobooth</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">
                  <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                  <Receipt size={32} className="mx-auto mb-2 opacity-30" />
                  Belum ada transaksi
                </td></tr>
              ) : filtered.map(o => (
                <tr key={o.id}>
                  <td className="font-mono text-xs font-medium text-brand-700">{o.order_number}</td>
                  <td className="text-xs text-slate-500">{formatDate(o.created_at)}</td>
                  <td className="text-sm">{o.app_users?.full_name || '—'}</td>
                  <td><span className="badge badge-gray">{PM_LABEL[o.payment_method]}</span></td>
                  <td className="font-semibold text-slate-800">{formatRupiah(o.total)}</td>
                  <td>
                    {o.photo_sessions?.[0] ? (
                      <span className={`badge ${o.photo_sessions[0].status === 'used' ? 'badge-green' : o.photo_sessions[0].status === 'expired' ? 'badge-red' : 'badge-amber'}`}>
                        {o.photo_sessions[0].status === 'used' ? 'Digunakan' : o.photo_sessions[0].status === 'expired' ? 'Expired' : 'Menunggu'}
                      </span>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span></td>
                  <td>
                    <button onClick={() => setDetail(o)} className="btn-ghost btn-sm btn-icon">
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="card w-full max-w-lg animate-slide-in overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <div>
                <p className="font-display font-semibold text-slate-800">Detail Transaksi</p>
                <p className="text-xs font-mono text-brand-600 mt-0.5">{detail.order_number}</p>
              </div>
              <button onClick={() => setDetail(null)} className="btn-icon btn-ghost">✕</button>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="label">Kasir</p><p>{detail.app_users?.full_name}</p></div>
                <div><p className="label">Waktu</p><p>{formatDate(detail.created_at)}</p></div>
                <div><p className="label">Pembayaran</p><p>{PM_LABEL[detail.payment_method]}</p></div>
                <div><p className="label">Status</p><span className={`badge ${STATUS_BADGE[detail.status]}`}>{STATUS_LABEL[detail.status]}</span></div>
              </div>
              <div className="bg-surface-muted rounded-xl p-4 space-y-2">
                {detail.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.product_name} ×{item.quantity}</span>
                    <span className="font-medium">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
                <div className="border-t border-surface-border pt-2 mt-2 space-y-1 text-sm">
                  {detail.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Diskon</span><span>-{formatRupiah(detail.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-brand-700">
                    <span>Total</span><span>{formatRupiah(detail.total)}</span>
                  </div>
                  {detail.payment_method === 'cash' && (
                    <>
                      <div className="flex justify-between text-slate-500">
                        <span>Dibayar</span><span>{formatRupiah(detail.amount_paid)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Kembalian</span><span>{formatRupiah(detail.change_amount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {detail.photo_sessions?.[0] && (
                <div className="bg-brand-50 rounded-xl p-3 text-xs text-brand-700">
                  <p className="font-medium mb-1">📸 Photobooth Session</p>
                  <p>Status: <strong>{detail.photo_sessions[0].status}</strong></p>
                  <p className="truncate mt-0.5 text-brand-400">{detail.photo_sessions[0].token_url}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
