# Quick Deployment Guide

## 🚀 Fastest Way to Deploy (5 minutes)

### Step 1: Deploy Backend to Render

1. Go to https://render.com and sign up (free)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `doc-brain-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Click "Create Web Service"
6. **Wait for deployment** (2-3 minutes)
7. **Copy your backend URL** (e.g., `https://doc-brain-backend.onrender.com`)

### Step 2: Deploy Frontend to Vercel

1. Go to https://vercel.com and sign up (free)
2. Click "Add New" → "Project"
3. Import from GitHub
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
5. **Add Environment Variable**:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api` (use your actual backend URL)
6. Click "Deploy"
7. **Copy your frontend URL** (e.g., `https://doc-brain.vercel.app`)

### Step 3: Update Backend CORS

1. Go back to Render dashboard
2. Go to your backend service → "Environment"
3. Add environment variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: Your frontend URL from Step 2 (e.g., `https://doc-brain.vercel.app`)
4. Click "Save Changes"
5. Render will automatically redeploy

### Step 4: Test!

1. Visit your frontend URL
2. Try uploading a PDF
3. Everything should work! 🎉

---

## 📝 Important Notes

- **Backend URL Format**: Always end with `/api` when setting `VITE_API_URL`
  - ✅ Correct: `https://backend.onrender.com/api`
  - ❌ Wrong: `https://backend.onrender.com`

- **Free Tier Limitations**:
  - Render: Spins down after 15 min inactivity (first request may be slow)
  - Vercel: Generous free tier, no spin-down

- **File Storage**: Current setup uses local storage. For production scale, consider cloud storage (S3, Cloudinary).

---

## 🔧 Troubleshooting

**CORS Errors?**
- Make sure `FRONTEND_URL` in backend matches your frontend URL exactly
- Check for trailing slashes

**API Not Working?**
- Verify `VITE_API_URL` includes `/api` at the end
- Check browser console for errors
- Check backend logs in Render dashboard

**Build Fails?**
- Make sure root directory is set correctly (`backend` or `frontend`)
- Check build logs for specific errors

---

For detailed deployment options, see [DEPLOYMENT.md](./DEPLOYMENT.md)

