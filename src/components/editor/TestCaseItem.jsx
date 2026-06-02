import React, { useState } from 'react'
import useTestCases from '../../hooks/useTestCases'
import useEditorStore from '../../store/useEditorStore'
import useAppStore from '../../store/useAppStore'

const path = window.require ? window.require('path') : { join: (...args) => args.join('/') }

export default function TestCaseItem({ tc, index }) {
  const { updateCase, deleteCase, cases, isRunning, setRunning, updateResult, clearResults, setCompilationError } = useTestCases()
  const { code, timeLimit, memoryLimit } = useEditorStore()
  const { workingDir, selectedProblem } = useAppStore()

  const runSingle = async () => {
    if (isRunning) return
    setRunning(true)
    clearResults() // or just clear this one if we want, but let's clear all for simplicity
    
    try {
      if (window.electronAPI) {
        await window.electronAPI.writeFile(
          path.join(workingDir, selectedProblem, 'solution.cpp'),
          code || ''
        )
      }

      const res = await fetch('http://127.0.0.1:8765/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code || '',
          testcases: [tc],
          timeLimit,
          memoryLimit
        })
      })
      const data = await res.json()
      
      if (data.compilationError) {
        setCompilationError(data.compilationError)
      } else {
        for (const resItem of data.results) {
          updateResult(resItem.id, resItem)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setRunning(false)
    }
  }

  const renderDiff = (expected, actual) => {
    const expLines = (expected || '').split('\n')
    const actLines = (actual || '').split('\n')
    const maxLen = Math.max(expLines.length, actLines.length)
    const out = []
    for (let i = 0; i < maxLen; i++) {
       const el = expLines[i] || ''
       const al = actLines[i] || ''
       if (el === al) {
          out.push(<div key={i} style={{color: 'var(--text-primary)'}}>{al}</div>)
       } else {
          out.push(<div key={i} style={{color: 'var(--error)'}}><del style={{opacity:0.6}}>{el}</del> <span>{al}</span></div>)
       }
    }
    return <div style={{fontFamily:'var(--font-mono)', fontSize:12}}>{out}</div>
  }

  const res = tc.result

  return (
    <div style={{display:'flex', flexDirection:'column', gap:10}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{fontWeight:600}}>{tc.label || `Case ${index+1}`}</div>
        <div style={{display:'flex', gap:8}}>
          <button onClick={runSingle} disabled={isRunning} className="btn-run" style={{padding:'4px 8px', fontSize:12}}>
            {isRunning ? '⟳' : '▶'}
          </button>
          <button onClick={() => deleteCase(tc.id)} disabled={cases.length <= 1} style={{padding:'4px 8px', background:'transparent', border:'1px solid var(--border)', borderRadius:4, color:'var(--text-muted)'}}>
            🗑
          </button>
        </div>
      </div>
      
      <div>
        <div style={{fontSize:12, color:'var(--text-muted)', marginBottom:4}}>Input</div>
        <textarea 
          value={tc.input} 
          onChange={e => updateCase(tc.id, { input: e.target.value })} 
          style={{width:'100%', height:80, background:'var(--bg-input)', border:'1px solid var(--border)', color:'var(--text-primary)', padding:8, borderRadius:4, fontFamily:'var(--font-mono)', resize:'vertical'}} 
        />
      </div>

      <div>
        <div style={{fontSize:12, color:'var(--text-muted)', marginBottom:4}}>Expected Output</div>
        <textarea 
          value={tc.expectedOutput} 
          onChange={e => updateCase(tc.id, { expectedOutput: e.target.value })} 
          style={{width:'100%', height:80, background:'var(--bg-input)', border:'1px solid var(--border)', color:'var(--text-primary)', padding:8, borderRadius:4, fontFamily:'var(--font-mono)', resize:'vertical'}} 
        />
      </div>

      {res && (
        <div style={{border:'1px solid var(--border)', borderRadius:6, padding:8, background:'var(--bg-base)'}}>
          <div style={{fontSize:12, color:'var(--text-muted)', marginBottom:4}}>Actual Output</div>
          
          {res.status === 'WA' ? (
            <div style={{background:'var(--bg-input)', padding:8, borderRadius:4, overflowX:'auto'}}>
              {renderDiff(tc.expectedOutput, res.stdout)}
            </div>
          ) : (
            <div style={{background:'var(--bg-input)', padding:8, borderRadius:4, fontFamily:'var(--font-mono)', fontSize:12, whiteSpace:'pre-wrap', overflowX:'auto'}}>
              {res.stdout || <em style={{color:'var(--text-muted)'}}>(no output)</em>}
            </div>
          )}

          {['TLE', 'MLE', 'RE'].includes(res.status) && res.stderr && (
            <div style={{marginTop:8}}>
              <div style={{fontSize:12, color:'var(--error)', marginBottom:4}}>Standard Error</div>
              <div style={{background:'var(--error-bg)', border:'1px solid var(--error-border)', color:'var(--error)', padding:8, borderRadius:4, fontFamily:'var(--font-mono)', fontSize:12, whiteSpace:'pre-wrap', overflowX:'auto'}}>
                {res.stderr}
              </div>
            </div>
          )}

          <div style={{display:'flex', gap:10, marginTop:10, alignItems:'center', fontSize:12, fontWeight:500}}>
            <span style={{color: res.status === 'AC' ? 'var(--success)' : (res.status === 'WA' || res.status === 'RE' ? 'var(--error)' : 'var(--warning)')}}>
              [{res.status === 'AC' ? ' AC ✓ ' : ` ${res.status} ` + (res.status==='WA'?'✗':res.status==='RE'?'💥':'⏱')} ]
            </span>
            <span style={{color:'var(--text-muted)'}}>{res.timeMs}ms</span>
            <span style={{color:'var(--text-muted)'}}>{(res.memoryKb / 1024).toFixed(1)} MB</span>
          </div>
        </div>
      )}
    </div>
  )
}
