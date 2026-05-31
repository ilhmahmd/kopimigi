import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/format'
import { Plus, Pencil, Users, ShieldCheck, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLE_BADGE: Record<string, string> = { owner: 'badge-red', manager: 'badge-blue', cashier: 'badge-gray' }
const ROLE_LABEL: Record<string, string> = { owner: 'Owner', manager: 'Manager', cashier: 'Kasir' }

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; user?: any } | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', role: 'cashier', is_active: true, password: '' })
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const load = async () => {
    const { data } = await supabase.from('app_users').select('*').order('created_at')
    setUsers(data || [])
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  useEffect(() => { load() }, [])

  const openEdit = (u: any) => {
    setForm({ full_name: u.full_name, email: u.email, role: u.role, is_active: u.is_active, password: '' })
    setModal({ mode: 'edit', user: u })
  }

  const openAdd = () => {
    setForm({ full_name: '', email: '', role: 'cashier', is_active: true, password: '' })
    setModal({ mode: 'add' })
  }

  const save = async () => {
    if (!form.full_name || !form.email) { toast.error('Lengkapi data pengguna'); return }
    setSaving(true)

    if (modal?.mode === 'add') {
      if (!form.password) { toast.error('Password wajib diisi'); setSaving(false); return }
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data?.error || 'Gagal menambahkan pengguna')
        setSaving(false)
        return
      }
      toast.success('Pengguna berhasil ditambahkan')
    } else {
      const { error } = await supabase.from('app_users').update({
        full_name: form.full_name, role: form.role as any, is_active: form.is_active
      }).eq('id', modal?.user?.id)
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Pengguna diperbarui')
    }
    setSaving(false); setModal(null); load()
  }

  const toggleActive = async (u: any) => {
    if (u.id === currentUser?.id) { toast.error('Tidak bisa nonaktifkan akun sendiri'); return }
    await supabase.from('app_users').update({ is_active: !u.is_active }).eq('id', u.id)
    load()
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-800">Manajemen Pengguna</h1>
          <p className="text-xs text-slate-500">{users.length} pengguna terdaftar</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} />Tambah Pengguna</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.map(u => (
          <div key={u.id} className={`card p-5 transition-all ${!u.is_active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center font-display font-bold text-brand-700 text-base flex-shrink-0">
                  {u.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">{u.full_name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
              </div>
              <button onClick={() => openEdit(u)} className="btn-icon btn-ghost btn-sm"><Pencil size={14} /></button>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className={`badge ${ROLE_BADGE[u.role]}`}>
                {u.role === 'owner' ? <ShieldCheck size={11} /> : u.role === 'manager' ? <ShieldAlert size={11} /> : <Users size={11} />}
                {ROLE_LABEL[u.role]}
              </span>
              <button onClick={() => toggleActive(u)} className={`text-xs font-medium transition-colors ${u.is_active ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}>
                {u.is_active ? 'Aktif' : 'Nonaktif'}
              </button>
            </div>
            <p className="text-2xs text-slate-400 mt-2">Bergabung {formatDate(u.created_at)}</p>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="card w-full max-w-md animate-slide-in">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-display font-semibold">{modal.mode === 'add' ? 'Tambah Pengguna' : 'Edit Pengguna'}</h3>
              <button onClick={() => setModal(null)} className="btn-icon btn-ghost">✕</button>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Nama Lengkap *</label>
                <input className="input" placeholder="Budi Santoso" value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" placeholder="budi@kopimigi.id" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} disabled={modal.mode === 'edit'} />
              </div>
              {modal.mode === 'add' && (
                <div>
                  <label className="label">Password *</label>
                  <input type="password" className="input" placeholder="Min. 6 karakter" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} />
                </div>
              )}
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                  <option value="cashier">Kasir</option>
                  <option value="manager">Manager</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              {modal.mode === 'edit' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded accent-brand-600" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} />
                  <span className="text-sm text-slate-700">Pengguna aktif</span>
                </label>
              )}
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
