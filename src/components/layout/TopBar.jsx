import React from 'react'

export default function TopBar({ onToggleSidebar }) {
  return (
    <div style={{height: 40, display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--bg-secondary)', WebkitAppRegion: 'drag'}}>
      <button onClick={onToggleSidebar} style={{WebkitAppRegion: 'no-drag', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 18}}>☰</button>
      <div style={{marginLeft: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent)'}}>PadiAI</div>
    </div>
  )
}
