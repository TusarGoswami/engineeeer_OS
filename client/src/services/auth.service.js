import api, { setAccessToken } from './api.js';

export const authService = {
  async register(data) {
    const response = await api.post('/auth/register', data);
    if (response.data.data.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
    return response.data.data;
  },

  async login(data) {
    const response = await api.post('/auth/login', data);
    if (response.data.data.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
    return response.data.data;
  },

  async refresh() {
    const response = await api.post('/auth/refresh');
    if (response.data.data.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
    return response.data.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data.data;
  },

  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data.data;
  },
};

export default authService;
