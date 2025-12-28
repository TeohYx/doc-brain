# doc-brain
DocBrain lets teams upload their internal documents and instantly ask questions, get summaries, and extract information — privately.

## Project Setup

This project consists of a React frontend and Node.js/Express backend for uploading and managing PDF documents.

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:3001`

   For development with auto-reload:
   ```bash
   npm run dev
   ```

2. **Start the frontend development server:**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

### Features

- **Upload PDFs**: Drag and drop or select PDF files to upload
- **View Uploaded PDFs**: See all uploaded PDFs with metadata (name, size, upload date)
- **Download PDFs**: Download any uploaded PDF
- **Delete PDFs**: Remove PDFs from the system
- **Database Storage**: All PDF metadata is stored in SQLite database
- **File Storage**: PDF files are stored in `backend/uploads/` directory

### API Endpoints

- `GET /api/health` - Health check
- `POST /api/upload` - Upload a PDF file
- `GET /api/pdfs` - Get all uploaded PDFs
- `GET /api/pdfs/:id` - Get PDF metadata by ID
- `GET /api/pdfs/:id/download` - Download a PDF file
- `DELETE /api/pdfs/:id` - Delete a PDF

### Project Structure

```
doc-brain/
├── backend/
│   ├── server.js          # Express server and API routes
│   ├── package.json       # Backend dependencies
│   ├── uploads/           # PDF file storage (created automatically)
│   └── database.db        # SQLite database (created automatically)
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── App.css        # Component styles
│   │   ├── main.jsx       # React entry point
│   │   └── index.css      # Global styles
│   ├── index.html         # HTML template
│   ├── vite.config.js     # Vite configuration
│   └── package.json       # Frontend dependencies
└── README.md
```

### Notes

- Maximum file size: 50MB per PDF
- Only PDF files are accepted
- The database and uploads directory are created automatically on first run
- Make sure both servers are running for the application to work properly

## 🌐 Deployment to Online Server

To deploy this application to an online server:

1. **Quick Start**: See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for the fastest deployment guide
2. **Detailed Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment options

### Recommended Platforms:
- **Backend**: Render, Railway, or Heroku
- **Frontend**: Vercel or Netlify

### Environment Variables:

**Backend** (set in hosting platform):
- `FRONTEND_URL`: Your frontend URL (e.g., `https://your-app.vercel.app`)
- `PORT`: Usually auto-set by platform

**Frontend** (set in hosting platform):
- `VITE_API_URL`: Your backend URL + `/api` (e.g., `https://your-backend.onrender.com/api`)

See the deployment guides for step-by-step instructions!