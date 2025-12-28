# Deployment Guide

This guide will help you deploy DocBrain to online servers. You'll need to deploy both the **backend** and **frontend** separately.

## 📋 Table of Contents
1. [Quick Start - Recommended Platforms](#quick-start)
2. [Backend Deployment Options](#backend-deployment)
3. [Frontend Deployment Options](#frontend-deployment)
4. [Environment Variables Setup](#environment-variables)
5. [Post-Deployment Checklist](#post-deployment)

---

## 🚀 Quick Start - Recommended Platforms

**Easiest Option:**
- **Backend**: [Render](https://render.com) (Free tier available)
- **Frontend**: [Vercel](https://vercel.com) (Free tier available)

**Alternative Options:**
- **Backend**: Railway, Heroku, Fly.io, DigitalOcean
- **Frontend**: Netlify, GitHub Pages, Cloudflare Pages

---

## 🔧 Backend Deployment

### Option 1: Render (Recommended - Free Tier)

1. **Create Account**: Go to https://render.com and sign up

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder

3. **Configure Settings**:
   - **Name**: `doc-brain-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Root Directory**: `backend`

4. **Set Environment Variables**:
   - `FRONTEND_URL`: Your frontend URL (set after deploying frontend)
   - `NODE_ENV`: `production`

5. **Deploy**: Click "Create Web Service"

6. **Get Backend URL**: After deployment, copy your backend URL (e.g., `https://doc-brain-backend.onrender.com`)

**Note**: Free tier spins down after 15 minutes of inactivity. First request may take 30-60 seconds.

---

### Option 2: Railway

1. **Create Account**: Go to https://railway.app and sign up

2. **New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select `backend` folder

3. **Configure**:
   - Railway auto-detects Node.js
   - Add environment variable: `FRONTEND_URL`

4. **Deploy**: Railway automatically deploys

5. **Get Backend URL**: Copy the generated URL

---

### Option 3: Heroku

1. **Install Heroku CLI**: https://devcenter.heroku.com/articles/heroku-cli

2. **Login**:
   ```bash
   heroku login
   ```

3. **Create App**:
   ```bash
   cd backend
   heroku create doc-brain-backend
   ```

4. **Set Environment Variables**:
   ```bash
   heroku config:set FRONTEND_URL=https://your-frontend.vercel.app
   ```

5. **Deploy**:
   ```bash
   git add .
   git commit -m "Deploy backend"
   git push heroku main
   ```

---

### Option 4: Vercel (Serverless)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd backend
   vercel
   ```

3. **Set Environment Variables** in Vercel dashboard:
   - `FRONTEND_URL`

**Note**: Vercel is serverless. For file uploads, consider using cloud storage (S3, Cloudinary) instead of local filesystem.

---

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended - Free Tier)

1. **Create Account**: Go to https://vercel.com and sign up

2. **Import Project**:
   - Click "Add New" → "Project"
   - Import from GitHub
   - Select your repository
   - **Root Directory**: Set to `frontend`

3. **Configure Build Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Set Environment Variables**:
   - `VITE_API_URL`: Your backend URL + `/api`
     - Example: `https://doc-brain-backend.onrender.com/api`

5. **Deploy**: Click "Deploy"

6. **Get Frontend URL**: Copy your Vercel URL (e.g., `https://doc-brain.vercel.app`)

---

### Option 2: Netlify

1. **Create Account**: Go to https://netlify.com and sign up

2. **New Site from Git**:
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub repository

3. **Configure Build Settings**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

4. **Set Environment Variables**:
   - `VITE_API_URL`: Your backend URL + `/api`

5. **Deploy**: Click "Deploy site"

---

### Option 3: GitHub Pages

1. **Update `vite.config.js`**:
   ```javascript
   export default defineConfig({
     base: '/doc-brain/', // Your repo name
     // ... rest of config
   })
   ```

2. **Install gh-pages**:
   ```bash
   cd frontend
   npm install --save-dev gh-pages
   ```

3. **Add to package.json**:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

5. **Set Environment Variable**: Use GitHub Actions or build-time replacement

---

## 🔐 Environment Variables Setup

### Backend Environment Variables

Set these in your hosting platform's dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `FRONTEND_URL` | Your frontend URL | `https://doc-brain.vercel.app` |
| `PORT` | Server port (usually auto-set) | `3001` |
| `NODE_ENV` | Environment | `production` |

### Frontend Environment Variables

Set these in your hosting platform's dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://doc-brain-backend.onrender.com/api` |

**Important**: 
- Vite requires `VITE_` prefix for environment variables
- Rebuild frontend after changing environment variables

---

## ✅ Post-Deployment Checklist

### 1. Update Backend CORS
After deploying frontend, update backend environment variable:
```
FRONTEND_URL=https://your-frontend-url.vercel.app
```

### 2. Update Frontend API URL
After deploying backend, update frontend environment variable:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### 3. Test the Application
- [ ] Visit frontend URL
- [ ] Upload a PDF
- [ ] View uploaded PDFs
- [ ] Download a PDF
- [ ] Delete a PDF

### 4. Check Logs
- Backend logs: Check hosting platform's logs for errors
- Frontend console: Open browser DevTools → Console

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: CORS errors
- **Solution**: Update `FRONTEND_URL` environment variable to match your frontend URL exactly

**Problem**: Database/file storage issues
- **Solution**: Some platforms (Vercel, serverless) don't support persistent file storage. Consider:
  - Using cloud storage (AWS S3, Cloudinary)
  - Using a database with file storage (MongoDB GridFS, PostgreSQL with file storage)

**Problem**: Port binding errors
- **Solution**: Use `process.env.PORT` (already configured in code)

### Frontend Issues

**Problem**: API calls failing
- **Solution**: 
  - Check `VITE_API_URL` is set correctly
  - Ensure backend URL includes `/api` at the end
  - Check browser console for CORS errors

**Problem**: Build fails
- **Solution**: 
  - Ensure all dependencies are in `package.json`
  - Check build logs for specific errors

---

## 📦 Production Considerations

### File Storage
The current setup stores files locally. For production, consider:
- **AWS S3**: Scalable cloud storage
- **Cloudinary**: Image/document storage
- **Google Cloud Storage**: Alternative cloud storage

### Database
SQLite works for small apps, but for production consider:
- **PostgreSQL**: More robust, better for production
- **MongoDB**: NoSQL alternative
- **Supabase**: PostgreSQL with easy setup

### Security
- Add authentication (JWT tokens)
- Rate limiting for API endpoints
- Input validation and sanitization
- HTTPS only (most platforms provide this)

---

## 🔄 Updating After Deployment

### Backend Updates
1. Push changes to GitHub
2. Platform auto-deploys (if connected to Git)
3. Or manually trigger deployment

### Frontend Updates
1. Push changes to GitHub
2. Platform auto-deploys
3. Environment variables persist across deployments

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Railway Documentation](https://docs.railway.app)

---

## 🎯 Recommended Deployment Flow

1. **Deploy Backend First**
   - Choose Render or Railway
   - Get backend URL
   - Test backend health endpoint

2. **Deploy Frontend**
   - Choose Vercel or Netlify
   - Set `VITE_API_URL` to backend URL + `/api`
   - Get frontend URL

3. **Update Backend CORS**
   - Set `FRONTEND_URL` to frontend URL
   - Redeploy backend

4. **Test Everything**
   - Upload PDF
   - Verify all features work

---

Good luck with your deployment! 🚀

