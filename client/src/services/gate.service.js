import { api } from './api';

export const gateService = {
  async getTests(params = {}) {
    const res = await api.get('/gate/tests', { params });
    return res.data.data;
  },

  async getTestForAttempt(testId) {
    const res = await api.get(`/gate/tests/${testId}`);
    return res.data.data;
  },

  async submitAttempt(testId, answers, timeTakenSeconds) {
    const res = await api.post(`/gate/tests/${testId}/submit`, {
      answers,
      timeTakenSeconds,
    });
    return res.data.data;
  },

  async getAttemptById(attemptId) {
    const res = await api.get(`/gate/attempts/${attemptId}`);
    return res.data.data;
  },

  async getMyAttempts() {
    const res = await api.get('/gate/attempts');
    return res.data.data;
  },
};

export default gateService;
