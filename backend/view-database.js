// view-database.js (PostgreSQL version)
const { Pool } = require('pg');
require('dotenv').config(); // if you use a .env file
const util = require('util');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    console.log('\n📊 PDF Database Contents\n');
    console.log('='.repeat(80));

    // Fetch all PDFs
    const result = await pool.query('SELECT * FROM pdfs ORDER BY upload_date DESC');
    const pdfs = result.rows;

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
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'pdfs'
      ORDER BY ordinal_position
    `);

    schemaResult.rows.forEach(col => {
      console.log(`  ${col.column_name} | ${col.data_type} | nullable: ${col.is_nullable}`);
    });

  } catch (err) {
    console.error('Error viewing database:', err);
  } finally {
    await pool.end();
    console.log('\nConnection closed.\n');
  }
}

main();
