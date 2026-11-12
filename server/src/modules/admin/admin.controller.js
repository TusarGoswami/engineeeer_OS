import { AdminService } from './admin.service.js';

export class AdminController {
  static async getStats(req, res, next) {
    try {
      res.set('Cache-Control', 'no-store');
      const data = await AdminService.getDashboardStats();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // Coding Problems
  static async getProblems(req, res, next) {
    try {
      const data = await AdminService.getProblems(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getProblemById(req, res, next) {
    try {
      const data = await AdminService.getProblemById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async createProblem(req, res, next) {
    try {
      const data = await AdminService.createProblem(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateProblem(req, res, next) {
    try {
      const data = await AdminService.updateProblem(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteProblem(req, res, next) {
    try {
      const data = await AdminService.deleteProblem(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async addTestCase(req, res, next) {
    try {
      const data = await AdminService.addTestCase(req.params.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteTestCase(req, res, next) {
    try {
      const data = await AdminService.deleteTestCase(req.params.testCaseId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // Assessments
  static async getAssessments(req, res, next) {
    try {
      const data = await AdminService.getAssessments(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async createAssessment(req, res, next) {
    try {
      const data = await AdminService.createAssessment(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateAssessment(req, res, next) {
    try {
      const data = await AdminService.updateAssessment(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteAssessment(req, res, next) {
    try {
      const data = await AdminService.deleteAssessment(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // Integrity Signals
  static async getIntegritySignals(req, res, next) {
    try {
      const data = await AdminService.getIntegritySignals(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async resolveIntegrityVerdict(req, res, next) {
    try {
      const reviewerId = req.user.id || req.user._id;
      const data = await AdminService.resolveIntegrityVerdict(req.params.attemptId, req.body, reviewerId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // Users & Alumni
  static async getUsers(req, res, next) {
    try {
      const data = await AdminService.getUsers(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateUserRole(req, res, next) {
    try {
      const data = await AdminService.updateUserRole(req.params.userId, req.body.role);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async verifyAlumniStatus(req, res, next) {
    try {
      const data = await AdminService.verifyAlumniStatus(req.params.userId, req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export default AdminController;
