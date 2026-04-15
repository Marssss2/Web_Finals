require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { initDB } = require('./db');

const app = express();

// ── MIDDLEWARE ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service: 'UpSkills API',
    version: '1.0.0',
    status: 'running',
    time: new Date().toISOString()
  });
});

// ── ROUTES ────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/courses',     require('./routes/courses'));

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── ERROR HANDLER ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── START ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 UpSkills API running on port ${PORT}`);
      console.log(`   → http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ DB init failed:', err);
    process.exit(1);
  });
