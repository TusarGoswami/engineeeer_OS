import api from './api.js';

export const academicsService = {
  async getSubjects(params = {}) {
    const response = await api.get('/academics/subjects', { params });
    return response.data;
  },

  async getSubjectById(id) {
    const response = await api.get(`/academics/subjects/${id}`);
    return response.data.data;
  },

  async toggleTopic(subjectId, topicId) {
    const response = await api.post(`/academics/subjects/${subjectId}/topics/${topicId}/toggle`);
    return response.data.data;
  },

  async getResources(subjectId, type = null) {
    const response = await api.get(`/academics/subjects/${subjectId}/resources`, {
      params: type ? { type } : undefined,
    });
    return response.data.data;
  },
};

export default academicsService;
