import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ShoppingCart, UtensilsCrossed, Tag, BarChart2,
  Users, ClipboardList, Box, LogOut, Coffee, Menu, X, Layers
} from 'lucide-react'
import { useEffect, useState } from 'react'

const NAV = [
  { to: '/pos',       icon: ShoppingCart,  label: 'Kasir' },
  { to: '/orders',    icon: ClipboardList, label: 'Transaksi' },
  { to: '/menu',      icon: UtensilsCrossed, label: 'Menu' },
  { to: '/categories', icon: Layers,       label: 'Kategori' },
  { to: '/inventory', icon: Box,           label: 'Persediaan' },
  { to: '/discounts', icon: Tag,           label: 'Diskon' },
  { to: '/reports',   icon: BarChart2,     label: 'Laporan' },
  { to: '/users',     icon: Users,         label: 'Pengguna' },
]

interface DashboardLayoutProps {
  userRole: string | null | undefined
}

export default function DashboardLayout({ userRole }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const formatClock = (date: Date) => {
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  const [currentTime, setCurrentTime] = useState(() => formatClock(new Date()))

  const handleLogout = async () => {
    setLogoutConfirmOpen(true)
  }

  const confirmLogout = async () => {
    setLogoutConfirmOpen(false)
    await supabase.auth.signOut()
    navigate('/login')
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatClock(new Date()))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const loadUserName = async () => {
      const { data } = await supabase.auth.getUser()
      const userId = data.user?.id
      if (!userId) return

      const { data: appUser } = await supabase
        .from('app_users')
        .select('full_name')
        .eq('id', userId)
        .single()

      if (appUser?.full_name) {
        setUserName(appUser.full_name)
      }
    }

    loadUserName()
  }, [])

  const Sidebar = ({ mobile = false }) => (
    <aside className={`
      flex flex-col h-full bg-white border-r border-surface-border
      ${mobile ? 'w-full' : 'w-60'}
    `}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
          <Coffee size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-display font-bold text-brand-700 leading-none">KopiMigi</p>
          <p className="text-2xs text-slate-400 mt-0.5">Point of Sale</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-2xs font-medium text-slate-400 uppercase tracking-widest px-3 py-2">Menu</p>
        {NAV.filter(item => !['/users', '/categories'].includes(item.to) || ['owner', 'manager'].includes(userRole || '')).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-surface-border">
        <button
          onClick={handleLogout}
          className="nav-item w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={17} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0 shadow-sidebar">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 w-64 shadow-xl animate-slide-in">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-surface-border">
          <button className="btn-icon btn-ghost" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center">
              <Coffee size={12} className="text-white" />
            </div>
            <span className="font-display font-bold text-brand-700 text-sm">KopiMigi</span>
          </div>
        </header>

        <div className="sticky top-0 z-10 border-b border-surface-border bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-6 py-4">
            <p className="text-lg font-semibold text-slate-900">Selamat datang kembali, {userName || 'Kasir'}</p>
            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
              {currentTime}
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-surface-border shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-900">Keluar dari aplikasi?</h3>
            <p className="mt-2 text-sm text-slate-500">Jika keluar, kamu harus login lagi untuk menggunakan sistem.</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setLogoutConfirmOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmLogout}
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
