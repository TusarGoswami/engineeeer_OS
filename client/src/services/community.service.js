import api from './api.js';

export const communityService = {
  async getPosts(params = {}) {
    const res = await api.get('/community/posts', { params });
    return res.data;
  },

  async createPost(postData) {
    const res = await api.post('/community/posts', postData);
    return res.data;
  },

  async getPostById(id) {
    const res = await api.get(`/community/posts/${id}`);
    return res.data;
  },

  async getReplies(postId) {
    const res = await api.get(`/community/posts/${postId}/replies`);
    return res.data;
  },

  async addReply(postId, replyData) {
    const res = await api.post(`/community/posts/${postId}/replies`, replyData);
    return res.data;
  },

  async upvotePost(id) {
    const res = await api.post(`/community/posts/${id}/upvote`);
    return res.data;
  },

  async upvoteReply(replyId) {
    const res = await api.post(`/community/replies/${replyId}/upvote`);
    return res.data;
  },

  async acceptReply(replyId) {
    const res = await api.post(`/community/replies/${replyId}/accept`);
    return res.data;
  },
};

export default communityService;
