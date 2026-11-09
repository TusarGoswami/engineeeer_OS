import { v2 as cloudinary } from 'cloudinary';
import { IStorageAdapter } from './storage.interface.js';

export class CloudinaryStorageAdapter extends IStorageAdapter {
  constructor({ cloudName, apiKey, apiSecret, defaultFolder = 'engineeros' } = {}) {
    super();
    this.cloudName = cloudName || process.env.CLOUDINARY_CLOUD_NAME;
    this.apiKey = apiKey || process.env.CLOUDINARY_API_KEY;
    this.apiSecret = apiSecret || process.env.CLOUDINARY_API_SECRET;
    this.defaultFolder = defaultFolder;

    if (this.cloudName && this.apiKey && this.apiSecret) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
        secure: true,
      });
    }
  }

  /**
   * Upload buffer directly to Cloudinary via upload_stream
   * @param {Object} params
   * @param {string} params.key - Unique identifier / file name
   * @param {Buffer} params.buffer - In-memory file buffer
   * @param {string} [params.contentType] - MIME type
   * @param {string} [params.folder] - Target Cloudinary folder
   * @param {string} [params.resourceType] - 'image', 'raw', 'video', or 'auto'
   * @returns {Promise<{ key: string, url: string, size: number, format: string }>}
   */
  async upload({ key, buffer, contentType = '', folder, resourceType = 'auto' }) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Valid file buffer is required for Cloudinary upload');
    }

    const targetFolder = folder || this.defaultFolder;
    // Strip existing extension for public_id to let Cloudinary manage formats cleanly
    const publicId = key ? key.replace(/\.[^/.]+$/, '') : `file_${Date.now()}`;

    return new Promise((resolve, reject) => {
      const options = {
        folder: targetFolder,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: true,
      };

      // If contentType is pdf or raw doc, ensure raw or auto handling
      if (contentType.includes('pdf') || contentType.includes('document')) {
        options.resource_type = 'auto';
      }

      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
          return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        }
        resolve({
          key: result.public_id,
          url: result.secure_url,
          size: result.bytes || buffer.length,
          format: result.format || 'bin',
          resourceType: result.resource_type,
          version: result.version,
        });
      });

      stream.end(buffer);
    });
  }

  /**
   * Download file content from Cloudinary
   * @param {Object} params
   * @param {string} params.key - Cloudinary public_id
   * @returns {Promise<Buffer>}
   */
  async download({ key }) {
    const url = this.getUrl(key);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download ${key} from Cloudinary: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Delete file from Cloudinary
   * @param {Object} params
   * @param {string} params.key - Cloudinary public_id
   * @param {string} [params.resourceType='image']
   * @returns {Promise<boolean>}
   */
  async delete({ key, resourceType = 'image' }) {
    try {
      const res = await cloudinary.uploader.destroy(key, {
        resource_type: resourceType,
      });
      return res.result === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Generate secure delivery URL
   * @param {string} key - Cloudinary public_id
   * @param {Object} [options={}] - Transformation options (width, height, crop, format)
   * @returns {string}
   */
  getUrl(key, options = {}) {
    return cloudinary.url(key, {
      secure: true,
      ...options,
    });
  }

  /**
   * Generates optimized face-crop avatar URL
   * @param {string} key
   * @param {number} [size=256]
   * @returns {string}
   */
  getAvatarUrl(key, size = 256) {
    return cloudinary.url(key, {
      secure: true,
      width: size,
      height: size,
      crop: 'fill',
      gravity: 'face',
      format: 'webp',
      quality: 'auto',
    });
  }
}

export default CloudinaryStorageAdapter;

