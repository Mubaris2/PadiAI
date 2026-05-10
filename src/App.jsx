import React, { useState } from 'react'
import MainLayout from './layouts/MainLayout'
import Drawer from './components/Drawer'
import './main.css'

export default function App() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <div className="app-root">
      <MainLayout onToggleDrawer={() => setIsDrawerOpen(true)} />
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  )
}
