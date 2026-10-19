import { GateService } from './gate.service.js';

export class GateController {
  static async getTests(req, res, next) {
    try {
      const tests = await GateService.getTests(req.query);
      res.json({
        success: true,
        data: tests,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTestForAttempt(req, res, next) {
    try {
      const test = await GateService.getTestForAttempt(req.params.id);
      res.json({
        success: true,
        data: test,
      });
    } catch (err) {
      next(err);
    }
  }

  static async submitAttempt(req, res, next) {
    try {
      const { answers, timeTakenSeconds } = req.body;
      const attempt = await GateService.submitAttempt({
        testId: req.params.id,
        answers,
        timeTakenSeconds,
        userId: req.user.id || req.user._id,
      });

      res.status(201).json({
        success: true,
        message: 'GATE exam submitted and evaluated successfully',
        data: attempt,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAttemptById(req, res, next) {
    try {
      const attempt = await GateService.getAttemptById(req.params.id, req.user.id || req.user._id);
      res.json({
        success: true,
        data: attempt,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getUserAttempts(req, res, next) {
    try {
      const attempts = await GateService.getUserAttempts(req.user.id || req.user._id);
      res.json({
        success: true,
        data: attempts,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default GateController;
