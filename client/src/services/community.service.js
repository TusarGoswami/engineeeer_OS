import api from './api.js';

export const communityService = {
  async getPosts(params = {}) {
    const res = await api.get('/community', { params });
    return res.data;
  },

  async createPost(postData) {
    const res = await api.post('/community', postData);
    return res.data;
  },

  async getPostById(id) {
    const res = await api.get(`/community/${id}`);
    return res.data;
  },

  async getReplies(postId) {
    const res = await api.get(`/community/${postId}`);
    return {
      success: res.data?.success ?? true,
      data: res.data?.data?.replies || [],
    };
  },

  async addReply(postId, replyData) {
    const res = await api.post(`/community/${postId}/replies`, replyData);
    return res.data;
  },

  async upvotePost(id) {
    const res = await api.post(`/community/${id}/upvote`);
    return res.data;
  },

  async upvoteReply(replyId) {
    const res = await api.post(`/community/replies/${replyId}/upvote`);
    return res.data;
  },

  async acceptReply(postId, replyId) {
    const res = await api.post(`/community/${postId}/replies/${replyId}/accept`);
    return res.data;
  },
};

export default communityService;
