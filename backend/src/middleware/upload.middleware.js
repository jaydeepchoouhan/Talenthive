const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const base = path.basename(file.originalname, extension).replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${base}${extension}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video uploads are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }
});

module.exports = { upload };
