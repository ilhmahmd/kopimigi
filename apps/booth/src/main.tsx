import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import SessionPage from './pages/SessionPage'
import WaitingPage from './pages/WaitingPage'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Main booth waiting screen (idle display) */}
          <Route path="/" element={<WaitingPage />} />
          <Route path="/access/:accessCode" element={<SessionPage />} />
          {/* Customer lands here after scanning QR */}
          <Route path="/session/:token" element={<SessionPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-center" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
