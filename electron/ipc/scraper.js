const { BrowserWindow, ipcMain } = require('electron');

const CF_URL_PRIMARY = (contestId, index) =>
  `https://codeforces.com/problemset/problem/${contestId}/${index}`;

const CF_URL_FALLBACK = (contestId, index) =>
  `https://codeforces.com/contest/${contestId}/problem/${index}`;

const POLL_TIMEOUT_MS = 15000;   // 15 seconds max wait
const POLL_INTERVAL_MS = 500;    // check every 500ms

ipcMain.handle('scraper:fetchProblem', async (_, { contestId, index }) => {
  const urls = [
    CF_URL_PRIMARY(contestId, index),
    CF_URL_FALLBACK(contestId, index),
  ];

  for (const url of urls) {
    const result = await attemptScrape(url);
    if (result.success) return result;
  }

  return { success: false, error: 'Failed on both URL formats. Cloudflare may have blocked the request.' };
});

async function attemptScrape(url) {
  return new Promise((resolve) => {
    let win = new BrowserWindow({
      show: false,
      width: 1280,
      height: 800,
      webPreferences: {
        javascript: true,
        images: false,
        webSecurity: true,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    let settled = false;

    const cleanup = () => {
      if (!win.isDestroyed()) win.destroy();
      win = null;
    };

    const fail = (reason) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ success: false, error: reason });
    };

    const succeed = (html) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ success: true, html, url });
    };

    // Hard timeout
    const hardTimeout = setTimeout(() => {
      fail(`Timed out after ${POLL_TIMEOUT_MS / 1000}s waiting for .problem-statement`);
    }, POLL_TIMEOUT_MS);

    win.loadURL(url, {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });

    // Poll for .problem-statement element
    const poll = setInterval(async () => {
      if (!win || win.isDestroyed()) {
        clearInterval(poll);
        clearTimeout(hardTimeout);
        return;
      }

      if (win.webContents.isLoading()) {
        return; // wait until navigation finishes
      }

      try {
        const html = await win.webContents.executeJavaScript(`
          (function() {
            const el = document.querySelector('.problem-statement');
            return el ? el.innerHTML : null;
          })()
        `);

        if (html) {
          clearInterval(poll);
          clearTimeout(hardTimeout);
          succeed(html);
        }
      } catch (err) {
        // Page still loading or JS error, keep polling
      }
    }, POLL_INTERVAL_MS);

    win.webContents.on('did-fail-load', (_, errorCode, errorDesc) => {
      clearInterval(poll);
      clearTimeout(hardTimeout);
      fail(`Page failed to load: ${errorDesc} (${errorCode})`);
    });
  });
}
