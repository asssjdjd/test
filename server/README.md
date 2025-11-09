# UntralView Signaling Server

Signaling server for WebRTC peer connection between client and host.

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

Server will run on port 3001 (or PORT environment variable if set).

## Environment Variables

- `PORT` - Port to run server on (default: 3001)

## Deployment on VPS

### Using Node.js directly:
```bash
npm install
npm start
```

### Using PM2 (recommended for production):
```bash
npm install -g pm2
npm install
pm2 start server.js --name "untralview-server"
pm2 startup
pm2 save
```

### Using systemd service:
Create `/etc/systemd/system/untralview-server.service`:
```ini
[Unit]
Description=UntralView Signaling Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/server
ExecStart=/usr/bin/node /path/to/server/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then enable:
```bash
sudo systemctl enable untralview-server
sudo systemctl start untralview-server
```

## API Endpoints

- `GET /` - Server status check
- `GET /status` - JSON status response

## WebSocket Events

### Client/Host Events:
- `join` - Join a room
- `offer` - Send WebRTC offer
- `answer` - Send WebRTC answer
- `candidate` - Send ICE candidate
