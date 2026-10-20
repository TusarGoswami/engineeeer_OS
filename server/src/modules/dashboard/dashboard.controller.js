import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  static async getSummary(req, res, next) {
    try {
      const summary = await DashboardService.getSummary(req.user.id);
      res.status(200).json({ data: summary });
    } catch (error) {
      next(error);
    }
  }
}

export default DashboardController;
