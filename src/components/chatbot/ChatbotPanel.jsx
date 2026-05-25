import React, { useEffect, useState } from 'react'
import useAppStore from '../../store/useAppStore'

export default function ChatbotPanel() {
  const apiKeys = useAppStore(s => s.apiKeys)
  const [input, setInput] = useState('')
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true

  const send = () => {
    console.log('Chat input (phase1):', input)
    setInput('')
  }

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column', padding:12}}>
      <div style={{fontWeight:600}}>Assistant</div>
      {!apiKeys?.grok && <div style={{background:'#3a2a2a', padding:8, marginTop:8}}>No Grok API key set. Add one in settings.</div>}
      {!online && <div style={{background:'#3a2a2a', padding:8, marginTop:8}}>Offline mode. Assistant unavailable.</div>}
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)'}}>Ask anything about the problem...</div>
      <div style={{display:'flex', gap:8}}>
        <textarea value={input} onChange={e=>setInput(e.target.value)} style={{flex:1, height:48}} placeholder="Ask a question..." />
        <button onClick={send} disabled={!apiKeys?.grok || !online}>Send ➤</button>
      </div>
    </div>
  )
}
