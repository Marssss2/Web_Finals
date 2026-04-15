const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDB() {
  const client = await pool.connect();
  try {
    // Users table (students + admin)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(150) NOT NULL,
        email       VARCHAR(200) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        role        VARCHAR(20) DEFAULT 'student',
        track       VARCHAR(100),
        verified    BOOLEAN DEFAULT false,
        verify_token VARCHAR(255),
        created_at  TIMESTAMP DEFAULT NOW()
      )
    `);

    // Enrollments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
        name        VARCHAR(150) NOT NULL,
        email       VARCHAR(200) NOT NULL,
        track       VARCHAR(100),
        course      VARCHAR(255),
        status      VARCHAR(30) DEFAULT 'pending',
        created_at  TIMESTAMP DEFAULT NOW()
      )
    `);

    // Courses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        level       VARCHAR(30) DEFAULT 'Beginner',
        price       INTEGER DEFAULT 0,
        duration    VARCHAR(20),
        students    INTEGER DEFAULT 0,
        image_url   TEXT,
        created_at  TIMESTAMP DEFAULT NOW()
      )
    `);

    // Seed default courses if empty
    const { rows } = await client.query('SELECT COUNT(*) FROM courses');
    if (parseInt(rows[0].count) === 0) {
      await client.query(`
        INSERT INTO courses (title, description, level, price, duration, students, image_url) VALUES
        ('HTML & CSS Fundamentals', 'Build your first webpage from scratch. Master layouts, Flexbox, Grid, and responsive design principles.', 'Beginner', 0, '6 hrs', 5200, 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&q=80'),
        ('JavaScript — Zero to Hero', 'Variables to async/await. A complete deep dive into modern JS with real exercises every step of the way.', 'Beginner', 0, '14 hrs', 4800, 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&q=80'),
        ('React & Next.js Bootcamp', 'Build production full-stack apps with the most popular React ecosystem tools used by top companies worldwide.', 'Intermediate', 499, '20 hrs', 3100, 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&q=80'),
        ('Python for Data Science', 'Pandas, NumPy, Matplotlib, and real datasets. Start your data career with hands-on analysis projects.', 'Beginner', 0, '10 hrs', 6300, 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&q=80'),
        ('Node.js & REST APIs', 'Design and deploy robust APIs with Express, PostgreSQL, and JWT authentication. Ship a real backend.', 'Intermediate', 499, '16 hrs', 2200, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80'),
        ('Machine Learning with Python', 'Neural networks, model training, and deployment. Build your first AI application from first principles.', 'Advanced', 799, '24 hrs', 1400, 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80')
      `);
    }

    console.log('✅ Database initialized');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
