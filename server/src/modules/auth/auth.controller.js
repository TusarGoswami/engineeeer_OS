import { AuthService } from './auth.service.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export class AuthController {
  static async register(req, res, next) {
    try {
      const context = {
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || '',
      };

      const result = await AuthService.register(req.body, context);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());

      res.status(201).json({
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const context = {
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || '',
      };

      const result = await AuthService.login(req.body, context);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());

      res.status(200).json({
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req, res, next) {
    try {
      const rawToken = req.cookies[REFRESH_COOKIE_NAME] || req.body.refreshToken;

      const context = {
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || '',
      };

      const result = await AuthService.refresh(rawToken, context);

      res.cookie(REFRESH_COOKIE_NAME, result.newRefreshToken, getRefreshCookieOptions());

      res.status(200).json({
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const rawToken = req.cookies[REFRESH_COOKIE_NAME] || req.body.refreshToken;
      await AuthService.logout(rawToken);

      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      res.status(200).json({
        data: { message: 'Logged out successfully' },
      });
    } catch (error) {
      next(error);
    }
  }

  static async requestPasswordReset(req, res, next) {
    try {
      const result = await AuthService.requestPasswordReset(req.body.email);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  static async confirmPasswordReset(req, res, next) {
    try {
      const result = await AuthService.confirmPasswordReset(req.body.token, req.body.newPassword);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
