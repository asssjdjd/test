// preload.js - Fixed desktopCapturer import

const { contextBridge, ipcRenderer } = require('electron');

console.log('[preload] Starting...');

// Import desktopCapturer - có thể undefined trong một số phiên bản Electron
let desktopCapturer;
try {
    desktopCapturer = require('electron').desktopCapturer;
    console.log('[preload] desktopCapturer:', desktopCapturer ? 'OK' : 'undefined');
} catch (e) {
    console.error('[preload] Cannot import desktopCapturer:', e.message);
}

// Expose API
contextBridge.exposeInMainWorld('electronAPI', {
    sendControl: (command) => ipcRenderer.send('control', command),
    quitApp: () => ipcRenderer.send('quit-app'),
    
    // Sử dụng IPC thay vì direct access
    getDesktopSources: async (opts) => {
        console.log('[preload] getDesktopSources called with opts:', opts);
        
        // Thử dùng IPC handle trước (reliable hơn)
        try {
            console.log('[preload] Using IPC invoke method...');
            const sources = await ipcRenderer.invoke('get-desktop-sources', opts);
            console.log('[preload] IPC returned:', sources ? sources.length : 'null', 'sources');
            return sources;
        } catch (ipcError) {
            console.error('[preload] IPC method failed:', ipcError.message);
            
            // Fallback: thử dùng desktopCapturer trực tiếp
            if (desktopCapturer) {
                console.log('[preload] Falling back to direct desktopCapturer...');
                try {
                    const sources = await desktopCapturer.getSources(opts);
                    console.log('[preload] Direct method returned:', sources ? sources.length : 'null', 'sources');
                    return sources;
                } catch (directError) {
                    console.error('[preload] Direct method also failed:', directError);
                    throw directError;
                }
            } else {
                throw new Error('desktopCapturer is not available and IPC failed');
            }
        }
    }
});

console.log('[preload] electronAPI exposed successfully');