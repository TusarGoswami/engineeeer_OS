import sharp from 'sharp';
import { UserRepository } from './user.repository.js';
import { NotFoundError, ValidationError, ConflictError } from '../../middleware/error.js';
import { storageAdapter } from '../../integrations/storage/index.js';
import { validateImageMagicBytes } from '../../utils/magicBytes.js';
import { RESERVED_USERNAMES } from './user.schema.js';

export class UserService {
  /**
   * Get user profile by ID
   */
  static async getProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  /**
   * Update profile fields
   */
  static async updateProfile(userId, updateData) {
    // Disallow role or email mutation through normal profile update
    const sanitized = { ...updateData };
    delete sanitized.role;
    delete sanitized.email;
    delete sanitized.passwordHash;
    delete sanitized.failedLoginAttempts;
    delete sanitized.lockoutUntil;
    delete sanitized.avatarKey;
    delete sanitized.avatarVersion;

    if (sanitized.username) {
      sanitized.username = sanitized.username.toLowerCase().trim();
      if (RESERVED_USERNAMES.has(sanitized.username)) {
        throw new ValidationError(`Username '${sanitized.username}' is reserved`);
      }
      const existing = await UserRepository.findByUsername(sanitized.username);
      if (existing && existing._id.toString() !== userId.toString()) {
        throw new ConflictError(`Username '${sanitized.username}' is already taken`);
      }
    }

    const updated = await UserRepository.updateById(userId, sanitized);
    if (!updated) {
      throw new NotFoundError('User not found');
    }
    return updated;
  }

  /**
   * Upload and process user avatar
   */
  static async uploadAvatar(userId, fileBuffer) {
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      throw new ValidationError('A valid image buffer is required');
    }

    // Magic-byte sniffing
    const { isValid } = validateImageMagicBytes(fileBuffer);
    if (!isValid) {
      throw new ValidationError(
        'Invalid image format. Only authentic JPEG, PNG, and WebP files are permitted.'
      );
    }

    // Strip EXIF / GPS metadata and resize to 512x512 WebP (plus 128x128 thumb)
    const avatarBuffer = await sharp(fileBuffer)
      .rotate()
      .resize(512, 512, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer();

    const thumbBuffer = await sharp(fileBuffer)
      .rotate()
      .resize(128, 128, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toBuffer();

    const timestamp = Date.now();
    const avatarKey = `avatar_${userId}_${timestamp}.webp`;
    const thumbKey = `thumb_${userId}_${timestamp}.webp`;

    // Fetch user to clean up previous avatar if present
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.avatarKey) {
      try {
        await storageAdapter.delete({ key: user.avatarKey });
        await storageAdapter.delete({ key: user.avatarKey.replace('avatar_', 'thumb_') });
      } catch {
        // Silently continue if old files were already missing
      }
    }

    // Upload new files
    await storageAdapter.upload({ key: avatarKey, buffer: avatarBuffer, contentType: 'image/webp' });
    await storageAdapter.upload({ key: thumbKey, buffer: thumbBuffer, contentType: 'image/webp' });

    const newVersion = (user.avatarVersion || 1) + 1;
    const avatarUrl = storageAdapter.getUrl(avatarKey);

    const updatedUser = await UserRepository.updateById(userId, {
      avatarKey,
      avatarVersion: newVersion,
      'profile.avatarUrl': avatarUrl,
    });

    return {
      avatarKey,
      avatarUrl,
      avatarVersion: newVersion,
      user: updatedUser,
    };
  }

  /**
   * Remove user avatar
   */
  static async deleteAvatar(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.avatarKey) {
      try {
        await storageAdapter.delete({ key: user.avatarKey });
        await storageAdapter.delete({ key: user.avatarKey.replace('avatar_', 'thumb_') });
      } catch {
        // Silently continue
      }
    }

    const updatedUser = await UserRepository.updateById(userId, {
      avatarKey: '',
      avatarVersion: (user.avatarVersion || 1) + 1,
      'profile.avatarUrl': '',
    });

    return { success: true, user: updatedUser };
  }

  /**
   * Download avatar buffer
   */
  static async getAvatarBuffer(key) {
    return await storageAdapter.download({ key });
  }

  /**
   * Export complete user profile & data archive (GDPR / DPDP)
   */
  static async exportUserData(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        headline: user.headline,
        role: user.role,
        isAlumni: user.isAlumni,
        university: user.university,
        branch: user.branch,
        semester: user.semester,
        bio: user.bio,
        timezone: user.timezone,
        profile: user.profile,
        profileSettings: user.profileSettings,
        goals: user.goals,
        settings: user.settings,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Delete user account (GDPR Right to be Forgotten)
   */
  static async deleteAccount(userId) {
    const user = await UserRepository.deleteById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return { success: true, message: 'Account and associated data deleted permanently' };
  }
}

export default UserService;
