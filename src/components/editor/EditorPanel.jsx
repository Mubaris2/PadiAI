import React, { useEffect, useState } from 'react'
import MonacoEditor from './MonacoEditor'
import TestCasePanel from './TestCasePanel'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'
import useTestCases from '../../hooks/useTestCases'
import useEditorStore from '../../store/useEditorStore'
import useAppStore from '../../store/useAppStore'

const path = window.require ? window.require('path') : { join: (...args) => args.join('/') }

export default function EditorPanel() {
  const [sizes, setSizes] = useState([70,30])
  const { cases, isRunning, setRunning, updateResult, clearResults, setCompilationError } = useTestCases()
  const { code, timeLimit, memoryLimit } = useEditorStore()
  const { workingDir, selectedProblem } = useAppStore()

  useEffect(()=>{
    if (window.electronAPI) {
      window.electronAPI.settingsGet('ui.panelSizes').then(s => {
        if (s && s.panelSizes && s.panelSizes.editorSplit) setSizes(s.panelSizes.editorSplit)
      })
    }
  }, [])

  const onLayout = (layout) => {
    let values = []
    if (Array.isArray(layout)) values = layout
    else if (layout && typeof layout === 'object') values = Object.values(layout)
    const editorSplit = values.map(n => Math.round(n))
    setSizes(editorSplit)
    if (window.electronAPI) {
      window.electronAPI.settingsGet('ui.panelSizes').then(existing => {
        const out = { ...existing?.panelSizes, editorSplit }
        window.electronAPI.settingsSet('ui.panelSizes', { panelSizes: out })
      })
    }
  }

  const runAll = async () => {
    if (isRunning) return
    setRunning(true)
    clearResults()
    
    try {
      if (window.electronAPI && workingDir && selectedProblem) {
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
          testcases: cases,
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

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div className="panel-header" style={{height:32, display:'flex', alignItems:'center', justifyContent:'space-between', padding: '0 8px'}}>
        <div style={{fontSize:12, fontWeight:600, color:'var(--text-secondary)'}}>C++17</div>
        <button 
          className="btn-run" 
          onClick={runAll} 
          disabled={isRunning}
          style={{
            background: isRunning ? 'var(--text-muted)' : 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 600,
            cursor: isRunning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          {isRunning ? '⟳ Running...' : '▶ Run All'}
        </button>
      </div>
      <div style={{flex:1, display:'flex', flexDirection:'column'}}>
        <PanelGroup orientation="vertical" onLayoutChange={onLayout} onLayoutChanged={onLayout} style={{display:'flex', flex:1}}>
          <Panel defaultSize={sizes[0]} minSize={"40%"}>
            <div style={{height:'100%'}} className="code-area">
              <MonacoEditor />
            </div>
          </Panel>
          <PanelResizeHandle className="resize-handle horizontal" />
          <Panel defaultSize={sizes[1]} minSize={"20%"}>
            <div style={{height:'100%', borderTop:'1px solid var(--border)'}}>
              <TestCasePanel />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
