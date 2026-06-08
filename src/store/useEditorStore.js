import { create } from 'zustand'

const useEditorStore = create((set) => ({
  code: null,
  language: 'cpp',
  setCode: (c) => set({ code: c }),
  timeLimit: 2.0,
  memoryLimit: 256,
  setLimits: (t, m) => set({ timeLimit: t, memoryLimit: m }),
  
  activeTimeSeconds: 0,
  lastKeystrokeAt: null,
  trackingInterval: null,

  startTracking: () => {
    const interval = setInterval(() => {
      const store = useEditorStore.getState();
      if (!store.lastKeystrokeAt) return;
      const idleMs = Date.now() - store.lastKeystrokeAt;
      if (idleMs < 5 * 60 * 1000) {  // less than 5 min idle
        useEditorStore.setState(s => ({ activeTimeSeconds: s.activeTimeSeconds + 1 }));
      }
    }, 1000);
    set({ trackingInterval: interval });
  },

  recordKeystroke: () => set({ lastKeystrokeAt: Date.now() }),

  stopTracking: () => {
    const { trackingInterval } = useEditorStore.getState();
    if (trackingInterval) clearInterval(trackingInterval);
    set({ trackingInterval: null });
  },

  resetTime: () => set({ activeTimeSeconds: 0, lastKeystrokeAt: null }),
}))

export default useEditorStore
