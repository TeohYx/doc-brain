# Backend API Flow - Detailed Explanation

This document explains step-by-step what happens in the backend when any API endpoint is called.

## 📋 Table of Contents
1. [Server Initialization](#server-initialization)
2. [Request Flow Overview](#request-flow-overview)
3. [Middleware Stack](#middleware-stack)
4. [API Endpoints Detailed Flow](#api-endpoints-detailed-flow)
5. [Error Handling](#error-handling)

---

## 🚀 Server Initialization

When `server.js` starts, the following happens **once** (before any requests):

### 1. **Module Imports** (Lines 1-7)
```javascript
const express = require('express');
const multer = require('multer');
const cors = require('cors');
// ... etc
```
- Loads all required Node.js modules
- `express`: Web framework for handling HTTP requests
- `multer`: Middleware for handling file uploads
- `cors`: Enables Cross-Origin Resource Sharing
- `path`, `fs`: Node.js built-in modules for file system operations
- `uuid`: Generates unique identifiers
- `better-sqlite3`: SQLite database driver

### 2. **Express App Creation** (Line 9)
```javascript
const app = express();
```
- Creates an Express application instance
- This `app` object handles all HTTP requests

### 3. **Port Configuration** (Line 10)
```javascript
const PORT = process.env.PORT || 3001;
```
- Sets server port to environment variable or defaults to 3001

### 4. **Middleware Registration** (Lines 13-15)
```javascript
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```
- **CORS**: Allows frontend (localhost:3000) to make requests to backend (localhost:3001)
- **express.json()**: Parses JSON request bodies
- **express.urlencoded()**: Parses URL-encoded form data

### 5. **Uploads Directory Setup** (Lines 18-21)
```javascript
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
```
- Creates `backend/uploads/` directory if it doesn't exist
- This is where PDF files will be stored

### 6. **Multer Configuration** (Lines 24-46)
```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => { ... },
  filename: (req, file, cb) => { ... }
});
```
- **Storage Strategy**: Files saved to disk (not memory)
- **Destination**: All files go to `backend/uploads/`
- **Filename**: Generates unique filename using UUID + original name
  - Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890-document.pdf`
- **File Size Limit**: 50MB maximum
- **File Filter**: Only accepts files with MIME type `application/pdf`

### 7. **Database Initialization** (Lines 49-61)
```javascript
const db = new Database(path.join(__dirname, 'database.db'));
db.exec(`CREATE TABLE IF NOT EXISTS pdfs ...`);
```
- Opens/creates SQLite database file `database.db`
- Creates `pdfs` table with columns:
  - `id`: Unique identifier (UUID)
  - `original_name`: User's original filename
  - `stored_filename`: Actual filename on disk
  - `file_size`: Size in bytes
  - `upload_date`: ISO timestamp
  - `mime_type`: File MIME type

### 8. **Route Registration** (Lines 66-182)
- All API endpoints are registered with Express
- Routes are matched in order (first match wins)

### 9. **Error Handler Registration** (Lines 185-192)
- Global error handling middleware

### 10. **Server Start** (Lines 194-196)
```javascript
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```
- Starts listening for incoming HTTP requests on the specified port

---

## 🔄 Request Flow Overview

When a client makes an HTTP request, here's the general flow:

```
1. HTTP Request arrives at server
   ↓
2. Express receives request
   ↓
3. Middleware Stack (in order):
   - CORS middleware
   - JSON parser
   - URL-encoded parser
   ↓
4. Route Matching
   - Express checks URL path and HTTP method
   - Matches to appropriate route handler
   ↓
5. Route-Specific Middleware (if any)
   - e.g., multer for file uploads
   ↓
6. Route Handler Execution
   - Business logic runs
   - Database operations
   - File operations
   ↓
7. Response Sent
   - JSON response or file download
   ↓
8. Error Handler (if error occurred)
```

---

## 🛡️ Middleware Stack

### Execution Order for Every Request:

1. **CORS Middleware** (`app.use(cors())`)
   - Adds CORS headers to response
   - Allows frontend to make cross-origin requests
   - Headers added: `Access-Control-Allow-Origin: *`

2. **JSON Parser** (`app.use(express.json())`)
   - Parses request body if `Content-Type: application/json`
   - Makes parsed data available in `req.body`
   - Only runs if request has JSON body

3. **URL-Encoded Parser** (`app.use(express.urlencoded())`)
   - Parses request body if `Content-Type: application/x-www-form-urlencoded`
   - Makes parsed data available in `req.body`
   - Only runs if request has URL-encoded body

---

## 📍 API Endpoints Detailed Flow

### 1. **GET /api/health** - Health Check

**Purpose**: Simple endpoint to verify server is running

**Flow**:
```
Request: GET http://localhost:3001/api/health
  ↓
1. Middleware runs (CORS, JSON parser - no body to parse)
  ↓
2. Route handler executes (Line 66-68)
  ↓
3. Immediately returns JSON response:
   {
     "status": "ok",
     "message": "Server is running"
   }
  ↓
4. Response sent with status 200
```

**No database or file operations** - fastest endpoint

---

### 2. **POST /api/upload** - Upload PDF

**Purpose**: Accept PDF file upload, save to disk, store metadata in database

**Flow**:
```
Request: POST http://localhost:3001/api/upload
Body: multipart/form-data with PDF file
  ↓
1. Middleware runs (CORS)
  ↓
2. Multer middleware executes (upload.single('pdf'))
   - Intercepts request before route handler
   - Validates file:
     * Checks MIME type is 'application/pdf'
     * Checks file size < 50MB
   - If valid:
     * Generates unique filename: UUID + original name
     * Saves file to backend/uploads/
     * Attaches file info to req.file object
   - If invalid:
     * Rejects request, error sent to error handler
  ↓
3. Route handler executes (Line 71-108)
   ↓
4. Check if file exists:
   if (!req.file) {
     return 400 error
   }
   ↓
5. Generate PDF ID:
   const pdfId = uuidv4(); // e.g., "a1b2c3d4-..."
   ↓
6. Get current timestamp:
   const uploadDate = new Date().toISOString();
   ↓
7. Prepare SQL INSERT statement:
   INSERT INTO pdfs (id, original_name, stored_filename, ...)
   VALUES (?, ?, ?, ...)
   ↓
8. Execute database insert:
   stmt.run(pdfId, originalName, storedFilename, ...)
   - Saves metadata to database
   ↓
9. Return success response (201 Created):
   {
     "message": "PDF uploaded successfully",
     "pdf": {
       "id": "...",
       "originalName": "document.pdf",
       "fileSize": 12345,
       "uploadDate": "2024-01-01T12:00:00.000Z"
     }
   }
```

**What gets stored**:
- **Database**: Metadata (id, name, size, date, etc.)
- **Disk**: Actual PDF file in `backend/uploads/`

**Error Cases**:
- No file uploaded → 400 Bad Request
- File too large → 400 (handled by multer)
- Not a PDF → 400 (handled by multer)
- Database error → 500 Internal Server Error

---

### 3. **GET /api/pdfs** - Get All PDFs

**Purpose**: Retrieve list of all uploaded PDFs with their metadata

**Flow**:
```
Request: GET http://localhost:3001/api/pdfs
  ↓
1. Middleware runs (CORS, JSON parser - no body)
  ↓
2. Route handler executes (Line 111-119)
   ↓
3. Prepare SQL SELECT statement:
   SELECT * FROM pdfs ORDER BY upload_date DESC
   ↓
4. Execute database query:
   const pdfs = db.prepare(...).all();
   - Returns array of all PDF records
   - Sorted by newest first (DESC)
   ↓
5. Return JSON response (200 OK):
   [
     {
       "id": "uuid-1",
       "original_name": "doc1.pdf",
       "stored_filename": "uuid-1-doc1.pdf",
       "file_size": 12345,
       "upload_date": "2024-01-01T12:00:00.000Z",
       "mime_type": "application/pdf"
     },
     { ... }
   ]
```

**No file operations** - only database query

---

### 4. **GET /api/pdfs/:id** - Get PDF by ID

**Purpose**: Get metadata for a specific PDF

**Flow**:
```
Request: GET http://localhost:3001/api/pdfs/a1b2c3d4-...
  ↓
1. Middleware runs
  ↓
2. Route handler executes (Line 122-135)
   ↓
3. Extract ID from URL parameter:
   req.params.id = "a1b2c3d4-..."
   ↓
4. Prepare SQL SELECT with WHERE clause:
   SELECT * FROM pdfs WHERE id = ?
   ↓
5. Execute database query:
   const pdf = db.prepare(...).get(req.params.id);
   - Returns single record or undefined
   ↓
6. Check if PDF exists:
   if (!pdf) {
     return 404 Not Found
   }
   ↓
7. Return JSON response (200 OK):
   {
     "id": "...",
     "original_name": "document.pdf",
     ...
   }
```

**Error Cases**:
- PDF not found → 404 Not Found

---

### 5. **GET /api/pdfs/:id/download** - Download PDF

**Purpose**: Download the actual PDF file

**Flow**:
```
Request: GET http://localhost:3001/api/pdfs/a1b2c3d4-.../download
  ↓
1. Middleware runs
  ↓
2. Route handler executes (Line 138-157)
   ↓
3. Query database for PDF metadata:
   const pdf = db.prepare('SELECT * FROM pdfs WHERE id = ?').get(id);
   ↓
4. Check if PDF exists in database:
   if (!pdf) {
     return 404 Not Found
   }
   ↓
5. Construct file path:
   const filePath = path.join(uploadsDir, pdf.stored_filename);
   // e.g., "backend/uploads/uuid-document.pdf"
   ↓
6. Check if file exists on disk:
   if (!fs.existsSync(filePath)) {
     return 404 Not Found
   }
   ↓
7. Send file as download:
   res.download(filePath, pdf.original_name);
   - Sets headers:
     * Content-Type: application/pdf
     * Content-Disposition: attachment; filename="original.pdf"
   - Streams file to client
   - Client receives file with original filename
```

**Two-step verification**:
1. Check database (metadata exists)
2. Check file system (file exists on disk)

**Error Cases**:
- PDF not in database → 404
- File missing from disk → 404

---

### 6. **DELETE /api/pdfs/:id** - Delete PDF

**Purpose**: Remove PDF from both database and file system

**Flow**:
```
Request: DELETE http://localhost:3001/api/pdfs/a1b2c3d4-...
  ↓
1. Middleware runs
  ↓
2. Route handler executes (Line 160-182)
   ↓
3. Query database for PDF:
   const pdf = db.prepare('SELECT * FROM pdfs WHERE id = ?').get(id);
   ↓
4. Check if PDF exists:
   if (!pdf) {
     return 404 Not Found
   }
   ↓
5. Construct file path:
   const filePath = path.join(uploadsDir, pdf.stored_filename);
   ↓
6. Delete file from disk:
   if (fs.existsSync(filePath)) {
     fs.unlinkSync(filePath);  // Removes file from filesystem
   }
   ↓
7. Delete record from database:
   db.prepare('DELETE FROM pdfs WHERE id = ?').run(id);
   ↓
8. Return success response (200 OK):
   {
     "message": "PDF deleted successfully"
   }
```

**Two-step deletion**:
1. Delete file from disk
2. Delete record from database

**Why both?**
- Database record without file = orphaned metadata
- File without database record = orphaned file (takes up space)

---

## ⚠️ Error Handling

### Error Handler Middleware (Lines 185-192)

This runs **after** all route handlers. It catches errors that weren't handled.

**Flow**:
```
Error occurs in route handler
  ↓
Error bubbles up to error handler
  ↓
Error handler checks error type:
  ↓
If MulterError (file upload error):
  - Check if LIMIT_FILE_SIZE
  - Return 400 with "File too large" message
  ↓
Otherwise:
  - Return 500 with error message
```

**Error Types Handled**:
- `MulterError`: File upload errors (size limit, etc.)
- Generic errors: Any other unexpected errors

**Error Response Format**:
```json
{
  "error": "Error message here"
}
```

---

## 🔍 Key Concepts

### 1. **Middleware Execution Order**
- Middleware runs **before** route handlers
- Order matters: CORS → JSON → URL-encoded → Routes

### 2. **Request Object (`req`)**
- `req.body`: Parsed request body (JSON or form data)
- `req.file`: Uploaded file info (from multer)
- `req.params`: URL parameters (e.g., `:id`)
- `req.query`: Query string parameters

### 3. **Response Object (`res`)**
- `res.json()`: Send JSON response
- `res.status()`: Set HTTP status code
- `res.download()`: Send file as download

### 4. **Database Operations**
- `db.prepare()`: Prepare SQL statement (reusable)
- `.get()`: Execute and get single row
- `.all()`: Execute and get all rows
- `.run()`: Execute without returning data (INSERT, DELETE, UPDATE)

### 5. **File System Operations**
- `fs.existsSync()`: Check if file/directory exists
- `fs.mkdirSync()`: Create directory
- `fs.unlinkSync()`: Delete file

---

## 📊 Request/Response Examples

### Upload Request:
```http
POST /api/upload HTTP/1.1
Content-Type: multipart/form-data
Content-Length: 12345

[PDF file binary data]
```

### Upload Response:
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "message": "PDF uploaded successfully",
  "pdf": {
    "id": "a1b2c3d4-...",
    "originalName": "document.pdf",
    "fileSize": 12345,
    "uploadDate": "2024-01-01T12:00:00.000Z"
  }
}
```

---

This completes the detailed explanation of the backend API flow!

