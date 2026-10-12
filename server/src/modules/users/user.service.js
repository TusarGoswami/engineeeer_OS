import { UserRepository } from './user.repository.js';
import { TokenService } from '../auth/token.service.js';
import { NotFoundError } from '../../middleware/error.js';

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

    const updated = await UserRepository.updateById(userId, sanitized);
    if (!updated) {
      throw new NotFoundError('User not found');
    }
    return updated;
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
        name: user.name,
        role: user.role,
        isAlumni: user.isAlumni,
        university: user.university,
        branch: user.branch,
        semester: user.semester,
        bio: user.bio,
        profile: user.profile,
        goals: user.goals,
        settings: user.settings,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Soft or hard delete user account
   */
  static async deleteAccount(userId) {
    await TokenService.revokeAllUserTokens(userId);
    const deleted = await UserRepository.deleteById(userId);
    if (!deleted) {
      throw new NotFoundError('User not found');
    }
    return { message: 'User account and all associated sessions deleted successfully.' };
  }
}

export default UserService;
