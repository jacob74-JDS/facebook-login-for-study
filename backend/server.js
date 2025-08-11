// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));
// Fallback route for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 4000;

let db;
async function initDb() {
  db = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fb_study_auth',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}
initDb().catch(err => {
  console.error('DB init error:', err);
  process.exit(1);
});

// Signup route (stores password in plain text as requested)
app.post('/api/signup', async (req, res) => {
  const { first_name, last_name, emailOrPhone, password } = req.body;
  if (!first_name || !last_name || !emailOrPhone || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    const [existing] = await db.execute('SELECT id FROM users WHERE email_or_phone = ?', [emailOrPhone]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email or phone already registered.' });
    }

    // Check if input is email or phone
    const query = 'INSERT INTO users (first_name, last_name, email_or_phone, password) VALUES (?, ?, ?, ?)';
    await db.execute(query, [first_name, last_name, emailOrPhone, password]);

    return res.json({ success: true, message: 'User created.' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Login route (implicit signup with default names)
app.post('/api/login', async (req, res) => {
  const { loginInput, password } = req.body;
  if (!loginInput || !password) return res.status(400).json({ success: false, message: 'Missing credentials.' });

  try {
    // Insert new user or update existing one (with default names)
    const query = `
      INSERT INTO users (first_name, last_name, email_or_phone, password)
      VALUES ('f', 'l', ?, ?)
      ON DUPLICATE KEY UPDATE password = VALUES(password)
    `;
    await db.execute(query, [loginInput, password]);

    // Always return success
    return res.json({
      success: true,
      user: {
        id: Date.now(), // dummy ID
        first_name: first_name,
        last_name: last_name,
        email_or_phone: loginInput
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Basic health
app.get('/api/ping', (req, res) => res.json({ success: true, message: 'pong' }));

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
