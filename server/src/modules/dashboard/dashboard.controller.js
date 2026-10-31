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

  static async getToday(req, res, next) {
    try {
      const todayData = await DashboardService.getTodayTasks(req.user.id);
      res.status(200).json({ data: todayData });
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req, res, next) {
    try {
      const updated = await DashboardService.updateTask(
        req.user.id,
        req.params.id,
        req.body
      );
      res.status(200).json({ data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async getHeatmap(req, res, next) {
    try {
      const months = req.query.months ? parseInt(req.query.months, 10) : 12;
      const heatmap = await DashboardService.getHeatmap(req.user.id, months);
      res.status(200).json({ data: heatmap });
    } catch (error) {
      next(error);
    }
  }
}

export default DashboardController;
