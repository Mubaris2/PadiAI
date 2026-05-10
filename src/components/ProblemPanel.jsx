import React from 'react'

export default function ProblemPanel() {
  const handleOpen = async () => {
    try {
      const p = await window.electronAPI?.openDirectory()
      console.log('selected dir', p)
    } catch (e) {
      console.log('openDirectory not available', e)
    }
  }

  return (
    <div className="problem-empty">
      <div className="title">Agentic_CPH</div>
      <div className="subtitle">Your competitive programming mentor</div>
      <button className="accent-btn" onClick={handleOpen}>Open Working Directory</button>
    </div>
  )
}
