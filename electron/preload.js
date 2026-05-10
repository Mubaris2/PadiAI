const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  // Forwarding helpers for renderer to call backend via main process
  llmCall: (payload) => ipcRenderer.invoke('llm:call', payload),
  llmInterrupt: (payload) => ipcRenderer.invoke('llm:interrupt', payload),
  getUsers: () => ipcRenderer.invoke('users:get'),
  createUser: (payload) => ipcRenderer.invoke('users:create', payload),
  getProblems: () => ipcRenderer.invoke('problems:get'),
  saveProblem: (payload) => ipcRenderer.invoke('problems:create', payload),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (payload) => ipcRenderer.invoke('settings:save', payload),
})
