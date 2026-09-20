const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const { sql, getPool } = require('./db');

const app = express();
const port = process.env.PORT || 8888;

// Serve HTML, CSS and JS from public/
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON and form-encoded requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create a new user account (username + password are hashed before storage).
app.post('/register', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  try {
    const pool = await getPool();
    const existing = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT Id FROM dbo.Users WHERE Username = @username');

    if (existing.recordset.length > 0) {
      return res.status(409).json({ success: false, message: 'Username already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.request()
      .input('username', sql.NVarChar, username)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .query('INSERT INTO dbo.Users (Username, PasswordHash) VALUES (@username, @passwordHash)');

    return res.status(201).json({ success: true, message: 'User created successfully.' });
  } catch (err) {
    console.error('Error registering user:', err);
    return res.status(500).json({ success: false, message: 'Server error while registering user.' });
  }
});

// Validate credentials against the Users table stored in SQL Server.
app.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT PasswordHash FROM dbo.Users WHERE Username = @username');

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'invalid username and/or password' });
    }

    const { PasswordHash } = result.recordset[0];
    const passwordMatches = await bcrypt.compare(password, PasswordHash);

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'invalid username and/or password' });
    }

    return res.json({ success: true, message: 'You have successfully logged in.' });
  } catch (err) {
    console.error('Error logging in:', err);
    return res.status(500).json({ success: false, message: 'Server error while logging in.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
