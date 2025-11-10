# Hướng dẫn chạy UntralView Remote Desktop

## 🚀 Chạy nhanh (Test trong LAN)

### 1. Server (Signaling Server) - Chạy trên máy bất kỳ

```powershell
cd D:\abc\test
node server\server.js
```

✅ Phải thấy: "Signaling Server đang chạy trên cổng 3001"

Kiểm tra: Mở trình duyệt http://localhost:3001/status → Phải thấy `{"ok":true}`

---

### 2. Host (Máy bị điều khiển)

```powershell
cd D:\abc\test
npm start
```

✅ Phải thấy cửa sổ overlay hiện "Kết nối signaling: <socket-id>"

📋 **QUAN TRỌNG:** Copy socket ID hiện trên overlay (ví dụ: `abc123xyz`)

---

### 3. Client (Máy điều khiển)

**Cách 1: Mở file trực tiếp (chỉ dùng khi test trên cùng máy)**

- Mở file `client/index.html` bằng trình duyệt

**Cách 2: Dùng HTTP server (khuyến nghị)**

```powershell
cd D:\abc\test\client
npx http-server -p 5500
```

Rồi mở: http://localhost:5500

📝 **Kết nối:**

1. Nhập socket ID của Host vào ô input
2. Bấm "Kết nối"
3. Chờ video hiển thị (~3-5 giây)

---

## 🌐 Deploy qua Internet (dùng ngrok hoặc loca.lt)

### Bước 1: Deploy Server

```powershell
# Terminal 1: Chạy server
node server\server.js

# Terminal 2: Chạy ngrok
ngrok http 3001
```

📋 Copy URL ngrok (ví dụ: `https://abc-xyz.ngrok-free.app`)

### Bước 2: Cập nhật URL trong code

Sửa **CẢ HAI** file sau cho giống nhau:

**File: `host/hostRenderer.js` (dòng 11)**

```javascript
const SIGNALING_SERVER_URL = "https://abc-xyz.ngrok-free.app";
```

**File: `client/client.js` (dòng 11)**

```javascript
const SIGNALING_SERVER_URL = "https://abc-xyz.ngrok-free.app";
```

⚠️ **LƯU Ý:** URL phải GIỐNG HỆT NHAU ở cả host và client!

### Bước 3: Chạy Host và Client như bình thường

---

## ❌ Xử lý lỗi thường gặp

### Lỗi: "xhr poll error" trên Host

**Nguyên nhân:** CSP chặn hoặc URL sai
**Giải pháp:**

- Kiểm tra URL trong `hostRenderer.js` và `client.js` có giống nhau không
- Đảm bảo server đang chạy: `curl http://localhost:3001/status`

### Lỗi: Video không hiển thị

**Nguyên nhân:** ICE connection failed
**Giải pháp:**

- Mở DevTools (F12) trên cả Host và Client
- Kiểm tra console có lỗi WebRTC không
- Nếu thấy "ICE connection state: failed" → Cần TURN server (đã thêm sẵn trong code)

### Lỗi: "Phòng đã đầy"

**Nguyên nhân:** Host ID sai hoặc đã có client khác kết nối
**Giải pháp:**

- Copy lại Host ID chính xác từ cửa sổ overlay
- Restart Host nếu cần

### Lỗi: Client không nhận được video

**Các bước debug:**

1. Kiểm tra console Host: phải thấy "Nhận offer từ <client-id>"
2. Kiểm tra console Client: phải thấy "Đã nhận answer từ host"
3. Kiểm tra console Server: phải thấy "CHUYỂN OFFER" và "CHUYỂN ANSWER"
4. Nếu tất cả đều OK nhưng vẫn không có video → Kiểm tra ICE connection state

---

## 📊 Kiểm tra kết nối

### Trên Server Terminal:

```
✅ KẾT NỐI MỚI: <host-id> đã kết nối
✅ KẾT NỐI MỚI: <client-id> đã kết nối
✅ CHUYỂN OFFER: Từ <client-id> tới phòng <host-id>
✅ CHUYỂN ANSWER: Từ <host-id> tới <client-id>
```

### Trên Host DevTools Console:

```
✅ [HostRenderer] Kết nối signaling: <socket-id>
✅ Nhận offer từ <client-id>
✅ Đã gửi answer trở lại client
✅ Connection state: connected
```

### Trên Client DevTools Console:

```
✅ [Client] Đã kết nối server: <socket-id>
✅ [Client] Đã gửi offer tới host: <host-id>
✅ [Client] Đã nhận answer từ host
✅ [Client] ICE connection state: connected
✅ [Client] Đã nhận stream từ host
```

---

## 🔧 Đã sửa các lỗi

✅ **Lỗi CSP chặn kết nối:** Đã mở rộng `connect-src` trong `overlay.html`
✅ **Lỗi URL không khớp:** Đã đồng bộ URL giữa host và client
✅ **Lỗi xhr poll error:** Đã ép dùng WebSocket transport
✅ **Lỗi thiếu health check:** Đã thêm route `/status`
✅ **Lỗi race condition ICE candidates:** Đã thêm candidate queue
✅ **Lỗi thiếu TURN server:** Đã thêm TURN server công khai
✅ **Lỗi thiếu monitoring:** Đã thêm ICE connection state logging
✅ **Lỗi error handling:** Đã thêm xử lý lỗi đầy đủ

---

## 📝 Ghi chú

- **Cổng mặc định:** Server chạy trên port 3001
- **Framework:** Electron (Host) + WebRTC + Socket.IO
- **STUN/TURN:** Đã cấu hình sẵn (Google STUN + Metered.ca TURN)
- **Bảo mật:** CSP đã được cấu hình, contextIsolation enabled
