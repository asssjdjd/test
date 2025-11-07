const { ipcRenderer } = require('electron');
const io = require('socket.io-client');

// Configure your signaling server URL here or via environment variable
const SIGNALING_SERVER_URL = process.env.SIGNALING_SERVER_URL || 'https://pasty-unscarce-magnanimously.ngrok-free.dev';

const statusEl = document.getElementById('status');
let socket;

function logStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
    console.log('[HostRenderer]', msg);
}

async function start() {
    socket = io(SIGNALING_SERVER_URL);

    socket.on('connect', () => {
        logStatus(`Kết nối signaling: ${socket.id}`);
        // Join a room that equals this host's socket id so clients can target us
        socket.emit('join', socket.id);
    });

    socket.on('disconnect', () => {
        logStatus('Ngắt kết nối signaling');
    });

    socket.on('room_full', (roomId) => {
        logStatus(`Phòng ${roomId} đầy`);
    });

    // When a client sends an offer to this host
    socket.on('offer', async (offer, fromId) => {
        logStatus(`Nhận offer từ ${fromId}`);

        try {
            // Create RTCPeerConnection in renderer (browser) so we can capture screen
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }
                ]
            });

            // Relay ice candidates back to the specific client
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('candidate', event.candidate, fromId);
                }
            };

            // When a data channel is created by the client, listen for control messages
            pc.ondatachannel = (ev) => {
                const dc = ev.channel;
                logStatus(`Kênh điều khiển tới từ client (readyState=${dc.readyState})`);

                dc.onopen = () => logStatus('Kênh điều khiển mở');
                dc.onclose = () => logStatus('Kênh điều khiển đóng');

                dc.onmessage = (msgEvent) => {
                    try {
                        const payload = JSON.parse(msgEvent.data);
                        // Client sends an array (batch) of events or a single event
                        const events = Array.isArray(payload) ? payload : [payload];
                        for (const e of events) {
                            // Normalise: client uses `type`, and other fields
                            ipcRenderer.send('control', { type: e.type, data: e });
                        }
                    } catch (err) {
                        console.error('Lỗi khi đọc message từ dataChannel', err, msgEvent.data);
                    }
                };
            };

            // Acquire screen stream (share display)
            let stream = null;
            try {
                stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
                // Add tracks to peer connection
                stream.getTracks().forEach(track => pc.addTrack(track, stream));
            } catch (err) {
                console.error('Lỗi khi lấy màn hình:', err);
                logStatus('Lỗi khi lấy màn hình: ' + (err.message || err));
            }

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Send answer back to the originating client
            socket.emit('answer', answer, fromId);
            logStatus('Đã gửi answer trở lại client');

            // Accept ICE candidates from server forwarded by client
            const candidateHandler = (candidate) => {
                if (!candidate) return;
                pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => {
                    console.error('Lỗi addIceCandidate:', err);
                });
            };

            socket.on('candidate', candidateHandler);

            // Clean up when connection closed (optional)
            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    logStatus('Peer connection trạng thái: ' + pc.connectionState);
                    try { pc.close(); } catch (e) {}
                    socket.off('candidate', candidateHandler);
                    // stop tracks
                    if (stream) stream.getTracks().forEach(t => t.stop());
                }
            };

        } catch (err) {
            console.error('Lỗi khi xử lý offer:', err);
            logStatus('Lỗi khi xử lý offer: ' + (err.message || err));
        }
    });
}

// Wire disconnect button
const disconnectBtn = document.getElementById('disconnectBtn');
if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
        if (socket) socket.disconnect();
        ipcRenderer.send('quit-app');
    });
}

start().catch(err => console.error('Start failed', err));
