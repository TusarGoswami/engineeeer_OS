import { describe, it, expect } from 'vitest';
import request from 'supertest';
import '../../test/setupDb.js';
import { createApp } from '../../app.js';
import { Subject } from './subject.model.js';
import { ProgressSummary } from '../progress/progressSummary.model.js';

describe('Academics Module Integration Tests', () => {
  const app = createApp();

  const registerUser = async (email, role = 'student') => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email,
      password: 'Password123',
      name: 'Test Student',
      role,
      university: 'MIT',
      branch: 'Computer Science and Engineering',
      semester: 4,
    });
    return res.body.data.accessToken;
  };

  it('lists subjects filtered by university, branch and semester', async () => {
    // Seed test subject
    await Subject.create({
      code: 'CS203',
      name: 'Design and Analysis of Algorithms',
      university: 'MIT',
      branch: 'Computer Science and Engineering',
      semester: 4,
      topics: [
        { topicId: 't1', title: 'Divide and Conquer', order: 1 },
        { topicId: 't2', title: 'Greedy Algorithms', order: 2 },
      ],
    });

    const res = await request(app)
      .get(
        '/api/v1/academics/subjects?university=MIT&branch=Computer Science and Engineering&semester=4'
      )
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].code).toBe('CS203');
    expect(res.body.data[0].name).toBe('Design and Analysis of Algorithms');
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.hasMore).toBe(false);
  });

  it('allows student to toggle topic completion and updates progress summary', async () => {
    const token = await registerUser('student_academics@test.com');

    const subject = await Subject.create({
      code: 'CS204',
      name: 'Operating Systems',
      university: 'MIT',
      branch: 'Computer Science and Engineering',
      semester: 4,
      topics: [
        { topicId: 'top_proc', title: 'Processes & Threads', order: 1 },
        { topicId: 'top_mem', title: 'Virtual Memory', order: 2 },
      ],
    });

    // Mark topic complete
    const toggleRes = await request(app)
      .post(`/api/v1/academics/subjects/${subject._id}/topics/top_proc/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(toggleRes.body.data.completedTopicIds).toContain('top_proc');
    expect(toggleRes.body.data.completionPercentage).toBe(50);

    // Verify ProgressSummary was automatically updated by progress pipeline
    const userRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);
    const userId = userRes.body.data._id;

    const summary = await ProgressSummary.findOne({ userId });
    expect(summary).toBeDefined();
    expect(summary.academicsStats.completedTopics).toBe(1);
    expect(summary.academicsStats.totalTopics).toBe(2);
    expect(summary.academicsStats.percentComplete).toBe(50);
  });

  it('rejects subject creation by standard student with 403 Forbidden', async () => {
    const studentToken = await registerUser('unauthorized_student@test.com');

    const res = await request(app)
      .post('/api/v1/academics/subjects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        code: 'CS999',
        name: 'Hacking 101',
        university: 'MIT',
        branch: 'Computer Science and Engineering',
        semester: 4,
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
