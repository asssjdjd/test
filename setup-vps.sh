#!/bin/bash
# UntralView Server Deployment Script for Linux VPS
# Usage: bash setup-vps.sh

set -e

echo "================================"
echo "UntralView Server Setup for VPS"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Extract server if zip exists
if [ -f "untralview-server.zip" ]; then
    echo "Extracting server files..."
    unzip -q untralview-server.zip
    echo "✅ Extracted"
fi

# Navigate to server directory
if [ ! -d "server" ]; then
    echo "❌ Error: server directory not found"
    exit 1
fi

cd server

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Test if server starts
echo ""
echo "Testing server startup..."
timeout 3s node server.js &
sleep 1

# Check if port 3001 is open
if lsof -i :3001 >/dev/null 2>&1; then
    echo "✅ Server listening on port 3001"
else
    echo "⚠️  Server may not be listening"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "To run with PM2 (recommended):"
echo "  npm install -g pm2"
echo "  pm2 start server.js --name 'untralview-server'"
echo "  pm2 startup"
echo "  pm2 save"
