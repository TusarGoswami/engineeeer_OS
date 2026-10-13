import { UserRepository } from '../users/user.repository.js';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';
import { EmailAdapter } from '../../integrations/email/email.adapter.js';
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} from '../../middleware/error.js';
import crypto from 'crypto';

// In-memory or Redis-backed reset token store
const resetTokens = new Map();

export class AuthService {
  /**
   * Register a new user
   */
  static async register(userData, context = {}) {
    const existing = await UserRepository.findByEmail(userData.email);
    if (existing) {
      throw new ConflictError('An account with this email address already exists.');
    }

    const passwordHash = await PasswordService.hash(userData.password);

    // Prevent direct registration as contentAdmin or platformAdmin
    const role = userData.role === 'senior' ? 'senior' : 'student';

    const user = await UserRepository.create({
      email: userData.email,
      passwordHash,
      name: userData.name,
      role,
      isAlumni: userData.isAlumni || false,
      university: userData.university || '',
      branch: userData.branch || '',
      semester: userData.semester || 1,
    });

    const accessToken = TokenService.signAccessToken(user);
    const refreshTokenData = await TokenService.issueRefreshToken(
      user._id,
      null,
      context.userAgent,
      context.ipAddress
    );

    // Trigger non-blocking verification email
    EmailAdapter.sendVerificationEmail(
      user.email,
      user.name,
      crypto.randomBytes(24).toString('hex')
    ).catch(() => {});

    const userSafe = user.toObject();
    delete userSafe.passwordHash;

    return {
      user: userSafe,
      accessToken,
      refreshToken: refreshTokenData.rawToken,
    };
  }

  /**
   * Login user with lockout protection
   */
  static async login({ email, password }, context = {}) {
    const user = await UserRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check account lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockoutUntil - Date.now()) / (60 * 1000));
      throw new ForbiddenError(
        `Account temporarily locked due to consecutive failed logins. Try again in ${minutesLeft} minute(s).`
      );
    }

    const isValid = await PasswordService.verify(password, user.passwordHash);
    if (!isValid) {
      await UserRepository.incrementFailedAttempts(user._id);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed counter
    if (user.failedLoginAttempts > 0) {
      await UserRepository.resetFailedAttempts(user._id);
    }

    const accessToken = TokenService.signAccessToken(user);
    const refreshTokenData = await TokenService.issueRefreshToken(
      user._id,
      null,
      context.userAgent,
      context.ipAddress
    );

    const userSafe = user.toObject();
    delete userSafe.passwordHash;

    return {
      user: userSafe,
      accessToken,
      refreshToken: refreshTokenData.rawToken,
    };
  }

  /**
   * Rotate refresh token
   */
  static async refresh(refreshTokenRaw, context = {}) {
    if (!refreshTokenRaw) {
      throw new UnauthorizedError('No refresh token provided');
    }

    const rotation = await TokenService.rotateRefreshToken(
      refreshTokenRaw,
      context.userAgent,
      context.ipAddress
    );

    const user = await UserRepository.findById(rotation.userId);
    if (!user) {
      throw new UnauthorizedError('User account no longer exists');
    }

    const accessToken = TokenService.signAccessToken(user);

    return {
      user,
      accessToken,
      newRefreshToken: rotation.newRawToken,
    };
  }

  /**
   * Logout user
   */
  static async logout(refreshTokenRaw) {
    if (refreshTokenRaw) {
      await TokenService.revokeRefreshToken(refreshTokenRaw);
    }
  }

  /**
   * Request password reset link
   */
  static async requestPasswordReset(email) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Return success to prevent user enumeration
      return { message: 'If this email exists, a password reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    resetTokens.set(token, { userId: user._id.toString(), expiresAt });

    await EmailAdapter.sendPasswordResetEmail(user.email, user.name, token);

    return { message: 'If this email exists, a password reset link has been sent.' };
  }

  /**
   * Confirm password reset
   */
  static async confirmPasswordReset(token, newPassword) {
    const record = resetTokens.get(token);
    if (!record || record.expiresAt < Date.now()) {
      resetTokens.delete(token);
      throw new BadRequestError('Password reset link is invalid or has expired.');
    }

    const newHash = await PasswordService.hash(newPassword);
    await UserRepository.updateById(record.userId, { passwordHash: newHash });

    // Revoke all existing sessions for security
    await TokenService.revokeAllUserTokens(record.userId);
    resetTokens.delete(token);

    return {
      message: 'Password has been successfully reset. Please log in with your new password.',
    };
  }
}

export default AuthService;
