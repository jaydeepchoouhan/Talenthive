const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: '' },
    qualification: { type: String, trim: true, default: '' },
    experience: { type: String, trim: true, default: '' },
    personalDetails: { type: String, trim: true, default: '' },
    photo: { type: String, default: '' },
    generatedSummary: { type: String, trim: true, default: '' },
    generatedSkills: [{ type: String, trim: true }],
    updatedAt: { type: Date }
  },
  { _id: false }
);

const internshipApplicationSchema = new mongoose.Schema(
  {
    companyName: { type: String, trim: true, required: true },
    role: { type: String, trim: true, required: true },
    location: { type: String, trim: true, default: '' },
    mode: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    status: { type: String, trim: true, default: 'Applied' },
    appliedAt: { type: Date, default: Date.now },
    resumeSnapshot: { type: resumeSchema, default: null }
  },
  { _id: true }
);

const loginHistorySchema = new mongoose.Schema(
  {
    browser: { type: String, trim: true, default: 'Unknown Browser' },
    os: { type: String, trim: true, default: 'Unknown OS' },
    deviceType: { type: String, trim: true, default: 'desktop' },
    ipAddress: { type: String, trim: true, default: 'Unknown IP' },
    loginMethod: { type: String, trim: true, default: 'password' },
    loggedInAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const pendingChromeLoginSchema = new mongoose.Schema(
  {
    browser: { type: String, trim: true, default: '' },
    os: { type: String, trim: true, default: '' },
    deviceType: { type: String, trim: true, default: '' },
    ipAddress: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    phone: { type: String, trim: true, unique: true, sparse: true },
    password: { type: String, required: true },
    language: {
      type: String,
      enum: ['en', 'es', 'hi', 'pt', 'zh', 'fr'],
      default: 'en'
    },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    resetCode: { type: String, default: '' },
    resetCodeExpiry: { type: Date },
    resetChannel: { type: String, enum: ['email', 'phone', ''], default: '' },
    forgotPasswordLastRequestedAt: { type: Date },
    isAccountVerified: { type: Boolean, default: true },
    accountVerificationCode: { type: String, default: '' },
    accountVerificationCodeExpiry: { type: Date },
    accountVerificationChannel: { type: String, enum: ['email', 'phone', ''], default: '' },
    accountVerificationSentAt: { type: Date },
    verifiedAt: { type: Date },
    chromeLoginCode: { type: String, default: '' },
    chromeLoginCodeExpiry: { type: Date },
    chromeLoginSentAt: { type: Date },
    pendingChromeLogin: { type: pendingChromeLoginSchema, default: null },
    frenchLanguageOtp: { type: String, default: '' },
    frenchLanguageOtpExpiry: { type: Date },
    frenchLanguageVerifiedAt: { type: Date },
    resume: { type: resumeSchema, default: null },
    internshipApplications: { type: [internshipApplicationSchema], default: [] },
    loginHistory: { type: [loginHistorySchema], default: [] }
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
