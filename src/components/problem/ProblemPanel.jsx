import React, { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'
import EmptyProblemState from './EmptyProblemState'
import ProblemSection from './ProblemSection'
import useAppStore from '../../store/useAppStore'

export default function ProblemPanel() {
  const workingDir = useAppStore(s => s.workingDir)
  const selectedProblem = useAppStore(s => s.selectedProblem)
  const [problemData, setProblemData] = useState(null)

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
      } catch (e) {
        console.warn('failed parse problem.json', e)
      }
    })
  }, [workingDir, selectedProblem])

  if (!workingDir) return <EmptyProblemState />
  if (!selectedProblem) return <div style={{padding:16, color:'var(--text-muted)'}}>Select a problem from the sidebar</div>

  return (
    <div style={{padding:12, overflow:'auto'}}>
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
    </div>
  )
}
