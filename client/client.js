
// lấy các thành phần của giao diện
const connectUI = document.getElementById('connect-ui');
const streamingUI = document.getElementById('streaming-ui');
const hostIdInput = document.getElementById('hostIdInput');
const connectBtn = document.getElementById('connectBtn');
const statusEl = document.getElementById('status');
const remoteVideo = document.getElementById('remoteVideo');

//  ---- Cấu hình -----
const SIGNALING_SERVER_URL = 'https://pasty-unscarce-magnanimously.ngrok-free.dev'; // cấu hình kết nối đến Server
let pc; 
let dataChannel; 
let socket;

let eventQueue = [];
let batchTimeout;
const BATCH_INTERVAL_MS = 20; // Gửi lô sau mỗi 20ms

/**
 * Hàm này chỉ gửi các sự kiện ƯU TIÊN THẤP (mouse/scroll)
 */
function flushLowPriorityQueue() {
    if (eventQueue.length === 0) return;
    
    // Chỉ gửi nếu kênh đã mở
    if (dataChannel && dataChannel.readyState === 'open') {
        const batch = [...eventQueue];
        eventQueue = [];
        
        // Gửi lô qua WebRTC
        dataChannel.send(JSON.stringify(batch));
        console.log("GỬI LÔ (Mouse/Scroll):", batch);
    }
}

function sendCommand(payload) {
    
    // PHÂN LOẠI ƯU TIÊN
    if (payload.type === 'mousemove' || payload.type === 'scroll') {
        // === ƯU TIÊN THẤP ===
        const lastEventIndex = eventQueue.findLastIndex(e => e.type === payload.type);
        
        if (lastEventIndex !== -1) {
            eventQueue[lastEventIndex] = payload; // Thay thế
        } else {
            eventQueue.push(payload); // Thêm mới
        }
        
        clearTimeout(batchTimeout);
        batchTimeout = setTimeout(flushLowPriorityQueue, BATCH_INTERVAL_MS);

    } else {
        // === ƯU TIÊN CAO (down, up, keydown, keyup) ===

        // 1. Xả hàng đợi thấp ngay lập tức
        flushLowPriorityQueue();
        
        // 2. Gửi sự kiện quan trọng này đi ngay lập tức
        if (dataChannel && dataChannel.readyState === 'open') {
            const batch = [payload]; // Gửi trong 1 lô riêng
            dataChannel.send(JSON.stringify(batch));
            console.log("GỬI LÔ (Critical):", batch);
        }
    }
}

// -- Định nghĩa máy chủ sturn/turn ---

const iceServersConfig = {
    iceServers: [
        // 1. Máy chủ STUN (Miễn phí của Google)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        
        /*  2. Máy chủ TURN (Phương án dự phòng)
        {
            urls: 'turn:your-turn-server.com:3478',
            username: 'your-username',
            credential: 'your-password'
        }
        */
    ]
};


// Giai đoạn 1 : bắt tay
socket = io(SIGNALING_SERVER_URL);
socket.on('connect', () => {
    statusEl.textContent = 'Sẵn Sàng.';
});

// Thông báo phòng đẩy không thể join được nữa
socket.on('room_full', (roomId) => {
    statusEl.textContent = `Lỗi: Phòng ${roomId} đã đầy hoặc đang bận.`;
});

// Bước 3 : Sau khi người dùng ấn nút để kết nối
connectBtn.onclick = async () => {
    const hostId = hostIdInput.value;
    if(!hostId) return;
    statusEl.textContent = "Đang gọi,....";

    // Khởi tạo các kết nói
    pc = new RTCPeerConnection(iceServersConfig);

    // ngay khi tìm thấy hay bắt được địa chỉ thì sự khiện sẽ kích hoạt và gửi địa chỉ đó đế 
    pc.onicecandidate = (event) => {
        if(event.candidate) {
            console.log('Đã tìm thấy 1 "địa chỉ" (candidate), gửi đi...');
            socket.emit('candidate', event.candidate, hostId);
        }
    };

    // Gắn sự kiện để nhận được video
    pc.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];

        // Khi nhận được video từ host thì loại bỏ UI không cần thiết
        connectUI.style.display = 'none';
        streamingUI.style.display ='block';
        remoteVideo.focus();
    };

    // bước 5 : Gắn miệng nơi sẽ bắt các sự kiện của client (kênh điều khiển)
    dataChannel = pc.createDataChannel('control', {
        ordered: false,
        maxRetransmits: 0
    });

    // GỌI HÀM SETUP TỪ FILE eventHandlers.js
    setupEventListeners(remoteVideo); 

    // Bước 9 : Chấp nhận (Answer) từ HOST
    socket.on('answer', async (answer) => {
       await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });
    
    // Bước 11 (Phần 2) : Nhận "Địa chỉ" (Candidate)
    socket.on('candidate', (candidate) => {
       pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', offer, hostId, socket.id);
};
