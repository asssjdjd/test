
// lấy các thành phần của giao diện
const connectUI = document.getElementById('connect-ui');
const streamingUI = document.getElementById('streaming-ui');
const hostIdInput = document.getElementById('hostIdInput');
const connectBtn = document.getElementById('connectBtn');
const statusEl = document.getElementById('status');
const remoteVideo = document.getElementById('remoteVideo');

//  ---- Cấu hình -----
// ===== SỬA URL CHO KHỚP VỚI HOST =====
const SIGNALING_SERVER_URL = 'http://localhost:3001'; // Dùng localhost khi test local
// Nếu dùng ngrok/loca.lt, thay bằng URL public và đảm bảo CÙNG với host
// const SIGNALING_SERVER_URL = 'https://your-ngrok-url.ngrok-free.app';

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
        { urls: 'stun:stun2.l.google.com:19302' },
        
        // 2. Máy chủ TURN công khai (Metered - free tier)
        // Thay bằng TURN server của bạn nếu cần
        {
            urls: 'turn:a.relay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:a.relay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ]
};


// Giai đoạn 1 : bắt tay
socket = io(SIGNALING_SERVER_URL, {
    transports: ['websocket'], // Ép dùng WebSocket
    timeout: 10000
});

socket.on('connect', () => {
    statusEl.textContent = 'Sẵn Sàng.';
    console.log('[Client] Đã kết nối server:', socket.id);
});

socket.on('connect_error', (err) => {
    statusEl.textContent = 'Lỗi kết nối server: ' + err.message;
    console.error('[Client] Lỗi kết nối:', err);
});

// Thông báo phòng đẩy không thể join được nữa
socket.on('room_full', (roomId) => {
    statusEl.textContent = `Lỗi: Phòng ${roomId} đã đầy hoặc đang bận.`;
});

// ===== NHẬN THÔNG BÁO LỖI TỪ HOST =====
socket.on('error', (errorData) => {
    console.error('[Client] Lỗi từ host:', errorData);
    statusEl.textContent = `Lỗi từ host: ${errorData.message || 'Unknown error'}`;
});

// Bước 3 : Sau khi người dùng ấn nút để kết nối
connectBtn.onclick = async () => {
    const hostId = hostIdInput.value;
    if(!hostId) return;
    statusEl.textContent = "Đang gọi,....";

    // Khởi tạo các kết nói
    pc = new RTCPeerConnection(iceServersConfig);

    // ===== THÊM ICE CONNECTION STATE MONITORING =====
    pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log('[Client] ICE connection state:', state);
        
        if (state === 'connected') {
            statusEl.textContent = '✅ Đã kết nối WebRTC!';
        } else if (state === 'checking') {
            statusEl.textContent = '🔄 Đang kiểm tra kết nối...';
        } else if (state === 'failed') {
            statusEl.textContent = '❌ Kết nối thất bại (kiểm tra firewall/NAT)';
        } else if (state === 'disconnected') {
            statusEl.textContent = '⚠️ Mất kết nối';
        }
    };

    // ngay khi tìm thấy hay bắt được địa chỉ thì sự khiện sẽ kích hoạt và gửi địa chỉ đó đế 
    pc.onicecandidate = (event) => {
        if(event.candidate) {
            console.log('Đã tìm thấy 1 "địa chỉ" (candidate), gửi đi...');
            socket.emit('candidate', event.candidate, hostId);
        }
    };

    // Gắn sự kiện để nhận được video
    pc.ontrack = (event) => {
        console.log('[Client] Đã nhận stream từ host');
        remoteVideo.srcObject = event.streams[0];

        // Khi nhận được video từ host thì loại bỏ UI không cần thiết
        connectUI.style.display = 'none';
        streamingUI.style.display ='block';
        remoteVideo.focus();
        
        statusEl.textContent = '✅ Đang hiển thị màn hình host';
        
        // Cập nhật videoStatus nếu có
        const videoStatus = document.getElementById('videoStatus');
        if (videoStatus) {
            videoStatus.textContent = '✅ Video đang stream từ host';
            videoStatus.style.background = 'rgba(0,255,0,0.7)';
        }
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
       console.log('[Client] Đã nhận answer từ host');
       await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });
    
    // ===== XỬ LÝ CANDIDATE QUEUE ĐỂ TRÁNH RACE CONDITION =====
    const candidateQueue = [];
    let remoteDescriptionSet = false;
    
    // Bước 11 (Phần 2) : Nhận "Địa chỉ" (Candidate)
    socket.on('candidate', (candidate) => {
        console.log('[Client] Nhận candidate từ host');
        
        if (remoteDescriptionSet) {
            pc.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(err => console.error('Lỗi addIceCandidate:', err));
        } else {
            // Queue nếu chưa set remote description
            candidateQueue.push(candidate);
        }
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', offer, hostId, socket.id);
    
    console.log('[Client] Đã gửi offer tới host:', hostId);
    
    // Sau khi nhận answer, set flag và process queue
    const originalAnswerHandler = socket.listeners('answer')[0];
    socket.off('answer', originalAnswerHandler);
    socket.on('answer', async (answer) => {
        console.log('[Client] Đã nhận answer từ host');
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        remoteDescriptionSet = true;
        
        // Process queued candidates
        while (candidateQueue.length > 0) {
            const candidate = candidateQueue.shift();
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(err => console.error('Lỗi addIceCandidate (queued):', err));
        }
    });
};
