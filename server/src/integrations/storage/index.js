import { LocalStorageAdapter } from './local.storage.js';
import { CloudinaryStorageAdapter } from './cloudinary.storage.js';

export function createStorageAdapter(config = {}) {
  const provider = config.provider || process.env.STORAGE_PROVIDER || 'local';

  if (
    provider === 'cloudinary' &&
    (config.cloudName || process.env.CLOUDINARY_CLOUD_NAME)
  ) {
    return new CloudinaryStorageAdapter({
      cloudName: config.cloudName || process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: config.apiKey || process.env.CLOUDINARY_API_KEY,
      apiSecret: config.apiSecret || process.env.CLOUDINARY_API_SECRET,
      defaultFolder: config.folder || 'engineeros',
    });
  }

  // Default fallback: Local filesystem adapter
  return new LocalStorageAdapter(config.dir || process.env.STORAGE_LOCAL_DIR || 'uploads');
}

// Global singleton instance
export const storageAdapter = createStorageAdapter();

export { LocalStorageAdapter } from './local.storage.js';
export { CloudinaryStorageAdapter } from './cloudinary.storage.js';
export { IStorageAdapter } from './storage.interface.js';
export default storageAdapter;
