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
  const setLimits = useEditorStore(s => s.setLimits)

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
      return
    }
    const p = `${workingDir}/${selectedProblem}/problem.json`
    window.electronAPI.readFile(p).then(res => {
      if (!res.ok) return
      try {
        const parsed = JSON.parse(res.content)
        ;['statement','constraints','examples','others'].forEach(k => {
          if (parsed[k]) parsed[k] = DOMPurify.sanitize(parsed[k])
        })
        setProblemData(parsed)
        if (parsed.constraints) {
           const { timeLimit, memoryLimit } = parseConstraints(parsed.constraints)
           setLimits(timeLimit, memoryLimit)
        }
      } catch (e) {
        console.warn('failed parse problem.json', e)
      }
    })
  }, [workingDir, selectedProblem, setLimits])

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
          <ProblemSection title="Statement" defaultOpen={true}>
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
          <ProblemSection title="Statement" defaultOpen={true}>
            <div dangerouslySetInnerHTML={{__html: problemData?.statement || '<p>No statement</p>'}} />
          </ProblemSection>
          <ProblemSection title="Constraints" defaultOpen={true}>
            <div dangerouslySetInnerHTML={{__html: problemData?.constraints || ''}} />
          </ProblemSection>
          <ProblemSection title="Examples" defaultOpen={true}>
            <div dangerouslySetInnerHTML={{__html: problemData?.examples || ''}} />
          </ProblemSection>
          <ProblemSection title="Others" defaultOpen={false}>
            <div>{problemData?.others || 'Images and attachments will appear here'}</div>
          </ProblemSection>
        </>
      )}
    </div>
  )
}
