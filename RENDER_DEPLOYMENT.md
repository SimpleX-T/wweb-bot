# Render.com Deployment Guide

Complete step-by-step guide for deploying your WhatsApp bot to Render.com.

## 🚀 Quick Deploy to Render

### Prerequisites

- GitHub/GitLab account with your code pushed
- Render.com account (free tier available)

---

## 📝 Step-by-Step Manual Deployment

### Step 1: Prepare Your Repository

1. **Push your code to GitHub/GitLab**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Ensure these files exist in your repo:**
   - ✅ `package.json`
   - ✅ `server.js`
   - ✅ `Dockerfile` or `Dockerfile.bun`
   - ✅ `render.yaml` (we'll create this)

---

### Step 2: Create MongoDB Database on Render

1. **Go to Render Dashboard** → https://dashboard.render.com
2. Click **"New +"** → Select **"PostgreSQL"** or use **MongoDB Atlas** (recommended)

#### Option A: Use MongoDB Atlas (Recommended)

```bash
# Go to https://www.mongodb.com/cloud/atlas
# Create free cluster
# Get connection string like:
mongodb+srv://username:password@cluster.mongodb.net/whatsapp-bot
```

#### Option B: Use External MongoDB

- You can use any MongoDB hosting service
- Get the connection string

---

### Step 3: Create Web Service on Render

1. **Go to Render Dashboard**
2. Click **"New +"** → **"Web Service"**
3. **Connect your repository:**

   - Choose GitHub or GitLab
   - Select your repository
   - Click "Connect"

4. **Configure the service:**

| Setting             | Value                            |
| ------------------- | -------------------------------- |
| **Name**            | `whatsapp-bot`                   |
| **Region**          | Choose closest to you            |
| **Branch**          | `main`                           |
| **Runtime**         | `Docker`                         |
| **Dockerfile Path** | `Dockerfile` or `Dockerfile.bun` |
| **Instance Type**   | `Free` or `Starter` ($7/month)   |

5. **Add Environment Variables:**

Click **"Advanced"** → **"Add Environment Variable"**

```env
NODE_ENV=production
PORT=10000
HOST=0.0.0.0
MONGODB_URI=<your-mongodb-connection-string>
CORS_ORIGIN=https://your-app-name.onrender.com
LOG_LEVEL=info
```

**Important Notes:**

- Render uses port `10000` by default (not 3000)
- Replace `<your-mongodb-connection-string>` with actual URI
- Replace `your-app-name` with your Render service name

6. **Click "Create Web Service"**

---

### Step 4: Configure Build & Deploy

Render will automatically:

1. Build your Docker image
2. Deploy the container
3. Assign a URL: `https://your-app-name.onrender.com`

**Build time:** 5-10 minutes for first deployment

---

### Step 5: Monitor Deployment

1. **View Logs:**

   - Go to your service dashboard
   - Click "Logs" tab
   - Watch for "Server running" message

2. **Check Health:**

   - Visit: `https://your-app-name.onrender.com/health`
   - Should return: `{"status":"ok",...}`

3. **Access Dashboard:**
   - Visit: `https://your-app-name.onrender.com`
   - Scan QR code with WhatsApp

---

## 🔧 Using render.yaml (Infrastructure as Code)

Create `render.yaml` in your project root for automated deployment:

```yaml
services:
  - type: web
    name: whatsapp-bot
    runtime: docker
    dockerfilePath: ./Dockerfile.bun
    plan: free # or 'starter' for $7/month
    region: oregon # or singapore, frankfurt, etc.
    branch: main
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: HOST
        value: 0.0.0.0
      - key: MONGODB_URI
        sync: false # Set manually in dashboard
      - key: CORS_ORIGIN
        value: https://whatsapp-bot.onrender.com
      - key: LOG_LEVEL
        value: info
    disk:
      name: whatsapp-data
      mountPath: /app/.wwebjs_auth
      sizeGB: 1
```

**Deploy with render.yaml:**

1. Push `render.yaml` to your repo
2. Go to Render Dashboard → "New +" → "Blueprint"
3. Connect repository
4. Render will auto-detect `render.yaml`
5. Click "Apply"

---

## 💾 Persistent Storage for WhatsApp Session

**Important:** Render's free tier doesn't persist files across deploys!

### Solution 1: Use Render Disks (Paid Plans Only)

Add to `render.yaml`:

```yaml
disk:
  name: whatsapp-session
  mountPath: /app/.wwebjs_auth
  sizeGB: 1
```

### Solution 2: Use MongoDB for Session Storage (Recommended)

Your app already uses `wwebjs-mongo` which stores sessions in MongoDB!

**Verify in your code:**

```javascript
// src/config/whatsapp.js already uses RemoteAuth
const { RemoteAuth } = require("wwebjs-mongo");
```

This means your WhatsApp session persists in MongoDB automatically! ✅

---

## 🔄 Updating Your Deployment

### Method 1: Auto-deploy on Git Push

```bash
git add .
git commit -m "Update feature"
git push origin main
# Render auto-deploys on push
```

### Method 2: Manual Deploy

1. Go to Render Dashboard
2. Click "Manual Deploy" → "Deploy latest commit"

### Method 3: Rollback

1. Go to "Events" tab
2. Click "Rollback" on previous deployment

---

## ⚙️ Important Render-Specific Configurations

### 1. Update server.js for Render's PORT

Your `server.js` already handles this correctly:

```javascript
const PORT = process.env.PORT || 3000; // ✅ Will use Render's PORT=10000
```

### 2. Health Check Endpoint

Your app already has this:

```javascript
app.get("/health", (req, res) => {
  res.json({ status: "ok", ... });
});
```

### 3. WebSocket Configuration

Render supports WebSockets automatically! No extra config needed.

---

## 🆓 Free Tier Limitations

| Feature             | Free Tier                          | Paid Tier |
| ------------------- | ---------------------------------- | --------- |
| **Uptime**          | Spins down after 15 min inactivity | Always on |
| **Cold Start**      | ~30 seconds                        | Instant   |
| **Bandwidth**       | 100 GB/month                       | Unlimited |
| **Build Minutes**   | 500 min/month                      | Unlimited |
| **Persistent Disk** | ❌ No                              | ✅ Yes    |
| **Custom Domain**   | ✅ Yes                             | ✅ Yes    |

**Recommendation:** Use **Starter plan ($7/month)** for production to avoid cold starts.

---

## 🐛 Troubleshooting

### Issue 1: "Application failed to respond"

**Solution:** Check if PORT is set correctly

```bash
# In Render dashboard, verify:
PORT=10000
```

### Issue 2: "Cannot connect to MongoDB"

**Solution:** Whitelist Render's IPs in MongoDB Atlas

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)

