const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')
const { fork } = require('child_process');

let serverProcess;

function createWindow () {
  window = new BrowserWindow({ width: 800, height: 600 })
  //disable developer tools, header, and menu
  window.setMenuBarVisibility(false);
  //window.webContents.openDevTools({ mode: 'detach' });
  window.loadURL('http://localhost:3000')

  window.on('closed', () => {
    window = null
  })
}


app.whenReady().then(() => {
  // Start the Express server in a separate process
  serverProcess = fork(path.join(__dirname, 'server.js'));
  // Wait a moment for the server to start, then create the window
  setTimeout(() => {
    createWindow();
  }, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) {
      serverProcess.kill();
    }
    app.quit()
  }
})