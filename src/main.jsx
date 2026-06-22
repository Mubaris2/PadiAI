import React from 'react'
import { createRoot } from 'react-dom/client'
import './electron-shim'
import App from './App'
import './styles/globals.css'

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.type === 'cancelation') {
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