### Issue 3: "WhatsApp session lost after redeploy"

**Solution:** You're using MongoDB session storage, so this shouldn't happen!

- Verify `MONGODB_URI` is correct
- Check logs for RemoteAuth connection

### Issue 4: "Puppeteer/Chrome errors"

**Solution:** Your Dockerfile already includes Chrome dependencies ✅

### Issue 5: "Build timeout"

**Solution:**

- Use Bun for faster builds (`Dockerfile.bun`)
- Or upgrade to paid plan for more build time

---

## 📊 Monitoring on Render

### View Logs

```bash
# Real-time logs in dashboard
# Or use Render CLI:
render logs -f whatsapp-bot
```

### Metrics

- CPU usage
- Memory usage
- Request count
- Response times

All available in Render dashboard → "Metrics" tab

---

## 🔒 Security Best Practices

1. **Use Environment Variables** (never commit secrets)
2. **Enable HTTPS** (Render provides free SSL)
3. **Set CORS_ORIGIN** to your actual domain
4. **Use MongoDB authentication**
5. **Regularly update dependencies**

---

## 💰 Cost Estimate

| Plan         | Price     | Best For              |
| ------------ | --------- | --------------------- |
| **Free**     | $0        | Testing, development  |
| **Starter**  | $7/month  | Small production apps |
| **Standard** | $25/month | High-traffic apps     |

**Recommended Setup:**

- Web Service: **Starter** ($7/month)
- MongoDB Atlas: **Free M0** cluster
- **Total: $7/month**

---

## 🚀 Quick Commands Reference

```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# Deploy
render deploy

# View logs
render logs -f whatsapp-bot

# Open dashboard
render open whatsapp-bot

# SSH into container (paid plans only)
render ssh whatsapp-bot
```

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub/GitLab
- [ ] MongoDB database created (Atlas or other)
- [ ] Render web service created
- [ ] Environment variables configured
- [ ] PORT set to 10000
- [ ] MONGODB_URI configured
- [ ] Dockerfile selected
- [ ] First deployment successful
- [ ] Health check passing
- [ ] Dashboard accessible
- [ ] QR code scanned
- [ ] WhatsApp connected
- [ ] Session persisting in MongoDB

---

## 🎯 Next Steps After Deployment

1. **Set up custom domain** (optional)
2. **Configure auto-scaling** (paid plans)
3. **Set up monitoring alerts**
4. **Enable automatic backups**
5. **Configure CI/CD pipeline**

Your WhatsApp bot is now live on Render! 🎉

**Dashboard URL:** `https://your-app-name.onrender.com`
