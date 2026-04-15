# UpSkills Backend — Render Deployment Guide

## Project Structure
```
upskills-backend/
├── server.js              ← Entry point
├── package.json
├── .env.example           ← Copy to .env and fill in values
├── db/
│   ├── index.js           ← PostgreSQL connection + schema
│   └── mailer.js          ← Nodemailer email helper
├── middleware/
│   └── auth.js            ← JWT middleware
├── routes/
│   ├── auth.js            ← Register, Login, Verify
│   ├── enrollments.js     ← Enroll, My enrollments
│   └── courses.js         ← Courses + Admin routes
└── index.html             ← Updated frontend (deploy separately)
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | None | Create account |
| POST | /api/auth/login | None | Get JWT token |
| GET | /api/auth/verify?token= | None | Verify email |
| GET | /api/auth/me | JWT | Current user |
| POST | /api/enrollments | Optional JWT | Enroll in course |
| GET | /api/enrollments/mine | JWT | My enrollments |
| GET | /api/courses | None | All courses |
| GET | /api/courses/admin/stats | Admin JWT | Dashboard stats |
| GET | /api/courses/admin/students | Admin JWT | All students |
| GET | /api/courses/admin/enrollments | Admin JWT | All enrollments |
| POST | /api/courses/admin/courses | Admin JWT | Add course |
| POST | /api/courses/admin/seed | None | Create first admin |

---

## Step-by-Step Render Deployment

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/upskills-backend.git
git push -u origin main
```

### 2. Create PostgreSQL Database on Render
1. Go to https://dashboard.render.com
2. Click **New → PostgreSQL**
3. Name: `upskills-db`
4. Plan: **Free**
5. Click **Create Database**
6. Copy the **Internal Database URL** (use this for DATABASE_URL)

### 3. Deploy the Web Service
1. Click **New → Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name**: `upskills-backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 4. Add Environment Variables
In your Web Service → **Environment** tab, add:

```
DATABASE_URL        = (paste Internal Database URL from step 2)
JWT_SECRET          = (any long random string, e.g. generate at randomkeygen.com)
EMAIL_USER          = your_gmail@gmail.com
EMAIL_PASS          = your_gmail_app_password
ADMIN_EMAIL         = admin@upskills.ph
ADMIN_PASSWORD      = YourStrongPassword123!
FRONTEND_URL        = https://your-frontend-url.com (or * for now)
NODE_ENV            = production
```

### 5. Deploy & Seed Admin
After deploy, open your service URL in browser:
```
https://your-app.onrender.com/
```
Should show: `{"service":"UpSkills API","status":"running"}`

Then seed the admin account (one-time only):
```
POST https://your-app.onrender.com/api/courses/admin/seed
```
Use curl or Postman. After this works, the endpoint won't work again.

### 6. Update Frontend
In `index.html`, change this line:
```js
const API = 'https://YOUR-APP-NAME.onrender.com';
```
To your actual Render URL, then host `index.html` anywhere (Netlify, GitHub Pages, etc.)

---

## Gmail App Password Setup
1. Go to myaccount.google.com/security
2. Enable 2-Step Verification
3. Search "App passwords"
4. Create → App: Mail, Device: Other → type "UpSkills"
5. Copy the 16-character password → use as EMAIL_PASS

---

## Local Development
```bash
cp .env.example .env
# Fill in .env values
npm install
npm run dev
# Server runs at http://localhost:3000
```

⚠️ NOTE: Render free tier spins down after 15 min inactivity.
First request after idle takes ~30 seconds. Upgrade to Starter ($7/mo) to avoid this.
