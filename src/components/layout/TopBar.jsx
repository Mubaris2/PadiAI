import React, { useState, useEffect, useCallback } from 'react'
import useAppStore from '../../store/useAppStore'
import ProblemPickerModal from '../modals/ProblemPickerModal'
import './TopBar.css'

export default function TopBar({ onToggleSidebar }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const workingDir = useAppStore(s => s.workingDir)
  const backendReady = useAppStore(s => s.backendReady)
  const setBackendReady = useAppStore(s => s.setBackendReady)
  const initWorkingDir = useAppStore(s => s.initWorkingDir)
  const initApiKeys = useAppStore(s => s.initApiKeys)
  const setWorkingDir = useAppStore(s => s.setWorkingDir)
  const BACKEND_URL = 'http://127.0.0.1:8765'

  const checkBackendHealth = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      const response = await fetch(`${BACKEND_URL}/health`, { signal: controller.signal })
      clearTimeout(timeoutId)
      setBackendReady(response.ok)
    } catch (e) {
      // Expected if backend isn't ready or times out
      setBackendReady(false)
    }
  }, [setBackendReady])

  // Initialize working dir, API keys, and check backend health
  useEffect(() => {
    initWorkingDir()
    initApiKeys()
    
    let intervalId
    // Give backend time to start (2 seconds), then start polling every 1 second
    const startupTimer = setTimeout(() => {
      checkBackendHealth()
      intervalId = setInterval(checkBackendHealth, 1000)
    }, 2000)

    return () => {
      clearTimeout(startupTimer)
      if (intervalId) clearInterval(intervalId)
    }
  }, [initWorkingDir, initApiKeys, checkBackendHealth])

  const handleSelectDir = async () => {
    try {
      const result = await window.electronAPI.openDir()
      if (result && typeof result === 'string') {
        await setWorkingDir(result)
      }
    } catch (e) {
      console.error('Failed to open directory:', e)
    }
  }

  return (
    <>
      <div className="topbar">
        <button 
          className="menu-btn"
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        <div className="topbar-title">PadiAI</div>

        <div className="topbar-spacer" />

        {!workingDir && (
          <button onClick={handleSelectDir} className="btn-topbar">
            📁 Open Folder
          </button>
        )}

        {workingDir && (
          <>
            <div className="working-dir-label" title={workingDir}>
              📁 {workingDir.split('/').pop() || workingDir}
            </div>

            <button 
              className="btn-topbar"
              title="Select a different working directory"
              onClick={handleSelectDir}
            >
              Change
            </button>
          </>
        )}

        <div className="topbar-divider" />

        <div className={`backend-indicator ${backendReady ? 'ready' : 'starting'}`} title={backendReady ? 'Backend Ready' : 'Starting Backend...'}>
          <span className="indicator-dot" />
          {backendReady ? 'Ready' : 'Starting...'}
        </div>

        <button 
          className="btn-topbar add-problem-btn"
          onClick={() => setPickerOpen(true)}
          disabled={!workingDir || !backendReady}
          title={!workingDir ? 'Select a working directory first' : !backendReady ? 'Backend starting...' : 'Add problem from Codeforces'}
        >
          + Add Problem
        </button>
      </div>

      <ProblemPickerModal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  )
}

