import React from 'react'
import Toolbar from '../components/Toolbar'
import EditorPanel from '../components/EditorPanel'
import TestCasePanel from '../components/TestCasePanel'
import ProblemPanel from '../components/ProblemPanel'
import ChatbotPanel from '../components/ChatbotPanel'

export default function MainLayout({ onToggleDrawer }) {
  return (
    <div className="main-layout">
      <div className="pane left-pane pane left">
        <Toolbar onToggleDrawer={onToggleDrawer} />
        <div className="editor-panel">
          <EditorPanel />
        </div>
        <div className="testcase-panel">
          <TestCasePanel />
        </div>
      </div>

      <div className="pane right-pane pane right">
        <div className="problem-panel">
          <ProblemPanel />
        </div>
        <div className="chatbot-panel">
          <ChatbotPanel />
        </div>
      </div>
    </div>
  )
}
