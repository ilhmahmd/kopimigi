import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import WaitingPage from './pages/WaitingPage'
import SessionPage from './pages/SessionPage'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<WaitingPage />} />
          <Route path="/session/:token" element={<SessionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-center" toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', fontFamily: '"Google Sans", sans-serif', fontSize: '14px' },
        }} />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
