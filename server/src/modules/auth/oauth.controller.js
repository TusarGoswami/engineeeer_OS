import { OAuthService } from './oauth.service.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export class OAuthController {
  static async google(req, res, next) {
    try {
      const { code, redirectUri } = req.body;
      const context = {
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || '',
      };

      const result = await OAuthService.exchangeGoogleCode(code, redirectUri, context);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async github(req, res, next) {
    try {
      const { code, redirectUri } = req.body;
      const context = {
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || '',
      };

      const result = await OAuthService.exchangeGitHubCode(code, redirectUri, context);

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default OAuthController;
