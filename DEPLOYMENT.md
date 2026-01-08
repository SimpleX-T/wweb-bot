# WhatsApp Bot Deployment Guide

This guide covers multiple deployment options for your WhatsApp bot application.

## 📋 Prerequisites

Before deploying, ensure you have:

- **Node.js** v18 or higher
- **MongoDB** v5.0 or higher (local or cloud)
- **Domain name** (optional, for HTTPS)
- **Server** with at least 2GB RAM and 2 CPU cores
- **Chrome/Chromium** dependencies for Puppeteer

---

## 🚀 Deployment Options

### Option 1: VPS Deployment (Ubuntu/Debian)

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Chrome dependencies for Puppeteer
sudo apt install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils

# Install PM2 globally
sudo npm install -g pm2
```

#### Step 2: Deploy Application

```bash
# Clone your repository
cd /var/www
sudo git clone <your-repo-url> whatsapp-bot
cd whatsapp-bot

# Install dependencies
sudo npm install --production

# Create .env file
sudo nano .env
```

**`.env` configuration:**

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
MONGODB_URI=mongodb://localhost:27017/whatsapp-bot
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

#### Step 3: Start with PM2

```bash
# Start application
pm2 start server.js --name whatsapp-bot

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command output instructions

# Monitor logs
pm2 logs whatsapp-bot
```

#### Step 4: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/whatsapp-bot
```

**Nginx configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/whatsapp-bot /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 5: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

---

### Option 2: Docker Deployment

#### Step 1: Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    wget \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "server.js"]
```

#### Step 2: Create docker-compose.yml

```yaml
version: "3.8"

services:
  app:
    build: .
    container_name: whatsapp-bot
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/whatsapp-bot
      - PORT=3000
      - HOST=0.0.0.0
    volumes:
      - ./.wwebjs_auth:/app/.wwebjs_auth
      - ./.wwebjs_cache:/app/.wwebjs_cache
    depends_on:
      - mongo
    networks:
      - whatsapp-network

  mongo:
    image: mongo:6
    container_name: whatsapp-mongo
    restart: unless-stopped
    volumes:
      - mongo-data:/data/db
    networks:
      - whatsapp-network

volumes:
  mongo-data:

networks:
  whatsapp-network:
    driver: bridge
```

#### Step 3: Deploy with Docker

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop containers
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

---

### Option 3: Cloud Platform Deployment

#### Heroku

1. **Install Heroku CLI**

```bash
npm install -g heroku
heroku login
```

2. **Create Heroku app**

```bash
heroku create whatsapp-bot-app
```

3. **Add MongoDB addon**

```bash
heroku addons:create mongolab:sandbox
```

4. **Configure buildpacks**

```bash
heroku buildpacks:add --index 1 heroku/nodejs
heroku buildpacks:add --index 2 jontewks/puppeteer
```

5. **Set environment variables**

```bash
heroku config:set NODE_ENV=production
heroku config:set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
heroku config:set PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

6. **Deploy**

```bash
git push heroku main
heroku logs --tail
```

#### Railway.app

1. Connect your GitHub repository
2. Add MongoDB plugin
3. Set environment variables in dashboard
4. Deploy automatically on push

#### DigitalOcean App Platform

1. Create new app from GitHub
2. Select Node.js environment
3. Add MongoDB database
4. Configure environment variables
5. Deploy

---

## 🔧 Production Configuration

### Environment Variables

Create a `.env` file with production settings:

```env
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb://localhost:27017/whatsapp-bot

# Security
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info

# Optional: Puppeteer
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "whatsapp-bot",
      script: "./server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
```

Start with: `pm2 start ecosystem.config.js`

---

## 🔒 Security Best Practices

1. **Firewall Configuration**

```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

2. **MongoDB Security**

```bash
# Enable authentication
sudo nano /etc/mongod.conf
```

Add:

```yaml
security:
  authorization: enabled
```

Create admin user:

```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "strong_password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase"]
})
```

3. **Regular Updates**

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
npm audit fix
```

---

## 📊 Monitoring & Maintenance

### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs whatsapp-bot

# Restart app
pm2 restart whatsapp-bot

# Stop app
pm2 stop whatsapp-bot
```

### Log Rotation

```bash
# Install PM2 log rotate
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Database Backup

```bash
# Create backup script
sudo nano /usr/local/bin/backup-mongo.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
mkdir -p $BACKUP_DIR
mongodump --out $BACKUP_DIR/backup_$DATE
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-mongo.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-mongo.sh
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Puppeteer/Chrome errors**

```bash
# Install missing dependencies
sudo apt install -y chromium-browser
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

**2. MongoDB connection failed**

```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Check logs
sudo tail -f /var/log/mongodb/mongod.log
```

**3. Port already in use**

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

**4. Session not persisting**

- Ensure `.wwebjs_auth` directory has write permissions
- Check MongoDB connection
- Verify session data in database

**5. High memory usage**

```bash
# Restart PM2 process
pm2 restart whatsapp-bot

# Increase memory limit in ecosystem.config.js
max_memory_restart: '2G'
```

---

## 📱 Accessing the Dashboard

After deployment:

1. **Local access**: `http://localhost:3000`
2. **Domain access**: `https://yourdomain.com`
3. **Scan QR code** with WhatsApp mobile app
4. **Monitor status** in real-time via WebSocket

---

## 🔄 Updates & Maintenance

### Updating the Application

```bash
# Pull latest changes
cd /var/www/whatsapp-bot
sudo git pull

# Install new dependencies
sudo npm install --production

# Restart application
pm2 restart whatsapp-bot
```

### Zero-Downtime Deployment

```bash
# Use PM2 reload for zero-downtime
pm2 reload whatsapp-bot
```

---

## 📞 Support

For issues or questions:

- Check logs: `pm2 logs whatsapp-bot`
- Review [README.md](README.md)
- Check [whatsapp-web.js documentation](https://docs.wwebjs.dev)

---

## ✅ Deployment Checklist

- [ ] Server provisioned with required specs
- [ ] Node.js 18+ installed
- [ ] MongoDB installed and secured
- [ ] Application cloned and dependencies installed
- [ ] Environment variables configured
- [ ] PM2 configured and running
- [ ] Nginx reverse proxy setup
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] QR code scanned and authenticated
- [ ] Dashboard accessible
- [ ] WebSocket connection working

**Your WhatsApp bot is now deployed and ready! 🎉**
