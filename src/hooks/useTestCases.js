import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

// Lightweight local hook; in a fuller app this would be a store
export default function useTestCases() {
  const [cases, setCases] = useState([{
    id: uuidv4(), label: 'Example 1', input: '', expectedOutput: '', result: null
  }])

  const addCase = () => setCases(c => [...c, { id: uuidv4(), label: `Case ${c.length+1}`, input: '', expectedOutput: '', result: null }])
  const updateCase = (id, patch) => setCases(c => c.map(x => x.id === id ? {...x, ...patch} : x))
  const deleteCase = (id) => setCases(c => c.length>1 ? c.filter(x => x.id !== id) : c)

  return { cases, addCase, updateCase, deleteCase }
}
