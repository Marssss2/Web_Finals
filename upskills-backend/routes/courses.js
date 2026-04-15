const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const { pool } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// ── PUBLIC: GET all courses ───────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM courses ORDER BY created_at ASC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── ADMIN: Dashboard stats ────────────────────────────────────
router.get('/admin/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [students, enrollments, courses] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users WHERE role='student'`),
      pool.query(`SELECT COUNT(*) FROM enrollments`),
      pool.query(`SELECT COUNT(*) FROM courses`)
    ]);

    const recentEnrollments = await pool.query(
      `SELECT e.*, u.verified FROM enrollments e
       LEFT JOIN users u ON e.user_id = u.id
       ORDER BY e.created_at DESC LIMIT 20`
    );

    res.json({
      stats: {
        totalStudents: parseInt(students.rows[0].count),
        totalEnrollments: parseInt(enrollments.rows[0].count),
        totalCourses: parseInt(courses.rows[0].count)
      },
      recentEnrollments: recentEnrollments.rows
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── ADMIN: Get all students ───────────────────────────────────
router.get('/admin/students', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, track, verified, role, created_at FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── ADMIN: Get all enrollments ────────────────────────────────
router.get('/admin/enrollments', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM enrollments ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── ADMIN: Add new course ─────────────────────────────────────
router.post('/admin/courses', authMiddleware, adminOnly, async (req, res) => {
  const { title, description, level, price, duration, image_url } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO courses (title, description, level, price, duration, image_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [title, description, level || 'Beginner', price || 0, duration, image_url]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── ADMIN: Seed default admin user ───────────────────────────
router.post('/admin/seed', async (req, res) => {
  // Only works if no admin exists yet
  try {
    const existing = await pool.query(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
    if (existing.rows.length) return res.status(409).json({ error: 'Admin already exists' });

    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin2026!', 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role, verified)
       VALUES ('Admin','${process.env.ADMIN_EMAIL || 'admin@upskills.ph'}','${hashed}','admin',true)
       RETURNING id, name, email, role`
    );
    res.status(201).json({ message: 'Admin created!', admin: rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
