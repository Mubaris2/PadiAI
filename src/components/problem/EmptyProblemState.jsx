import React from 'react'

export default function EmptyProblemState() {
  const openFolder = async () => {
    const res = await window.electronAPI.openDir()
    if (res && res.filePaths && res.filePaths[0]) {
      const dir = res.filePaths[0]
      await window.electronAPI.settingsSet('workingDir', dir)
      window.location.reload()
    }
  }

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text-muted)'}}>
      <div style={{fontSize:48}}>📁</div>
      <div style={{fontSize:18, marginTop:8}}>No working directory selected</div>
      <div style={{marginTop:6}}>Select a folder to start solving problems</div>
      <button onClick={openFolder} style={{marginTop:12, background:'var(--accent)', border:'none', padding:'8px 12px'}}>Open Folder</button>
    </div>
  )
}
