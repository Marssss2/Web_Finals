const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { pool } = require('../db');
const { sendVerificationEmail } = require('../db/mailer');

// ── REGISTER ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, track } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, track, verify_token)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role, verified`,
      [name, email, hashed, track || null, verifyToken]
    );

    // Send verification email (non-blocking)
    sendVerificationEmail(email, name, verifyToken).catch(e => console.error('Email error:', e));

    res.status(201).json({
      message: 'Account created! Check your email to verify.',
      user: rows[0]
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, verified: user.verified, track: user.track }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── VERIFY EMAIL ──────────────────────────────────────────────
router.get('/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token required' });

  try {
    const { rows } = await pool.query(
      `UPDATE users SET verified=true, verify_token=NULL WHERE verify_token=$1 RETURNING id, email`,
      [token]
    );
    if (!rows.length) return res.status(400).json({ error: 'Invalid or expired token' });

    // Redirect to frontend with success message
    res.redirect(`${process.env.FRONTEND_URL || '/'}?verified=true`);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── ME (get current user) ─────────────────────────────────────
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, track, verified, created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
