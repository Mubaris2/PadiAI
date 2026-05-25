import React, { useEffect, useState } from 'react'
import EditorPanel from '../editor/EditorPanel'
import ProblemPanel from '../problem/ProblemPanel'
import ChatbotPanel from '../chatbot/ChatbotPanel'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'

export default function MainLayout() {
  const [sizes, setSizes] = useState({ mainSplit: [50,50], rightSplit: [50,50] })

  useEffect(() => {
    window.electronAPI.settingsGet('ui.panelSizes').then(s => {
      if (s && s.panelSizes) setSizes(s.panelSizes)
    })
  }, [])

  const onMainLayout = (layout) => {
    let values = []
    if (Array.isArray(layout)) values = layout
    else if (layout && typeof layout === 'object') values = Object.values(layout)
    const mainSplit = values.map(n => Math.round(n))
    const merged = { ...sizes, mainSplit }
    setSizes(merged)
    window.electronAPI.settingsGet('ui.panelSizes').then(existing => {
      const out = { ...existing?.panelSizes, ...merged }
      window.electronAPI.settingsSet('ui.panelSizes', { panelSizes: out })
    })
  }

  const onRightLayout = (layout) => {
    let values = []
    if (Array.isArray(layout)) values = layout
    else if (layout && typeof layout === 'object') values = Object.values(layout)
    const rightSplit = values.map(n => Math.round(n))
    const merged = { ...sizes, rightSplit }
    setSizes(merged)
    window.electronAPI.settingsGet('ui.panelSizes').then(existing => {
      const out = { ...existing?.panelSizes, ...merged }
      window.electronAPI.settingsSet('ui.panelSizes', { panelSizes: out })
    })
  }

  return (
    <div style={{height:'calc(100vh - 40px)'}}>
      <PanelGroup orientation="horizontal" onLayoutChange={onMainLayout} onLayoutChanged={onMainLayout} style={{height:'100%', display:'flex'}}>
        <Panel defaultSize={sizes.mainSplit[0]} minSize={"30%"}>
          <div style={{height:'100%', borderRight:'1px solid var(--border)', background:'var(--bg-panel)'}}>
            <EditorPanel />
          </div>
        </Panel>
        <PanelResizeHandle className="resize-handle vertical" />
        <Panel defaultSize={sizes.mainSplit[1]} minSize={"30%"}>
          <div style={{height:'100%', display:'flex', flexDirection:'column', background:'var(--bg-panel)'}}>
            <PanelGroup orientation="vertical" onLayoutChange={onRightLayout} onLayoutChanged={onRightLayout} style={{height:'100%'}}>
              <Panel defaultSize={sizes.rightSplit[0]} minSize={"30%"}>
                <div style={{height:'100%', borderBottom:'1px solid var(--border)'}}>
                  <ProblemPanel />
                </div>
              </Panel>
              <PanelResizeHandle className="resize-handle horizontal" />
              <Panel defaultSize={sizes.rightSplit[1]} minSize={"30%"}>
                <div style={{height:'100%'}}>
                  <ChatbotPanel />
                </div>
              </Panel>
            </PanelGroup>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  )
}
