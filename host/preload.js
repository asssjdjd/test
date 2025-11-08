// preload.js (SIÊU ĐƠN GIẢN)

const { contextBridge, ipcRenderer, desktopCapturer } = require('electron');

// Chỉ expose những gì cần thiết cho Electron
contextBridge.exposeInMainWorld('electronAPI', {
    sendControl: (command) => ipcRenderer.send('control', command),
    quitApp: () => ipcRenderer.send('quit-app'),
    getDesktopSources: (opts) => desktopCapturer.getSources(opts)
});