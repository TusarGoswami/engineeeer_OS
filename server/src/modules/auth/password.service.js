import argon2 from 'argon2';
import crypto from 'crypto';

export class PasswordService {
  /**
   * Hash password with Argon2id
   * @param {string} password
   * @returns {Promise<string>}
   */
  static async hash(password) {
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,
        parallelism: 1,
      });
    } catch {
      // Fallback to high-iteration PBKDF2 if native binding fails
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      return `pbkdf2$${salt}$${hash}`;
    }
  }

  /**
   * Verify password against hash
   * @param {string} password
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  static async verify(password, hash) {
    if (!password || !hash) return false;

    if (hash.startsWith('pbkdf2$')) {
      const parts = hash.split('$');
      const salt = parts[1];
      const originalHash = parts[2];
      const checkHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(originalHash), Buffer.from(checkHash));
    }

    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}

export default PasswordService;
