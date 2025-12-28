// server.js (Production-ready: Render + Supabase + Vercel)
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================
// PostgreSQL (Supabase) Setup
// ============================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Must be Supabase URL
  ssl: { rejectUnauthorized: false },         // Required for Supabase
  family: 4                                  // Force IPv4
});

const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

// Test DB connection on startup
pool.connect()
  .then(client => {
    console.log('✅ Connected to PostgreSQL successfully.');
    client.release();
  })
  .catch(err => console.error('❌ PostgreSQL connection error:', err.stack));

// ============================
// Middleware
// ============================

// CORS
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

const vercelPreviewPattern = /https:\/\/.*\.vercel\.app$/;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || vercelPreviewPattern.test(origin)) return callback(null, true);
    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================
// Uploads Setup
// ============================

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  }
});

// ============================
// Helper Function
// ============================
async function query(sql, params) {
  const res = await pool.query(sql, params);
  return res.rows;
}

// ============================
// Routes
// ============================

// Root
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
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Server is running' }));

// Upload PDF
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const pdfId = uuidv4();
    const uploadDate = new Date().toISOString();

    await pool.query(`
      INSERT INTO pdfs (id, original_name, stored_filename, file_size, upload_date, mime_type)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [pdfId, req.file.originalname, req.file.filename, req.file.size, uploadDate, req.file.mimetype]);

    res.status(201).json({
      message: 'PDF uploaded successfully',
      pdf: { id: pdfId, originalName: req.file.originalname, fileSize: req.file.size, uploadDate }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload PDF', details: error.message });
  }
});

// Get all PDFs
app.get('/api/pdfs', async (req, res) => {
  try {
    const pdfs = await query('SELECT * FROM pdfs ORDER BY upload_date DESC');
    res.json(pdfs);
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({ error: 'Failed to fetch PDFs', details: error.message });
  }
});

// Get PDF by ID
app.get('/api/pdfs/:id', async (req, res) => {
  try {
    const pdfs = await query('SELECT * FROM pdfs WHERE id = $1', [req.params.id]);
    if (!pdfs[0]) return res.status(404).json({ error: 'PDF not found' });
    res.json(pdfs[0]);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).json({ error: 'Failed to fetch PDF', details: error.message });
  }
});

// Download PDF
app.get('/api/pdfs/:id/download', async (req, res) => {
  try {
    const pdfs = await query('SELECT * FROM pdfs WHERE id = $1', [req.params.id]);
    const pdf = pdfs[0];
    if (!pdf) return res.status(404).json({ error: 'PDF not found' });

    const filePath = path.join(uploadsDir, pdf.stored_filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'PDF file not found on disk' });

    res.download(filePath, pdf.original_name);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ error: 'Failed to download PDF', details: error.message });
  }
});

// Delete PDF
app.delete('/api/pdfs/:id', async (req, res) => {
  try {
    const pdfs = await query('SELECT * FROM pdfs WHERE id = $1', [req.params.id]);
    const pdf = pdfs[0];
    if (!pdf) return res.status(404).json({ error: 'PDF not found' });

    const filePath = path.join(uploadsDir, pdf.stored_filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM pdfs WHERE id = $1', [req.params.id]);
    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({ error: 'Failed to delete PDF', details: error.message });
  }
});

// Admin database view (HTML)
app.get('/admin/database', async (req, res) => {
  try {
    const pdfs = await query('SELECT * FROM pdfs ORDER BY upload_date DESC');
    const total = pdfs.length;
    const totalSize = pdfs.reduce((sum, pdf) => sum + Number(pdf.file_size), 0);

    const formattedPdfs = pdfs.map(pdf => ({
      ...pdf,
      file_size_kb: (pdf.file_size / 1024).toFixed(2),
      file_size_mb: (pdf.file_size / (1024*1024)).toFixed(2),
      upload_date_formatted: new Date(pdf.upload_date).toLocaleString()
    }));

    let rowsHtml = formattedPdfs.map(pdf => `
      <tr>
        <td>${pdf.id.substring(0, 20)}...</td>
        <td>${pdf.original_name}</td>
        <td>${pdf.stored_filename}</td>
        <td>${pdf.file_size_kb} KB<br><small>${pdf.file_size_mb} MB</small></td>
        <td>${pdf.upload_date_formatted}</td>
        <td>${pdf.mime_type}</td>
        <td><a href="/api/pdfs/${pdf.id}/download" target="_blank">Download</a></td>
      </tr>
    `).join('');

    const html = `
      <html><head><title>DocBrain Admin</title></head>
      <body>
        <h1>📊 DocBrain - Database</h1>
        <p>Total PDFs: ${total} | Total Size: ${(totalSize/(1024*1024)).toFixed(2)} MB</p>
        ${total === 0 ? '<p>No PDFs yet</p>' : `<table border="1" cellpadding="5"><thead>
          <tr><th>ID</th><th>Original Name</th><th>Stored Filename</th>
          <th>Size</th><th>Upload Date</th><th>MIME Type</th><th>Actions</th></tr>
        </thead><tbody>${rowsHtml}</tbody></table>`}
      </body></html>
    `;
    res.send(html);
  } catch (error) {
    console.error('Error fetching database:', error);
    res.status(500).send(`<h1>Error: ${error.message}</h1>`);
  }
});

// ============================
// Error handling middleware
// ============================
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 50MB' });
  }
  res.status(500).json({ error: error.message || 'Internal server error' });
});

// ============================
// Start server
// ============================
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});