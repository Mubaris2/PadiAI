import { create } from 'zustand'

const useEditorStore = create((set) => ({
  code: null,
  language: 'cpp',
  setCode: (c) => set({ code: c }),
  timeLimit: 2.0,
  memoryLimit: 256,
  setLimits: (t, m) => set({ timeLimit: t, memoryLimit: m }),
}))

export default useEditorStore
