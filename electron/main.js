const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const Store = require('electron-store')

const store = new Store({
  defaults: {
    workingDir: null,
    apiKeys: { grok: null },
    user: { handle: null },
    editor: { fontSize: 14, tabSize: 4, wordWrap: false },
  },
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0d0d0d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    win.loadURL(devUrl)
    //win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

function registerIPC() {
  ipcMain.handle('dialog:openDir', async () => {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return res
  })

  ipcMain.handle('fs:listProblems', async (event, workingDir) => {
    if (!workingDir) return []
    try {
      const items = await fs.promises.readdir(workingDir, { withFileTypes: true })
      return items.filter(d => d.isDirectory()).map(d => d.name)
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
    return { ok: true }
  })
}

app.whenReady().then(() => {
  registerIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
