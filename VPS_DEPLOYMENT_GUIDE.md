# VPS Deployment Guide - UntralView Server

## File to Deploy
- **untralview-server.zip** (2.23 MB) - Chứa toàn bộ server code + node_modules

## Step 1: Upload to VPS
```bash
# On your local machine, upload via SCP
scp untralview-server.zip user@your-vps-ip:/home/user/

# Or use SFTP/FTP client to upload
```

## Step 2: Extract on VPS
```bash
# SSH into your VPS
ssh user@your-vps-ip

# Navigate to upload directory
cd /home/user

# Extract zip
unzip untralview-server.zip

# Create tar.gz for backup (optional)
tar -czf untralview-server.tar.gz server/
rm untralview-server.zip
```

## Step 3: Test Locally (Quick Start)
```bash
cd server
npm start
```
Server should start on port 3001. Test with:
```bash
curl http://localhost:3001
# Should return: Server đang chạy OK!
```

## Step 4: Production Setup with PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start server with PM2
pm2 start server/server.js --name "untralview-server"

# Save PM2 config to auto-start on reboot
pm2 startup
pm2 save

# View logs
pm2 logs untralview-server

# Stop server
pm2 stop untralview-server

# Restart server
pm2 restart untralview-server
```

## Step 5: Setup Reverse Proxy (Optional but Recommended)

### Using Nginx
Create `/etc/nginx/sites-available/untralview-server`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/untralview-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Using systemd Service (Alternative)
Create `/etc/systemd/system/untralview-server.service`:
```ini
[Unit]
Description=UntralView Signaling Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/server
Environment="PATH=/usr/local/bin:/usr/bin"
ExecStart=/usr/bin/node /path/to/server/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable untralview-server
sudo systemctl start untralview-server
sudo systemctl status untralview-server
```

View logs:
```bash
sudo journalctl -u untralview-server -f
```

## Step 6: Update Client & Host URLs

Update your client and host to use the VPS server URL:

### client/client.js (line ~14)
```javascript
const SIGNALING_SERVER_URL = 'http://your-vps-ip:3001';
// Or with domain: 'https://your-domain.com'
```

### host/hostRenderer.js (line ~7-9)
```javascript
const SIGNALING_SERVER_URL = 'http://your-vps-ip:3001';
```

## Environment Variables
Set PORT on VPS:
```bash
export PORT=3001
npm start
```

Or in .env file:
```
PORT=3001
```

## Firewall Configuration
Make sure port 3001 (or your custom port) is open:
```bash
# UFW
sudo ufw allow 3001

# iptables
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
```

## Monitoring & Logs
```bash
# View recent logs
tail -f /var/log/pm2.log

# Check server status
curl http://localhost:3001/status

# Check connections
netstat -an | grep 3001
```

## Troubleshooting

### Server won't start
```bash
# Check if port is already in use
lsof -i :3001

# Kill process on that port
kill -9 <PID>
```

### Connection refused
- Check firewall rules
- Check if server is running: `pm2 list`
- Check logs: `pm2 logs untralview-server`

### High memory usage
- Monitor with: `pm2 monit`
- Restart server: `pm2 restart untralview-server`

## Files Included in Package
```
server/
  ├── server.js          # Main server file
  ├── package.json       # Dependencies
  ├── README.md          # Server documentation
  ├── .env.example       # Environment template
  ├── .gitignore         # Git ignore rules
  └── node_modules/      # All dependencies pre-installed
      ├── express/
      ├── socket.io/
      ├── cors/
      └── ...
```

## Version Info
- Node.js: 18.x or higher
- Express: 5.1.0
- Socket.IO: 4.8.1
- CORS: 2.8.5

## Support
If server won't connect to clients:
1. Check firewall: `sudo ufw status`
2. Check if server is running: `pm2 list`
3. View logs: `pm2 logs untralview-server`
4. Test connectivity: `curl http://your-vps-ip:3001`
