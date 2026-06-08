import React, { useEffect, useState, useRef } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import useEditorStore from '../../store/useEditorStore'
import useAppStore from '../../store/useAppStore'

const DEFAULT_CODE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // your code here
    
    return 0;
}
`

export default function MonacoEditor() {
  const monaco = useMonaco()
  const code = useEditorStore(state => state.code)
  const setCode = useEditorStore(state => state.setCode)
  const recordKeystroke = useEditorStore(state => state.recordKeystroke)
  const workingDir = useAppStore(state => state.workingDir)
  const selectedProblem = useAppStore(state => state.selectedProblem)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('padiai-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#1a1a1a',
          'editor.foreground': '#e6eef8',
          'editorLineNumber.foreground': '#9fb0c8',
          'editorLineNumber.activeForeground': '#e6eef8'
        }
      })
    }
  }, [monaco])

  const handleChange = (value) => {
    setCode(value)
    recordKeystroke()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (workingDir && selectedProblem) {
        const filePath = `${workingDir}/${selectedProblem}/solution.cpp`
        window.electronAPI.writeFile(filePath, value).then(res => console.log('autosave', res))
      }
    }, 1000)
  }

  return (
    <Editor
      height="100%"
      defaultLanguage="cpp"
      defaultValue={DEFAULT_CODE}
      language="cpp"
      theme="padiai-dark"
      value={code || DEFAULT_CODE}
      onChange={handleChange}
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        lineNumbers: 'on',
        folding: true,
        wordWrap: 'off',
        cursorBlinking: 'smooth',
        renderLineHighlight: 'line'
      }}
    />
  )
}
