import { AcademicsService } from './academics.service.js';

export class AcademicsController {
  static async getSubjects(req, res, next) {
    try {
      const filters = {
        university: req.query.university || req.user?.university,
        branch: req.query.branch || req.user?.branch,
        semester: req.query.semester || req.user?.semester,
        search: req.query.search,
      };

      const pagination = {
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
        cursor: req.query.cursor,
      };

      const result = await AcademicsService.getSubjects(filters, pagination);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getSubjectById(req, res, next) {
    try {
      const subject = await AcademicsService.getSubjectById(req.params.id, req.user?.id);
      res.status(200).json({ data: subject });
    } catch (error) {
      next(error);
    }
  }

  static async toggleTopicCompletion(req, res, next) {
    try {
      const { id: subjectId, topicId } = req.params;
      const result = await AcademicsService.toggleTopicCompletion(subjectId, topicId, req.user.id);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getResources(req, res, next) {
    try {
      const resources = await AcademicsService.getResources(req.params.id, req.query.type);
      res.status(200).json({ data: resources });
    } catch (error) {
      next(error);
    }
  }

  static async createSubject(req, res, next) {
    try {
      const subject = await AcademicsService.createSubject(req.body);
      res.status(201).json({ data: subject });
    } catch (error) {
      next(error);
    }
  }

  static async updateSubject(req, res, next) {
    try {
      const subject = await AcademicsService.updateSubject(req.params.id, req.body);
      res.status(200).json({ data: subject });
    } catch (error) {
      next(error);
    }
  }

  static async createResource(req, res, next) {
    try {
      const resource = await AcademicsService.createResource({
        ...req.body,
        subjectId: req.params.id,
      });
      res.status(201).json({ data: resource });
    } catch (error) {
      next(error);
    }
  }
}

export default AcademicsController;
