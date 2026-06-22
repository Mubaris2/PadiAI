import React from 'react'
import useAppStore from '../../store/useAppStore'
import { useScraping } from '../../context/ScrapingContext'
import './ProblemList.css'

function parseIdParts(id) {
  const match = id.match(/^(\d+)([A-Z]+\d?)$/);
  return match ? [parseInt(match[1]), match[2]] : [null, null];
}

function ScrapeStatusDot({ status }) {
  if (!status || status === 'ready') return null;

  const config = {
    pending:  { color: '#64748b', label: 'Queued',    pulse: false },
    fetching: { color: '#38bdf8', label: 'Fetching',  pulse: true  },
    parsing:  { color: '#818cf8', label: 'Parsing',   pulse: true  },
    failed:   { color: '#f87171', label: 'Failed',    pulse: false },
  };

  const c = config[status];
  if (!c) return null;

  return (
    <span
      title={c.label}
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: c.color,
        flexShrink: 0,
        animation: c.pulse ? 'pulse-glow 1.4s ease-in-out infinite' : 'none',
        display: 'inline-block',
        marginRight: 6,
      }}
    />
  );
}

export default function ProblemList() {
  const workingDir = useAppStore(s => s.workingDir)
  const setWorkingDir = useAppStore(s => s.setWorkingDir)
  const problemList = useAppStore(s => s.problemList)
  const selectedProblem = useAppStore(s => s.selectedProblem)
  const setSelectedProblem = useAppStore(s => s.setSelectedProblem)
  const { scrapeStatuses, retryOne } = useScraping()

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
            <div style={{display: 'flex', alignItems: 'center'}}>
              <ScrapeStatusDot status={scrapeStatuses[problem.id]} />
              <div className="problem-id">{problem.id}</div>
            </div>
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
            {scrapeStatuses[problem.id] === 'failed' && (
              <button
                className="link-button"
                title="Retry fetch"
                style={{marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171'}}
                onClick={(e) => {
                  e.stopPropagation();
                  const [contestId, index] = parseIdParts(problem.id);
                  retryOne(problem.id, contestId, index);
                }}
              >
                ↺
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

