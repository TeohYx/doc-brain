# How to Persist Database on Render

Your database is resetting because Render uses an **ephemeral filesystem** - files are lost on every deployment. Here's how to fix it:

## 🎯 Solution 1: Use Render Persistent Disk (Recommended for SQLite)

### Step 1: Create Persistent Disk in Render

1. Go to **Render Dashboard** → Your Backend Service
2. Click **"Settings"** tab
3. Scroll to **"Persistent Disks"** section
4. Click **"Add Persistent Disk"**
5. Configure:
   - **Name**: `data` (or any name)
   - **Mount Path**: `/data`
   - **Size**: 1GB (or more if needed)
6. Click **"Save"**

### Step 2: Update Environment Variables

In Render Dashboard → Your Backend Service → Environment:

Add these environment variables:
- **Key**: `DATA_DIR`
- **Value**: `/data`

- **Key**: `DATABASE_DIR`  
- **Value**: `/data`

### Step 3: Redeploy

After adding the persistent disk and environment variables:
1. Render will automatically redeploy
2. Or manually trigger a redeploy

### ✅ Result

Your database and uploads will now persist across deployments!

**Note**: Services with persistent disks cannot do zero-downtime deploys, but your data will persist.

---

## 🚀 Solution 2: Migrate to PostgreSQL (Best for Production)

For better scalability and reliability, migrate to PostgreSQL:

### Step 1: Create PostgreSQL Database on Render

1. Go to Render Dashboard
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `doc-brain-db`
   - **Database**: `docbrain`
   - **User**: Auto-generated
   - **Region**: Same as your backend
4. Click **"Create Database"**
5. **Copy the connection string** (Internal Database URL)

### Step 2: Install PostgreSQL Driver

```bash
cd backend
npm install pg
```

### Step 3: Update Code to Use PostgreSQL

I can help you migrate the code to PostgreSQL. The main changes:
- Replace `better-sqlite3` with `pg` (PostgreSQL client)
- Update database queries to PostgreSQL syntax
- Use connection pooling

### Step 4: Set Environment Variable

In Render Dashboard → Your Backend Service → Environment:

- **Key**: `DATABASE_URL`
- **Value**: (Your PostgreSQL connection string from Step 1)

### ✅ Advantages of PostgreSQL

- ✅ Data persists automatically
- ✅ Better for production
- ✅ Handles concurrent connections
- ✅ Can scale to multiple servers
- ✅ Built-in backups
- ✅ Better performance

---

## 🔧 Solution 3: Use Cloud Storage (Alternative)

Store database file in cloud storage (S3, etc.):

1. Upload database to S3 after changes
2. Download on startup
3. Sync periodically

**Not recommended** - Complex and not ideal for SQLite.

---

## 📊 Comparison

| Solution | Setup Time | Cost | Scalability | Recommended |
|----------|------------|------|-------------|-------------|
| **Persistent Disk** | 5 min | Free (small) | Limited | ✅ Quick fix |
| **PostgreSQL** | 30 min | Free tier | Excellent | ✅ Best long-term |
| **Cloud Storage** | 1 hour | Pay per use | Medium | ❌ Complex |

---

## 🎯 Recommended Approach

### **Right Now (Quick Fix):**
1. ✅ Add persistent disk to Render
2. ✅ Set `DATA_DIR=/data` environment variable
3. ✅ Redeploy

### **Later (Better Solution):**
1. Migrate to PostgreSQL when you have time
2. Better for production and scaling

---

## 📝 Current Code Changes

I've already updated your code to support persistent disks:

- Database path uses `DATABASE_DIR` environment variable
- Uploads directory uses `DATA_DIR` environment variable
- Falls back to local directory if not set

**You just need to:**
1. Add persistent disk in Render
2. Set environment variables
3. Redeploy

---

## 🔍 Verify It's Working

After setup:

1. Upload a PDF
2. Check `/admin/database` - should see your PDF
3. Trigger a redeploy
4. Check `/admin/database` again - PDF should still be there!

---

## 🐛 Troubleshooting

**Database still resetting?**
- Check environment variables are set correctly
- Verify persistent disk is attached
- Check disk mount path matches `DATA_DIR`
- Check Render logs for errors

**Can't create persistent disk?**
- Some Render plans may not support it
- Consider upgrading plan or using PostgreSQL

---

## 💡 Next Steps

1. **Immediate**: Set up persistent disk (5 minutes)
2. **Future**: Migrate to PostgreSQL (when scaling)

The code is already updated to support persistent disks - just configure it in Render!

