import { UserService } from './user.service.js';
import { ValidationError } from '../../middleware/error.js';

export class UserController {
  static async getMe(req, res, next) {
    try {
      const user = await UserService.getProfile(req.user.id);
      res.status(200).json({ data: user });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req, res, next) {
    try {
      const updated = await UserService.updateProfile(req.user.id, req.body);
      res.status(200).json({ data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req, res, next) {
    try {
      if (!req.file || !req.file.buffer) {
        throw new ValidationError('No image file provided in multipart upload');
      }
      const result = await UserService.uploadAvatar(req.user.id, req.file.buffer);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAvatar(req, res, next) {
    try {
      const result = await UserService.deleteAvatar(req.user.id);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getAvatar(req, res, next) {
    try {
      const { key } = req.params;
      const buffer = await UserService.getAvatarBuffer(key);
      res.set({
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      res.end(buffer);
    } catch (error) {
      next(error);
    }
  }

  static async exportMe(req, res, next) {
    try {
      const exportArchive = await UserService.exportUserData(req.user.id);
      res.status(200).json({ data: exportArchive });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMe(req, res, next) {
    try {
      const result = await UserService.deleteAccount(req.user.id);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
