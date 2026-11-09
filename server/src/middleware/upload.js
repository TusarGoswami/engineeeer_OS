import multer from 'multer';

// Use memory storage for in-memory buffer inspection before saving or streaming to Cloudinary
const storage = multer.memoryStorage();

export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3 Megabytes cap for profile images
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) are allowed for avatars'), false);
    }
  },
});

export const resourceUpload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 Megabytes cap for lecture notes, PYQs, and textbooks
    files: 1,
  },
});

export default avatarUpload;
