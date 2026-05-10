const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let backendProcess = null

function spawnBackend() {
  try {
    backendProcess = spawn('uvicorn', ['main:app', '--port', '8000'], {
      cwd: path.join(__dirname, '..', 'backend'),
      stdio: 'inherit',
    })
    backendProcess.on('exit', (code) => console.log('backend exited', code))
  } catch (e) {
    console.error('Failed to spawn backend process', e)
    backendProcess = null
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })

  const indexPath = path.join(__dirname, '..', 'index.html')
  const VITE_URL = 'http://localhost:5173'

  // Prefer dev server if available (vite). Fallback to built index.html.
  win.loadURL(VITE_URL).catch(() => {})
  // If dev server is not running, load the static html after a short delay
  setTimeout(() => {
    try {
      const current = win.webContents.getURL() || ''
      if (!current.startsWith('http')) {
        win.loadFile(indexPath)
      }
    } catch (e) {
      try { win.loadFile(indexPath) } catch (err) { win.loadURL('data:text/html,<title>Agentic_CPH</title>') }
    }
  }, 400)
}

app.whenReady().then(() => {
  spawnBackend()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  const selected = result.filePaths?.[0] ?? null
  console.log('dialog:openDirectory ->', selected)
  return selected
})

const API_BASE = 'http://localhost:8000'

async function forwardJSON(method, url, body) {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    return await res.json()
  } catch (e) {
    console.error('forwardJSON error', e)
    throw e
  }
}

ipcMain.handle('llm:call', async (_, payload) => forwardJSON('POST', '/llm/hint', payload))
ipcMain.handle('llm:interrupt', async (_, payload) => forwardJSON('POST', '/llm/interrupt', payload))

ipcMain.handle('users:get', async () => forwardJSON('GET', '/users/'))
ipcMain.handle('users:create', async (_, payload) => forwardJSON('POST', '/users/', payload))

ipcMain.handle('problems:get', async () => forwardJSON('GET', '/problems/'))
ipcMain.handle('problems:create', async (_, payload) => forwardJSON('POST', '/problems/', payload))

ipcMain.handle('settings:get', async () => forwardJSON('GET', '/settings/'))
ipcMain.handle('settings:save', async (_, payload) => forwardJSON('POST', '/settings/', payload))

app.on('quit', () => {
  if (backendProcess) {
    try {
      backendProcess.kill()
    } catch (e) {
      console.error('Failed to kill backend', e)
    }
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
