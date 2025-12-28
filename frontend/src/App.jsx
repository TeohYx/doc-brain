import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function App() {
  const [pdfs, setPdfs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pdfs`);
      setPdfs(response.data);
    } catch (err) {
      console.error('Error fetching PDFs:', err);
      setError('Failed to load PDFs');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('PDF uploaded successfully!');
      setSelectedFile(null);
      document.getElementById('file-input').value = '';
      fetchPdfs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this PDF?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/pdfs/${id}`);
      setSuccess('PDF deleted successfully!');
      fetchPdfs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete PDF');
    }
  };

  const handleDownload = async (id, originalName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pdfs/${id}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to download PDF');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>📄 DocBrain</h1>
          <p>Upload and manage your PDF documents</p>
        </header>

        <div className="upload-section">
          <div className="upload-card">
            <h2>Upload PDF</h2>
            <div className="file-input-wrapper">
              <input
                id="file-input"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="file-input" className="file-label">
                {selectedFile ? selectedFile.name : 'Choose PDF file'}
              </label>
            </div>
            {selectedFile && (
              <div className="file-info">
                <p>File: {selectedFile.name}</p>
                <p>Size: {formatFileSize(selectedFile.size)}</p>
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="upload-button"
            >
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <div className="pdfs-section">
          <h2>Uploaded PDFs ({pdfs.length})</h2>
          {pdfs.length === 0 ? (
            <div className="empty-state">
              <p>No PDFs uploaded yet. Upload your first PDF above!</p>
            </div>
          ) : (
            <div className="pdf-list">
              {pdfs.map((pdf) => (
                <div key={pdf.id} className="pdf-card">
                  <div className="pdf-info">
                    <h3>{pdf.original_name}</h3>
                    <div className="pdf-details">
                      <span>Size: {formatFileSize(pdf.file_size)}</span>
                      <span>Uploaded: {formatDate(pdf.upload_date)}</span>
                    </div>
                  </div>
                  <div className="pdf-actions">
                    <button
                      onClick={() => handleDownload(pdf.id, pdf.original_name)}
                      className="action-button download-button"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(pdf.id)}
                      className="action-button delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

