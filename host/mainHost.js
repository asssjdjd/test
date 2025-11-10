// main.js
const {app, BrowserWindow, ipcMain, Tray, Menu} = require('electron');
const path = require('path');
const {mouse, keyboard, Button, Key} = require('@nut-tree-fork/nut-js');
const {handleEvent} = require('./controlDevices');

// Configure
try {
    if (mouse && mouse.config) mouse.config.autoDelayMs = 0;
    if (keyboard && keyboard.config) keyboard.config.autoDelayMs = 0;
} catch (e) {
    console.warn('nut-js config warning:', e.message);
}

let tray = null;
let overlayWindow = null;

function createOverlayWindow() {
    overlayWindow = new BrowserWindow({
        width: 250,
        height: 100,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            // ===== ENABLE DESKTOP CAPTURER =====
            webSecurity: true
        }
    });

    overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

    overlayWindow.on('closed', () => {
        overlayWindow = null;
    });

    overlayWindow.webContents.openDevTools({mode: 'detach'});
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Quit',
            click: () => app.quit()
        },
        {
            label: 'Agent is running',
            enabled: false
        },
        { type: 'separator' }
    ]);
    tray.setToolTip('Agent điều khiển chuột và bàn phím từ xa');
    tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
    createOverlayWindow();
    createTray();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('control', async (event, command) => {
    console.log('Đã nhận lệnh:', command);
    try {
        await handleEvent(command.type, command.data);
    } catch (err) {
        console.error('Lỗi khi thực hiện lệnh:', err.message, 'Lệnh:', command);
    }
});

ipcMain.on('quit-app', () => {
    app.quit();
});

// ===== THÊM HANDLER CHO DESKTOP SOURCES =====
ipcMain.handle('get-desktop-sources', async (event, opts) => {
    console.log('[main] get-desktop-sources called with opts:', opts);
    try {
        const { desktopCapturer } = require('electron');
        const sources = await desktopCapturer.getSources(opts);
        console.log('[main] Found', sources.length, 'sources');
        return sources;
    } catch (err) {
        console.error('[main] Error getting desktop sources:', err);
        throw err;
    }
});
// ===== END =====