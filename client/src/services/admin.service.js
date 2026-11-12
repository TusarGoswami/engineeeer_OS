/**
 * Admin and Faculty Studio API Client Service
 * Handles problem authoring, exam scheduling, integrity moderation, and alumni governance
 */
import { api } from './api';

export const adminService = {
  // Stats
  async getStats() {
    const res = await api.get('/admin/stats');
    return res.data.data;
  },

  // Problems
  async getProblems(params = {}) {
    const res = await api.get('/admin/problems', { params });
    return res.data.data;
  },

  async getProblemById(id) {
    const res = await api.get(`/admin/problems/${id}`);
    return res.data.data;
  },

  async createProblem(data) {
    const res = await api.post('/admin/problems', data);
    return res.data.data;
  },

  async updateProblem(id, data) {
    const res = await api.put(`/admin/problems/${id}`, data);
    return res.data.data;
  },

  async deleteProblem(id) {
    const res = await api.delete(`/admin/problems/${id}`);
    return res.data.data;
  },

  async addTestCase(problemId, testCaseData) {
    const res = await api.post(`/admin/problems/${problemId}/testcases`, testCaseData);
    return res.data.data;
  },

  async deleteTestCase(problemId, testCaseId) {
    const res = await api.delete(`/admin/problems/${problemId}/testcases/${testCaseId}`);
    return res.data.data;
  },

  // Assessments
  async getAssessments(params = {}) {
    const res = await api.get('/admin/assessments', { params });
    return res.data.data;
  },

  async createAssessment(data) {
    const res = await api.post('/admin/assessments', data);
    return res.data.data;
  },

  async updateAssessment(id, data) {
    const res = await api.put(`/admin/assessments/${id}`, data);
    return res.data.data;
  },

  async deleteAssessment(id) {
    const res = await api.delete(`/admin/assessments/${id}`);
    return res.data.data;
  },

  // Integrity Signals
  async getIntegritySignals(params = {}) {
    const res = await api.get('/admin/integrity-signals', { params });
    return res.data.data;
  },

  async resolveIntegrityVerdict(attemptId, verdictData) {
    const res = await api.post(`/admin/attempts/${attemptId}/verdict`, verdictData);
    return res.data.data;
  },

  // Users & Alumni
  async getUsers(params = {}) {
    const res = await api.get('/admin/users', { params });
    return res.data.data;
  },

  async updateUserRole(userId, role) {
    const res = await api.patch(`/admin/users/${userId}/role`, { role });
    return res.data.data;
  },

  async verifyAlumniStatus(userId, alumniData) {
    const res = await api.post(`/admin/users/${userId}/alumni-status`, alumniData);
    return res.data.data;
  },
};

export default adminService;
