// Provide a safe fallback for window.electronAPI when running the renderer in a browser (Vite dev)
if (typeof window !== 'undefined' && !window.electronAPI) {
  window.electronAPI = {
    openDir: async () => ({ canceled: true }),
    listProblems: async () => [],
    readFile: async (filePath) => ({ ok: false, error: 'not available in browser' }),
    writeFile: async (filePath, content) => ({ ok: false, error: 'not available in browser' }),
    ensureDir: async (dirPath) => ({ ok: false, error: 'not available in browser' }),
    settingsGet: async (key) => {
      try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) : null
      } catch (e) {
        return localStorage.getItem(key)
      }
    },
    settingsSet: async (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        return { ok: true }
      } catch (e) {
        return { ok: false, error: String(e) }
      }
    },
  }
}
