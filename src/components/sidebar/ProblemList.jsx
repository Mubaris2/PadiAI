import React, { useEffect, useState } from 'react'
import useAppStore from '../../store/useAppStore'

export default function ProblemList() {
  const [problems, setProblems] = useState([])
  const workingDir = useAppStore(s => s.workingDir)
  const setWorkingDir = useAppStore(s => s.setWorkingDir)
  const selectedProblem = useAppStore(s => s.selectedProblem)
  const setSelectedProblem = useAppStore(s => s.setSelectedProblem)

  useEffect(() => {
    async function load() {
      const wd = await window.electronAPI.settingsGet('workingDir')
      setWorkingDir(wd)
      if (wd) {
        const res = await window.electronAPI.listProblems(wd)
        setProblems(res || [])
      }
    }
    load()
  }, [])

  if (!workingDir) return (
    <div style={{padding:12}}>
      <div>No folder selected</div>
      <button onClick={async ()=>{
        const res = await window.electronAPI.openDir()
        if (res?.filePaths?.[0]) {
          await window.electronAPI.settingsSet('workingDir', res.filePaths[0])
          window.location.reload()
        }
      }}>Open Folder</button>
    </div>
  )

  return (
    <div>
      <div style={{marginBottom:8}}> {problems.length} problems</div>
      <div>
        {problems.map(p => (
          <div key={p} onClick={() => setSelectedProblem(p)} style={{padding:8, borderLeft: selectedProblem===p ? '4px solid var(--accent)' : '4px solid transparent', cursor:'pointer'}}>
            {p}
          </div>
        ))}
      </div>
    </div>
  )
}
