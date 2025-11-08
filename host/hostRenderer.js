// hostRenderer.js (ĐÃ SỬA)

// Lấy API từ preload
const { sendControl, quitApp, getDesktopSources } = window.electronAPI;

// Lấy 'io' từ CDN (global window object)
// 'defer' trong HTML đảm bảo 'io' tồn tại trước khi code này chạy
const { io } = window; 

//const SIGNALING_SERVER_URL = 'https://pasty-unscarce-magnanimously.ngrok-free.dev';
const SIGNALING_SERVER_URL ='https://cuddly-lemons-repair.loca.lt'

const statusEl = document.getElementById('status');
let socket;

function logStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
    console.log('[HostRenderer]', msg);
}

async function start() {
    
    // === THÊM KIỂM TRA NÀY ===
    if (typeof io !== 'function') {
        const errorMsg = 'LỖI: Socket.IO (io) không tải được! (Kiểm tra CSP hoặc file HTML)';
        logStatus(errorMsg);
        console.error(errorMsg);
        return; // Dừng lại
    }
    // ===========================

    socket = io(SIGNALING_SERVER_URL);

    socket.on('connect', () => {
        logStatus(`Kết nối signaling: ${socket.id}`);
        socket.emit('join', socket.id);
    });
    
    socket.on('connect_error', (err) => {
        console.error('[HostRenderer] LỖI KẾT NỐI:', err.message);
        logStatus(`Lỗi kết nối: ${err.message}`);
    });

    // ... (Toàn bộ code 'socket.on('offer', ...)' và phần còn lại Y HỆT NHƯ CŨ) ...
    // (Dán toàn bộ phần code 'offer' của bạn vào đây)
    socket.on('offer', async (offer, fromId) => {
        logStatus(`Nhận offer từ ${fromId}`);

        try {
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('candidate', event.candidate, fromId);
                }
            };

            pc.ondatachannel = (ev) => {
                const dc = ev.channel;
                logStatus(`Kênh điều khiển tới từ client (readyState=${dc.readyState})`);

                dc.onopen = () => logStatus('Kênh điều khiển mở');
                dc.onclose = () => logStatus('Kênh điều khiển đóng');

                dc.onmessage = (msgEvent) => {
                    try {
                        const payload = JSON.parse(msgEvent.data);
                        const events = Array.isArray(payload) ? payload : [payload];
                        for (const e of events) {
                            sendControl({ type: e.type, data: e });
                        }
                    } catch (err) {
                        console.error('Lỗi khi đọc message từ dataChannel', err, msgEvent.data);
                    }
                };
            };

            // ===== LẤY DESKTOP STREAM =====
            let stream = null;
            try {
                const sources = await getDesktopSources({ types: ['screen', 'window'] });
                
                if (sources.length === 0) {
                    throw new Error('Không tìm thấy nguồn màn hình nào');
                }

                const source = sources[0];
                logStatus(`Đang chia sẻ: ${source.name}`);

                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: source.id,
                            minWidth: 1280,
                            minHeight: 720,
                            maxWidth: 1920,
                            maxHeight: 1080,
                            maxFrameRate: 30
                        }
                    }
                });

                stream.getTracks().forEach(track => pc.addTrack(track, stream));
                logStatus('Stream đã được thêm vào peer connection');

            } catch (err) {
                console.error('Lỗi khi lấy màn hình:', err);
                logStatus('Lỗi khi lấy màn hình: ' + (err.message || err));
                return;
            }

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('answer', answer, fromId);
            logStatus('Đã gửi answer trở lại client');

            const candidateHandler = (candidate) => {
                if (!candidate) return;
                pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => {
                    console.error('Lỗi addIceCandidate:', err);
                });
            };

            socket.on('candidate', candidateHandler);

            pc.onconnectionstatechange = () => {
                const state = pc.connectionState;
                logStatus('Connection state: ' + state);
                
                if (state === 'connected') {
                    logStatus('✅ Đã kết nối với client!');
                }
                
                if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                    logStatus('❌ Kết nối bị ngắt: ' + state);
                    try { pc.close(); } catch (e) {}
                    socket.off('candidate', candidateHandler);
                    if (stream) stream.getTracks().forEach(t => t.stop());
                }
            };

        } catch (err) {
            console.error('Lỗi khi xử lý offer:', err);
            logStatus('Lỗi khi xử lý offer: ' + (err.message || err));
        }
    });
}

const disconnectBtn = document.getElementById('disconnectBtn');
if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
        if (socket) socket.disconnect();
        quitApp();
    });
}

// `defer` trong HTML sẽ đảm bảo các file được tải xong
// trước khi hàm start() này được gọi
start().catch(err => console.error('Start failed', err));