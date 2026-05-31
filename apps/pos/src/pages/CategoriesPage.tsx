import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Category } from '@coffeeshop/shared/types'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Layers,
  Eye,
  Cookie,
  Coffee,
  Milk,
  ShoppingBag,
  Sandwich,
  Package,
} from 'lucide-react'
import toast from 'react-hot-toast'

const iconMap = {
  cookie: Cookie,
  coffee: Coffee,
  milk: Milk,
  sandwich: Sandwich,
  'shopping-bag': ShoppingBag,
  package: Package,
}

const CategoryIcon = ({
  icon,
  size = 18,
}: {
  icon?: string
  size?: number
}) => {
  const Icon =
    iconMap[icon as keyof typeof iconMap]

  if (!Icon) {
    return <Package size={size} />
  }

  return <Icon size={size} />
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; category?: Category } | null>(null)
  const [form, setForm] = useState({ name: '', icon: '', color: '#fbbf24', sort_order: '0', is_active: true })
  const [saving, setSaving] = useState(false)

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')

    if (error) {
      toast.error('Gagal memuat kategori')
      return
    }
    setCategories(data || [])
  }

  useEffect(() => { loadCategories() }, [])

  const openAdd = () => {
    setForm({ name: '', icon: '', color: '#fbbf24', sort_order: '0', is_active: true })
    setModal({ mode: 'add' })
  }

  const openEdit = (category: Category) => {
    setForm({
      name: category.name,
      icon: category.icon || '',
      color: category.color || '#fbbf24',
      sort_order: String(category.sort_order),
      is_active: category.is_active,
    })
    setModal({ mode: 'edit', category })
  }

  const saveCategory = async () => {
    if (!form.name) {
      toast.error('Nama kategori wajib diisi')
      return
    }

    setSaving(true)
    const payload = {
      name: form.name,
      icon: form.icon || null,
      color: form.color || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    }

    const action = modal?.mode === 'edit'
      ? supabase.from('categories').update(payload).eq('id', modal.category?.id)
      : supabase.from('categories').insert(payload)

    const { error } = await action
    if (error) {
      toast.error(modal?.mode === 'edit' ? 'Gagal memperbarui kategori' : 'Gagal menambah kategori')
      setSaving(false)
      return
    }

    toast.success(modal?.mode === 'edit' ? 'Kategori diperbarui' : 'Kategori ditambahkan')
    setSaving(false)
    setModal(null)
    loadCategories()
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      toast.error('Gagal menghapus kategori. Pastikan tidak ada produk yang menggunakan kategori ini.')
      return
    }
    toast.success('Kategori dihapus')
    loadCategories()
  }

  const toggleActive = async (category: Category) => {
    const { error } = await supabase.from('categories').update({ is_active: !category.is_active }).eq('id', category.id)
    if (error) {
      toast.error('Gagal memperbarui status kategori')
      return
    }
    loadCategories()
  }

  const filtered = categories.filter(category =>
    category.name.toLowerCase().includes(search.toLowerCase()) ||
    (category.icon || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-800">Manajemen Kategori</h1>
          <p className="text-xs text-slate-500">{categories.length} kategori terdaftar</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Tambah Kategori
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative max-w-sm w-full sm:w-auto">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10 w-full"
            placeholder="Cari kategori..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Nama</th>
                <th>Warna</th>
                <th>Urutan</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    <Layers size={32} className="mx-auto mb-2 opacity-30" />
                    Tidak ada kategori
                  </td>
                </tr>
              ) : filtered.map(category => (
                <tr key={category.id}>
                  <td>
  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-50 border border-slate-200">
    <CategoryIcon
      icon={category.icon}
      size={18}
    />
  </div>
</td>
                  <td>{category.name}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 rounded-full border border-slate-200" style={{ backgroundColor: category.color || '#fbbf24' }} />
                      <span className="text-xs text-slate-500">{category.color || '#fbbf24'}</span>
                    </div>
                  </td>
                  <td>{category.sort_order}</td>
                  <td>
                    <button
                      onClick={() => toggleActive(category)}
                      className={`badge ${category.is_active ? 'badge-green' : 'badge-red'}`}
                    >
                      {category.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(category)} className="btn-ghost btn-sm btn-icon"><Pencil size={14} /></button>
                      <button onClick={() => deleteCategory(category.id)} className="btn-ghost btn-sm btn-icon text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 size={14} /></button>
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
              <h3 className="font-display font-semibold text-slate-800">{modal.mode === 'add' ? 'Tambah Kategori' : 'Edit Kategori'}</h3>
              <button onClick={() => setModal(null)} className="btn-icon btn-ghost">✕</button>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Nama Kategori *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Minuman" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
  <label className="label">
    Icon
  </label>

  <select
    className="input"
    value={form.icon}
    onChange={e =>
      setForm(f => ({
        ...f,
        icon: e.target.value,
      }))
    }
  >
    <option value="">
      Pilih Icon
    </option>

    <option value="coffee">
      Coffee
    </option>

    <option value="milk">
      Milk
    </option>

    <option value="cookie">
      Cookie
    </option>

    <option value="sandwich">
      Sandwich
    </option>

    <option value="shopping-bag">
      Shopping Bag
    </option>

    <option value="package">
      Package
    </option>
  </select>

  <div className="mt-3 flex items-center gap-3">
  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 border border-slate-200">
    <CategoryIcon
      icon={form.icon}
      size={20}
    />
  </div>

  <span className="text-xs text-slate-500">
    Preview Icon
  </span>
</div>
</div>
                <div>
                  <label className="label">Warna</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-14 h-11 rounded-lg border border-slate-200 p-0" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                    <input className="input flex-1" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Urutan tampil</label>
                  <input type="number" className="input" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="category-active"
                    type="checkbox"
                    className="w-4 h-4 rounded accent-brand-600"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                  <label htmlFor="category-active" className="text-sm text-slate-700">Aktif</label>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="btn-secondary">Batal</button>
              <button onClick={saveCategory} disabled={saving} className="btn-primary">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
