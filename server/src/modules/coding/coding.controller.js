import { CodingService } from './coding.service.js';

export class CodingController {
  static async getProblems(req, res, next) {
    try {
      const filters = {
        difficulty: req.query.difficulty,
        tag: req.query.tag,
        search: req.query.search,
      };

      const pagination = {
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
        cursor: req.query.cursor,
      };

      const result = await CodingService.getProblems(filters, pagination);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProblemBySlug(req, res, next) {
    try {
      const problem = await CodingService.getProblemBySlug(req.params.slug);
      res.status(200).json({
        success: true,
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  }

  static async runSampleTest(req, res, next) {
    try {
      const result = await CodingService.runSampleTest({
        problemId: req.params.id,
        sourceCode: req.body.sourceCode,
        language: req.body.language,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async submitSolution(req, res, next) {
    try {
      const problemId = req.params.id || req.body.problemId;
      const result = await CodingService.submitSolution({
        problemId,
        sourceCode: req.body.sourceCode,
        language: req.body.language,
        userId: req.user.id || req.user._id,
      });

      // Returns 202 Accepted per spec
      res.status(202).json({
        success: true,
        data: result,
        message: 'Submission queued for sandboxed execution',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSubmissionById(req, res, next) {
    try {
      const submission = await CodingService.getSubmissionById(
        req.params.id,
        req.user.id || req.user._id
      );
      res.status(200).json({
        success: true,
        data: submission,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMySubmissions(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const cursor = req.query.cursor;
      const problemId = req.query.problemId;

      const result = await CodingService.getUserSubmissions(
        req.user.id || req.user._id,
        problemId,
        limit,
        cursor
      );
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CodingController;
