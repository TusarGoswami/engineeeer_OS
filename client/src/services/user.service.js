import api from './api.js';

export const userService = {
  async getMe() {
    const response = await api.get('/users/me');
    return response.data.data;
  },

  async updateMe(data) {
    const response = await api.patch('/users/me', data);
    return response.data.data;
  },

  async exportMe() {
    const response = await api.get('/users/me/export');
    return response.data.data;
  },

  async deleteMe() {
    const response = await api.delete('/users/me');
    return response.data.data;
  },
};

export default userService;
