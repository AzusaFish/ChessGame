const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let bridgeProc = null;
let pendingResolvers = [];

function startBridge() {
  let exe;
  if (app.isPackaged) {
    exe = path.join(process.resourcesPath, 'Bridge.exe');
  } else {
    exe = path.join(__dirname, 'Bridge.exe');
  }
  
  console.log('Starting Bridge executable at', exe);
  if (!fs.existsSync(exe)) {
    console.error('Bridge executable not found at:', exe);
    return;
  }

  bridgeProc = spawn(exe, [], { stdio: ['pipe', 'pipe', 'pipe'] });
  bridgeProc.stdout.setEncoding('utf8');

  let buf = '';
  bridgeProc.stdout.on('data', (chunk) => {
    console.log('Bridge stdout chunk:', chunk.toString?.() || chunk);
    buf += chunk;
    let idx;
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (line.startsWith('bestmove ')) {
        const parts = line.split(/\s+/);
        const move = parts[1] || '(none)';
        const resolver = pendingResolvers.shift();
        if (resolver) resolver(move);
      }
    }
  });

  bridgeProc.stderr.on('data', (d) => {
    console.error('Bridge stderr:', d.toString());
  });

  bridgeProc.on('exit', (code) => {
    console.log('Bridge exited', code);
    bridgeProc = null;
    // reject any pending
    while (pendingResolvers.length) {
      const r = pendingResolvers.shift();
      r(null);
    }
  });
}

ipcMain.handle('get-best-move', async (event, fen, movetimeMs) => {
  console.log('IPC get-best-move called', movetimeMs, fen.substring(0,40));
  if (!bridgeProc) startBridge();
  return new Promise((resolve) => {
    pendingResolvers.push((move) => resolve(move));
    try {
      console.log('Writing to Bridge stdin: bestmove', movetimeMs);
      bridgeProc.stdin.write(`bestmove ${movetimeMs} ${fen}\n`);
    } catch (e) {
      console.error('Failed to write to Bridge stdin', e);
      // try to restart
      bridgeProc = null;
      resolve(null);
    }
  });
});

ipcMain.handle('set-option', async (event, name, value) => {
  console.log('IPC set-option called', name, value);
  if (!bridgeProc) startBridge();
  try {
    bridgeProc.stdin.write(`setoption name ${name} value ${value}\n`);
  } catch (e) {
    console.error('Failed to write setoption to Bridge', e);
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 780,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (app.isPackaged) {
    // When packaged, the renderer is in dist/index.html relative to this file
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    console.log('Loading index file:', indexPath);
    win.loadFile(indexPath);
  } else {
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
