import { api, getAccessToken, setAccessToken } from './api';

export const aiService = {
  /**
   * Stream tokens from AI Academic Assistant via Fetch SSE
   */
  async streamAssistant({ query, subjectId, conversationId, onMeta, onToken, onDone, onError }) {
    const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

    const doFetch = (token) =>
      fetch(`${baseURL}/ai/assistant/stream`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, subjectId, conversationId }),
      });

    try {
      let token = getAccessToken();
      let response = await doFetch(token);

      if (response.status === 401) {
        const refreshRes = await fetch(`${baseURL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (refreshRes.ok) {
          const refreshJson = await refreshRes.json();
          const newToken = refreshJson?.data?.accessToken;
          if (newToken) {
            setAccessToken(newToken);
            response = await doFetch(newToken);
          }
        }
      }

      if (!response.ok) {
        throw new Error(`Streaming failed: HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      let isDone = false;
      while (!isDone) {
        const { done, value } = await reader.read();
        if (done) {
          isDone = true;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop(); // keep trailing incomplete chunk

        for (const evt of events) {
          const lines = evt.split('\n');
          let eventType = 'message';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.replace('data: ', '').trim();
            }
          }

          if (eventData) {
            try {
              const parsed = JSON.parse(eventData);
              if (eventType === 'meta' && onMeta) onMeta(parsed);
              if (eventType === 'token' && onToken) onToken(parsed.token);
              if (eventType === 'done' && onDone) onDone(parsed);
              if (eventType === 'error' && onError) onError(new Error(parsed.message));
            } catch {
              // Parse error
            }
          }
        }
      }
    } catch (err) {
      if (onError) onError(err);
    }
  },

  async getAssistantConversations() {
    const res = await api.get('/ai/assistant/conversations');
    return res.data.data;
  },

  async getAssistantConversation(id) {
    const res = await api.get(`/ai/assistant/conversations/${id}`);
    return res.data.data;
  },

  // Mock Interviews
  async createInterview({ mode, targetRole }) {
    const res = await api.post('/ai/interviews', { mode, targetRole });
    return res.data.data;
  },

  async submitInterviewTurn(sessionId, candidateMessage) {
    const res = await api.post(`/ai/interviews/${sessionId}/turn`, { candidateMessage });
    return res.data.data;
  },

  async submitTurn(sessionId, candidateMessage) {
    return this.submitInterviewTurn(sessionId, candidateMessage);
  },

  async finishInterview(sessionId) {
    const res = await api.post(`/ai/interviews/${sessionId}/finish`);
    return res.data.data;
  },

  async getInterview(sessionId) {
    const res = await api.get(`/ai/interviews/${sessionId}`);
    return res.data.data;
  },

  async getMyInterviews() {
    const res = await api.get('/ai/interviews');
    return res.data.data;
  },
};

export default aiService;
