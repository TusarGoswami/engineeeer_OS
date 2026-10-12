import { UserService } from './user.service.js';

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
