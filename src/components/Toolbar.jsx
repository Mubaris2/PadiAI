import React from 'react'

export default function Toolbar({ onToggleDrawer }) {
  return (
    <div className="toolbar">
      <div className="left">
        <select defaultValue="cpp" aria-label="Language selector">
          <option value="cpp">C++</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>
        <button className="icon-btn" onClick={onToggleDrawer} aria-label="Toggle drawer">☰</button>
      </div>
      <div className="spacer" />
      <div>
        <button disabled>Run</button>
      </div>
    </div>
  )
}
