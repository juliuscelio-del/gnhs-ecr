const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Optional licence module. Put a license.js next to this file exporting:
//   { getMachineId(): string, check(): {activated, owner?, machineId}, activate(code, owner): {ok, error?} }
// If it is missing, the app runs without the activation screen.
let license = null;
try { license = require('./license.js'); } catch (e) { /* no licence module */ }

const dataFile = () => path.join(app.getPath('userData'), 'ecr-data.json');
function writeAtomic(json) {
  const tmp = dataFile() + '.tmp';
  fs.writeFileSync(tmp, json, 'utf8');
  fs.renameSync(tmp, dataFile());
}

ipcMain.handle('ecr:read-data', () => {
  try { return fs.readFileSync(dataFile(), 'utf8'); } catch (e) { return null; }
});
ipcMain.handle('ecr:write-data', (_e, json) => { writeAtomic(String(json)); return true; });
ipcMain.on('ecr:write-data-sync', (e, json) => {
  try { writeAtomic(String(json)); e.returnValue = true; } catch (err) { e.returnValue = false; }
});

ipcMain.on('ecr:has-license', (e) => { e.returnValue = !!license; });
ipcMain.handle('ecr:check-license', () => license.check());
ipcMain.handle('ecr:machine-id', () => license.getMachineId());
ipcMain.handle('ecr:activate-license', (_e, code, owner) => license.activate(code, owner));

let win = null;
let closing = false;

function createWindow() {
  win = new BrowserWindow({
    show: false, width: 1280, height: 800, autoHideMenuBar: true, title: 'GNHS ECR',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'www', 'index.html'));
  win.once('ready-to-show', () => { win.maximize(); win.show(); });

  // Before closing, ask the page to write a final backup; wait up to 3 s.
  win.on('close', (ev) => {
    if (closing) return;
    ev.preventDefault();
    closing = true;
    const finish = () => { if (win && !win.isDestroyed()) win.destroy(); };
    const timer = setTimeout(finish, 3000);
    ipcMain.once('ecr:save-done', () => { clearTimeout(timer); finish(); });
    try { win.webContents.send('ecr:final-save'); } catch (e) { clearTimeout(timer); finish(); }
  });
  win.on('closed', () => { win = null; });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'editMenu' },
    ...(isMac ? [{ role: 'windowMenu' }] : []),
    { label: 'Help', submenu: [{ label: 'GNHS ECR v' + app.getVersion(), enabled: false }] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => { buildMenu(); createWindow(); });
app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) { closing = false; createWindow(); } });
