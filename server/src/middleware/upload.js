import multer from 'multer';

// Use memory storage for in-memory buffer inspection (magic-byte sniffing) before saving
const storage = multer.memoryStorage();

export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3 Megabytes cap
    files: 1,
  },
});

export default avatarUpload;

