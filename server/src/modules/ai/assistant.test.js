import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import '../../test/setupDb.js';
import { createApp } from '../../app.js';
import { Subject } from '../academics/subject.model.js';
import { AcademicResource } from '../academics/academicResource.model.js';
import { AssistantConversation } from './assistantConversation.model.js';

describe('AI Academic Assistant Integration Tests', () => {
  const app = createApp();
  let studentToken;
  let testSubject;

  beforeEach(async () => {
    // Register test student
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `ai_student_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
        password: 'Password123',
        name: 'AI Learner',
        role: 'student',
      });
    studentToken = regRes.body.data.accessToken;

    // Seed test subject and verified notes
    testSubject = await Subject.create({
      code: 'CS203',
      name: 'Design and Analysis of Algorithms',
      university: 'MIT',
      branch: 'Computer Science and Engineering',
      semester: 4,
      topics: [{ topicId: 't_dnc', title: 'Divide and Conquer', order: 1 }],
    });

    await AcademicResource.create({
      subjectId: testSubject._id,
      topicId: 't_dnc',
      title: 'Divide and Conquer & Binary Search Comprehensive Notes',
      type: 'notes',
      textContent:
        'Binary search works on sorted arrays. Steps: calculate mid = low + (high - low)/2. Time complexity is O(log n).',
      author: 'Algorithms Department',
      isPublished: true,
    });
  });

  it('streams assistant response over SSE and persists conversation history', async () => {
    const res = await request(app)
      .post('/api/v1/ai/assistant/stream')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        query: 'Explain Binary Search and its complexity bounds',
        subjectId: testSubject._id,
      })
      .expect(200);

    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.text).toContain('event: meta');
    expect(res.text).toContain('event: token');
    expect(res.text).toContain('event: done');

    // Verify conversation was persisted in database
    const conv = await AssistantConversation.findOne({});
    expect(conv).toBeDefined();
    expect(conv.messages.length).toBe(2); // 1 user + 1 assistant
    expect(conv.messages[0].role).toBe('user');
    expect(conv.messages[1].role).toBe('assistant');
    expect(conv.messages[1].citations.length).toBeGreaterThan(0);
  });

  it('lists past conversation threads for student', async () => {
    // Perform a query first
    await request(app)
      .post('/api/v1/ai/assistant/stream')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        query: 'How does binary search work?',
        subjectId: testSubject._id,
      });

    const listRes = await request(app)
      .get('/api/v1/ai/assistant/conversations')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThan(0);
  });

  it('rejects empty query with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/ai/assistant/stream')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        query: '',
      })
      .expect(400);

    expect(res.body.error.message).toContain('Query cannot be empty');
  });
});
