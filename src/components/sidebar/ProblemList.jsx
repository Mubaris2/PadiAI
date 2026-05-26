import React from 'react'
import useAppStore from '../../store/useAppStore'
import './ProblemList.css'

export default function ProblemList() {
  const workingDir = useAppStore(s => s.workingDir)
  const setWorkingDir = useAppStore(s => s.setWorkingDir)
  const problemList = useAppStore(s => s.problemList)
  const selectedProblem = useAppStore(s => s.selectedProblem)
  const setSelectedProblem = useAppStore(s => s.setSelectedProblem)

  const handleOpenDir = async () => {
    try {
      const result = await window.electronAPI.openDir()
      if (result && typeof result === 'string') {
        await setWorkingDir(result)
      }
    } catch (e) {
      console.error('Failed to open directory:', e)
    }
  }

  if (!workingDir) {
    return (
      <div className="problem-list-empty">
        <div className="empty-icon">📁</div>
        <div className="empty-text">No folder selected</div>
        <button onClick={handleOpenDir} className="btn-open-folder">
          Open Folder
        </button>
      </div>
    )
  }

  if (problemList.length === 0) {
    return (
      <div className="problem-list-empty">
        <div className="empty-icon">📋</div>
        <div className="empty-text">No problems yet</div>
        <div className="empty-subtext">Import a problem to get started</div>
      </div>
    )
  }

  return (
    <div className="problem-list">
      <div className="problem-count">{problemList.length} problem{problemList.length !== 1 ? 's' : ''}</div>
      <div className="problems">
        {problemList.map(problem => (
          <div
            key={problem.folder}
            className={`problem-item ${selectedProblem === problem.folder ? 'active' : ''}`}
            onClick={() => setSelectedProblem(problem.folder)}
          >
            <div className="problem-id">{problem.id}</div>
            <div className="problem-content">
              <div className="problem-title">{problem.title}</div>
              {problem.rating && (
                <div className="problem-rating">{problem.rating}</div>
              )}
            </div>
            {problem.tags && problem.tags.length > 0 && (
              <div className="problem-tags">
                {problem.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
                {problem.tags.length > 2 && (
                  <span className="tag-more">+{problem.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

