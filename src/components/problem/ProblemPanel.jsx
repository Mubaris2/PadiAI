import React, { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import EmptyProblemState from './EmptyProblemState'
import ProblemSection from './ProblemSection'
import useAppStore from '../../store/useAppStore'
import useEditorStore from '../../store/useEditorStore'
import { parseConstraints } from '../../utils/parseConstraints'
import './ProblemPanel.css'

export default function ProblemPanel() {
  const workingDir = useAppStore(s => s.workingDir)
  const selectedProblem = useAppStore(s => s.selectedProblem)
  const [problemData, setProblemData] = useState(null)
  const [isParsing, setIsParsing] = useState(false)
  const setLimits = useEditorStore(s => s.setLimits)
  const { startTracking, stopTracking, resetTime, activeTimeSeconds } = useEditorStore()

  const openExternal = async (url) => {
    if (window.electronAPI) {
      await window.electronAPI.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  useEffect(() => {
    if (!workingDir) return
    if (!selectedProblem) {
      setProblemData(null)
      stopTracking()
      return
    }

    startTracking()

    const loadProblem = async () => {
      const p = `${workingDir}/${selectedProblem}/problem.json`
      const res = await window.electronAPI.readFile(p)
      if (!res.ok) return
      
      let parsed;
      try {
        parsed = JSON.parse(res.content)
        ;['statement','constraints','others'].forEach(k => {
          if (typeof parsed[k] === 'string') parsed[k] = DOMPurify.sanitize(parsed[k])
        })
        if (Array.isArray(parsed.examples)) {
          parsed.examples = parsed.examples.map(ex => ({
            input: DOMPurify.sanitize(ex.input || ''),
            output: DOMPurify.sanitize(ex.output || ''),
            note: ex.note ? DOMPurify.sanitize(ex.note) : ''
          }))
        } else if (typeof parsed.examples === 'string') {
          parsed.examples = DOMPurify.sanitize(parsed.examples)
        }
        setProblemData(parsed)
        if (parsed.constraints && typeof parsed.constraints === 'string') {
           const { timeLimit, memoryLimit } = parseConstraints(parsed.constraints)
           setLimits(timeLimit, memoryLimit)
        }
      } catch (e) {
        console.warn('failed parse problem.json', e)
        return
      }

      // Mark attempted
      if (!parsed.attemptedSession) {
        try {
          await fetch('http://localhost:8765/agent/mark-attempted', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ problemId: selectedProblem, workingDir: workingDir })
          })
          parsed.attemptedSession = true
        } catch (e) {
          console.warn('Failed to mark attempted', e)
        }
      }

      if (parsed.statementPlaceholder === true || !parsed.llmSummary) {
        setIsParsing(true)
        try {
          const apiRes = await fetch('http://localhost:8765/agent/parse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ problemId: selectedProblem, workingDir: workingDir })
          })
          if (apiRes.ok) {
            const reloadRes = await window.electronAPI.readFile(p)
            if (reloadRes.ok) {
              const reloaded = JSON.parse(reloadRes.content)
              ;['statement','constraints','others'].forEach(k => {
                if (typeof reloaded[k] === 'string') reloaded[k] = DOMPurify.sanitize(reloaded[k])
              })
              if (Array.isArray(reloaded.examples)) {
                reloaded.examples = reloaded.examples.map(ex => ({
                  input: DOMPurify.sanitize(ex.input || ''),
                  output: DOMPurify.sanitize(ex.output || ''),
                  note: ex.note ? DOMPurify.sanitize(ex.note) : ''
                }))
              } else if (typeof reloaded.examples === 'string') {
                reloaded.examples = DOMPurify.sanitize(reloaded.examples)
              }
              setProblemData(reloaded)
              if (reloaded.constraints && typeof reloaded.constraints === 'string') {
                 const { timeLimit, memoryLimit } = parseConstraints(reloaded.constraints)
                 setLimits(timeLimit, memoryLimit)
              }
            }
          }
        } catch (e) {
          console.warn('Agent parse skipped or failed:', e)
        } finally {
          setIsParsing(false)
        }
      }
    }

    loadProblem()

    return () => {
      // Send tracked time on unmount or problem switch
      if (activeTimeSeconds > 0) {
        fetch('http://localhost:8765/agent/track-time', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemId: selectedProblem, workingDir: workingDir, seconds: useEditorStore.getState().activeTimeSeconds })
        }).catch(console.warn)
      }
      stopTracking()
      resetTime()
    }
  }, [workingDir, selectedProblem, setLimits])

  const handleMarkSolved = async () => {
    try {
      await fetch('http://localhost:8765/agent/track-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: selectedProblem, workingDir: workingDir, seconds: activeTimeSeconds })
      })
      await fetch('http://localhost:8765/agent/mark-solved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: selectedProblem, workingDir: workingDir })
      })
      setProblemData(prev => ({...prev, solvedAt: Date.now()}))
      resetTime()
      startTracking()
    } catch (e) {
      console.warn('Failed to mark solved', e)
    }
  }

  const isSolved = !!problemData?.solvedAt

  const renderPlaceholder = () => (
    <div className="placeholder-content">
      <div className="placeholder-icon">📄</div>
      <div className="placeholder-text">Problem statement not yet available.</div>
      {problemData?.url && (
        <button 
          className="btn-open-codeforces"
          onClick={() => openExternal(problemData.url)}
        >
          Open on Codeforces ↗
        </button>
      )}
    </div>
  )

  if (!workingDir) return <EmptyProblemState />
  if (!selectedProblem) return <div className="problem-panel-select">Select a problem from the sidebar</div>

  return (
    <div className="problem-panel">
      {problemData?.statementPlaceholder ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
            <button
              className="primary"
              onClick={handleMarkSolved}
              disabled={isSolved}
            >
              {isSolved ? "✓ Solved" : "Mark Solved"}
            </button>
          </div>
          <ProblemSection 
            title={
              <div style={{display:'flex', alignItems:'center'}}>
                Statement
                {isParsing && <span className="analysis-badge">Analyzing...</span>}
              </div>
            } 
            defaultOpen={true}
          >
            {renderPlaceholder()}
          </ProblemSection>
          <ProblemSection title="Constraints" defaultOpen={true}>
            {renderPlaceholder()}
          </ProblemSection>
          <ProblemSection title="Examples" defaultOpen={true}>
            {renderPlaceholder()}
          </ProblemSection>
          <ProblemSection title="Others" defaultOpen={false}>
            <div className="placeholder-content">
              <div className="placeholder-text">Images and attachments will appear here</div>
            </div>
          </ProblemSection>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
            <button
              className="primary"
              onClick={handleMarkSolved}
              disabled={isSolved}
            >
              {isSolved ? "✓ Solved" : "Mark Solved"}
            </button>
          </div>
          <ProblemSection 
            title={
              <div style={{display:'flex', alignItems:'center'}}>
                Statement
                {isParsing && <span className="analysis-badge">Analyzing...</span>}
              </div>
            } 
            defaultOpen={true}
          >
            <div dangerouslySetInnerHTML={{__html: problemData?.statement || '<p>No statement</p>'}} />
          </ProblemSection>
          <ProblemSection title="Constraints" defaultOpen={true}>
            <div dangerouslySetInnerHTML={{__html: problemData?.constraints || ''}} />
          </ProblemSection>
          <ProblemSection title="Examples" defaultOpen={true}>
            {Array.isArray(problemData?.examples) ? (
              problemData.examples.map((ex, idx) => (
                <div key={idx} className="example-card">
                  <div className="example-card-section">
                    <div className="example-card-title">Input</div>
                    <pre className="example-card-content" dangerouslySetInnerHTML={{__html: ex.input}} />
                  </div>
                  <div className="example-card-section">
                    <div className="example-card-title">Output</div>
                    <pre className="example-card-content" dangerouslySetInnerHTML={{__html: ex.output}} />
                  </div>
                  {ex.note && (
                    <div className="example-card-section">
                      <div className="example-card-title">Note</div>
                      <div className="example-card-note" dangerouslySetInnerHTML={{__html: ex.note}} />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div dangerouslySetInnerHTML={{__html: problemData?.examples || ''}} />
            )}
          </ProblemSection>
          <ProblemSection title="Others" defaultOpen={false}>
            <div>{problemData?.others || 'Images and attachments will appear here'}</div>
          </ProblemSection>
        </>
      )}
    </div>
  )
}
