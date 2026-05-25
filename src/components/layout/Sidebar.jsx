import React, { useEffect, useState } from 'react'
import ProblemList from '../sidebar/ProblemList'

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          opacity: open ? 1 : 0,
          transition: 'opacity 200ms ease',
          pointerEvents: open ? 'auto' : 'none',
          zIndex: 1000,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 40,
          left: 0,
          width: 280,
          bottom: 0,
          background: 'var(--bg-panel)',
          transition: 'transform 200ms ease',
          transform: `translateX(${open ? '0' : '-100%'})`,
          boxShadow: '2px 0 8px rgba(0,0,0,0.5)',
          zIndex: 1001,
        }}
      >
        <div style={{padding:12, borderBottom:'1px solid var(--border)'}}>
          <div style={{fontFamily:'var(--font-mono)', color:'var(--accent)'}}>PadiAI</div>
        </div>
        <div style={{overflow:'auto', padding:12}}>
          <ProblemList />
        </div>
        <div style={{position:'absolute', bottom:12, left:12, right:12}}>
          <button style={{display:'block', width:'100%', marginBottom:8}}>Change Working Directory</button>
          <button style={{display:'block', width:'100%', marginBottom:8}}>API Keys</button>
          <button style={{display:'block', width:'100%', opacity:0.5}} disabled>Change User</button>
        </div>
      </div>
    </>
  )
}
