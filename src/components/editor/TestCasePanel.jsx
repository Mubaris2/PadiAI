import React from 'react'
import TestCaseItem from './TestCaseItem'
import useTestCases from '../../hooks/useTestCases'

export default function TestCasePanel() {
  const { cases, addCase } = useTestCases()
  return (
    <div style={{height:'100%', padding:8, display:'flex', flexDirection:'column'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
        <div>Test Cases</div>
        <button onClick={addCase}>Add +</button>
      </div>
      <div style={{overflow:'auto'}}>
        {cases.map(tc => <TestCaseItem key={tc.id} tc={tc} />)}
      </div>
    </div>
  )
}
