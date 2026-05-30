import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/format'
import { Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight, UtensilsCrossed } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MenuPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [activeCat, setActiveCat] = useState('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; product?: any } | null>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', category_id: '', is_available: true })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('products').select('*, categories(*)').order('sort_order'),
    ])
    setCategories(cats || [])
    setProducts(prods || [])
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setForm({ name: '', description: '', price: '', category_id: categories[0]?.id || '', is_available: true })
    setModal({ mode: 'add' })
  }
  const openEdit = (p: any) => {
    setForm({ name: p.name, description: p.description || '', price: String(p.price), category_id: p.category_id, is_available: p.is_available })
    setModal({ mode: 'edit', product: p })
  }

  const save = async () => {
    if (!form.name || !form.price || !form.category_id) { toast.error('Lengkapi data produk'); return }
    setSaving(true)
    const payload = { name: form.name, description: form.description, price: Number(form.price), category_id: form.category_id, is_available: form.is_available }
    if (modal?.mode === 'add') {
      const { error } = await supabase.from('products').insert(payload)
      if (error) { toast.error('Gagal menambah menu'); setSaving(false); return }
      toast.success('Menu berhasil ditambahkan')
    } else {
      const { error } = await supabase.from('products').update(payload).eq('id', modal?.product?.id)
      if (error) { toast.error('Gagal memperbarui menu'); setSaving(false); return }
      toast.success('Menu berhasil diperbarui')
    }
    setSaving(false)
    setModal(null)
    load()
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Yakin hapus menu ini?')) return
    await supabase.from('products').delete().eq('id', id)
    toast.success('Menu dihapus')
    load()
  }

  const toggleAvailable = async (p: any) => {
    await supabase.from('products').update({ is_available: !p.is_available }).eq('id', p.id)
    load()
  }

  const filtered = products.filter(p => {
    const matchCat = activeCat === 'all' || p.category_id === activeCat
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-800">Manajemen Menu</h1>
          <p className="text-xs text-slate-500">{products.length} produk terdaftar</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Tambah Menu
        </button>
      </div>

      {/* Filter row */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10 w-56" placeholder="Cari menu..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {[{ id: 'all', name: 'Semua' }, ...categories].map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${activeCat === c.id ? 'bg-brand-600 text-white' : 'bg-white border border-surface-border text-slate-600 hover:border-brand-300'}`}>
              {(c as any).icon && <span className="mr-1">{(c as any).icon}</span>}{c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead><tr>
              <th>Menu</th><th>Kategori</th><th>Harga</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                  <UtensilsCrossed size={32} className="mx-auto mb-2 opacity-30" />Tidak ada menu
                </td></tr>
              ) : filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center text-xl flex-shrink-0">
                        {p.categories?.icon || '☕'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{p.name}</p>
                        {p.description && <p className="text-xs text-slate-400 truncate max-w-xs">{p.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-blue">{p.categories?.name}</span>
                  </td>
                  <td className="font-semibold text-brand-700">{formatRupiah(p.price)}</td>
                  <td>
                    <button onClick={() => toggleAvailable(p)} className="flex items-center gap-1.5 text-xs font-medium transition-colors">
                      {p.is_available
                        ? <><ToggleRight size={20} className="text-emerald-500" /><span className="text-emerald-600">Tersedia</span></>
                        : <><ToggleLeft size={20} className="text-slate-400" /><span className="text-slate-400">Nonaktif</span></>}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="btn-ghost btn-sm btn-icon"><Pencil size={14} /></button>
                      <button onClick={() => deleteProduct(p.id)} className="btn-ghost btn-sm btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="card w-full max-w-md animate-slide-in">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-display font-semibold text-slate-800">{modal.mode === 'add' ? 'Tambah Menu' : 'Edit Menu'}</h3>
              <button onClick={() => setModal(null)} className="btn-icon btn-ghost">✕</button>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Nama Menu *</label>
                <input className="input" placeholder="Contoh: Americano" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Deskripsi</label>
                <textarea className="input resize-none" rows={2} placeholder="Deskripsi singkat..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Harga (Rp) *</label>
                  <input type="number" className="input" placeholder="25000" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Kategori *</label>
                  <select className="input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">Pilih...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-brand-600" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} />
                <span className="text-sm text-slate-700">Tersedia untuk dipesan</span>
              </label>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="btn-secondary">Batal</button>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
