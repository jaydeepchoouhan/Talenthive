function normalizeIdentifier(identifier) {
  const value = String(identifier || '').trim();
  return value.includes('@') ? value.toLowerCase() : value;
}

function maskEmail(email) {
  const [name = '', domain = ''] = String(email || '').split('@');
  if (!name || !domain) {
    return '';
  }

  const visibleName = name.length <= 2 ? name.charAt(0) : `${name.slice(0, 2)}***`;
  return `${visibleName}@${domain}`;
}

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\s+/g, '');
  if (digits.length <= 4) {
    return digits;
  }

  return `${'*'.repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
}

function getDeliveryDestination({ email, phone, channel }) {
  if (channel === 'email') {
    return maskEmail(email);
  }

  if (channel === 'phone') {
    return maskPhone(phone);
  }

  return '';
}

function normalizeIpAddress(ipAddress) {
  const value = String(ipAddress || '').trim();
  if (!value) {
    return 'Unknown IP';
  }

  if (value === '::1') {
    return '127.0.0.1';
  }

  return value.replace(/^::ffff:/, '');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.trim()) {
    return normalizeIpAddress(forwarded.split(',')[0]);
  }

  return normalizeIpAddress(req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || '');
}

function detectBrowser(userAgent = '') {
  const ua = userAgent.toLowerCase();

  if (ua.includes('edg/')) return 'Microsoft Edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
  if ((ua.includes('chrome/') || ua.includes('crios/')) && !ua.includes('edg/') && !ua.includes('opr/')) {
    return 'Google Chrome';
  }
  if (ua.includes('firefox/')) return 'Mozilla Firefox';
  if (ua.includes('safari/') && !ua.includes('chrome/') && !ua.includes('crios/')) return 'Safari';
  if (ua.includes('samsungbrowser/')) return 'Samsung Internet';

  return 'Unknown Browser';
}

function detectOs(userAgent = '') {
  const ua = userAgent.toLowerCase();

  if (ua.includes('windows nt')) return 'Windows';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'iOS';
  if (ua.includes('mac os x') || ua.includes('macintosh')) return 'macOS';
  if (ua.includes('cros')) return 'Chrome OS';
  if (ua.includes('linux')) return 'Linux';

  return 'Unknown OS';
}

function detectDeviceType(userAgent = '') {
  const ua = userAgent.toLowerCase();

  if (ua.includes('ipad') || ua.includes('tablet') || (ua.includes('android') && !ua.includes('mobile'))) {
    return 'tablet';
  }

  if (
    ua.includes('mobile') ||
    ua.includes('iphone') ||
    ua.includes('ipod') ||
    ua.includes('android') ||
    ua.includes('windows phone')
  ) {
    return 'mobile';
  }

  return 'desktop';
}

function parseUserAgent(userAgent = '') {
  return {
    browser: detectBrowser(userAgent),
    os: detectOs(userAgent),
    deviceType: detectDeviceType(userAgent),
    userAgent: String(userAgent || '')
  };
}

function getRequestSecurityMeta(req) {
  const userAgent = req.headers['user-agent'] || '';
  return {
    ...parseUserAgent(userAgent),
    ipAddress: getClientIp(req),
    capturedAt: new Date()
  };
}

function isChromeBrowser(browser) {
  return browser === 'Google Chrome';
}

function getTimezoneClock(date = new Date(), timeZone = process.env.MOBILE_LOGIN_TIMEZONE || 'Asia/Kolkata') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23'
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);

  return { hour, minute, timeZone };
}

function isWithinMobileAccessWindow(date = new Date()) {
  const timeZone = process.env.MOBILE_LOGIN_TIMEZONE || 'Asia/Kolkata';
  const startHour = Number(process.env.MOBILE_LOGIN_START_HOUR || 10);
  const endHour = Number(process.env.MOBILE_LOGIN_END_HOUR || 13);
  const { hour, minute } = getTimezoneClock(date, timeZone);
  const totalMinutes = hour * 60 + minute;
  const windowStart = startHour * 60;
  const windowEnd = (endHour + 1) * 60 - 1;

  return totalMinutes >= windowStart && totalMinutes <= windowEnd;
}

function getMobileAccessWindowLabel() {
  const timeZone = process.env.MOBILE_LOGIN_TIMEZONE || 'Asia/Kolkata';
  const startHour = Number(process.env.MOBILE_LOGIN_START_HOUR || 10);
  const endHour = Number(process.env.MOBILE_LOGIN_END_HOUR || 13);

  const startLabel = formatHourLabel(startHour, 0);
  const endLabel = formatHourLabel(endHour, 59);

  return `${startLabel} and ${endLabel} (${timeZone})`;
}

function formatHourLabel(hour, minute) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function recordLoginHistory(user, meta, loginMethod) {
  const entry = {
    browser: meta.browser || 'Unknown Browser',
    os: meta.os || 'Unknown OS',
    deviceType: meta.deviceType || 'desktop',
    ipAddress: meta.ipAddress || 'Unknown IP',
    loginMethod: loginMethod || 'password',
    loggedInAt: new Date()
  };

  user.loginHistory = [entry, ...(user.loginHistory || [])].slice(0, 20);
  return entry;
}

module.exports = {
  normalizeIdentifier,
  getDeliveryDestination,
  getRequestSecurityMeta,
  isChromeBrowser,
  isWithinMobileAccessWindow,
  getMobileAccessWindowLabel,
  recordLoginHistory
};
