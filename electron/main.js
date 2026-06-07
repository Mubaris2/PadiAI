const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')
const Store = require('electron-store')

function writePadiConfig(data) {
  const configDir = path.join(os.homedir(), '.padiai');
  const configPath = path.join(configDir, 'config.json');
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(configPath, 'utf-8')); } catch {}
  
  const updated = { ...existing, ...data };
  fs.writeFileSync(configPath, JSON.stringify(updated, null, 2));
}

const store = new Store({
  defaults: {
    workingDir: null,
    apiKeys: { grok: null },
    user: { handle: null },
    editor: { fontSize: 14, tabSize: 4, wordWrap: false },
  },
})

let backendProcess = null

function startBackend() {
  try {
    const backendPath = path.join(__dirname, '../backend')
    const venvPython = path.join(__dirname, '../.venv/bin/python')
    
    // Check if backend path exists
    if (!fs.existsSync(backendPath)) {
      console.error('[backend] path does not exist:', backendPath)
      return
    }
    
    console.log('[backend] ====== BACKEND STARTUP ======')
    console.log('[backend] path:', backendPath)
    console.log('[backend] checking main.py exists...')
    
    if (!fs.existsSync(path.join(backendPath, 'main.py'))) {
      console.error('[backend] main.py not found in', backendPath)
      return
    }
    console.log('[backend] ✓ main.py found')
    
    console.log('[backend] checking venv python...')
    const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3'
    console.log('[backend] using python:', pythonCmd)
    console.log('[backend] spawning: uvicorn main:app --port 8765 --host 127.0.0.1')
    
    backendProcess = spawn(pythonCmd, ['-m', 'uvicorn', 'main:app', '--port', '8765', '--host', '127.0.0.1'], {
      cwd: backendPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    })

    backendProcess.stdout.on('data', (data) => {
      const message = data.toString().trim()
      if (message) console.log('[backend stdout]', message)
    })
    
    backendProcess.stderr.on('data', (data) => {
      const message = data.toString().trim()
      if (message) console.error('[backend stderr]', message)
    })
    
    backendProcess.on('error', (err) => {
      console.error('[backend] spawn error:', err.message)
      console.error('[backend] code:', err.code)
      console.error('[backend] errno:', err.errno)
      console.error('[backend] trying fallback: python -m uvicorn main:app ...')
      
      try {
        backendProcess = spawn('python', ['-m', 'uvicorn', 'main:app', '--port', '8765', '--host', '127.0.0.1'], {
          cwd: backendPath,
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: true,
          env: { ...process.env, PYTHONUNBUFFERED: '1' },
        })
        backendProcess.stdout.on('data', (d) => {
          const msg = d.toString().trim()
          if (msg) console.log('[backend stdout]', msg)
        })
        backendProcess.stderr.on('data', (d) => {
          const msg = d.toString().trim()
          if (msg) console.error('[backend stderr]', msg)
        })
      } catch (e2) {
        console.error('[backend] python fallback failed:', e2.message)
      }
    })
    
    backendProcess.on('exit', (code, signal) => {
      console.log('[backend] exited with code:', code, 'signal:', signal)
    })
    
    console.log('[backend] ====== BACKEND STARTED ======')
  } catch (e) {
    console.error('[backend] startup exception:', e.message)
    console.error('[backend] stack:', e.stack)
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: '#0d0d0d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL || (!app.isPackaged ? 'http://localhost:5173' : null)
  if (devUrl) {
    win.loadURL(devUrl)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

function registerIPC() {
  ipcMain.handle('dialog:openDir', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Working Directory',
    })
    if (result.canceled || !result.filePaths.length) return null
    return result.filePaths[0]
  })

  ipcMain.handle('fs:listProblems', async (event, dirPath) => {
    if (!dirPath) return []
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
      const problems = []
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const metaPath = path.join(dirPath, entry.name, 'problem.json')
        try {
          const raw = await fs.promises.readFile(metaPath, 'utf-8')
          const meta = JSON.parse(raw)
          problems.push({
            folder: entry.name,
            id: meta.id,
            title: meta.title,
            rating: meta.rating,
            tags: meta.tags,
          })
        } catch {
          // folder exists but no problem.json yet, skip
        }
      }
      return problems
    } catch (e) {
      return []
    }
  })

  ipcMain.handle('fs:readFile', async (event, filePath) => {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8')
      return { ok: true, content }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  })

  ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
    try {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
      await fs.promises.writeFile(filePath, content, 'utf8')
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  })

  ipcMain.handle('fs:ensureDir', async (event, dirPath) => {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  })

  ipcMain.handle('settings:get', (event, key) => {
    return store.get(key)
  })

  ipcMain.handle('settings:set', (event, key, value) => {
    store.set(key, value)
    
    if (key === 'workingDir') {
      writePadiConfig({ workingDir: value })
    } else if (key === 'apiKeys.grok') {
      writePadiConfig({ grokApiKey: value })
    } else if (key === 'apiKeys' && value && value.grok !== undefined) {
      writePadiConfig({ grokApiKey: value.grok })
    }
    
    return { ok: true }
  })

  ipcMain.handle('shell:openExternal', async (event, url) => {
    try {
      await shell.openExternal(url)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  })
}

app.whenReady().then(() => {
  startBackend()
  registerIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill()
  }
})
