const router  = require('express').Router();
const { pool } = require('../db');
const { sendEnrollmentEmail } = require('../db/mailer');
const { authMiddleware } = require('../middleware/auth');

// ── ENROLL (public — no login required) ──────────────────────
router.post('/', async (req, res) => {
  const { name, email, track, course } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

  try {
    // Check if already enrolled in same course
    const dup = await pool.query(
      'SELECT id FROM enrollments WHERE email=$1 AND course=$2',
      [email, course || 'General']
    );
    if (dup.rows.length) return res.status(409).json({ error: 'Already enrolled in this course!' });

    // Try to link to user account if exists
    const userRes = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    const userId = userRes.rows[0]?.id || null;

    const { rows } = await pool.query(
      `INSERT INTO enrollments (user_id, name, email, track, course, status)
       VALUES ($1,$2,$3,$4,$5,'confirmed') RETURNING *`,
      [userId, name, email, track || 'General', course || 'UpSkills']
    );

    // Update student count on course (non-blocking)
    if (course) {
      pool.query(
        `UPDATE courses SET students = students + 1 WHERE title=$1`,
        [course]
      ).catch(() => {});
    }

    // Send confirmation email (non-blocking)
    sendEnrollmentEmail(email, name, course || 'UpSkills', track || 'General')
      .catch(e => console.error('Email error:', e));

    res.status(201).json({ message: 'Enrolled successfully!', enrollment: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── MY ENROLLMENTS (authenticated student) ───────────────────
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM enrollments WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
