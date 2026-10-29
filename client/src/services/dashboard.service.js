import api from './api.js';

export const dashboardService = {
  async getSummary() {
    const response = await api.get('/dashboard/summary');
    return response.data.data;
  },
};

export default dashboardService;
