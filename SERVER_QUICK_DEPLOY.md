# 🚀 UntralView Server - Quick VPS Deployment

## What You Have
✅ **untralview-server.zip** (2.23 MB)
- Contains: server.js + package.json + node_modules (all dependencies pre-installed)
- Ready to deploy immediately

## Quick Start on VPS (5 minutes)

### 1. Upload to VPS
```bash
scp untralview-server.zip user@your-vps-ip:/home/user/
```

### 2. Extract and Run
```bash
ssh user@your-vps-ip
cd /home/user
unzip untralview-server.zip
cd server
npm start
```

Server will be running on **port 3001** ✅

### 3. Test Connection
```bash
curl http://your-vps-ip:3001
# Should see: Server đang chạy OK!
```

### 4. Update Client & Host URLs
Update both files to use your VPS URL:
- `client/client.js` line 14
- `host/hostRenderer.js` line 7-9

Change:
```javascript
const SIGNALING_SERVER_URL = 'http://your-vps-ip:3001';
```

## Production Setup (Recommended)

### Install PM2 for Auto-Restart
```bash
npm install -g pm2
cd ~/server
pm2 start server.js --name "untralview-server"
pm2 startup
pm2 save
```

### View Logs
```bash
pm2 logs untralview-server
```

### Monitor
```bash
pm2 monit
```

## With Nginx Reverse Proxy (Advanced)

Create `/etc/nginx/sites-available/untralview`:
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
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/untralview /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Firewall (UFW)
```bash
sudo ufw allow 3001/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Troubleshooting

**Port already in use?**
```bash
lsof -i :3001
kill -9 <PID>
```

**Check if running:**
```bash
pm2 list
```

**View errors:**
```bash
pm2 logs untralview-server
```

**Full guide:** See `VPS_DEPLOYMENT_GUIDE.md`
