const nodemailer = require('nodemailer');

function buildTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendResetMessage({ to, code }) {
  const transporter = buildTransporter();

  if (!transporter) {
    console.log(`[DEV EMAIL] Reset code for ${to}: ${code}`);
    return { delivered: false, message: 'SMTP not configured. Reset code logged in server console.' };
  }

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'TalentHive Password Reset',
    html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>Your reset code is:</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">${code}</div>
      <p>This code expires in 15 minutes.</p>
    </div>`
  });

  return { delivered: true, message: 'Reset code sent to email' };
}

async function sendFrenchLanguageOtp({ to, code }) {
  const transporter = buildTransporter();

  if (!transporter) {
    console.log(`[DEV FRENCH OTP] Verification code for ${to}: ${code}`);
    return { delivered: false, message: 'SMTP not configured. French verification code logged in server console.' };
  }

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'TalentHive French Language Verification',
    html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc;">
      <h2 style="color: #2563eb;">French Language Verification</h2>
      <p>Use this OTP to enable French on your TalentHive account:</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">${code}</div>
      <p>This code expires in 10 minutes.</p>
    </div>`
  });

  return { delivered: true, message: 'French verification code sent to email' };
}

async function sendAccountVerificationEmail({ to, code }) {
  const transporter = buildTransporter();

  if (!transporter) {
    console.log(`[DEV ACCOUNT OTP] Verification code for ${to}: ${code}`);
    return { delivered: false, message: 'SMTP not configured. Verification code logged in server console.' };
  }

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'TalentHive Account Verification',
    html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc;">
      <h2 style="color: #2563eb;">Verify Your TalentHive Account</h2>
      <p>Use this OTP to verify your account and activate sign in:</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">${code}</div>
      <p>This code expires in 10 minutes.</p>
    </div>`
  });

  return { delivered: true, message: 'Account verification code sent to email' };
}

async function sendChromeLoginOtp({ to, code }) {
  const transporter = buildTransporter();

  if (!transporter) {
    console.log(`[DEV CHROME LOGIN OTP] Login code for ${to}: ${code}`);
    return { delivered: false, message: 'SMTP not configured. Login OTP logged in server console.' };
  }

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'TalentHive Google Chrome Login OTP',
    html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc;">
      <h2 style="color: #2563eb;">Google Chrome Login Verification</h2>
      <p>Use this OTP to finish signing in to TalentHive from Google Chrome:</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">${code}</div>
      <p>This code expires in 10 minutes.</p>
    </div>`
  });

  return { delivered: true, message: 'Google Chrome login OTP sent to email' };
}

module.exports = {
  sendResetMessage,
  sendFrenchLanguageOtp,
  sendAccountVerificationEmail,
  sendChromeLoginOtp
};
