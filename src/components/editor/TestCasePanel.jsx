import React, { useEffect } from 'react'
import TestCaseItem from './TestCaseItem'
import useTestCases from '../../hooks/useTestCases'

export default function TestCasePanel() {
  const { cases, addCase, activeTab, setActiveTab, compilationError } = useTestCases()

  useEffect(() => {
    if (!activeTab && cases.length > 0) {
      setActiveTab(cases[0].id)
    }
  }, [cases, activeTab, setActiveTab])

  const renderBadge = (status) => {
    if (!status) return null
    if (status === 'AC') return <span style={{color:'var(--success)', marginLeft:4}}>✓</span>
    if (status === 'WA') return <span style={{color:'var(--error)', marginLeft:4}}>✗</span>
    if (status === 'RE') return <span style={{color:'var(--error)', marginLeft:4}}>💥</span>
    return <span style={{color:'var(--warning)', marginLeft:4}}>⏱</span>
  }

  const activeTc = cases.find(c => c.id === activeTab)

  return (
    <div style={{height:'100%', padding:8, display:'flex', flexDirection:'column'}}>
      <div style={{display:'flex', gap:6, overflowX:'auto', marginBottom:12, paddingBottom:4}}>
        {compilationError && (
          <div 
            onClick={() => setActiveTab('compile')} 
            style={{
              padding: '6px 12px', 
              borderRadius: 16, 
              cursor: 'pointer', 
              fontSize: 12, 
              fontWeight: 500,
              whiteSpace: 'nowrap',
              background: activeTab === 'compile' ? 'var(--error-bg)' : 'rgba(239, 68, 68, 0.1)',
              color: 'var(--error)',
              border: `1px solid ${activeTab === 'compile' ? 'var(--error-border)' : 'transparent'}`
            }}
          >
            ⚠ Compile Error
          </div>
        )}
        
        {cases.map((tc, idx) => {
          const isActive = activeTab === tc.id
          let bg = 'var(--bg-input)'
          let color = 'var(--text-primary)'
          let border = 'transparent'
          
          if (tc.result?.status === 'AC') {
             color = 'var(--success)'
             bg = isActive ? 'var(--success-bg)' : 'rgba(16, 185, 129, 0.05)'
             border = isActive ? 'var(--success-border)' : 'transparent'
          } else if (tc.result?.status) {
             const isErr = ['WA', 'RE'].includes(tc.result.status)
             color = isErr ? 'var(--error)' : 'var(--warning)'
             bg = isActive ? (isErr ? 'var(--error-bg)' : 'var(--warning-bg)') : 'rgba(255,255,255,0.05)'
             border = isActive ? (isErr ? 'var(--error-border)' : 'var(--warning-border)') : 'transparent'
          } else if (isActive) {
             bg = 'var(--bg-hover)'
             border = 'var(--border)'
          }

          return (
            <div 
              key={tc.id} 
              onClick={() => setActiveTab(tc.id)}
              style={{
                padding: '6px 12px', 
                borderRadius: 16, 
                cursor: 'pointer', 
                fontSize: 12, 
                fontWeight: 500,
                whiteSpace: 'nowrap',
                background: bg,
                color: color,
                border: `1px solid ${border}`
              }}
            >
              Case {idx + 1} {renderBadge(tc.result?.status)}
            </div>
          )
        })}
        <button 
          onClick={addCase}
          style={{
            padding: '6px 12px',
            borderRadius: 16,
            background: 'var(--bg-input)',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          +
        </button>
      </div>

      <div style={{flex:1, overflow:'auto', paddingRight:4}}>
        {activeTab === 'compile' && compilationError ? (
          <div style={{ 
            background: 'rgba(127, 29, 29, 0.2)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: 8, 
            padding: 10, 
            fontFamily: 'var(--font-mono)', 
            fontSize: 12, 
            color: '#fca5a5', 
            whiteSpace: 'pre-wrap' 
          }}>
            <div style={{fontWeight:600, marginBottom:8}}>Compilation Error</div>
            {compilationError}
          </div>
        ) : activeTc ? (
          <TestCaseItem tc={activeTc} index={cases.findIndex(c => c.id === activeTab)} />
        ) : null}
      </div>
    </div>
  )
}
