import { api } from './api';

export const codingService = {
  async getProblems(params = {}) {
    const res = await api.get('/coding/problems', { params });
    return res.data;
  },

  async getProblemBySlug(slug) {
    const res = await api.get(`/coding/problems/${slug}`);
    return res.data.data;
  },

  async runSampleTest(problemId, sourceCode, language) {
    const res = await api.post(`/coding/problems/${problemId}/run`, {
      sourceCode,
      language,
    });
    return res.data.data;
  },

  async submitSolution(problemId, sourceCode, language) {
    const res = await api.post(`/coding/problems/${problemId}/submit`, {
      sourceCode,
      language,
    });
    return res.data.data;
  },

  async getSubmissionStatus(submissionId) {
    const res = await api.get(`/coding/submissions/${submissionId}`);
    return res.data.data;
  },

  async getMySubmissions(problemId = null) {
    const params = problemId ? { problemId } : {};
    const res = await api.get('/coding/submissions', { params });
    return res.data.data;
  },
};

export default codingService;
