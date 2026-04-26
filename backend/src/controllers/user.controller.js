const fs = require('fs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { generateNumericCode } = require('../utils/password');
const { uploadSingleMedia } = require('../utils/media');
const {
  sanitizeAuthUser,
  sanitizePublicUser,
  sanitizeResume,
  sanitizeInternshipApplications
} = require('../utils/userResponse');
const { sendFrenchLanguageOtp } = require('../services/email.service');

const SUPPORTED_LANGUAGES = ['en', 'es', 'hi', 'pt', 'zh', 'fr'];

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function cleanText(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function extractResumeSkills(...sources) {
  const combined = sources.join(' ');
  const tokens = combined
    .split(/[\n,/.|;:()-]+/)
    .map((value) => value.trim())
    .filter((value) => value.length >= 3 && value.length <= 24);

  const ignored = new Set([
    'with',
    'from',
    'that',
    'this',
    'have',
    'your',
    'will',
    'into',
    'looking',
    'student',
    'internship',
    'experience',
    'details',
    'qualification'
  ]);

  const unique = [];
  const seen = new Set();

  for (const token of tokens) {
    const normalized = token.toLowerCase();
    if (ignored.has(normalized) || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    unique.push(token.charAt(0).toUpperCase() + token.slice(1));

    if (unique.length === 8) {
      break;
    }
  }

  return unique;
}

function buildGeneratedSummary({ fullName, qualification, experience, personalDetails }) {
  const experienceSnippet = experience.split('\n')[0] || experience;
  const detailSnippet = personalDetails.split('\n')[0] || personalDetails;

  return `${fullName} is a ${qualification} candidate with practical experience in ${experienceSnippet}. ${detailSnippet} Looking for internship opportunities to contribute, learn quickly, and grow in a professional environment.`;
}

function buildResumePayload(user, fields, photoUrl) {
  const fullName = cleanText(fields.fullName || user.name);
  const qualification = cleanText(fields.qualification);
  const experience = cleanText(fields.experience);
  const personalDetails = cleanText(fields.personalDetails);

  if (!fullName || !qualification || !experience || !personalDetails) {
    return null;
  }

  return {
    fullName,
    qualification,
    experience,
    personalDetails,
    photo: photoUrl || user.resume?.photo || user.avatar || '',
    generatedSummary: buildGeneratedSummary({ fullName, qualification, experience, personalDetails }),
    generatedSkills: extractResumeSkills(qualification, experience, personalDetails),
    updatedAt: new Date()
  };
}

async function listUsers(req, res) {
  const users = await User.find({ _id: { $ne: req.user._id } })
    .select('name email phone language avatar bio friends friendRequestsSent friendRequestsReceived resume')
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  const currentUserId = req.user._id.toString();

  const mapped = users.map((user) => ({
    ...sanitizePublicUser(user),
    isFriend: user.friends.some((id) => id.toString() === currentUserId),
    requestSent: user.friendRequestsReceived.some((id) => id.toString() === currentUserId),
    requestReceived: user.friendRequestsSent.some((id) => id.toString() === currentUserId)
  }));

  return res.json({ users: mapped });
}

async function sendFriendRequest(req, res) {
  const { targetUserId } = req.params;

  if (!isValidObjectId(targetUserId)) {
    return res.status(404).json({ message: 'Target user not found' });
  }

  if (targetUserId === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
  }

  const sender = await User.findById(req.user._id);
  const target = await User.findById(targetUserId);

  if (!target) {
    return res.status(404).json({ message: 'Target user not found' });
  }

  const alreadyFriends = sender.friends.some((id) => id.toString() === targetUserId);
  if (alreadyFriends) {
    return res.status(400).json({ message: 'Already connected' });
  }

  const alreadySent = sender.friendRequestsSent.some((id) => id.toString() === targetUserId);
  if (alreadySent) {
    return res.status(400).json({ message: 'Friend request already sent' });
  }

  sender.friendRequestsSent.push(target._id);
  target.friendRequestsReceived.push(sender._id);
  await Promise.all([sender.save(), target.save()]);

  const io = req.app.get('io');
  io.to(`user:${target._id}`).emit('friend-request', { from: sender._id, name: sender.name });

  return res.json({ message: 'Friend request sent' });
}

async function acceptFriendRequest(req, res) {
  const { requesterId } = req.params;

  if (!isValidObjectId(requesterId)) {
    return res.status(404).json({ message: 'Requester not found' });
  }

  const currentUser = await User.findById(req.user._id);
  const requester = await User.findById(requesterId);

  if (!requester) {
    return res.status(404).json({ message: 'Requester not found' });
  }

  const hasRequest = currentUser.friendRequestsReceived.some((id) => id.toString() === requesterId);
  if (!hasRequest) {
    return res.status(400).json({ message: 'No pending request from this user' });
  }

  currentUser.friendRequestsReceived = currentUser.friendRequestsReceived.filter(
    (id) => id.toString() !== requesterId
  );
  requester.friendRequestsSent = requester.friendRequestsSent.filter(
    (id) => id.toString() !== currentUser._id.toString()
  );

  if (!currentUser.friends.some((id) => id.toString() === requesterId)) {
    currentUser.friends.push(requester._id);
  }
  if (!requester.friends.some((id) => id.toString() === currentUser._id.toString())) {
    requester.friends.push(currentUser._id);
  }

  await Promise.all([currentUser.save(), requester.save()]);

  const io = req.app.get('io');
  io.to(`user:${requester._id}`).emit('friend-accepted', { by: currentUser._id, name: currentUser.name });

  return res.json({ message: 'Friend request accepted' });
}

async function updateLanguage(req, res) {
  const language = String(req.body.language || '').trim().toLowerCase();

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({ message: 'Unsupported language' });
  }

  if (language === 'fr') {
    return res.status(403).json({ message: 'French requires email verification' });
  }

  const user = await User.findById(req.user._id);
  user.language = language;
  await user.save();

  return res.json({
    message: 'Preferred language updated',
    user: sanitizeAuthUser(user)
  });
}

async function requestFrenchLanguageOtp(req, res) {
  const user = await User.findById(req.user._id);

  if (!user.email) {
    return res.status(400).json({ message: 'Add an email address to your account to verify French' });
  }

  const code = generateNumericCode(6);
  const delivery = await sendFrenchLanguageOtp({ to: user.email, code });

  user.frenchLanguageOtp = code;
  user.frenchLanguageOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  return res.json({
    message: delivery.message,
    email: user.email,
    devHint: delivery.delivered ? undefined : 'In development mode, check server console for the French verification code.'
  });
}

async function verifyFrenchLanguageOtp(req, res) {
  const code = String(req.body.code || '').trim();

  if (!code) {
    return res.status(400).json({ message: 'Verification code is required' });
  }

  const user = await User.findById(req.user._id);

  if (
    !user.frenchLanguageOtp ||
    user.frenchLanguageOtp !== code ||
    !user.frenchLanguageOtpExpiry ||
    user.frenchLanguageOtpExpiry < new Date()
  ) {
    return res.status(400).json({ message: 'Invalid or expired verification code' });
  }

  user.language = 'fr';
  user.frenchLanguageOtp = '';
  user.frenchLanguageOtpExpiry = null;
  user.frenchLanguageVerifiedAt = new Date();
  await user.save();

  return res.json({
    message: 'French language activated successfully',
    user: sanitizeAuthUser(user)
  });
}

async function saveResume(req, res) {
  const user = await User.findById(req.user._id);

  if (req.file && !req.file.mimetype.startsWith('image/')) {
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(400).json({ message: 'Resume photo must be an image file' });
  }

  const uploadedPhoto = await uploadSingleMedia(req.file);
  const resume = buildResumePayload(user, req.body, uploadedPhoto?.url);

  if (!resume) {
    return res.status(400).json({
      message: 'Full name, qualification, experience, and personal details are required'
    });
  }

  user.name = resume.fullName;
  user.resume = resume;

  if (resume.photo) {
    user.avatar = resume.photo;
  }

  await user.save();

  return res.json({
    message: 'Resume created successfully',
    resume: sanitizeResume(user.resume),
    user: sanitizeAuthUser(user)
  });
}

async function applyForInternship(req, res) {
  const companyName = cleanText(req.body.companyName);
  const role = cleanText(req.body.role);
  const location = cleanText(req.body.location);
  const mode = cleanText(req.body.mode);
  const notes = cleanText(req.body.notes);

  if (!companyName || !role) {
    return res.status(400).json({ message: 'Company name and role are required' });
  }

  const user = await User.findById(req.user._id);
  const savedResume = sanitizeResume(user.resume);

  if (
    !savedResume ||
    !savedResume.fullName ||
    !savedResume.qualification ||
    !savedResume.experience ||
    !savedResume.personalDetails
  ) {
    return res.status(400).json({ message: 'Create your resume before applying for internships' });
  }

  user.internshipApplications.unshift({
    companyName,
    role,
    location,
    mode,
    notes,
    status: 'Applied',
    appliedAt: new Date(),
    resumeSnapshot: savedResume
  });

  await user.save();

  return res.status(201).json({
    message: 'Internship application submitted with your saved resume',
    application: sanitizeInternshipApplications([user.internshipApplications[0]])[0],
    user: sanitizeAuthUser(user)
  });
}

module.exports = {
  listUsers,
  sendFriendRequest,
  acceptFriendRequest,
  updateLanguage,
  requestFrenchLanguageOtp,
  verifyFrenchLanguageOtp,
  saveResume,
  applyForInternship
};
