# How to View Database in Production

Since your database is on Render's server, here are several ways to view it:

## 🌐 Option 1: Use Existing API Endpoint (Easiest)

You already have an endpoint that shows all database records:

**URL**: `https://your-backend-url.onrender.com/api/pdfs`

### How to Use:

1. **In Browser:**
   - Visit: `https://your-backend-url.onrender.com/api/pdfs`
   - You'll see a JSON array with all PDF records

2. **Using curl:**
   ```bash
   curl https://your-backend-url.onrender.com/api/pdfs
   ```

3. **Format JSON (Browser Extension):**
   - Install "JSON Formatter" extension
   - Visit the URL - it will format nicely

### Response Format:
```json
[
  {
    "id": "uuid-here",
    "original_name": "document.pdf",
    "stored_filename": "uuid-document.pdf",
    "file_size": 12345,
    "upload_date": "2024-01-01T12:00:00.000Z",
    "mime_type": "application/pdf"
  }
]
```

---

## 💻 Option 2: Use Render Shell (Direct Database Access)

### Step 1: Access Render Shell
1. Go to Render Dashboard
2. Click on your backend service
3. Look for "Shell" tab or "Logs" → "Shell"
4. Click to open terminal on Render's server

### Step 2: Run SQLite Commands

Once in the shell, run:

```bash
# Navigate to your app directory (usually already there)
cd /opt/render/project/src/backend

# Or find where your database is
find . -name "database.db"

# Open SQLite
sqlite3 database.db

# Now you're in SQLite prompt, run:
.tables                    # List all tables
.schema pdfs              # Show table structure
SELECT * FROM pdfs;       # View all records
.headers on              # Show column headers
.mode column             # Better formatting

# Count records
SELECT COUNT(*) FROM pdfs;

# View recent uploads
SELECT * FROM pdfs ORDER BY upload_date DESC LIMIT 10;

# Exit SQLite
.quit
```

---

## 📥 Option 3: Download Database File

### Using Render Shell:

1. **Access Shell** (see Option 2)

2. **Find Database File:**
   ```bash
   find . -name "database.db"
   ```

3. **View File Location:**
   ```bash
   ls -lh database.db
   ```

4. **Download Options:**
   - Render may have a file download feature
   - Or use `scp` if you have SSH access
   - Or copy file contents using `cat` (for small files)

5. **Open Locally:**
   - Download DB Browser for SQLite: https://sqlitebrowser.org/
   - Open the downloaded `database.db` file

---

## 🔧 Option 4: Add Database Viewing Endpoint

I can add a dedicated endpoint for viewing database with better formatting. Would you like me to add:

- `GET /api/database` - Returns formatted database info
- `GET /api/database/stats` - Returns statistics only

---

## 🌐 Option 5: Use Your Frontend

Your frontend already displays all PDFs from the database! Just:

1. Visit your frontend URL
2. The list shows all PDFs from database
3. Check browser DevTools → Network tab
4. Look at the `/api/pdfs` request response

---

## 📊 Quick Database Stats

### Using API:
```bash
# Get all PDFs
curl https://your-backend-url.onrender.com/api/pdfs | jq 'length'
# (jq formats JSON - install if needed)

# Or in browser console:
fetch('https://your-backend-url.onrender.com/api/pdfs')
  .then(r => r.json())
  .then(data => console.log('Total PDFs:', data.length))
```

### Using SQLite (in Render Shell):
```bash
sqlite3 database.db "SELECT COUNT(*) as total FROM pdfs;"
```

---

## 🎯 Recommended: Use `/api/pdfs` Endpoint

**Easiest way**: Just visit:
```
https://your-backend-url.onrender.com/api/pdfs
```

This shows all your database records in JSON format.

---

## 🔍 Database Schema

Your `pdfs` table has these columns:
- `id` - UUID (primary key)
- `original_name` - User's original filename
- `stored_filename` - Actual filename on disk
- `file_size` - Size in bytes
- `upload_date` - ISO timestamp
- `mime_type` - File MIME type

---

## 💡 Pro Tips

1. **Browser Extension**: Install "JSON Formatter" for Chrome/Firefox to view JSON nicely
2. **Postman**: Use Postman to test API endpoints
3. **jq**: Install `jq` for command-line JSON formatting
4. **Frontend**: Your frontend already shows database contents!

---

## 🚀 Quick Access

**Right now, you can view your database by visiting:**
```
https://your-backend-url.onrender.com/api/pdfs
```

Replace `your-backend-url` with your actual Render backend URL!

