import { describe, it, expect } from 'vitest';
import request from 'supertest';
import '../../test/setupDb.js';
import { createApp } from '../../app.js';
import { Subject } from '../academics/subject.model.js';

describe('Dashboard Module Integration Tests', () => {
  const app = createApp();

  const registerUser = async email => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email,
      password: 'Password123',
      name: 'Alex Developer',
      university: 'MIT',
      branch: 'Computer Science and Engineering',
      semester: 3,
    });
    return res.body.data.accessToken;
  };

  it('GET /api/v1/dashboard/summary delivers pre-aggregated data and 3-5 recommendations', async () => {
    const token = await registerUser('dash_test@test.com');

    // Create a subject in semester 3 so recommendation engine picks it up
    await Subject.create({
      code: 'CS201',
      name: 'Discrete Mathematical Structures',
      university: 'MIT',
      branch: 'Computer Science and Engineering',
      semester: 3,
      topics: [
        {
          topicId: 'top_logic',
          title: 'Propositional & Predicate Logic',
          order: 1,
          estimatedHours: 2,
        },
      ],
    });

    const start = performance.now();
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const durationMs = performance.now() - start;

    expect(durationMs).toBeLessThan(500); // Fast SLA verification
    expect(res.body.data).toBeDefined();
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.stats.academics).toBeDefined();
    expect(res.body.data.stats.coding).toBeDefined();

    // Check "What should I do today?" recommendation panel
    const recs = res.body.data.whatShouldIDoToday;
    expect(Array.isArray(recs)).toBe(true);
    expect(recs.length).toBeGreaterThanOrEqual(3);
    expect(recs.length).toBeLessThanOrEqual(5);

    // Verify recommendation structure
    const firstRec = recs[0];
    expect(firstRec.id).toBeDefined();
    expect(firstRec.title).toBeDefined();
    expect(firstRec.description).toBeDefined();
    expect(firstRec.priority).toBeDefined();
    expect(firstRec.deepLink).toBeDefined();
    expect(firstRec.actionLabel).toBeDefined();

    // Check that academics pending topic was recommended
    const academicRec = recs.find(r => r.type === 'academics');
    expect(academicRec).toBeDefined();
    expect(academicRec.title).toContain('Propositional & Predicate Logic');
  });

  it('GET /api/v1/dashboard/today returns prioritized daily tasks and supports PATCH /tasks/:id', async () => {
    const token = await registerUser('dash_today@test.com');

    // 1. Fetch today's tasks
    const todayRes = await request(app)
      .get('/api/v1/dashboard/today')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(todayRes.body.data).toBeDefined();
    expect(todayRes.body.data.date).toBeDefined();
    expect(Array.isArray(todayRes.body.data.tasks)).toBe(true);
    expect(todayRes.body.data.tasks.length).toBeGreaterThanOrEqual(3);
    expect(todayRes.body.data.total).toBe(todayRes.body.data.tasks.length);
    expect(todayRes.body.data.completed).toBe(0);

    const firstTask = todayRes.body.data.tasks[0];
    expect(firstTask.status).toBe('pending');

    // 2. Complete the first task
    const patchRes = await request(app)
      .patch(`/api/v1/dashboard/tasks/${firstTask._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' })
      .expect(200);

    expect(patchRes.body.data.status).toBe('completed');
    expect(patchRes.body.data.completedAt).toBeDefined();

    // 3. Snooze the second task
    const secondTask = todayRes.body.data.tasks[1];
    const snoozeRes = await request(app)
      .patch(`/api/v1/dashboard/tasks/${secondTask._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'snoozed' })
      .expect(200);

    expect(snoozeRes.body.data.status).toBe('snoozed');
    expect(snoozeRes.body.data.snoozedUntil).toBeDefined();

    // 4. Verify updated stats on GET /today
    const verifyRes = await request(app)
      .get('/api/v1/dashboard/today')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(verifyRes.body.data.completed).toBe(1);
    expect(verifyRes.body.data.percent).toBeGreaterThan(0);
  });

  it('GET /api/v1/dashboard/heatmap returns consistency telemetry list', async () => {
    const token = await registerUser('dash_heat@test.com');

    const res = await request(app)
      .get('/api/v1/dashboard/heatmap?months=6')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
