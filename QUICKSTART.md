# Quick Start Guide - Template Doctor

## 🚀 First Time Setup (5 minutes)

### Step 1: Prerequisites
```bash
# Install Docker Desktop
# https://www.docker.com/products/docker-desktop

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Clone Repository
```bash
git clone https://github.com/Azure-Samples/template-doctor.git
cd template-doctor
```

### Step 3: Run Setup Script
```bash
./scripts/full-setup.sh
```

**Choose these options:**
1. **GitHub OAuth**: Option 1 or 2 (create new or use existing)
2. **GitHub PAT**: Create token with `repo`, `workflow`, `read:user` scopes
3. **MongoDB**: **Option 1** - Local development ✅
4. **Admin Users**: Enter your GitHub username
5. **Dispatch Repo**: Your fork or leave for manual setup

### Step 4: Start Application
```bash
docker-compose --profile combined up
```

Wait for:
```
✓ MongoDB container started
✓ Express backend + Vite frontend started on port 3000
```

### Step 5: Open Application
```
http://localhost:3000
```

Click "Sign in with GitHub" and you're ready! 🎉

---

## ⚠️ Common Mistakes (DON'T DO THIS!)

### ❌ WRONG: Setting MONGODB_URI in .env
```bash
# DON'T do this for local development:
MONGODB_URI=mongodb://localhost:27017/template-doctor
```

### ✅ CORRECT: Leave MONGODB_URI commented out
```bash
# Correct - leave commented for Docker:
# MONGODB_URI - DO NOT SET for local dev! Docker Compose handles this automatically.
```

**Why?** Docker containers use service names (`mongodb`), not `localhost`.

---

## 🔧 Quick Commands

### Start Application
```bash
docker-compose --profile combined up
```

### Stop Application
```bash
# Stop but keep data
docker-compose down

# Stop and delete ALL data (careful!)
docker-compose down -v
```

### View Logs
```bash
docker-compose logs -f
```

### Restart Clean
```bash
docker-compose down
docker-compose --profile combined up --build
```

### Check MongoDB is Running
```bash
docker ps | grep mongodb
```

Expected output:
```
template-doctor-mongodb   Up X minutes   0.0.0.0:27017->27017/tcp
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**Fix:**
1. Check `.env` - `MONGODB_URI` must be commented out
2. Restart: `docker-compose down && docker-compose --profile combined up`

### OAuth Login Not Working
```
404 after clicking "Sign in with GitHub"
```

**Fix:**
1. GitHub OAuth callback URL must be: `http://localhost:3000/callback.html`
2. Check `.env` has correct `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

### Port Already in Use
```
bind: address already in use
```

**Fix:**
```bash
# macOS/Linux
lsof -ti :3000 | xargs kill -9
docker-compose --profile combined up
```

### Container Won't Start
```
Error response from daemon: ...
```

**Fix:**
```bash
# Clear Docker cache
docker system prune -a
docker-compose --profile combined up --build
```

---

## 📚 Full Documentation

- **Setup**: [docs/usage/DOCKER.md](../usage/DOCKER.md)
- **Troubleshooting**: [docs/usage/TROUBLESHOOTING.md](../usage/TROUBLESHOOTING.md)
- **Environment Variables**: [docs/development/ENVIRONMENT_VARIABLES.md](../development/ENVIRONMENT_VARIABLES.md)
- **OAuth Setup**: [docs/development/OAUTH_CONFIGURATION.md](../development/OAUTH_CONFIGURATION.md)
- **Production Deploy**: [docs/deployment/COSMOS_DB_PORTAL_SETUP.md](../deployment/COSMOS_DB_PORTAL_SETUP.md)

---

## 🆘 Getting Help

**Still stuck?**

1. Check [Troubleshooting Guide](../usage/TROUBLESHOOTING.md)
2. Search [existing issues](https://github.com/Azure-Samples/template-doctor/issues)
3. Create [new issue](https://github.com/Azure-Samples/template-doctor/issues/new) with:
   - Error message
   - Docker version
   - `.env` contents (redact secrets!)
   - Output of `docker-compose logs`

---

## 🎯 What You Should See

### Successful Startup
```
✓ Container template-doctor-mongodb  Started
✓ Container template-doctor-combined Started

template-doctor-combined  | {"level":"INFO","msg":"MongoDB connected successfully"}
template-doctor-combined  | {"level":"INFO","msg":"Server listening on port 3000"}
```

### Application Homepage
```
http://localhost:3000

┌─────────────────────────────────┐
│   Template Doctor               │
│   Analyze Azure Developer       │
│   CLI (azd) Templates          │
│                                 │
│   [Sign in with GitHub]        │
└─────────────────────────────────┘
```

### After Login
You should see:
- Your GitHub avatar/username in top right
- Dashboard with template analysis options
- No error messages

---

## 🚢 Production Deployment

For deploying to Azure Container Apps:

1. **CRITICAL**: Set up User-Assigned Managed Identity (UAMI) FIRST
2. Create Azure Cosmos DB (MongoDB API)
3. Create production GitHub OAuth app
4. Run: `azd init && azd up`

See [Production Deployment Guide](../deployment/COSMOS_DB_PORTAL_SETUP.md) for details.

**Without UAMI, deployment WILL FAIL!**

---

Made with ❤️ by the Template Doctor team
