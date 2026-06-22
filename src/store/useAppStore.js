import { create } from 'zustand'

const useAppStore = create((set) => ({
  workingDir: null,
  selectedProblem: null,
  sidebarOpen: false,
  apiKeys: { grok: null },
  problemData: null,
  problemList: [],
  backendReady: false,
  toasts: [],
  
  addToast: (message, type = 'error') => set(s => ({
    toasts: [...s.toasts, { id: Date.now(), message, type }]
  })),
  
  removeToast: (id) => set(s => ({
    toasts: s.toasts.filter(t => t.id !== id)
  })),
  
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
  
  setGrokApiKey: async (key) => {
    set((state) => ({ apiKeys: { ...state.apiKeys, grok: key } }))
    await window.electronAPI.settingsSet('apiKeys.grok', key)
  },

  initApiKeys: async () => {
    try {
      const savedGrok = await window.electronAPI.settingsGet('apiKeys.grok')
      if (savedGrok) {
        set((state) => ({ apiKeys: { ...state.apiKeys, grok: savedGrok } }))
      }
    } catch (e) {
      console.error('Failed to init api keys:', e)
    }
  },
  
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
