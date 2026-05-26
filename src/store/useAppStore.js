import { create } from 'zustand'

const useAppStore = create((set) => ({
  workingDir: null,
  selectedProblem: null,
  sidebarOpen: false,
  apiKeys: { grok: null },
  problemData: null,
  problemList: [],
  backendReady: false,
  
  setWorkingDir: async (dir) => {
    set({ workingDir: dir })
    await window.electronAPI.settingsSet('workingDir', dir)
    try {
      const problems = await window.electronAPI.listProblems(dir)
      set({ problemList: problems })
    } catch (e) {
      console.error('Failed to list problems:', e)
    }
  },
  
  setSelectedProblem: (p) => set({ selectedProblem: p }),
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setProblemData: (d) => set({ problemData: d }),
  
  initWorkingDir: async () => {
    try {
      const saved = await window.electronAPI.settingsGet('workingDir')
      if (saved && typeof saved === 'string') {
        set({ workingDir: saved })
        const problems = await window.electronAPI.listProblems(saved)
        set({ problemList: problems })
      }
    } catch (e) {
      console.error('Failed to init working dir:', e)
    }
  },
  
  setBackendReady: (v) => set({ backendReady: v }),
  setProblemList: (list) => set({ problemList: list }),
}))

export default useAppStore
