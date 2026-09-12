require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const demosRouter = require('./routes/demos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes - the frontend talks to these, never to Airtable directly.
app.use('/api/demos', demosRouter);

// Simple health check, useful when deploying
app.get('/api/health', (req, res) => {
  const configured = Boolean(process.env.AIRTABLE_TOKEN && process.env.AIRTABLE_BASE_ID);
  res.json({ ok: true, airtableConfigured: configured });
});

// Serve the frontend
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Demo Pipeline app running at http://localhost:${PORT}`);
  if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_BASE_ID) {
    console.warn('⚠️  AIRTABLE_TOKEN / AIRTABLE_BASE_ID not set. Copy .env.example to .env and fill them in.');
  }
});
