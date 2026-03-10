const { app, BrowserWindow } = require('electron/main');
const path = require('node:path');
const { execSync } = require('child_process');
const express = require('express');

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
    width: 800,
    height: 600,
    webPreferences: {
      devTools: false, // Disable dev tools
      nodeIntegration: false, // Disable node integration for security
      contextIsolation: true, // Enable context isolation
      backgroundThrottling: false, // Prevent background throttling
      sandbox: true // Enable sandbox for security
    },
    autoHideMenuBar: true, // Hide menu bar
    show: true,
    frame: true // Keep window frame for OS controls
  });
  window.setMenuBarVisibility(false);
  window.loadURL(`http://localhost:${port}`);

  // Remove window reference on close
  window.on('closed', () => {
    window = null;
  });
}

app.whenReady().then(() => createServer((port) => {
  // Set process priority to highest for main and child process
  try {
    if (process.platform === 'win32') {
      const pid = process.pid;
      execSync(`wmic process where processid=${pid} CALL setpriority "realtime"`); // Highest priority
    } else if (process.platform === 'linux' || process.platform === 'darwin') {
      process.setPriority && process.setPriority(-20); // -20 is highest, 0 is default
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