import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Search, ToggleLeft, ToggleRight, Box } from 'lucide-react'
import toast from 'react-hot-toast'

const ITEM_TYPES = [
  { id: 'bahan_baku', label: 'Bahan Baku' },
  { id: 'kemasan', label: 'Kemasan' },
  { id: 'pelengkap', label: 'Pelengkap' },
  { id: 'lainnya', label: 'Lainnya' },
]

const UNIT_OPTIONS = ['pcs', 'gram', 'kg', 'ml', 'ltr']

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; item?: any } | null>(null)
  const [form, setForm] = useState({
    name: '',
    item_type: 'bahan_baku',
    unit: 'pcs',
    quantity: '0',
    min_stock: '0',
    notes: '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('inventory_items').select('*').order('created_at', { ascending: false })
    setItems(data || [])
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setForm({ name: '', item_type: 'bahan_baku', unit: 'pcs', quantity: '0', min_stock: '0', notes: '', is_active: true })
    setModal({ mode: 'add' })
  }

  const openEdit = (item: any) => {
    setForm({
      name: item.name,
      item_type: item.item_type,
      unit: item.unit,
      quantity: String(item.quantity ?? 0),
      min_stock: String(item.min_stock ?? 0),
      notes: item.notes || '',
      is_active: item.is_active,
    })
    setModal({ mode: 'edit', item })
  }

  const save = async () => {
    if (!form.name.trim()) { toast.error('Nama bahan/kemasan wajib diisi'); return }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      item_type: form.item_type,
      unit: form.unit,
      quantity: Number(form.quantity) || 0,
      min_stock: Number(form.min_stock) || 0,
      notes: form.notes.trim() || null,
      is_active: form.is_active,
    }

    if (modal?.mode === 'add') {
      const { error } = await supabase.from('inventory_items').insert(payload)
      if (error) { toast.error('Gagal menambah item persediaan'); setSaving(false); return }
      toast.success('Item persediaan berhasil ditambahkan')
    } else {
      const { error } = await supabase.from('inventory_items').update(payload).eq('id', modal.item.id)
      if (error) { toast.error('Gagal memperbarui item'); setSaving(false); return }
      toast.success('Item persediaan berhasil diperbarui')
    }

    setSaving(false)
    setModal(null)
    load()
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Yakin hapus item persediaan ini?')) return
    const { error } = await supabase.from('inventory_items').delete().eq('id', id)
    if (error) { toast.error('Gagal menghapus item'); return }
    toast.success('Item dihapus')
    load()
  }

  const toggleActive = async (item: any) => {
    await supabase.from('inventory_items').update({ is_active: !item.is_active }).eq('id', item.id)
    load()
  }

  const filtered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || item.item_type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-800">Persediaan & Bahan</h1>
          <p className="text-xs text-slate-500">CRUD bahan baku, kemasan, dan item persediaan lainnya</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tambah Item
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10 w-full" placeholder="Cari bahan atau kemasan..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterType('all')} className={`px-3.5 py-2 rounded-xl text-xs font-medium ${filterType === 'all' ? 'bg-brand-600 text-white' : 'bg-white border border-surface-border text-slate-600'}`}>Semua</button>
          {ITEM_TYPES.map(type => (
            <button key={type.id} onClick={() => setFilterType(type.id)} className={`px-3.5 py-2 rounded-xl text-xs font-medium ${filterType === type.id ? 'bg-brand-600 text-white' : 'bg-white border border-surface-border text-slate-600'}`}>
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Jenis</th>
                <th>Stok</th>
                <th>Min. Stok</th>
                <th>Satuan</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-14 text-slate-400 text-sm">
                  <Box size={32} className="mx-auto mb-2 opacity-30" />Tidak ada item persediaan
                </td></tr>
              ) : filtered.map(item => (
                <tr key={item.id}>
                  <td>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    {item.notes && <p className="text-xs text-slate-400 truncate max-w-xs">{item.notes}</p>}
                  </td>
                  <td>{ITEM_TYPES.find(type => type.id === item.item_type)?.label || item.item_type}</td>
                  <td>{item.quantity}</td>
                  <td>{item.min_stock}</td>
                  <td>{item.unit}</td>
                  <td>
                    <button onClick={() => toggleActive(item)} className="flex items-center gap-1.5 text-xs font-medium transition-colors">
                      {item.is_active ? <><ToggleRight size={20} className="text-emerald-500" /><span className="text-emerald-600">Aktif</span></> : <><ToggleLeft size={20} className="text-slate-400" /><span className="text-slate-400">Nonaktif</span></>}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(item)} className="btn-ghost btn-sm btn-icon"><Pencil size={14} /></button>
                      <button onClick={() => deleteItem(item.id)} className="btn-ghost btn-sm btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="card w-full max-w-md animate-slide-in">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-display font-semibold text-slate-800">{modal.mode === 'add' ? 'Tambah Item Persediaan' : 'Edit Item Persediaan'}</h3>
              <button onClick={() => setModal(null)} className="btn-icon btn-ghost">✕</button>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Nama *</label>
                <input className="input" placeholder="Contoh: Kopi Arabika" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Jenis *</label>
                  <select className="input" value={form.item_type} onChange={e => setForm(f => ({ ...f, item_type: e.target.value }))}>
                    {ITEM_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Satuan *</label>
                  <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                    {UNIT_OPTIONS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Jumlah</label>
                  <input type="number" className="input" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Min. Stok</label>
                  <input type="number" className="input" min="0" value={form.min_stock} onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Catatan</label>
                <textarea className="input resize-none" rows={3} placeholder="Keterangan..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-brand-600" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span className="text-sm text-slate-700">Aktif</span>
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
