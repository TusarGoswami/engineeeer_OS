import { AssistantService } from './assistant.service.js';
import { InterviewService } from './interview.service.js';

export class AiController {
  // === AI Academic Assistant ===

  static async streamAssistant(req, res, next) {
    try {
      const { conversationId, query, subjectId } = req.body;
      const userId = req.user.id || req.user._id;

      if (!query || query.trim() === '') {
        return res.status(400).json({ error: { message: 'Query cannot be empty' } });
      }

      await AssistantService.streamAssistantResponse({
        userId,
        conversationId,
        query,
        subjectId,
        res,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAssistantConversations(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const conversations = await AssistantService.getConversations(userId);
      res.json({
        success: true,
        data: conversations,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAssistantConversationById(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const conversation = await AssistantService.getConversationById(req.params.id, userId);

      if (!conversation) {
        return res.status(404).json({ error: { message: 'Conversation not found' } });
      }

      res.json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }

  // === AI Mock Interviews ===

  static async createInterview(req, res, next) {
    try {
      const { mode, targetRole } = req.body;
      const userId = req.user.id || req.user._id;

      const session = await InterviewService.createSession({
        userId,
        mode,
        targetRole,
      });

      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (err) {
      next(err);
    }
  }

  static async submitInterviewTurn(req, res, next) {
    try {
      const { candidateMessage } = req.body;
      const userId = req.user.id || req.user._id;

      if (!candidateMessage || candidateMessage.trim() === '') {
        return res.status(400).json({ error: { message: 'Message cannot be empty' } });
      }

      const session = await InterviewService.submitTurn({
        sessionId: req.params.id,
        userId,
        candidateMessage,
      });

      res.json({
        success: true,
        data: session,
      });
    } catch (err) {
      next(err);
    }
  }

  static async finishInterview(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const session = await InterviewService.finishSession({
        sessionId: req.params.id,
        userId,
      });

      res.status(202).json({
        success: true,
        message: 'Interview completed. AI rubric evaluation queued.',
        data: session,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getInterviewById(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const session = await InterviewService.getSessionById(req.params.id, userId);

      res.json({
        success: true,
        data: session,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getUserInterviews(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const sessions = await InterviewService.getUserSessions(userId);

      res.json({
        success: true,
        data: sessions,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default AiController;
