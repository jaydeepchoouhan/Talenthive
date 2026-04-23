const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getDayBounds } = require('../utils/date');
const { generateAlphaPassword, generateNumericCode, generateResetCode } = require('../utils/password');
const { sanitizeAuthUser } = require('../utils/userResponse');
const {
  normalizeIdentifier,
  getDeliveryDestination,
  getRequestSecurityMeta,
  isChromeBrowser,
  isWithinMobileAccessWindow,
  getMobileAccessWindowLabel,
  recordLoginHistory
} = require('../utils/authSecurity');
const {
  sendResetMessage,
  sendAccountVerificationEmail,
  sendChromeLoginOtp
} = require('../services/email.service');
const { sendResetSms, sendAccountVerificationSms } = require('../services/sms.service');

const SUPPORTED_LANGUAGES = ['en', 'es', 'hi', 'pt', 'zh', 'fr'];
const OTP_EXPIRY_MS = 10 * 60 * 1000;

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function getUserLookup(identifier) {
  return {
    $or: [{ email: normalizeIdentifier(identifier) }, { phone: String(identifier || '').trim() }]
  };
}

async function sendAccountVerification(user) {
  const code = generateNumericCode(6);
  const channel = user.email ? 'email' : 'phone';
  let delivery;

  if (channel === 'email') {
    delivery = await sendAccountVerificationEmail({ to: user.email, code });
  } else {
    delivery = await sendAccountVerificationSms({ to: user.phone, code });
  }

  user.accountVerificationCode = code;
  user.accountVerificationCodeExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
  user.accountVerificationChannel = channel;
  user.accountVerificationSentAt = new Date();

  return {
    delivery,
    channel,
    destination: getDeliveryDestination({
      email: user.email,
      phone: user.phone,
      channel
    })
  };
}

async function issueChromeLoginOtp(user, meta) {
  const code = generateNumericCode(6);
  const delivery = await sendChromeLoginOtp({ to: user.email, code });

  user.chromeLoginCode = code;
  user.chromeLoginCodeExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
  user.chromeLoginSentAt = new Date();
  user.pendingChromeLogin = {
    browser: meta.browser,
    os: meta.os,
    deviceType: meta.deviceType,
    ipAddress: meta.ipAddress
  };

  return {
    delivery,
    destination: getDeliveryDestination({
      email: user.email,
      channel: 'email'
    })
  };
}

function isMobileDevice(meta) {
  return meta.deviceType === 'mobile';
}

function clearChromeLoginChallenge(user) {
  user.chromeLoginCode = '';
  user.chromeLoginCodeExpiry = null;
  user.chromeLoginSentAt = null;
  user.pendingChromeLogin = null;
}

