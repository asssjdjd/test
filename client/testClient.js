// client.js (ĐÃ SỬA LỖI ƯU TIÊN VÀ BATCHING)

// ===== PHẦN 1: LẤY UI VÀ CẤU HÌNH =====
const remoteVideo = document.getElementById('remoteVideo');
const logOutput = document.getElementById('log-output');

// === BIẾN CHO BATCHING ===
let eventQueue = [];
let batchTimeout;
const BATCH_INTERVAL_MS = 20; // Đồng hồ cho các sự kiện ưu tiên thấp

// ===== PHẦN 2: HÀM GỬI LỆNH (ĐÃ SỬA LẠI) =====

/**
 * Hàm này chỉ gửi các sự kiện ƯU TIÊN THẤP (mouse/scroll)
 */
function flushLowPriorityQueue() {
    if (eventQueue.length === 0) return;
    
    const batch = [...eventQueue];
    eventQueue = [];
    
    // Gửi lô (In ra log)
    const logMsg = JSON.stringify(batch, null, 2);
    console.log("GỬI LÔ (Mouse/Scroll):", batch);
    logOutput.textContent = logMsg + '\n' + logOutput.textContent;
}

/**
 * Hàm này CHỈ THÊM sự kiện vào hàng đợi (Giữ nguyên)
 * (File eventHandlers.js sẽ gọi hàm này)
 */
function sendCommand(payload) {
    
    // PHÂN LOẠI ƯU TIÊN
    if (payload.type === 'mousemove' || payload.type === 'scroll') {
        // === ƯU TIÊN THẤP ===

        // 1. Tìm và thay thế sự kiện cũ cùng loại
        // (Điều này đảm bảo hàng đợi chỉ có 1 mousemove và 1 scroll)
        const lastEventIndex = eventQueue.findLastIndex(e => e.type === payload.type);
        
        if (lastEventIndex !== -1) {
            eventQueue[lastEventIndex] = payload; // Thay thế sự kiện cũ
        } else {
            eventQueue.push(payload); // Thêm sự kiện mới
        }
        
        // 2. Đặt đồng hồ (Debounce) để gửi lô sự kiện thấp
        clearTimeout(batchTimeout);
        batchTimeout = setTimeout(flushLowPriorityQueue, BATCH_INTERVAL_MS);

    } else {
        // === ƯU TIÊN CAO (click, keydown, keyup, v.v.) ===

        // 1. Xả hàng đợi ưu tiên thấp NGAY LẬP TỨC
        // (Để đảm bảo chuột ở đúng vị trí trước khi click)
        flushLowPriorityQueue();
        
        // 2. Gửi sự kiện quan trọng này đi NGAY LẬP TỨC trong 1 lô riêng
        const logMsg = JSON.stringify([payload], null, 2); // Gửi trong 1 lô
        console.log("GỬI LÔ (Critical):", [payload]);
        logOutput.textContent = logMsg + '\n' + logOutput.textContent;
    }
}

// ===== PHẦN 3: LOGIC BẮT TAY (ĐÃ BỊ XÓA) =====


// ===== PHẦN 4: TỰ ĐỘNG CHẠY =====
window.addEventListener('load', () => {
    console.log("Trang đã tải, gắn bộ bắt sự kiện.");
    
    // Gọi hàm setup TỪ FILE eventHandlers.js
    setupEventListeners(remoteVideo);
    
    // Focus vào video để bắt phím
    remoteVideo.focus();
    alert("Sandbox đã sẵn sàng. Click vào ô màu xám, sau đó di chuột và gõ phím để test.");
});