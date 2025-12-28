// Simple script to view database contents
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.db'));

console.log('\n📊 PDF Database Contents\n');
console.log('='.repeat(80));

// Get all PDFs
const pdfs = db.prepare('SELECT * FROM pdfs ORDER BY upload_date DESC').all();

if (pdfs.length === 0) {
  console.log('\nNo PDFs in database yet.\n');
} else {
  console.log(`\nTotal PDFs: ${pdfs.length}\n`);
  console.log('-'.repeat(80));
  
  pdfs.forEach((pdf, index) => {
    console.log(`\n[${index + 1}] PDF Record:`);
    console.log(`  ID: ${pdf.id}`);
    console.log(`  Original Name: ${pdf.original_name}`);
    console.log(`  Stored Filename: ${pdf.stored_filename}`);
    console.log(`  File Size: ${(pdf.file_size / 1024).toFixed(2)} KB`);
    console.log(`  Upload Date: ${pdf.upload_date}`);
    console.log(`  MIME Type: ${pdf.mime_type}`);
    console.log('-'.repeat(80));
  });
}

// Show table structure
console.log('\n\n📋 Table Structure:\n');
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='pdfs'").get();
console.log(schema.sql);

db.close();
console.log('\n');

