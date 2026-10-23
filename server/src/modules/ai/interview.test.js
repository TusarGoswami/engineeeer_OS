import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import '../../test/setupDb.js';
import { createApp } from '../../app.js';
import { ProgressSummary } from '../progress/progressSummary.model.js';

describe('AI Mock Interviews Integration Tests', () => {
  const app = createApp();
  let studentToken;

  beforeEach(async () => {
    // Register test student
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `candidate_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
        password: 'Password123',
        name: 'Interview Candidate',
        role: 'student',
      });
    studentToken = regRes.body.data.accessToken;
  });

  it('initializes interactive interview session with context-aware opening question', async () => {
    const res = await request(app)
      .post('/api/v1/ai/interviews')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        mode: 'technical',
        targetRole: 'Full Stack Engineer',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.status).toBe('in_progress');
    expect(res.body.data.turns).toHaveLength(1);
    expect(res.body.data.turns[0].role).toBe('interviewer');
    expect(res.body.data.turns[0].message).toContain('Full Stack Engineer');
  });

  it('accepts candidate answer and returns interviewer follow-up question', async () => {
    // 1. Create session
    const startRes = await request(app)
      .post('/api/v1/ai/interviews')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        mode: 'technical',
        targetRole: 'SDE-1',
      });

    const sessionId = startRes.body.data._id;

    // 2. Submit candidate answer
    const turnRes = await request(app)
      .post(`/api/v1/ai/interviews/${sessionId}/turn`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        candidateMessage:
          'I designed a high-throughput caching layer with Redis to reduce PostgreSQL read load by 80%.',
      })
      .expect(200);

    expect(turnRes.body.success).toBe(true);
    expect(turnRes.body.data.turns).toHaveLength(3); // 1. greeting, 2. candidate, 3. follow-up
    expect(turnRes.body.data.turns[1].role).toBe('candidate');
    expect(turnRes.body.data.turns[2].role).toBe('interviewer');
  });

  it('finishes interview session, triggers evaluation worker, and generates rubric scorecard', async () => {
    // 1. Create and conduct a turn
    const startRes = await request(app)
      .post('/api/v1/ai/interviews')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ mode: 'dsa', targetRole: 'Backend Engineer' });

    const sessionId = startRes.body.data._id;

    await request(app)
      .post(`/api/v1/ai/interviews/${sessionId}/turn`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        candidateMessage:
          'I can use a depth-first search to check if the heights of left and right subtrees differ by at most 1, returning -1 if unbalanced in O(n) time.',
      });

    // 2. Finish interview
    const finishRes = await request(app)
      .post(`/api/v1/ai/interviews/${sessionId}/finish`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(202);

    expect(finishRes.body.success).toBe(true);

    // 3. Verify session was evaluated by synchronous test-mode worker
    const reportRes = await request(app)
      .get(`/api/v1/ai/interviews/${sessionId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(reportRes.body.success).toBe(true);
    const session = reportRes.body.data;
    expect(session.status).toBe('evaluated');
    expect(session.evaluation).toBeDefined();
    expect(session.evaluation.overallScore).toBeGreaterThanOrEqual(0);
    expect(session.evaluation.rubricScores.technicalCorrectness).toBeGreaterThan(0);
    expect(session.evaluation.strengths.length).toBeGreaterThan(0);
    expect(session.evaluation.areasForImprovement.length).toBeGreaterThan(0);

    // Verify user progress summary was updated
    const userRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${studentToken}`);
    const userId = userRes.body.data._id;

    const summary = await ProgressSummary.findOne({ userId });
    expect(summary).toBeDefined();
    expect(summary.interviewStats.sessionsCompleted).toBeGreaterThan(0);
  });
});
