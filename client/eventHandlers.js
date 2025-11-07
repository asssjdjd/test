// eventHandlers.js (FIXED VERSION)

// Biến cho việc tối ưu
let lastMoveTime = 0;
const MOVE_THROTTLE_MS = 50;
let scrollTimeout;
let accumulatedDeltaY = 0;
const SCROLL_DEBOUNCE_MS = 100;

// Hàm tính toán tọa độ (ĐÃ SỬA)
function getScaledCoordinates(e, remoteVideo) {
    const rect = remoteVideo.getBoundingClientRect();
    const videoWidth = remoteVideo.videoWidth;
    const videoHeight = remoteVideo.videoHeight;
    
    // ===== SỬA ĐỔI Ở ĐÂY =====
    // Nếu không có video (width/height = 0), dùng kích thước DOM
    const actualWidth = videoWidth > 0 ? videoWidth : rect.width;
    const actualHeight = videoHeight > 0 ? videoHeight : rect.height;
    
    const scaleX = actualWidth / rect.width;
    const scaleY = actualHeight / rect.height;
    // ===== KẾT THÚC SỬA ĐỔI =====

    return {
        x: Math.round((e.clientX - rect.left) * scaleX),
        y: Math.round((e.clientY - rect.top) * scaleY)
    };
}

// --- Các hàm xử lý sự kiện ---

function throttledMouseMove(event) {
    const remoteVideo = this; 
    
    const currentTime = Date.now();
    if (currentTime - lastMoveTime < MOVE_THROTTLE_MS) return; 
    lastMoveTime = currentTime;

    const coords = getScaledCoordinates(event, remoteVideo);
    if (!coords) return;

    sendCommand({
        type: "mousemove",
        x: coords.x,
        y: coords.y
    });
}

function debouncedScroll(event) {
    event.preventDefault();
    accumulatedDeltaY += event.deltaY;
    clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
        sendCommand({
            type: "scroll",
            deltaY: accumulatedDeltaY
        });
        accumulatedDeltaY = 0;
    }, SCROLL_DEBOUNCE_MS);
}

function handleMouseDown(e) {
    e.preventDefault();
    const remoteVideo = this;
    const button = e.button === 2 ? "right" : e.button === 1 ? "middle" : "left";
    const coords = getScaledCoordinates(e, remoteVideo);
    if (!coords) return;

    sendCommand({ type: "down", button, x: coords.x, y: coords.y });
}

function handleMouseUp(e) {
    e.preventDefault();
    const remoteVideo = this;
    const button = e.button === 2 ? "right" : e.button === 1 ? "middle" : "left";
    const coords = getScaledCoordinates(e, remoteVideo);
    if (!coords) return;

    sendCommand({ type: "up", button, x: coords.x, y: coords.y });
}

function handleContextMenu(e) {
    e.preventDefault();
}

function handleKeyDown(e) {
    e.preventDefault();
    if (e.repeat) return;
    sendCommand({
        type: "keydown",
        key: e.key,
        code: e.code,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
    });
}

function handleKeyUp(e) {
    e.preventDefault();
    sendCommand({ type: "keyup", key: e.key, code: e.code });
}

function handleFocus() {
    this.style.borderColor = "blue";
}

function handleBlur() {
    this.style.borderColor = "#333";
}

// Hàm setup chính
function setupEventListeners(targetElement) {
    targetElement.addEventListener('mousemove', throttledMouseMove);
    targetElement.addEventListener('wheel', debouncedScroll);
    targetElement.addEventListener('mousedown', handleMouseDown);
    targetElement.addEventListener('mouseup', handleMouseUp);
    targetElement.addEventListener('contextmenu', handleContextMenu);
    targetElement.addEventListener('keydown', handleKeyDown);
    targetElement.addEventListener('keyup', handleKeyUp);
    targetElement.addEventListener('focus', handleFocus);
    targetElement.addEventListener('blur', handleBlur);
    
    console.log(' Event listeners đã được gắn vào:', targetElement);
}

// Hàm cleanup (bonus)
function removeEventListeners(targetElement) {
    targetElement.removeEventListener('mousemove', throttledMouseMove);
    targetElement.removeEventListener('wheel', debouncedScroll);
    targetElement.removeEventListener('mousedown', handleMouseDown);
    targetElement.removeEventListener('mouseup', handleMouseUp);
    targetElement.removeEventListener('contextmenu', handleContextMenu);
    targetElement.removeEventListener('keydown', handleKeyDown);
    targetElement.removeEventListener('keyup', handleKeyUp);
    targetElement.removeEventListener('focus', handleFocus);
    targetElement.removeEventListener('blur', handleBlur);
    
    console.log(' Event listeners đã được gỡ bỏ');
}