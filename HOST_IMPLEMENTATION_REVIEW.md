📡 1. Server (Signaling Server - "Tổng đài")
Mục đích: Chỉ làm "người mai mối" (Signaling). Giúp Client và Host "tìm thấy" và "bắt tay" nhau. Không truyền video hay lệnh điều khiển.

Công nghệ: Node.js + Socket.IO.

Các bước làm:

Cài đặt: Tạo thư mục signaling-server, chạy npm install express socket.io.

Viết server.js:

Khởi tạo Socket.IO với cấu hình CORS (origin: "*").

io.on('connection', ...): Chờ người kết nối.

socket.on('join', ...): Lắng nghe sự kiện "tham gia". Kiểm tra số người trong phòng (nếu >= 2 thì gửi lỗi room_full, ngược lại thì cho socket.join(roomId)).

socket.on('offer', ...): Nhận "lời mời" từ Client, gửi nó tới phòng (socket.to(roomId).emit('offer', ...)).

socket.on('answer', ...): Nhận "trả lời" từ Host, gửi nó về chính xác cho Client (socket.to(targetSocketId).emit('answer', ...)).

socket.on('candidate', ...): Nhận "địa chỉ" (ICE candidate) từ 1 bên, gửi nó cho bên kia (socket.to(targetId).emit('candidate', ...)).

Chạy:

Test LAN: Chạy node server.js.

Test Internet: Chạy node server.js (Terminal 1) VÀ ngrok http 3001 (Terminal 2), sau đó copy URL ngrok vào code.

💻 2. Host (Agent / Máy bị điều khiển)
Mục đích: Quay màn hình gửi đi, nhận lệnh và thực thi. Đây là một ứng dụng Desktop (không phải web).

Công nghệ: Electron (bao gồm 2 quy trình chạy song song).

Các bước làm:

A. Main Process (Lõi - main.js)
Mục đích: Chạy ngầm, truy cập phần cứng, quản lý cửa sổ.

Viết code:

Import BrowserWindow, ipcMain, Tray, Menu.

Import @nut-tree-fork/nut-js (đây là công cụ truy cập phần cứng).

Viết hàm createMainWindow(): Tải connect.html, BẬT nodeIntegration: true.

Viết hàm createOverlayWindow() và createTray() (để dùng sau).

Lắng nghe IPC: ipcMain.on('connection-successful', ...) -> Nhận lệnh này từ "bộ não" (Renderer) để ẩn mainWindow và hiện overlayWindow, tray.

Lắng nghe IPC: ipcMain.on('control', ...) -> Nhận lệnh (ví dụ: mousemove).

TRUY CẬP PHẦN CỨNG: Bên trong ipcMain.on('control'), dùng nut-js để thực thi lệnh (ví dụ: await mouse.move(...)).

Chạy: npm start sẽ chạy file này đầu tiên.

B. Renderer Process (Giao diện & "Bộ não" - connect.html + renderer.js)
Mục đích: Xử lý logic "bắt tay" WebRTC và làm giao diện.

Viết connect.html: Tạo giao diện hiển thị ID và trạng thái. Load file renderer.js.

Viết renderer.js:

Import ipcRenderer, desktopCapturer.

Kết nối Signaling Server: socket = io(SIGNALING_SERVER_URL).

socket.on('connect'): Lấy socket.id (làm ID phòng), hiển thị lên connect.html, và socket.emit('join', myId).

socket.on('offer', ...): Lắng nghe "lời mời" từ Client.

TRUY CẬP PHẦN CỨNG (Màn hình): Dùng desktopCapturer.getSources và navigator.mediaDevices.getUserMedia để lấy MediaStream (luồng video màn hình).

Khởi tạo pc = new RTCPeerConnection(...).

Gắn video vào: pc.addTrack(stream).

Nhận offer, tạo answer, setLocalDescription(answer).

Gửi answer về Client: socket.emit('answer', ...).

pc.ondatachannel: Lắng nghe kênh điều khiển. Khi onmessage, lấy lệnh (payload) và gửi qua "cầu" IPC: ipcRenderer.send('control', payload).

Khi kênh mở (onopen), báo cho Main Process: ipcRenderer.send('connection-successful').

🖥️ 3. Client (Controller / Máy điều khiển)
Mục đích: Hiển thị giao diện, bắt sự kiện (chuột/phím), gửi lệnh đi, nhận video về. Đây là một Trang Web bình thường.

Công nghệ: HTML + JavaScript (chia làm 2 file).

Các bước làm:

Viết index.html:

Tạo 2 div (UI kết nối và UI streaming).

Tạo <input> (nhập ID), <button>, và thẻ <video>.

Load file eventHandlers.js TRƯỚC, rồi load client.js SAU.

Viết eventHandlers.js (Logic Bắt sự kiện):

Định nghĩa tất cả các hàm (throttledMouseMove, handleKeyDown, handleMouseDown, getScaledCoordinates...).

Tối ưu (Throttling, Debouncing, Lọc phím lặp).

Trong các hàm này, gọi sendCommand(payload) (hàm này sẽ được định nghĩa ở file sau).

Định nghĩa hàm setupEventListeners().

Viết client.js (Logic "Bắt tay" & Gửi lệnh):

Lấy các element HTML.

Kết nối Signaling Server: socket = io(SIGNALING_SERVER_URL).

Định nghĩa logic "ưu tiên" (batching) và hàm sendCommand(payload) (hàm này sẽ thêm lệnh vào hàng đợi hoặc gửi ngay lập tức).

Định nghĩa hàm flushQueue() (hàm này thực sự gửi lô lệnh qua dataChannel.send(...)).

connectBtn.onclick:

Lấy hostId từ <input>.

Tạo pc = new RTCPeerConnection(iceServersConfig) (với STUN/TURN).

pc.ontrack: Nhận video, gắn vào <video>, đổi giao diện (ẩn UI kết nối, hiện UI video).

pc.onicecandidate: socket.emit('candidate', ...).

dataChannel = pc.createDataChannel(...).

Gọi setupEventListeners(remoteVideo) (từ file eventHandlers.js).

socket.on('answer'): Nhận answer từ Host.

socket.on('candidate'): Nhận candidate từ Host.

Tạo offer, setLocalDescription(offer).

Gửi offer: socket.emit('offer', offer, hostId, ...).

Chạy: Mở index.html bằng trình duyệt (hoặc deploy lên Netlify/gửi file Zip).

rà soát lại đặc biệt phần host thực hiện như kia cho toi