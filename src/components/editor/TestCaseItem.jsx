import React, { useState } from 'react'
import useTestCases from '../../hooks/useTestCases'

export default function TestCaseItem({ tc }) {
  const { updateCase, deleteCase, cases } = useTestCases()
  const [output, setOutput] = useState(null)

  const run = () => {
    console.log('Run test case (Phase1):', tc)
    setOutput('Output: (phase1 - console only)')
  }

  return (
    <div style={{border:'1px solid var(--border)', padding:8, marginBottom:8, borderRadius:6}}>
      <div style={{display:'flex', justifyContent:'space-between'}}>
        <div>{tc.label || 'Case'}</div>
        <div>
          <button onClick={run}>▶</button>
          <button onClick={() => deleteCase(tc.id)} style={{marginLeft:8}} disabled={cases.length<=1}>🗑</button>
        </div>
      </div>
      <div style={{display:'flex', gap:8, marginTop:8}}>
        <textarea value={tc.input} onChange={e => updateCase(tc.id, { input: e.target.value })} style={{flex:1, height:80}} />
        <textarea value={tc.expectedOutput} onChange={e => updateCase(tc.id, { expectedOutput: e.target.value })} style={{flex:1, height:80}} />
      </div>
      {output && <div style={{marginTop:8}}>{output}</div>}
    </div>
  )
}
