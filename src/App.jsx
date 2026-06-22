import React, { useState } from 'react'
import TopBar from './components/layout/TopBar'
import Sidebar from './components/layout/Sidebar'
import MainLayout from './components/layout/MainLayout'
import { Toast } from './components/layout/Toast'
import useAppStore from './store/useAppStore'
import { useScrapingQueue } from './hooks/useScrapingQueue'
import { ScrapingContext } from './context/ScrapingContext'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const toasts = useAppStore(s => s.toasts)
  const removeToast = useAppStore(s => s.removeToast)
  const { scrapeStatuses, scrapeQueue, retryOne } = useScrapingQueue()

  return (
    <ScrapingContext.Provider value={{ scrapeStatuses, scrapeQueue, retryOne }}>
      <div className="app-root" style={{height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)'}}>
        <TopBar onToggleSidebar={() => setSidebarOpen(s => !s)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <MainLayout />
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ScrapingContext.Provider>
  )
}
