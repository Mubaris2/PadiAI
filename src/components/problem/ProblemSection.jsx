import React, { useState, useRef, useEffect } from 'react'

export default function ProblemSection({ title, children, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div style={{border:'1px solid var(--border)', marginBottom:8, borderRadius:6, overflow:'hidden'}}>
      <div onClick={() => setOpen(o => !o)} style={{padding:8, display:'flex', justifyContent:'space-between', cursor:'pointer'}}>
        <div>{title}</div>
        <div style={{transform: `rotate(${open? 90: 0}deg)`, transition:'transform 150ms'}}>&gt;</div>
      </div>
      <div style={{padding:8, display: open? 'block' : 'none'}}>
        {children}
      </div>
    </div>
  )
}
