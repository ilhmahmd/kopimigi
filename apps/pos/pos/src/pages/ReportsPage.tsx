import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/format'
import { BarChart2, TrendingUp, ShoppingCart, Percent } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Database } from '@coffeeshop/shared/supabase/database.types'

// 1. Definisikan tipe join untuk orders dan order_items secara eksplisit
type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderItemRow = Database['public']['Tables']['order_items']['Row']

type OrderWithItems = OrderRow & {
  order_items: OrderItemRow[] | null
}

export default function ReportsPage() {
  const [range, setRange] = useState<'7' | '30' | '90'>('7')
  const [stats, setStats] = useState({ revenue: 0, orders: 0, avgOrder: 0, discountTotal: 0 })
  const [chartData, setChartData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      const since = new Date()
      since.setDate(since.getDate() - Number(range))
      const sinceISO = since.toISOString()

      // 2. Berikan type-casting pada query Supabase menggunakan tipe data join
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .gte('created_at', sinceISO)
        .in('status', ['paid', 'completed'])

      const orders = data as OrderWithItems[] | null

      if (!orders) { setLoading(false); return }

      const revenue = orders.reduce((s, o) => s + o.total, 0)
      const discountTotal = orders.reduce((s, o) => s + o.discount_amount, 0)
      setStats({ revenue, orders: orders.length, avgOrder: orders.length ? Math.round(revenue / orders.length) : 0, discountTotal })

      // Daily chart
      const dailyMap: Record<string, number> = {}
      orders.forEach(o => {
        const d = o.created_at.slice(0, 10)
        dailyMap[d] = (dailyMap[d] || 0) + o.total
      })
      const sorted = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({
        date: new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(date)),
        total,
      }))
      setChartData(sorted)

      // Top products
      const prodMap: Record<string, { name: string; qty: number; rev: number }> = {}
      orders.forEach(o => o.order_items?.forEach((i) => {
        if (!prodMap[i.product_id]) prodMap[i.product_id] = { name: i.product_name, qty: 0, rev: 0 }
        prodMap[i.product_id].qty += i.quantity
        prodMap[i.product_id].rev += i.subtotal
      }))
      setTopProducts(Object.values(prodMap).sort((a, b) => b.qty - a.qty).slice(0, 8))

      setLoading(false)
    }
    fetchReports()
  }, [range])

  const STATS = [
    { label: 'Total Pendapatan', value: formatRupiah(stats.revenue), sub: `${range} hari terakhir`, icon: TrendingUp, color: 'text-brand-600 bg-brand-50' },
    { label: 'Total Transaksi', value: stats.orders, sub: 'order berhasil', icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Rata-rata Order', value: formatRupiah(stats.avgOrder), sub: 'per transaksi', icon: BarChart2, color: 'text-amber-600 bg-amber-50' },
    { label: 'Total Diskon', value: formatRupiah(stats.discountTotal), sub: 'diberikan', icon: Percent, color: 'text-purple-600 bg-purple-50' },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) return (
      <div className="card px-3 py-2 text-xs shadow-card-md">
        <p className="font-medium text-slate-700 mb-1">{label}</p>
        <p className="text-brand-600 font-bold">{formatRupiah(payload[0].value)}</p>
      </div>
    )
    return null
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-800">Laporan Penjualan</h1>
          <p className="text-xs text-slate-500">Analitik performa toko</p>
        </div>
        <div className="flex gap-1 bg-surface-muted p-1 rounded-xl">
          {(['7','30','90'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${range === r ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {r} hari
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-2`}>
              <s.icon size={18} />
            </div>
            <p className="stat-label">{s.label}</p>
            <p className="stat-value">{loading ? '—' : s.value}</p>
            <p className="stat-sub">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="card xl:col-span-2 p-5">
          <p className="font-display font-semibold text-slate-700 mb-4">Pendapatan Harian</p>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-300">Memuat...</div>
          ) : chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm">Belum ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ebf5" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#2B4083" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top products */}
        <div className="card p-5">
          <p className="font-display font-semibold text-slate-700 mb-4">Menu Terlaris</p>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_,i) => <div key={i} className="h-8 bg-surface-muted rounded-lg animate-pulse" />)}</div>
          ) : topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-slate-300 text-sm">Belum ada data</div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const maxQty = topProducts[0]?.qty || 1
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 text-slate-700">
                        <span className={`text-2xs font-bold w-4 ${i < 3 ? 'text-brand-600' : 'text-slate-400'}`}>#{i+1}</span>
                        {p.name}
                      </span>
                      <span className="text-xs text-slate-500">{p.qty} terjual</span>
                    </div>
                    <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                      <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${(p.qty/maxQty)*100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}