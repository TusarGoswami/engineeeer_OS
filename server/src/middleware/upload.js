import multer from 'multer';
import { ValidationError } from './error.js';

// Use memory storage for in-memory buffer inspection before saving or streaming to Cloudinary
const storage = multer.memoryStorage();

const ALLOWED_RESOURCE_MIMES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

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
      cb(new ValidationError('Only image files (JPEG, PNG, WebP) are allowed for avatars'), false);
    }
  },
});

export const resourceUpload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 Megabytes cap for lecture notes, PYQs, and textbooks
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_RESOURCE_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Unsupported resource file type'), false);
    }
  },
});

export default avatarUpload;
