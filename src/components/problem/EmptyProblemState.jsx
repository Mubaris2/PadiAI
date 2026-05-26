import React from 'react'
import useAppStore from '../../store/useAppStore'
import './EmptyProblemState.css'

export default function EmptyProblemState() {
  const setWorkingDir = useAppStore(s => s.setWorkingDir)

  const openFolder = async () => {
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
    <div className="empty-state">
      <div className="empty-icon">📁</div>
      <div className="empty-title">No working directory selected</div>
      <div className="empty-description">Select a folder to start solving problems</div>
      <button className="btn-empty" onClick={openFolder}>Open Folder</button>
    </div>
  )
}