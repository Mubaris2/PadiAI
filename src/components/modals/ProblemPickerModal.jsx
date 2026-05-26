import React, { useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
import useAppStore from '../../store/useAppStore'
import './ProblemPickerModal.css'

export default function ProblemPickerModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('search')
  const [searchInput, setSearchInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedProblems, setSelectedProblems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detectedUrl, setDetectedUrl] = useState('')
  const workingDir = useAppStore(s => s.workingDir)
  const setProblemList = useAppStore(s => s.setProblemList)
  const setSelectedProblem = useAppStore(s => s.setSelectedProblem)
  const BACKEND_URL = 'http://127.0.0.1:8765'

  const parseCode = (input) => {
    const cleaned = input.replace(/\s/g, '').toUpperCase()
    const match = cleaned.match(/^(\d+)([A-Z]+\d?)$/)
    return match ? { contestId: parseInt(match[1]), index: match[2] } : null
  }

  const parseUrl = (url) => {
    const match = url.match(/codeforces\.com\/(?:problemset\/problem|contest\/\d+\/problem)\/(\d+)\/([A-Z]+\d?)/i)
    return match ? { contestId: parseInt(match[1]), index: match[2].toUpperCase() } : null
  }

  useEffect(() => {
    if (tab === 'paste') {
      const parsed = parseUrl(urlInput)
      setDetectedUrl(parsed ? `Detected: ${parsed.contestId}${parsed.index}` : '')
    }
  }, [urlInput, tab])

  const handleSearch = async () => {
    setError('')
    setSearchResults([])
    
    let parsed
    if (tab === 'search') {
      parsed = parseCode(searchInput)
      if (!parsed) {
        setError('Invalid format. Use problem code like 1234A')
        return
      }
    } else {
      parsed = parseUrl(urlInput)
      if (!parsed) {
        setError('Invalid URL. Use a valid Codeforces problem URL')
        return
      }
    }

    setLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/cf/search?contest_id=${parsed.contestId}&index=${parsed.index}`)
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      setSearchResults(data.results || [])
      if (data.error) setError(data.error)
    } catch (e) {
      setError('Failed to search: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleResult = (result) => {
    const id = result.id
    setSelectedProblems(prev => 
      prev.find(p => p.id === id)
        ? prev.filter(p => p.id !== id)
        : [...prev, result]
    )
  }

  const handleRemoveSelected = (id) => {
    setSelectedProblems(prev => prev.filter(p => p.id !== id))
  }

  const handleImport = async () => {
    if (!workingDir || selectedProblems.length === 0) return

    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${BACKEND_URL}/cf/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problems: selectedProblems.map(p => ({
            contestId: p.contestId,
            index: p.index,
          })),
          workingDir: workingDir,
        }),
      })
      if (!response.ok) throw new Error('Import failed')
      const data = await response.json()
      
      if (data.errors && data.errors.length > 0) {
        setError('Errors: ' + data.errors.join(', '))
      }

      // Refresh problem list
      const problems = await window.electronAPI.listProblems(workingDir)
      setProblemList(problems)

      // Auto-select first imported problem
      if (data.imported && data.imported.length > 0) {
        const folderName = data.imported[0]
        setSelectedProblem(folderName)
      }

      onClose()
    } catch (e) {
      setError('Import failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="problem-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Problem from Codeforces</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${tab === 'search' ? 'active' : ''}`}
            onClick={() => { setTab('search'); setSearchResults([]); setError('') }}
          >
            Search by Code
          </button>
          <button 
            className={`tab ${tab === 'paste' ? 'active' : ''}`}
            onClick={() => { setTab('paste'); setSearchResults([]); setError('') }}
          >
            Paste URL
          </button>
          <button 
            className="tab coming-soon"
            title="Coming soon"
          >
            Browse
            <span className="badge">Coming Soon</span>
          </button>
        </div>

        <div className="tab-content">
          {tab === 'search' && (
            <div className="search-tab">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="e.g. 1234A or 1234 A"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch} disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          )}

          {tab === 'paste' && (
            <div className="paste-tab">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="https://codeforces.com/problemset/problem/1234/A"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                {detectedUrl && <div className="detected">{detectedUrl}</div>}
                <button onClick={handleSearch} disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          )}

          {error && <div className="error-msg">{error}</div>}

          <div className="results-list">
            {searchResults.map(result => (
              <div key={result.id} className="result-card">
                <label className="result-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedProblems.some(p => p.id === result.id)}
                    onChange={() => handleToggleResult(result)}
                  />
                </label>
                <div className="result-info">
                  <div className="result-title">
                    <strong>{result.id}</strong> — {result.title}
                    {result.rating && <span className="rating-badge">{result.rating}</span>}
                  </div>
                  <div className="result-meta">
                    {result.tags && result.tags.length > 0 && (
                      <>tags: {result.tags.join(', ')}</>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedProblems.length > 0 && (
          <div className="preview-section">
            <h3>Selected for Import ({selectedProblems.length})</h3>
            <div className="preview-list">
              {selectedProblems.map(prob => (
                <div key={prob.id} className="preview-item">
                  <div className="preview-info">
                    <strong>{prob.id}</strong> — {prob.title}
                    {prob.rating && <span className="rating-badge">{prob.rating}</span>}
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveSelected(prob.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleImport}
            disabled={selectedProblems.length === 0 || loading}
          >
            Import {selectedProblems.length > 0 ? selectedProblems.length : ''} Problem{selectedProblems.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
