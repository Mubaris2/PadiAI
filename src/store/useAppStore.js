import create from 'zustand'

const useAppStore = create((set) => ({
  workingDir: null,
  selectedProblem: null,
  sidebarOpen: false,
  apiKeys: { grok: null },
  problemData: null,
  setWorkingDir: (dir) => set({ workingDir: dir }),
  setSelectedProblem: (p) => set({ selectedProblem: p }),
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setProblemData: (d) => set({ problemData: d }),
}))

export default useAppStore
