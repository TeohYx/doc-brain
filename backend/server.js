const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS configuration - allow Vercel preview and production URLs
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

// Also allow any Vercel preview URLs (they contain the project name)
const vercelPreviewPattern = /https:\/\/.*\.vercel\.app$/;

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } 
    // Allow Vercel preview URLs (for preview deployments)
    else if (vercelPreviewPattern.test(origin)) {
      callback(null, true);
    } 
    else {
      // Log for debugging
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'database.db'));

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS pdfs (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    upload_date TEXT NOT NULL,
    mime_type TEXT NOT NULL
  )
`);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'DocBrain API Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      upload: 'POST /api/upload',
      getAllPdfs: 'GET /api/pdfs',
      getPdfById: 'GET /api/pdfs/:id',
      downloadPdf: 'GET /api/pdfs/:id/download',
      deletePdf: 'DELETE /api/pdfs/:id',
      adminDatabase: 'GET /admin/database'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Upload PDF
app.post('/api/upload', upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pdfId = uuidv4();
    const uploadDate = new Date().toISOString();

    // Insert into database
    const stmt = db.prepare(`
      INSERT INTO pdfs (id, original_name, stored_filename, file_size, upload_date, mime_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      pdfId,
      req.file.originalname,
      req.file.filename,
      req.file.size,
      uploadDate,
      req.file.mimetype
    );

    res.status(201).json({
      message: 'PDF uploaded successfully',
      pdf: {
        id: pdfId,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        uploadDate: uploadDate
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload PDF', details: error.message });
  }
});

// Get all PDFs
app.get('/api/pdfs', (req, res) => {
  try {
    const pdfs = db.prepare('SELECT * FROM pdfs ORDER BY upload_date DESC').all();
    res.json(pdfs);
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({ error: 'Failed to fetch PDFs', details: error.message });
  }
});

// Admin: View database table
app.get('/admin/database', (req, res) => {
  try {
    const pdfs = db.prepare('SELECT * FROM pdfs ORDER BY upload_date DESC').all();
    const total = pdfs.length;
    
    // Calculate total file size
    const totalSize = pdfs.reduce((sum, pdf) => sum + pdf.file_size, 0);
    
    // Format data for display
    const formattedPdfs = pdfs.map(pdf => ({
      ...pdf,
      file_size_kb: (pdf.file_size / 1024).toFixed(2),
      file_size_mb: (pdf.file_size / (1024 * 1024)).toFixed(2),
      upload_date_formatted: new Date(pdf.upload_date).toLocaleString()
    }));

    // Return HTML page for admin view
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DocBrain - Admin Database View</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 30px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
        }
        .stat-card {
            flex: 1;
            padding: 15px;
            background: white;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            position: sticky;
            top: 0;
        }
        td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        tr:hover {
            background: #f9f9f9;
        }
        .id-cell {
            font-family: monospace;
            font-size: 11px;
            color: #666;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .name-cell {
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .actions {
            display: flex;
            gap: 10px;
        }
        .btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            font-size: 12px;
        }
        .btn-view {
            background: #667eea;
            color: white;
        }
        .btn-download {
            background: #48bb78;
            color: white;
        }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #999;
        }
        .refresh-btn {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .refresh-btn:hover {
            background: #5568d3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 DocBrain - Database Admin View</h1>
        <p style="color: #666; margin-bottom: 20px;">Complete database table view</p>
        
        <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-label">Total PDFs</div>
                <div class="stat-value">${total}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Size</div>
                <div class="stat-value">${(totalSize / (1024 * 1024)).toFixed(2)} MB</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Database Records</div>
                <div class="stat-value">${total}</div>
            </div>
        </div>

        ${total === 0 ? `
            <div class="empty-state">
                <h2>No PDFs in database yet</h2>
                <p>Upload PDFs through the frontend to see them here.</p>
            </div>
        ` : `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Original Name</th>
                        <th>Stored Filename</th>
                        <th>File Size</th>
                        <th>Upload Date</th>
                        <th>MIME Type</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${formattedPdfs.map(pdf => `
                        <tr>
                            <td class="id-cell" title="${pdf.id}">${pdf.id.substring(0, 20)}...</td>
                            <td class="name-cell" title="${pdf.original_name}">${pdf.original_name}</td>
                            <td class="name-cell" title="${pdf.stored_filename}">${pdf.stored_filename}</td>
                            <td>${pdf.file_size_kb} KB<br><small style="color: #999;">${pdf.file_size_mb} MB</small></td>
                            <td>${pdf.upload_date_formatted}</td>
                            <td>${pdf.mime_type}</td>
                            <td class="actions">
                                <a href="/api/pdfs/${pdf.id}/download" class="btn btn-download" target="_blank">Download</a>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `}
    </div>
</body>
</html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error fetching database:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px;">
          <h1>Error</h1>
          <p>Failed to fetch database: ${error.message}</p>
        </body>
      </html>
    `);
  }
});

// Get PDF by ID
app.get('/api/pdfs/:id', (req, res) => {
  try {
    const pdf = db.prepare('SELECT * FROM pdfs WHERE id = ?').get(req.params.id);
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    res.json(pdf);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).json({ error: 'Failed to fetch PDF', details: error.message });
  }
});

// Download PDF
app.get('/api/pdfs/:id/download', (req, res) => {
  try {
    const pdf = db.prepare('SELECT * FROM pdfs WHERE id = ?').get(req.params.id);
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    const filePath = path.join(uploadsDir, pdf.stored_filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'PDF file not found on disk' });
    }

    res.download(filePath, pdf.original_name);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ error: 'Failed to download PDF', details: error.message });
  }
});

// Delete PDF
app.delete('/api/pdfs/:id', (req, res) => {
  try {
    const pdf = db.prepare('SELECT * FROM pdfs WHERE id = ?').get(req.params.id);
    
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // Delete file from disk
    const filePath = path.join(uploadsDir, pdf.stored_filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    db.prepare('DELETE FROM pdfs WHERE id = ?').run(req.params.id);

    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({ error: 'Failed to delete PDF', details: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB' });
    }
  }
  res.status(500).json({ error: error.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

