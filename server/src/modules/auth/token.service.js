import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { RefreshToken } from './refreshToken.model.js';
import { UnauthorizedError } from '../../middleware/error.js';
import { logger } from '../../config/logger.js';

export class TokenService {
  /**
   * Generate short-lived JWT Access Token
   */
  static signAccessToken(user) {
    const payload = {
      id: user._id ? user._id.toString() : user.id,
      email: user.email,
      role: user.role,
      isAlumni: user.isAlumni || false,
      name: user.name,
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY,
      issuer: 'engineeros-api',
      audience: 'engineeros-client',
    });
  }

  /**
   * Verify JWT Access Token
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: 'engineeros-api',
        audience: 'engineeros-client',
      });
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  /**
   * Hash opaque refresh token using SHA-256 for secure storage
   */
  static hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Generate cryptographically secure random refresh token string
   */
  static generateRandomToken() {
    return crypto.randomBytes(40).toString('hex');
  }

  /**
   * Issue and persist a new refresh token
   */
  static async issueRefreshToken(userId, family = null, userAgent = '', ipAddress = '') {
    const rawToken = this.generateRandomToken();
    const tokenHash = this.hashToken(rawToken);
    const tokenFamily = family || crypto.randomUUID();

    // 7 days expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      tokenHash,
      userId,
      family: tokenFamily,
      isUsed: false,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return {
      rawToken,
      family: tokenFamily,
      expiresAt,
    };
  }

  /**
   * Rotate refresh token with reuse detection
   */
  static async rotateRefreshToken(rawToken, userAgent = '', ipAddress = '') {
    if (!rawToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    const tokenHash = this.hashToken(rawToken);
    const existing = await RefreshToken.findOne({ tokenHash });

    if (!existing) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Token reuse detection! Old used token presented again.
    if (existing.isUsed) {
      logger.warn(
        { userId: existing.userId, family: existing.family, ipAddress },
        '[Security Breach] Refresh token reuse detected! Invalidating token family.'
      );
      // Revoke all tokens belonging to this family
      await RefreshToken.deleteMany({ family: existing.family });
      throw new UnauthorizedError(
        'Token reuse detected. All sessions in this chain have been revoked.'
      );
    }

    if (existing.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: existing._id });
      throw new UnauthorizedError('Refresh token expired');
    }

    // Mark current token as used
    existing.isUsed = true;
    await existing.save();

    // Issue next token in the same family
    const nextToken = await this.issueRefreshToken(
      existing.userId,
      existing.family,
      userAgent,
      ipAddress
    );

    return {
      userId: existing.userId,
      newRawToken: nextToken.rawToken,
      expiresAt: nextToken.expiresAt,
    };
  }

  /**
   * Revoke specific token (Logout)
   */
  static async revokeRefreshToken(rawToken) {
    if (!rawToken) return;
    const tokenHash = this.hashToken(rawToken);
    await RefreshToken.deleteOne({ tokenHash });
  }

  /**
   * Revoke all sessions for a user
   */
  static async revokeAllUserTokens(userId) {
    await RefreshToken.deleteMany({ userId });
  }
}

export default TokenService;
