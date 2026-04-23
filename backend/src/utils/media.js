const fs = require('fs');
const path = require('path');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

async function uploadMediaFiles(files = []) {
  const uploadedMedia = [];

  for (const file of files) {
    const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';

    if (isCloudinaryConfigured) {
      const result = await cloudinary.uploader.upload(file.path, { resource_type: resourceType });
      uploadedMedia.push({
        url: result.secure_url,
        publicId: result.public_id,
        resourceType
      });
      fs.unlinkSync(file.path);
    } else {
      uploadedMedia.push({
        url: `${process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`}/uploads/${path.basename(file.path)}`,
        publicId: '',
        resourceType
      });
    }
  }

  return uploadedMedia;
}

async function uploadSingleMedia(file) {
  if (!file) {
    return null;
  }

  const [uploaded] = await uploadMediaFiles([file]);
  return uploaded || null;
}

module.exports = {
  uploadMediaFiles,
  uploadSingleMedia
};
