import React from 'react'

export default function TestCasePanel() {
  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',justifyContent:'flex-end',color:'var(--muted)',fontSize:12}}>Run</div>
      <div className="testcase-grid">
        <div className="card" style={{flex:1}}>
          <div className="label">Expected Output</div>
          <div className="content">(placeholder) Expected output will appear here.</div>
        </div>
        <div className="card" style={{flex:1}}>
          <div className="label">Custom Input</div>
          <textarea className="textarea" placeholder="Enter custom input" />
        </div>
      </div>
    </div>
  )
}
