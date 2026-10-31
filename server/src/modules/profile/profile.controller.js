import { ProfileService } from './profile.service.js';

export class ProfileController {
  static async getMe(req, res, next) {
    try {
      const data = await ProfileService.getOwnerProfile(req.user.id);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req, res, next) {
    try {
      const data = await ProfileService.updateOwnerProfile(req.user.id, req.body);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  static async regenerateShareToken(req, res, next) {
    try {
      const data = await ProfileService.regenerateShareToken(req.user.id);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  static async getBadges(req, res, next) {
    try {
      const data = await ProfileService.getMyBadges(req.user.id);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  static async getHeatmap(req, res, next) {
    try {
      const days = parseInt(req.query.days, 10) || 365;
      const data = await ProfileService.getHeatmap(req.user.id, days);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicProfile(req, res, next) {
    try {
      const { username } = req.params;
      const token = req.query.token || null;
      const data = await ProfileService.getPublicProfile(username, token);

      // Cache headers for public profiles (short TTL to allow quick updates)
      res.set({
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      });

      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }
}

export default ProfileController;

