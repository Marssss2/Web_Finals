const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ── Welcome / Enrollment Confirmation ──
async function sendEnrollmentEmail(to, name, course, track) {
  const subject = `🎉 You're enrolled in UpSkills!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#060910;font-family:'Helvetica Neue',Arial,sans-serif">
      <div style="max-width:600px;margin:40px auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.07)">
        <div style="background:linear-gradient(135deg,rgba(0,229,160,.15),rgba(59,130,246,.10));padding:40px 40px 30px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.07)">
          <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#00e5a0,#3b82f6);border-radius:12px;line-height:48px;font-size:22px;font-weight:800;color:#060910;text-align:center;margin-bottom:16px">U</div>
          <h1 style="margin:0;color:#eef2ff;font-size:26px;font-weight:800;letter-spacing:-0.5px">Welcome to UpSkills!</h1>
          <p style="margin:8px 0 0;color:#6b7a99;font-size:15px">Your learning journey starts now</p>
        </div>
        <div style="padding:36px 40px">
          <p style="color:#9aa3bb;font-size:15px;line-height:1.7;margin:0 0 20px">Hi <strong style="color:#eef2ff">${name}</strong>,</p>
          <p style="color:#9aa3bb;font-size:15px;line-height:1.7;margin:0 0 24px">You've successfully enrolled in <strong style="color:#00e5a0">${course}</strong>. Here's a summary of your enrollment:</p>

          <div style="background:#0d1117;border-radius:12px;padding:20px 24px;margin:0 0 28px;border:1px solid rgba(255,255,255,0.07)">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
              <span style="color:#6b7a99;font-size:13px">Course</span>
              <span style="color:#eef2ff;font-size:13px;font-weight:600">${course}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0">
              <span style="color:#6b7a99;font-size:13px">Track</span>
              <span style="color:#eef2ff;font-size:13px;font-weight:600">${track}</span>
            </div>
          </div>

          <p style="color:#9aa3bb;font-size:14px;line-height:1.7;margin:0 0 28px">
            Next steps: Log in to your account, access your course, and start building. Our community Discord is open 24/7 if you need help.
          </p>

          <div style="text-align:center">
            <a href="${process.env.FRONTEND_URL || '#'}" style="display:inline-block;background:#00e5a0;color:#060910;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none">Go to My Dashboard →</a>
          </div>
        </div>
        <div style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.07);text-align:center">
          <p style="color:#6b7a99;font-size:12px;margin:0">© 2026 UpSkills Inc. · <a href="#" style="color:#6b7a99">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({ from: `"UpSkills" <${process.env.EMAIL_USER}>`, to, subject, html });
}

// ── Email Verification ──
async function sendVerificationEmail(to, name, token) {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${token}`;
  const subject = `Verify your UpSkills account`;
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#060910;font-family:'Helvetica Neue',Arial,sans-serif">
      <div style="max-width:600px;margin:40px auto;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.07)">
        <div style="padding:40px;text-align:center">
          <div style="display:inline-block;width:48px;height:48px;background:linear-gradient(135deg,#00e5a0,#3b82f6);border-radius:12px;line-height:48px;font-size:22px;font-weight:800;color:#060910;text-align:center;margin-bottom:20px">U</div>
          <h1 style="margin:0 0 12px;color:#eef2ff;font-size:22px;font-weight:800">Verify your email</h1>
          <p style="color:#9aa3bb;font-size:15px;line-height:1.7;margin:0 0 28px">Hi ${name}! Click the button below to verify your UpSkills account. This link expires in 24 hours.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#00e5a0;color:#060910;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none">Verify My Account →</a>
          <p style="color:#6b7a99;font-size:12px;margin:24px 0 0">Or copy this link: <span style="color:#9aa3bb">${verifyUrl}</span></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({ from: `"UpSkills" <${process.env.EMAIL_USER}>`, to, subject, html });
}

module.exports = { sendEnrollmentEmail, sendVerificationEmail };
