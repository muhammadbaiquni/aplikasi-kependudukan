import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { app, BrowserWindow, Menu } from 'electron';
import './database.js';

let mainWindow = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.ELECTRON_DEV === '1' || process.env.NODE_ENV === 'development';
const devServerUrl = process.env.ELECTRON_DEV_SERVER_URL || 'http://localhost:5173';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: path.join(__dirname, '../build/icon.ico')
  });

  if (isDev) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (!fs.existsSync(indexPath)) {
      console.error('Build output not found. Run npm run build first.');
    }
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  Menu.setApplicationMenu(null);
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
