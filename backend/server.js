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

// Routes

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
      deletePdf: 'DELETE /api/pdfs/:id'
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

