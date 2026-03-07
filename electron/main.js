const { app, BrowserWindow } = require('electron/main');
const path = require('node:path');
const { fork, execSync } = require('child_process');
const net = require('net');

let serverProcess;

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

function getAvailablePort(cb) {
  const server = net.createServer();
  server.listen(0, () => {
    const port = server.address().port;
    server.close(() => cb(port));
  });
}

app.whenReady().then(() => getAvailablePort(port => {
  // Start the Express server in a separate process
  serverProcess = fork(path.join(__dirname, 'server.js'), [`--port=${port}`]);

  // Set process priority to highest for main and child process
  try {
    if (process.platform === 'win32') {
      const pid = process.pid;
      execSync(`wmic process where processid=${pid} CALL setpriority "realtime"`); // Highest priority
      if (serverProcess && serverProcess.pid) {
        execSync(`wmic process where processid=${serverProcess.pid} CALL setpriority "realtime"`);
      }
    } else if (process.platform === 'linux' || process.platform === 'darwin') {
      process.setPriority && process.setPriority(-20); // -20 is highest, 0 is default
      if (serverProcess && serverProcess.pid) {
        try {
          process.kill(serverProcess.pid, 0); // Check if process exists
          process.setPriority(serverProcess.pid, -20);
        } catch (e) {
          console.warn('Could not set child process priority:', e.message);
        }
      }
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
    if (serverProcess) {
      serverProcess.kill();
    }
    app.quit();
  }
});