async function register(req, res) {
  const { name, email, phone, password } = req.body;
  const requestedLanguage = SUPPORTED_LANGUAGES.includes(req.body.language) ? req.body.language : 'en';

  if (!name || !password || (!email && !phone)) {
    return res.status(400).json({ message: 'Name, password, and email or phone are required' });
  }

  const lookup = [];
  if (email) lookup.push({ email: normalizeIdentifier(email) });
  if (phone) lookup.push({ phone: String(phone).trim() });
  const existingUser = lookup.length ? await User.findOne({ $or: lookup }) : null;

  if (existingUser && existingUser.isAccountVerified !== false) {
    return res.status(409).json({ message: 'User already exists with this email or phone' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user =
    existingUser ||
    new User({
      email: email || undefined,
      phone: phone || undefined
    });

  user.name = name;
  user.email = email ? normalizeIdentifier(email) : undefined;
  user.phone = phone || undefined;
  user.password = hashedPassword;
  user.language = requestedLanguage === 'fr' ? 'en' : requestedLanguage;
  user.isAccountVerified = false;
  user.verifiedAt = null;

  const { delivery, channel, destination } = await sendAccountVerification(user);
  await user.save();

  return res.status(existingUser ? 200 : 201).json({
    requiresVerification: true,
    identifier: user.email || user.phone,
    channel,
    destination,
    message: existingUser
      ? 'Existing unverified account found. A fresh verification OTP has been sent.'
      : 'Account created. Verify with the OTP we sent.',
    devHint: delivery.delivered ? undefined : delivery.message
  });
}

async function login(req, res) {
  const { identifier, password } = req.body;
  const meta = getRequestSecurityMeta(req);

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Identifier and password are required' });
  }

  if (isMobileDevice(meta) && !isWithinMobileAccessWindow()) {
    return res.status(403).json({
      message: `Mobile logins are allowed only between ${getMobileAccessWindowLabel()}.`
    });
  }

  const user = await User.findOne(getUserLookup(identifier));

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (user.isAccountVerified === false) {
    const { delivery, channel, destination } = await sendAccountVerification(user);
    await user.save();

    return res.json({
      requiresVerification: true,
      identifier: user.email || user.phone,
      channel,
      destination,
      message: 'Verify your account before logging in',
      devHint: delivery.delivered ? undefined : delivery.message
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (isChromeBrowser(meta.browser)) {
    if (!user.email) {
      return res.status(403).json({ message: 'An email address is required for Google Chrome OTP login' });
    }

    const { delivery, destination } = await issueChromeLoginOtp(user, meta);
    await user.save();

    return res.json({
      requiresOtp: true,
      identifier: user.email,
      destination,
      browser: meta.browser,
      message: 'Google Chrome login OTP sent to email',
      devHint: delivery.delivered ? undefined : delivery.message
    });
  }

  clearChromeLoginChallenge(user);
  recordLoginHistory(user, meta, 'password');
  await user.save();

  return res.json({
    message: 'Login successful',
    token: signToken(user._id),
    user: sanitizeAuthUser(user)
  });
}

async function me(req, res) {
  return res.json({ user: sanitizeAuthUser(req.user) });
}

async function verifyAccount(req, res) {
  const identifier = normalizeIdentifier(req.body.identifier);
  const code = String(req.body.code || '').trim();

  if (!identifier || !code) {
    return res.status(400).json({ message: 'Identifier and verification code are required' });
  }

  const user = await User.findOne(getUserLookup(identifier));

  if (!user || user.isAccountVerified !== false) {
    return res.status(404).json({ message: 'No pending account verification found' });
  }

  if (
    !user.accountVerificationCode ||
    user.accountVerificationCode !== code ||
    !user.accountVerificationCodeExpiry ||
    user.accountVerificationCodeExpiry < new Date()
  ) {
    return res.status(400).json({ message: 'Invalid or expired account verification code' });
  }

  user.isAccountVerified = true;
  user.verifiedAt = new Date();
  user.accountVerificationCode = '';
  user.accountVerificationCodeExpiry = null;
  user.accountVerificationChannel = '';
  user.accountVerificationSentAt = null;
  await user.save();

  return res.json({
    message: 'Account verified successfully. Please log in to continue.'
  });
}

async function resendAccountVerificationOtp(req, res) {
  const identifier = normalizeIdentifier(req.body.identifier);

  if (!identifier) {
    return res.status(400).json({ message: 'Identifier is required' });
  }

  const user = await User.findOne(getUserLookup(identifier));

  if (!user || user.isAccountVerified !== false) {
    return res.status(404).json({ message: 'No pending account verification found' });
  }

  const { delivery, channel, destination } = await sendAccountVerification(user);
  await user.save();

  return res.json({
    channel,
    destination,
    message: 'Account verification OTP resent',
    devHint: delivery.delivered ? undefined : delivery.message
  });
}

async function verifyChromeLoginOtp(req, res) {
  const identifier = normalizeIdentifier(req.body.identifier);
  const code = String(req.body.code || '').trim();
  const meta = getRequestSecurityMeta(req);

  if (!identifier || !code) {
    return res.status(400).json({ message: 'Identifier and login OTP are required' });
  }

  if (isMobileDevice(meta) && !isWithinMobileAccessWindow()) {
    return res.status(403).json({
      message: `Mobile logins are allowed only between ${getMobileAccessWindowLabel()}.`
    });
  }

  if (!isChromeBrowser(meta.browser)) {
    return res.status(403).json({ message: 'Google Chrome login verification must be completed in Google Chrome' });
  }

  const user = await User.findOne(getUserLookup(identifier));

  if (!user || !user.chromeLoginCode) {
    return res.status(404).json({ message: 'No pending Google Chrome login OTP found' });
  }

  if (
    user.chromeLoginCode !== code ||
    !user.chromeLoginCodeExpiry ||
    user.chromeLoginCodeExpiry < new Date()
  ) {
    return res.status(400).json({ message: 'Invalid or expired login OTP' });
  }

  const loginMeta = user.pendingChromeLogin || meta;
  clearChromeLoginChallenge(user);
  recordLoginHistory(user, loginMeta, 'chrome-email-otp');
  await user.save();

  return res.json({
    message: 'Login successful',
    token: signToken(user._id),
    user: sanitizeAuthUser(user)
  });
}

async function resendChromeLoginOtp(req, res) {
  const identifier = normalizeIdentifier(req.body.identifier);
  const meta = getRequestSecurityMeta(req);

  if (!identifier) {
    return res.status(400).json({ message: 'Identifier is required' });
  }

  if (isMobileDevice(meta) && !isWithinMobileAccessWindow()) {
    return res.status(403).json({
      message: `Mobile logins are allowed only between ${getMobileAccessWindowLabel()}.`
    });
  }

  if (!isChromeBrowser(meta.browser)) {
    return res.status(403).json({ message: 'Google Chrome login verification must be completed in Google Chrome' });
  }

  const user = await User.findOne(getUserLookup(identifier));

  if (!user || !user.email || !user.chromeLoginCode) {
    return res.status(404).json({ message: 'No pending Google Chrome login OTP found' });
  }

  const { delivery, destination } = await issueChromeLoginOtp(user, meta);
  await user.save();

  return res.json({
    destination,
    message: 'Google Chrome login OTP resent',
    devHint: delivery.delivered ? undefined : delivery.message
  });
}

async function forgotPassword(req, res) {
  const identifier = String(req.body.identifier || '').trim();
  const method = String(req.body.method || '').trim().toLowerCase();

  if (!identifier || !method) {
    return res.status(400).json({ message: 'Identifier and reset method are required' });
  }

  const user = await User.findOne(getUserLookup(identifier));

  if (!user) {
    return res.status(404).json({ message: 'No account found for this email or phone' });
  }

  const { start, end } = getDayBounds();
  if (
    user.forgotPasswordLastRequestedAt &&
    user.forgotPasswordLastRequestedAt >= start &&
    user.forgotPasswordLastRequestedAt <= end
  ) {
    return res.status(429).json({
      message: 'Warning: you can use forgot password only one time per day.',
      type: 'warning'
    });
  }

  let delivery;
  const code = generateResetCode(6);
  if (method === 'email') {
    if (!user.email) {
      return res.status(400).json({ message: 'This account does not have an email' });
    }
    delivery = await sendResetMessage({ to: user.email, code });
  } else if (method === 'phone') {
    if (!user.phone) {
      return res.status(400).json({ message: 'This account does not have a phone number' });
    }
    delivery = await sendResetSms({ to: user.phone, code });
  } else {
    return res.status(400).json({ message: 'Method must be email or phone' });
  }

  user.resetCode = code;
  user.resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);
  user.resetChannel = method;
  user.forgotPasswordLastRequestedAt = new Date();
  await user.save();

  return res.json({
    message: delivery.message,
    devHint: delivery.delivered ? undefined : 'In development mode, check server console for the reset code.'
  });
}

async function resetPassword(req, res) {
  const identifier = String(req.body.identifier || '').trim();
  const code = String(req.body.code || '').trim().toUpperCase();
  const newPassword = String(req.body.newPassword || '');

  if (!identifier || !code || !newPassword) {
    return res.status(400).json({ message: 'Identifier, code, and new password are required' });
  }

  const user = await User.findOne(getUserLookup(identifier));

  if (!user) {
    return res.status(404).json({ message: 'No account found' });
  }

  if (!user.resetCode || user.resetCode !== code) {
    return res.status(400).json({ message: 'Invalid reset code' });
  }

  if (!user.resetCodeExpiry || user.resetCodeExpiry < new Date()) {
    return res.status(400).json({ message: 'Reset code expired' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetCode = '';
  user.resetCodeExpiry = null;
  user.resetChannel = '';
  await user.save();

  return res.json({ message: 'Password reset successful' });
}

function generatePassword(_req, res) {
  const password = generateAlphaPassword(12);
  return res.json({ password });
}

module.exports = {
  register,
  login,
  me,
  verifyAccount,
  resendAccountVerificationOtp,
  verifyChromeLoginOtp,
  resendChromeLoginOtp,
  forgotPassword,
  resetPassword,
  generatePassword
};
