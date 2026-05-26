import { create } from 'zustand'

const useEditorStore = create((set) => ({
  code: null,
  language: 'cpp',
  setCode: (c) => set({ code: c }),
}))

export default useEditorStore
