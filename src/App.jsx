import React from 'react'
import TopBar from './components/layout/TopBar'
import Sidebar from './components/layout/Sidebar'
import MainLayout from './components/layout/MainLayout'
import { useState } from 'react'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="app-root" style={{height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)'}}>
      <TopBar onToggleSidebar={() => setSidebarOpen(s => !s)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <MainLayout />
    </div>
  )
}
