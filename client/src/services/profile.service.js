import api from './api.js';

export const profileService = {
  async getOwnerProfile() {
    const response = await api.get('/profile/me');
    return response.data.data;
  },

  async updateOwnerProfile(data) {
    const response = await api.patch('/profile/me', data);
    return response.data.data;
  },

  async regenerateShareToken() {
    const response = await api.post('/profile/me/regenerate-share-token');
    return response.data.data;
  },

  async getMyBadges() {
    const response = await api.get('/profile/me/badges');
    return response.data.data;
  },

  async getHeatmap(months = 12) {
    const response = await api.get(`/profile/me/heatmap?months=${months}`);
    return response.data.data;
  },

  async getPublicProfile(username, token = null) {
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    const response = await api.get(`/profile/${encodeURIComponent(username)}${query}`);
    return response.data.data;
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async deleteAvatar() {
    const response = await api.delete('/users/me/avatar');
    return response.data.data;
  },
};

export default profileService;

