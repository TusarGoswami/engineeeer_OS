import api from './api.js';

export const assessmentService = {
  async getAssessments() {
    const res = await api.get('/assessments');
    return res.data;
  },

  async getAssessmentById(id) {
    const res = await api.get(`/assessments/${id}`);
    return res.data;
  },

  async startAttempt(assessmentId) {
    const res = await api.post(`/assessments/${assessmentId}/start`);
    return res.data;
  },

  async autosave(attemptId, answers) {
    const res = await api.post(`/assessments/attempts/${attemptId}/autosave`, { answers });
    return res.data;
  },

  async recordIntegrity(attemptId, eventType, metadata = {}) {
    const res = await api.post(`/assessments/attempts/${attemptId}/integrity`, {
      eventType,
      metadata,
    });
    return res.data;
  },

  async submitAttempt(attemptId, answers) {
    const res = await api.post(`/assessments/attempts/${attemptId}/submit`, { answers });
    return res.data;
  },

  async getReviewSignals(assessmentId) {
    const res = await api.get(`/assessments/${assessmentId}/review-signals`);
    return res.data;
  },
};

export default assessmentService;
