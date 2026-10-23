import { AssessmentsService } from './assessments.service.js';

export class AssessmentsController {
  static async getAssessments(req, res, next) {
    try {
      const data = await AssessmentsService.getAssessments(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getAssessmentById(req, res, next) {
    try {
      const data = await AssessmentsService.getAssessmentById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async startAttempt(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const data = await AssessmentsService.startAttempt({
        assessmentId: req.params.id,
        userId,
      });
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async autosave(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const data = await AssessmentsService.autosaveAttempt({
        attemptId: req.params.attemptId,
        userId,
        answers: req.body.answers,
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async recordIntegrity(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const data = await AssessmentsService.recordIntegrityEvent({
        attemptId: req.params.attemptId,
        userId,
        eventType: req.body.eventType,
        metadata: req.body.metadata,
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async submitAttempt(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const data = await AssessmentsService.submitAttempt({
        attemptId: req.params.attemptId,
        userId,
        answers: req.body.answers,
        isAutoSubmitted: req.body.isAutoSubmitted || false,
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getReviewSignals(req, res, next) {
    try {
      const data = await AssessmentsService.getReviewSignals(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export default AssessmentsController;
