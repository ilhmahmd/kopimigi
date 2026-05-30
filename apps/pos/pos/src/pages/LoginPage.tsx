import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Coffee, Eye, EyeOff, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) { toast.error('Username tidak boleh kosong'); return }
    setLoading(true)

    // Konversi username → email internal
    const email = username.includes('@') ? username : `${username.trim().toLowerCase()}@kopimigi.id`

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Username atau password salah')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-50 opacity-60" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-brand-100 opacity-40" />
      </div>

      <div className="relative w-full max-w-sm animate-slide-in">
        <div className="card p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mb-4 shadow-card-md">
              <Coffee size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-brand-700">KopiMigi</h1>
            <p className="text-sm text-slate-500 mt-1">Point of Sale System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="contoh: budi"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-lg w-full justify-center mt-2"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Masuk'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Hubungi admin untuk mendapatkan akses
        </p>
      </div>
    </div>
  )
}
