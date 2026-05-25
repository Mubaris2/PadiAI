import React, { useEffect, useState } from 'react'
import MonacoEditor from './MonacoEditor'
import TestCasePanel from './TestCasePanel'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'

export default function EditorPanel() {
  const [sizes, setSizes] = useState([70,30])

  useEffect(()=>{
    window.electronAPI.settingsGet('ui.panelSizes').then(s => {
      if (s && s.panelSizes && s.panelSizes.editorSplit) setSizes(s.panelSizes.editorSplit)
    })
  }, [])

  const onLayout = (layout) => {
    let values = []
    if (Array.isArray(layout)) values = layout
    else if (layout && typeof layout === 'object') values = Object.values(layout)
    const editorSplit = values.map(n => Math.round(n))
    setSizes(editorSplit)
    window.electronAPI.settingsGet('ui.panelSizes').then(existing => {
      const out = { ...existing?.panelSizes, editorSplit }
      window.electronAPI.settingsSet('ui.panelSizes', { panelSizes: out })
    })
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div className="panel-header" style={{height:32, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{fontSize:12}}>C++17</div>
        <button className="btn-run">Run All ▶</button>
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
