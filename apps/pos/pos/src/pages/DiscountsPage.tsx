import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatDateShort } from '@/lib/format'
import { Plus, Pencil, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { code: '', name: '', type: 'percentage', value: '', min_order: '', max_uses: '', is_active: true, valid_from: '', valid_until: '' }

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([])
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; item?: any } | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('discounts').select('*').order('created_at', { ascending: false })
    setDiscounts(data || [])
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(emptyForm); setModal({ mode: 'add' }) }
  const openEdit = (d: any) => {
    setForm({ ...d, value: String(d.value), min_order: d.min_order ? String(d.min_order) : '', max_uses: d.max_uses ? String(d.max_uses) : '', valid_from: d.valid_from?.slice(0,10) || '', valid_until: d.valid_until?.slice(0,10) || '' })
    setModal({ mode: 'edit', item: d })
  }

  const save = async () => {
    if (!form.code || !form.name || !form.value) { toast.error('Lengkapi data diskon'); return }
    setSaving(true)
    const payload = {
      code: form.code.toUpperCase(), name: form.name, type: form.type,
      value: Number(form.value), min_order: form.min_order ? Number(form.min_order) : null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      is_active: form.is_active,
      valid_from: form.valid_from || null, valid_until: form.valid_until || null,
    }
    if (modal?.mode === 'add') {
      const { error } = await supabase.from('discounts').insert(payload)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Diskon berhasil ditambahkan')
    } else {
      const { error } = await supabase.from('discounts').update(payload).eq('id', modal?.item?.id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Diskon diperbarui')
    }
    setSaving(false); setModal(null); load()
  }

  const remove = async (id: string) => {
    if (!confirm('Hapus diskon ini?')) return
    await supabase.from('discounts').delete().eq('id', id)
    toast.success('Diskon dihapus'); load()
  }

  const toggleActive = async (d: any) => {
    await supabase.from('discounts').update({ is_active: !d.is_active }).eq('id', d.id)
    load()
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-800">Diskon & Promo</h1>
          <p className="text-xs text-slate-500">{discounts.length} kode diskon</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} />Tambah Diskon</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {discounts.length === 0 && (
          <div className="col-span-3 card p-12 text-center text-slate-400">
            <Tag size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada diskon</p>
          </div>
        )}
        {discounts.map(d => (
          <div key={d.id} className={`card p-5 transition-all ${!d.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-lg">{d.code}</span>
                  {d.is_active
                    ? <span className="badge badge-green">Aktif</span>
                    : <span className="badge badge-gray">Nonaktif</span>}
                </div>
                <p className="text-sm font-medium text-slate-700">{d.name}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(d)} className="btn-icon btn-ghost btn-sm"><Pencil size={14} /></button>
                <button onClick={() => remove(d.id)} className="btn-icon btn-ghost btn-sm text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="text-2xl font-display font-bold text-slate-800 mb-3">
              {d.type === 'percentage' ? `${d.value}%` : formatRupiah(d.value)}
              <span className="text-xs font-normal text-slate-400 ml-1">off</span>
            </div>

            <div className="space-y-1 text-xs text-slate-500">
              {d.min_order && <p>Min. order: <span className="font-medium text-slate-700">{formatRupiah(d.min_order)}</span></p>}
              {d.max_uses && <p>Kuota: <span className="font-medium text-slate-700">{d.used_count}/{d.max_uses} digunakan</span></p>}
              {d.valid_until && <p>Berlaku hingga: <span className="font-medium text-slate-700">{formatDateShort(d.valid_until)}</span></p>}
            </div>

            <div className="mt-3 pt-3 border-t border-surface-border">
              <button onClick={() => toggleActive(d)} className="flex items-center gap-1.5 text-xs font-medium transition-colors">
                {d.is_active
                  ? <><ToggleRight size={18} className="text-emerald-500" /><span className="text-emerald-600">Nonaktifkan</span></>
                  : <><ToggleLeft size={18} className="text-slate-400" /><span className="text-slate-500">Aktifkan</span></>}
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="card w-full max-w-md animate-slide-in">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-display font-semibold">{modal.mode === 'add' ? 'Tambah Diskon' : 'Edit Diskon'}</h3>
              <button onClick={() => setModal(null)} className="btn-icon btn-ghost">✕</button>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Kode *</label>
                  <input className="input uppercase" placeholder="PROMO10" value={form.code} onChange={e => setForm((f:any) => ({...f, code: e.target.value.toUpperCase()}))} />
                </div>
                <div>
                  <label className="label">Tipe</label>
                  <select className="input" value={form.type} onChange={e => setForm((f:any) => ({...f, type: e.target.value}))}>
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Nama Diskon *</label>
                <input className="input" placeholder="Flash Sale Weekend" value={form.name} onChange={e => setForm((f:any) => ({...f, name: e.target.value}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nilai * {form.type === 'percentage' ? '(%)' : '(Rp)'}</label>
                  <input type="number" className="input" placeholder={form.type === 'percentage' ? '10' : '5000'} value={form.value} onChange={e => setForm((f:any) => ({...f, value: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Min. Order (Rp)</label>
                  <input type="number" className="input" placeholder="50000" value={form.min_order} onChange={e => setForm((f:any) => ({...f, min_order: e.target.value}))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Berlaku Dari</label>
                  <input type="date" className="input" value={form.valid_from} onChange={e => setForm((f:any) => ({...f, valid_from: e.target.value}))} />
                </div>
                <div>
                  <label className="label">Berlaku Hingga</label>
                  <input type="date" className="input" value={form.valid_until} onChange={e => setForm((f:any) => ({...f, valid_until: e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Maks. Penggunaan (kosong = unlimited)</label>
                <input type="number" className="input" placeholder="100" value={form.max_uses} onChange={e => setForm((f:any) => ({...f, max_uses: e.target.value}))} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-brand-600" checked={form.is_active} onChange={e => setForm((f:any) => ({...f, is_active: e.target.checked}))} />
                <span className="text-sm text-slate-700">Aktifkan diskon</span>
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
