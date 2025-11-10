const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3001;

// ===== THÊM HEALTH CHECK ROUTES =====
app.get('/', (req, res) => {
    res.send('Signaling Server đang chạy OK!');
});

app.get('/status', (req, res) => {
    res.json({ 
        ok: true, 
        port: PORT, 
        timestamp: Date.now(),
        connections: io.engine.clientsCount
    });
});

// ===== LOG LỖI ENGINE.IO =====
io.engine.on('connection_error', (err) => {
    console.error('[ENGINE.IO ERROR]', {
        message: err.message,
        code: err.code,
        context: err.context
    });
});

io.on('connection', (socket) => {
    console.log(`KẾT NỐI MỚI: ${socket.id} đã kết nối.`);

    // Giai đoạn khởi tạo và tham gia vào phòng.
    socket.on('join', (roomId) => {
        const room = io.sockets.adapter.rooms.get(roomId);
        const count = room ? room.size : 0;

        if (count >= 2) {
            socket.emit('room_full', roomId);
            console.log(`[PHÒNG ĐẦY: ${socket.id} cố gắng vào phòng '${roomId}' nhưng đã đầy.`);
        } else {
            socket.join(roomId);
            console.log(`THAM GIA: ${socket.id} đã vào phòng '${roomId}'. (Tổng số: ${count + 1})`);
            socket.emit('join_success', roomId);
        }
    });

    // Khi Client gửi "Offer"
   socket.on('offer', (offer, roomId, fromId) => {
        console.log(` CHUYỂN OFFER: Từ ${fromId} (Client) tới phòng '${roomId}' (Host).`);
        // Gửi "offer" tới TẤT CẢ mọi người trong phòng (trừ người gửi)
        const sent = socket.to(roomId).emit('offer', offer, fromId);
        console.log(`   → Offer đã gửi tới phòng ${roomId}`);
    });

    // Khi Host gửi "Answer"
    socket.on('answer', (answer, targetSocketId) => {
        console.log(`CHUYỂN ANSWER: Từ ${socket.id} (Host) tới '${targetSocketId}' (Client).`);
        // Gửi "answer" trả lại CHÍNH XÁC cho Client đã hỏi
        socket.to(targetSocketId).emit('answer', answer);
        console.log(`   → Answer đã gửi tới ${targetSocketId}`);
    });

    // --- 3. Giai đoạn Trao đổi "Địa chỉ" (Candidate) ---
    // (Cả Client và Host đều gửi sự kiện này)
    socket.on('candidate', (candidate, targetId) => {
        console.log(`CHUYỂN CANDIDATE: Từ ${socket.id} tới '${targetId}'.`);
        
        // Gửi "candidate" tới mục tiêu
        socket.to(targetId).emit('candidate', candidate);
    });

    // --- KHI NGẮT KẾT NỐI ---
    socket.on('disconnect', () => {
        console.log(` NGẮT KẾT NỐI: ${socket.id} đã rời đi.`);
    });
    
    // ===== XỬ LÝ LỖI TỪ CLIENT/HOST =====
    socket.on('error', (errorData) => {
        console.error(`[LỖI từ ${socket.id}]:`, errorData);
        // Forward lỗi tới các peer khác trong phòng nếu cần
        socket.broadcast.emit('error', errorData);
    });

});

server.listen(PORT, () => {
   console.log(` Signaling Server (Bản Đầy Đủ) đang chạy trên cổng ${PORT}`);
   console.log(`   URL: http://localhost:${PORT}`);
   console.log(`   Health check: http://localhost:${PORT}/status`);
   console.log(`   (Hỗ trợ cả LAN và Non-LAN)`);
});
