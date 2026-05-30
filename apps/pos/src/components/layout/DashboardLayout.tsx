import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  ShoppingCart, UtensilsCrossed, Tag, BarChart2,
  Users, ClipboardList, LogOut, Coffee, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/pos',       icon: ShoppingCart,  label: 'Kasir' },
  { to: '/orders',    icon: ClipboardList, label: 'Transaksi' },
  { to: '/menu',      icon: UtensilsCrossed, label: 'Menu' },
  { to: '/discounts', icon: Tag,           label: 'Diskon' },
  { to: '/reports',   icon: BarChart2,     label: 'Laporan' },
  { to: '/users',     icon: Users,         label: 'Pengguna' },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const Sidebar = ({ mobile = false }) => (
    <aside className={`
      flex flex-col h-full bg-white border-r border-surface-border
      ${mobile ? 'w-full' : 'w-60'}
    `}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-border">
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
        {NAV.map(({ to, icon: Icon, label }) => (
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

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
