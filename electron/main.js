const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
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

// ---------------------------------------------------------------------------
// Auto-updater (content updates)
// Downloads ecr-app.zip from the newest GitHub release (published by the
// workflow), unpacks it into the user-data folder and loads it on next start.
// Teacher data is not touched. Changes to main.js/preload.js still need a new
// installer, but screen/grade-logic changes arrive automatically.
// ---------------------------------------------------------------------------
const GH_REPO = 'juliuscelio-del/gnhs-ecr';   // <-- owner/repo on GitHub
const ASSET = 'ecr-app.zip';
const upDir = () => path.join(app.getPath('userData'), 'www-update');
const pendDir = () => path.join(app.getPath('userData'), 'www-pending');

function cmpVer(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map(Number);
  const pb = String(b).replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d; }
  return 0;
}
function readVer(dir) {
  try { return fs.readFileSync(path.join(dir, '.version'), 'utf8').trim(); } catch (e) { return null; }
}
// Move a finished download into place (done at startup, before any window opens).
function applyPendingUpdate() {
  try {
    if (fs.existsSync(pendDir())) {
      fs.rmSync(upDir(), { recursive: true, force: true });
      fs.renameSync(pendDir(), upDir());
    }
  } catch (e) { /* keep running on the bundled version */ }
}
// Folder the app loads from: the downloaded update if newer than the installed build.
function wwwRoot() {
  const v = readVer(upDir());
  if (v && cmpVer(v, app.getVersion()) > 0 && fs.existsSync(path.join(upDir(), 'index.html'))) return upDir();
  return path.join(__dirname, 'www');
}
function currentVersion() {
  const cands = [app.getVersion(), readVer(upDir()), readVer(pendDir())].filter(Boolean);
  return cands.reduce((a, b) => (cmpVer(b, a) > 0 ? b : a));
}
const box = (opts) => (win && !win.isDestroyed() ? dialog.showMessageBox(win, opts) : dialog.showMessageBox(opts));

let checking = false;
async function checkForUpdates(manual) {
  if (checking) return;
  checking = true;
  try {
    // /releases/latest redirects to /releases/tag/vX.Y.Z (no API rate limit)
    const r = await fetch(`https://github.com/${GH_REPO}/releases/latest`, { redirect: 'manual', headers: { 'User-Agent': 'GNHS-ECR' } });
    const loc = r.headers.get('location') || '';
    const m = loc.match(/\/tag\/v?([0-9.]+)$/);
    if (!m) throw new Error('Could not find the latest release');
    const latest = m[1];
    const current = currentVersion();
    if (cmpVer(latest, current) <= 0) {
      if (manual) await box({ type: 'info', message: 'You are up to date.', detail: 'Version ' + current });
      return;
    }
    const zr = await fetch(`https://github.com/${GH_REPO}/releases/download/v${latest}/${ASSET}`, { headers: { 'User-Agent': 'GNHS-ECR' } });
    if (!zr.ok) throw new Error('Download failed (' + zr.status + ')');
    const buf = Buffer.from(await zr.arrayBuffer());

    const AdmZip = require('adm-zip');
    const tmp = pendDir() + '.tmp';
    fs.rmSync(tmp, { recursive: true, force: true });
    new AdmZip(buf).extractAllTo(tmp, true);
    if (!fs.existsSync(path.join(tmp, 'index.html'))) throw new Error('Update package is invalid');
    fs.writeFileSync(path.join(tmp, '.version'), latest);
    fs.rmSync(pendDir(), { recursive: true, force: true });
    fs.renameSync(tmp, pendDir());

    const res = await box({
      type: 'info', buttons: ['Restart now', 'Later'], defaultId: 0, cancelId: 1,
      message: 'GNHS ECR ' + latest + ' is ready.',
      detail: 'Restart to finish updating. Your class records are kept.',
    });
    if (res.response === 0) { app.relaunch(); app.quit(); }
  } catch (e) {
    if (manual) await box({ type: 'warning', message: 'Could not check for updates.', detail: String(e.message || e) });
  } finally {
    checking = false;
  }
}

function createWindow() {
  win = new BrowserWindow({
    show: false, width: 1280, height: 800, autoHideMenuBar: true, title: 'GNHS ECR',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(wwwRoot(), 'index.html'));
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
    { label: 'Help', submenu: [
      { label: 'GNHS ECR v' + currentVersion(), enabled: false },
      { label: 'Check for updates…', click: () => checkForUpdates(true) },
    ] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  applyPendingUpdate();
  buildMenu();
  createWindow();
  setTimeout(() => checkForUpdates(false), 8000);
});
app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) { closing = false; createWindow(); } });
