import React, { useEffect, useState, useRef } from 'react'
import useAppStore from '../../store/useAppStore'
import useEditorStore from '../../store/useEditorStore'
import useTestCases from '../../hooks/useTestCases'
import './ChatbotPanel.css'

export default function ChatbotPanel() {
  const apiKeys = useAppStore(s => s.apiKeys)
  const selectedProblem = useAppStore(s => s.selectedProblem)
  const workingDir = useAppStore(s => s.workingDir)
  const backendReady = useAppStore(s => s.backendReady)
  const code = useEditorStore(s => s.code)
  const { cases } = useTestCases()
  
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef(null)
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true

  useEffect(() => {
    setHistory([])
  }, [selectedProblem])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history, isLoading])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const userMsg = input.trim()
    setInput('')
    setHistory(h => [...h, { role: 'user', content: userMsg }])
    setIsLoading(true)
    
    try {
      const res = await fetch('http://127.0.0.1:8765/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: selectedProblem,
          workingDir: workingDir,
          userMessage: userMsg,
          currentCode: code || '',
          lastTestResults: cases || [], // cases contains results if executed
          chatHistory: history,
        }),
      })
      
      const data = await res.json()
      setHistory(h => [...h, { role: 'assistant', content: data.response }])
    } catch {
      setHistory(h => [...h, { role: 'assistant', content: 'Something went wrong. Check your API key and connection.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column', padding:12}}>
      <div style={{fontWeight:600, marginBottom: 8}}>Assistant</div>
      
      {!apiKeys?.grok && <div style={{background:'rgba(255, 70, 70, 0.1)', color: '#ff4646', padding:8, marginBottom:8, borderRadius: 4}}>No Grok API key set. Add one in settings.</div>}
      {!online && <div style={{background:'rgba(255, 180, 0, 0.1)', color: '#ffb400', padding:8, marginBottom:8, borderRadius: 4}}>Offline mode. Assistant unavailable.</div>}
      {!backendReady && <div style={{background:'rgba(56, 189, 248, 0.1)', color: 'var(--accent)', padding:8, marginBottom:8, borderRadius: 4}}>Backend not ready...</div>}
      
      <div className="panel-body chat-body scrollable" ref={scrollRef}>
        {history.length === 0 && (
          <p className="panel-empty">Ask anything about the current problem...</p>
        )}
        {history.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            <p className="chat-text">{msg.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="chat-bubble assistant">
            <p className="chat-text typing">Thinking...</p>
          </div>
        )}
      </div>

      <div className="panel-footer" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <textarea
          className="code-input"
          style={{ flex: 1, minHeight: 36, maxHeight: 80, resize: 'none' }}
          placeholder="Ask a question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={isLoading || !backendReady || !online}
        />
        <button
          className="primary"
          onClick={handleSend}
          disabled={isLoading || !input.trim() || !backendReady || !online}
          style={{ padding: '0 16px' }}
        >
          →
        </button>
      </div>
    </div>
  )
}
