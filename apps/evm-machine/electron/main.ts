import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    fullscreen: true, // Kiosk mode for EVM polling machine
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Hardware Handlers
ipcMain.handle('scan-fingerprint', async () => {
  // Simulating hardware fingerprint scan
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        template: Buffer.from(`EVM-FP-${Date.now()}`).toString('base64'),
      });
    }, 2000);
  });
});

ipcMain.handle('print-voter-slip', async (_, voteData) => {
  console.log('VVPAT Printer Output:', voteData);
  return { success: true, printedAt: new Date().toISOString() };
});
