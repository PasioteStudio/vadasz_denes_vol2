const { app, BrowserWindow } = require('electron/main');
const { session } = require('electron');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const express = require('express');

app.setPath('userData', path.join(os.tmpdir(), 'vadasz-temp'));

app.commandLine.appendSwitch('disable-http-cache');

const nodejsApp = express();

nodejsApp.use(express.static(__dirname));

nodejsApp.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function createServer(callback) {  
  const server = nodejsApp.listen(0, () => {
    callback(server.address().port);
  });
}

let window = null;
function createWindowWithPort(port) {
  window = new BrowserWindow({
    title: "Vadász Dénes",
    webPreferences: {
      devTools: false,
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'temporary',
      backgroundThrottling: false,
      sandbox: true
    },
    autoHideMenuBar: true,
    show: true,
    frame: true,
  });
  window.setMenuBarVisibility(false);
  window.loadURL(`http://localhost:${port}`);

  window.on('closed', () => {
    window = null;
  });

  window.maximize();
}

app.commandLine.appendSwitch('--force_high_performance_gpu');

app.whenReady().then(() => createServer(async(port) => {
  await session.defaultSession.clearCache();
  await session.defaultSession.clearStorageData();
  try {
    if (process.platform === 'win32') {
      const pid = process.pid;
      execSync(`wmic process where processid=${pid} CALL setpriority "realtime"`);
    } else if (process.platform === 'linux' || process.platform === 'darwin') {
      process.setPriority && process.setPriority(-20);
    }
  } catch (e) {
    console.warn('Could not set process priority:', e.message);
  }

  createWindowWithPort(port);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindowWithPort(port);
    }
  });
}));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});