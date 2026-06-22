const { contextBridge, ipcRenderer } = require('electron')

const channels = [
  'dialog:openDir',
  'fs:listProblems',
  'fs:readFile',
  'fs:writeFile',
  'fs:ensureDir',
  'settings:get',
  'settings:set',
  'shell:openExternal',
]

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args)

const electronAPI = {}
channels.forEach(ch => {
  electronAPI[ch.replace(/[:]/g, '_')] = (...args) => invoke(ch, ...args)
})

// also expose a convenience wrapper
contextBridge.exposeInMainWorld('electronAPI', {
  openDir: () => invoke('dialog:openDir'),
  listProblems: (workingDir) => invoke('fs:listProblems', workingDir),
  readFile: (filePath) => invoke('fs:readFile', filePath),
  writeFile: (filePath, content) => invoke('fs:writeFile', filePath, content),
  ensureDir: (dirPath) => invoke('fs:ensureDir', dirPath),
  settingsGet: (key) => invoke('settings:get', key),
  settingsSet: (key, value) => invoke('settings:set', key, value),
  openExternal: (url) => invoke('shell:openExternal', url),
  fetchProblem: (contestId, index) => invoke('scraper:fetchProblem', { contestId, index }),
})

