import { env } from '../../config/env.js';
import { UserRepository } from '../users/user.repository.js';
import { TokenService } from './token.service.js';
import { BadRequestError } from '../../middleware/error.js';
import { logger } from '../../config/logger.js';

/**
 * Lightweight OAuth service — exchanges authorization codes for user profiles
 * via standard token + userinfo endpoints. No Passport dependency required.
 */
export class OAuthService {
  // ── Google ──────────────────────────────────────────────────────────────────
  static async exchangeGoogleCode(code, redirectUri, context = {}) {
    if (typeof code !== 'string' || !code.trim()) {
      throw new BadRequestError('Authorization code is required.');
    }

    const isMockCode = code.startsWith('demo_') || code.startsWith('mock_');
    // Development / Test mock fallback (never permitted in production)
    if (env.NODE_ENV !== 'production' && (!env.GOOGLE_CLIENT_ID || isMockCode)) {
      logger.info('Using mock Google OAuth authentication in development');
      return OAuthService._findOrCreateUser({
        provider: 'google',
        oauthId: 'google_demo_1092837465',
        email: 'alex.engineer@gmail.com',
        name: 'Alex Rivera',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&crop=faces',
      }, context);
    }

    if (!env.GOOGLE_CLIENT_ID) {
      throw new BadRequestError('Google OAuth is not configured.');
    }

    // 1. Exchange code → tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (tokens.error) {
      logger.warn({ error: tokens.error }, 'Google OAuth token exchange failed');
      throw new BadRequestError(`Google login failed: ${tokens.error_description || tokens.error}`);
    }

    // 2. Fetch profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profile.email) throw new BadRequestError('Could not retrieve Google email');

    return OAuthService._findOrCreateUser({
      provider: 'google',
      oauthId: profile.id,
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      avatarUrl: profile.picture || '',
    }, context);
  }

  // ── GitHub ──────────────────────────────────────────────────────────────────
  static async exchangeGitHubCode(code, redirectUri, context = {}) {
    if (typeof code !== 'string' || !code.trim()) {
      throw new BadRequestError('Authorization code is required.');
    }

    const isMockCode = code.startsWith('demo_') || code.startsWith('mock_');
    // Development / Test mock fallback (never permitted in production)
    if (env.NODE_ENV !== 'production' && (!env.GITHUB_CLIENT_ID || isMockCode)) {
      logger.info('Using mock GitHub OAuth authentication in development');
      return OAuthService._findOrCreateUser({
        provider: 'github',
        oauthId: 'github_demo_987654321',
        email: 'tusar.dev@github.com',
        name: 'Tusar Goswami',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1024025?v=4',
        githubHandle: 'tusargoswami',
      }, context);
    }

    if (!env.GITHUB_CLIENT_ID) {
      throw new BadRequestError('GitHub OAuth is not configured.');
    }

    // 1. Exchange code → access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });
    const tokens = await tokenRes.json();
    if (tokens.error) {
      logger.warn({ error: tokens.error }, 'GitHub OAuth token exchange failed');
      throw new BadRequestError(`GitHub login failed: ${tokens.error_description || tokens.error}`);
    }

    // 2. Fetch profile + email
    const [profileRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokens.access_token}`, 'User-Agent': 'EngineerOS' },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokens.access_token}`, 'User-Agent': 'EngineerOS' },
      }),
    ]);
    const profile = await profileRes.json();
    const emails = await emailsRes.json();
    const primaryEmail = Array.isArray(emails)
      ? emails.find(e => e.primary && e.verified)?.email || emails[0]?.email
      : null;
    const email = primaryEmail || profile.email;
    if (!email) throw new BadRequestError('Could not retrieve GitHub email. Ensure email is public or grant email scope.');

    return OAuthService._findOrCreateUser({
      provider: 'github',
      oauthId: String(profile.id),
      email,
      name: profile.name || profile.login,
      avatarUrl: profile.avatar_url || '',
      githubHandle: profile.login || '',
    }, context);
  }

  // ── Shared: find-or-create + issue tokens ──────────────────────────────────
  static async _findOrCreateUser(oauthData, context) {
    const { provider, oauthId, email, name, avatarUrl, githubHandle } = oauthData;

    // Try find by OAuth ID first, then by email
    let user = await UserRepository.findByOAuth(provider, oauthId);

    if (!user) {
      // Check if a local account exists with same email → link
      user = await UserRepository.findByEmail(email);

      if (user) {
        // Link OAuth to existing account
        user = await UserRepository.updateById(user._id, {
          oauthProvider: provider,
          oauthId,
          isEmailVerified: true,
          ...(avatarUrl && !user.profile?.avatarUrl ? { 'profile.avatarUrl': avatarUrl } : {}),
          ...(githubHandle && !user.profile?.githubHandle ? { 'profile.githubHandle': githubHandle } : {}),
        });
      } else {
        // Create new OAuth user (no password needed)
        const { User } = await import('../users/user.model.js');
        const newUser = await User.create({
          email: email.toLowerCase(),
          name,
          role: 'student',
          oauthProvider: provider,
          oauthId,
          isEmailVerified: true,
          profile: {
            avatarUrl: avatarUrl || '',
            githubHandle: githubHandle || '',
          },
        });
        user = newUser.toObject();
      }
    }

    // Issue JWT tokens
    const accessToken = TokenService.signAccessToken(user);
    const refreshTokenData = await TokenService.issueRefreshToken(
      user._id,
      null,
      context.userAgent || '',
      context.ipAddress || ''
    );

    const userSafe = { ...user };
    delete userSafe.passwordHash;

    return {
      user: userSafe,
      accessToken,
      refreshToken: refreshTokenData.rawToken,
    };
  }
}

export default OAuthService;
