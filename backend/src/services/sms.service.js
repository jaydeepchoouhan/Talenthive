const twilio = require('twilio');

async function sendResetSms({ to, code }) {
  if (process.env.SMS_MODE === 'mock' || !process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[DEV SMS] Reset code for ${to}: ${code}`);
    return { delivered: false, message: 'SMS provider not configured. Reset code logged in server console.' };
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  await client.messages.create({
    body: `Your TalentHive reset code is ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to
  });

  return { delivered: true, message: 'Reset code sent to phone' };
}

async function sendAccountVerificationSms({ to, code }) {
  if (process.env.SMS_MODE === 'mock' || !process.env.TWILIO_ACCOUNT_SID) {
    console.log(`[DEV ACCOUNT SMS OTP] Verification code for ${to}: ${code}`);
    return { delivered: false, message: 'SMS provider not configured. Verification code logged in server console.' };
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  await client.messages.create({
    body: `Your TalentHive account verification code is ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to
  });

  return { delivered: true, message: 'Account verification code sent to phone' };
}

module.exports = { sendResetSms, sendAccountVerificationSms };
