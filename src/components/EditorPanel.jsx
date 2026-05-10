import React from 'react'
import Editor from '@monaco-editor/react'

export default function EditorPanel() {
  return (
    <div style={{height:'100%',width:'100%'}}>
      <Editor
        height="100%"
        defaultLanguage="cpp"
        theme="vs-dark"
        defaultValue={"// Select a problem to start\n"}
        options={{fontFamily: 'monospace', minimap: { enabled: false }}}
      />
    </div>
  )
}
