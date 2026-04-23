function sanitizeResume(resume) {
  if (!resume) {
    return null;
  }

  return {
    fullName: resume.fullName || '',
    qualification: resume.qualification || '',
    experience: resume.experience || '',
    personalDetails: resume.personalDetails || '',
    photo: resume.photo || '',
    generatedSummary: resume.generatedSummary || '',
    generatedSkills: Array.isArray(resume.generatedSkills) ? resume.generatedSkills.filter(Boolean) : [],
    updatedAt: resume.updatedAt || null
  };
}

function sanitizeInternshipApplications(applications = []) {
  return applications
    .map((application) => ({
      _id: application._id,
      companyName: application.companyName || '',
      role: application.role || '',
      location: application.location || '',
      mode: application.mode || '',
      notes: application.notes || '',
      status: application.status || 'Applied',
      appliedAt: application.appliedAt || null,
      resumeSnapshot: sanitizeResume(application.resumeSnapshot)
    }))
    .sort((left, right) => new Date(right.appliedAt || 0) - new Date(left.appliedAt || 0));
}

function sanitizeLoginHistory(history = []) {
  return history
    .map((entry) => ({
      _id: entry._id,
      browser: entry.browser || 'Unknown Browser',
      os: entry.os || 'Unknown OS',
      deviceType: entry.deviceType || 'desktop',
      ipAddress: entry.ipAddress || 'Unknown IP',
      loginMethod: entry.loginMethod || 'password',
      loggedInAt: entry.loggedInAt || null
    }))
    .sort((left, right) => new Date(right.loggedInAt || 0) - new Date(left.loggedInAt || 0));
}

function sanitizeAuthUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    language: user.language || 'en',
    avatar: user.avatar,
    bio: user.bio,
    friends: user.friends,
    friendCount: user.friends.length,
    createdAt: user.createdAt,
    isAccountVerified: user.isAccountVerified !== false,
    verifiedAt: user.verifiedAt || null,
    resume: sanitizeResume(user.resume),
    internshipApplications: sanitizeInternshipApplications(user.internshipApplications || []),
    loginHistory: sanitizeLoginHistory(user.loginHistory || [])
  };
}

function sanitizePublicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    language: user.language || 'en',
    avatar: user.avatar,
    bio: user.bio,
    friendCount: user.friends.length,
    hasResume: Boolean(
      user.resume &&
        (user.resume.fullName || user.resume.qualification || user.resume.experience || user.resume.personalDetails)
    ),
    isFriend: false,
    requestSent: false,
    requestReceived: false
  };
}

module.exports = {
  sanitizeResume,
  sanitizeInternshipApplications,
  sanitizeLoginHistory,
  sanitizeAuthUser,
  sanitizePublicUser
};
