'use strict';

const express = require('express');
const mysql   = require('mysql2/promise');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MySQL connection pool (reads all config from env vars) ───────────────────
const pool = mysql.createPool({
  host              : process.env.DB_HOST,
  port              : parseInt(process.env.DB_PORT || '3306', 10),
  user              : process.env.DB_USER,
  password          : process.env.DB_PASSWORD,
  database          : process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit   : 10,
  queueLimit        : 0,
  // Automatically reconnect on lost connection
  enableKeepAlive   : true,
  keepAliveInitialDelay: 10000,
});

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /  →  simple OK response
app.get('/', (req, res) => {
  res.json({
    message : 'Backend is running ✅',
    service : 'backend',
    timestamp: new Date().toISOString(),
  });
});

// GET /health  →  actively checks MySQL and returns status in JSON
app.get('/health', async (req, res) => {
  let dbStatus   = 'disconnected';
  let dbMessage  = '';
  let httpStatus = 200;

  try {
    const conn = await pool.getConnection();
    await conn.ping();          // actual DB round-trip
    conn.release();
    dbStatus  = 'connected';
    dbMessage = 'MySQL ping successful';
  } catch (err) {
    dbStatus   = 'disconnected';
    dbMessage  = err.message;
    httpStatus = 503;
  }

  res.status(httpStatus).json({
    status   : httpStatus === 200 ? 'healthy' : 'unhealthy',
    service  : 'backend',
    database : dbStatus,
    db_message: dbMessage,
    timestamp: new Date().toISOString(),
  });
});

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[backend] Server listening on port ${PORT}`);
  console.log(`[backend] DB_HOST=${process.env.DB_HOST}  DB_NAME=${process.env.DB_NAME}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[backend] SIGTERM received, shutting down...');
  pool.end().then(() => process.exit(0));
});