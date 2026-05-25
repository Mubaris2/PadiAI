const path = require('path')
const fs = require('fs')
const extract = require('extract-zip')
const { downloadArtifact } = require('@electron/get')

async function run() {
  const electronPkg = require('../node_modules/electron/package.json')
  const checksums = require('../node_modules/electron/checksums.json')
  const version = electronPkg.version
  const platform = process.platform
  const arch = process.arch

  console.log('downloadElectron', { version, platform, arch })
  try {
    const zipPath = await downloadArtifact({ version, artifactName: 'electron', checksums, platform, arch })
    console.log('downloaded to', zipPath)
    const distPath = path.join(__dirname, '..', 'node_modules', 'electron', 'dist')
    await extract(zipPath, { dir: distPath })
    // write path.txt
    const platformPath = platform === 'win32' ? 'electron.exe' : (platform === 'darwin' ? 'Electron.app/Contents/MacOS/Electron' : 'electron')
    fs.writeFileSync(path.join(__dirname, '..', 'node_modules', 'electron', 'path.txt'), platformPath)
    console.log('extracted to', distPath)
  } catch (e) {
    console.error('failed', e)
    process.exit(1)
  }
}

run()
