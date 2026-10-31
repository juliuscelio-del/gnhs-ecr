// Exposes window.electronAPI to the class-record page (see src/legacy/scripts/51 and 52).
const { contextBridge, ipcRenderer } = require('electron');

const api = {
  // --- file backup (used by the "ECR Bridge" in the app) ---
  readData: () => ipcRenderer.invoke('ecr:read-data'),
  writeData: (json) => ipcRenderer.invoke('ecr:write-data', json),
  writeDataSync: (json) => ipcRenderer.sendSync('ecr:write-data-sync', json),
  // main asks the page to save before the window closes; the page answers with saveDone()
  onFinalSave: (cb) => ipcRenderer.on('ecr:final-save', () => cb()),
  saveDone: () => ipcRenderer.send('ecr:save-done'),
};

// Auto-update (used by the update banner inside the page)
api.checkUpdate = () => ipcRenderer.invoke('ecr:check-update');
api.installUpdate = (version) => ipcRenderer.invoke('ecr:install-update', version);
api.restartApp = () => ipcRenderer.invoke('ecr:restart');

// Licence functions are only exposed when a licence module is installed (see main.js).
// Without them the page skips the activation screen.
if (ipcRenderer.sendSync('ecr:has-license')) {
  api.checkLicense = () => ipcRenderer.invoke('ecr:check-license');
  api.getMachineId = () => ipcRenderer.invoke('ecr:machine-id');
  api.activateLicense = (code, owner) => ipcRenderer.invoke('ecr:activate-license', code, owner);
}

contextBridge.exposeInMainWorld('electronAPI', api);
