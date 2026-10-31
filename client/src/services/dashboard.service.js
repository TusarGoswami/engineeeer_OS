import api from './api.js';

export const dashboardService = {
  async getSummary() {
    const response = await api.get('/dashboard/summary');
    return response.data.data;
  },

  async getTodayTasks() {
    const response = await api.get('/dashboard/today');
    return response.data.data;
  },

  async updateTask(taskId, status) {
    const response = await api.patch(`/dashboard/tasks/${taskId}`, { status });
    return response.data.data;
  },

  async getHeatmap(months = 12) {
    const response = await api.get(`/dashboard/heatmap?months=${months}`);
    return response.data.data;
  },
};

export default dashboardService;
