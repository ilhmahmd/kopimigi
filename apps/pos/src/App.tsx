import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

// Pages
import LoginPage from '@/pages/LoginPage'
import DashboardLayout from '@/components/layout/DashboardLayout'
import POSPage from '@/pages/POSPage'
import OrdersPage from '@/pages/OrdersPage'
import MenuPage from '@/pages/MenuPage'
import DiscountsPage from '@/pages/DiscountsPage'
import InventoryPage from '@/pages/InventoryPage'
import ReportsPage from '@/pages/ReportsPage'
import CategoriesPage from '@/pages/CategoriesPage'
import UsersPage from '@/pages/UsersPage'

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [currentRole, setCurrentRole] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const loadRole = async () => {
      if (!session?.user?.id) {
        setCurrentRole(null)
        return
      }

      const { data, error } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (error || !data?.role) {
        setCurrentRole(null)
        return
      }

      setCurrentRole(data.role)
    }

    if (session) {
      loadRole()
    } else {
      setCurrentRole(undefined)
    }
  }, [session])

  // Loading
  if (session === undefined || (session && currentRole === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <div className="w-8 h-8 border-2 border-coffee-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardLayout userRole={currentRole} />}>
        <Route index element={<Navigate to="/pos" replace />} />
        <Route path="pos" element={<POSPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="categories" element={['owner', 'manager'].includes(currentRole || '') ? <CategoriesPage /> : <Navigate to="/pos" replace />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="discounts" element={<DiscountsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route
          path="users"
          element={['owner', 'manager'].includes(currentRole || '') ? <UsersPage /> : <Navigate to="/pos" replace />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/pos" replace />} />
    </Routes>
  )
}

export default App
