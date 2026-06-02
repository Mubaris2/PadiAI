import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

const useTestCases = create((set) => ({
  cases: [{
    id: uuidv4(), label: 'Example 1', input: '', expectedOutput: '', result: null
  }],
  isRunning: false,
  compilationError: null,
  activeTab: null, // will hold the id of active tab

  setActiveTab: (tabId) => set({ activeTab: tabId }),
  setCases: (newCases) => set({ cases: newCases }),
  addCase: () => set(state => ({
    cases: [...state.cases, { id: uuidv4(), label: `Case ${state.cases.length+1}`, input: '', expectedOutput: '', result: null }]
  })),
  updateCase: (id, patch) => set(state => ({
    cases: state.cases.map(x => x.id === id ? {...x, ...patch} : x)
  })),
  deleteCase: (id) => set(state => ({
    cases: state.cases.length > 1 ? state.cases.filter(x => x.id !== id) : state.cases
  })),
  
  setRunning: (v) => set({ isRunning: v }),
  setCompilationError: (err) => set({ compilationError: err, activeTab: 'compile' }),
  updateResult: (id, result) => set(state => ({
    cases: state.cases.map(tc => tc.id === id ? { ...tc, result } : tc)
  })),
  clearResults: () => set(state => ({
    cases: state.cases.map(tc => ({ ...tc, result: null })),
    compilationError: null,
  })),
}))

export default useTestCases
