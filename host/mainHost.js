// main.js
const {app, BrowserWindow, ipcMain, Tray, Menu} = require('electron');
const path = require('path');

const {mouse, keyboard, straightTo, Button, Key} = require('@nut-tree-fork/nut-js');
const {handleEvent} = require('./controlDevices');

// configure input libs (low delay for real-time control)
try {
    if (mouse && mouse.config) mouse.config.autoDelayMs = 0;
    if (keyboard && keyboard.config) keyboard.config.autoDelayMs = 0;
} catch (e) {
    console.warn('nut-js not available/configurable from main process:', e && e.message);
}

let tray = null;
let overlayWindow = null;

function createOverlayWindow() {
    overlayWindow = new BrowserWindow({
        width: 250,
        height: 100,
        transparent: true, // nền trong suốt
        frame: false, // không có khung cửa sổ, nút close, minimize, maximize
        alwaysOnTop: true, // luôn ở trên cùng
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

    overlayWindow.on('closed', () => {
        overlayWindow = null;
    });

    // mở devtools để debug, xóa khi release
    overlayWindow.webContents.openDevTools({mode: 'detach'});
}


// tạo tray icon và menu
function createTray() {
    // tray = new Tray(path.join(__dirname, 'tray-icon.png'));
    // icon.png lives in the host folder
    tray = new Tray(path.join(__dirname, 'icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Quit',
            click: () => {
                app.quit();
            },
        },
        {
            label : 'Agent is running',
            enabled : false
        },
        {
            type : 'separator'
        }
    ]);
    tray.setToolTip('Agent điều khiển chuột và bàn phím từ xa');
    tray.setContextMenu(contextMenu);
}

// khi app sẵn sàng, tạo cửa sổ overlay và tray icon
app.whenReady().then(() => {
    createOverlayWindow();
    createTray();   
});

// thoát app khi tất cả cửa sổ đóng (trừ macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// lắng nghe lệnh từ renderer process để điều khiển chuột và bàn phím qua kênh là control
ipcMain.on('control', async (event, command) => {
    console.log('Đã nhận lệnh:', command);
    try{
        await handleEvent(command.type, command.data);
    }catch(err){
        console.error('Lỗi khi thực hiện lệnh:', err.message, 'Lệnh:', command);
    }
});


ipcMain.on('quit-app', () => {
    app.quit();
});