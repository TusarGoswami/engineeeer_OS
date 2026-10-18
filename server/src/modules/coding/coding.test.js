import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import '../../test/setupDb.js';
import { createApp } from '../../app.js';
import { CodingProblem } from './codingProblem.model.js';
import { CodingTestCase } from './codingTestCase.model.js';

describe('Coding Module Integration Tests', () => {
  const app = createApp();
  let studentToken;
  let testProblem;

  beforeEach(async () => {
    // Register test student
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `coder_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
        password: 'Password123',
        name: 'Test Coder',
        role: 'student',
      });
    studentToken = regRes.body.data.accessToken;

    // Seed test problem
    testProblem = await CodingProblem.create({
      title: 'Two Sum',
      slug: `two-sum-${Date.now()}`,
      statementMarkdown:
        'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
      difficulty: 'easy',
      tags: ['Array', 'Hash Table'],
      sampleTestCases: [
        {
          input: '4\n2 7 11 15\n9',
          output: '0 1',
          explanation: 'nums[0] + nums[1] == 9, we return [0, 1].',
        },
      ],
      isPublished: true,
    });

    // Seed hidden test cases
    await CodingTestCase.create([
      {
        problemId: testProblem._id,
        input: '4\n2 7 11 15\n9',
        expectedOutput: '0 1',
        isHidden: false,
        order: 1,
      },
      {
        problemId: testProblem._id,
        input: '3\n3 2 4\n6',
        expectedOutput: '1 2',
        isHidden: true,
        order: 2,
      },
    ]);
  });

  it('lists problems with pagination and filters', async () => {
    const res = await request(app).get('/api/v1/coding/problems?difficulty=easy').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const found = res.body.data.find(p => p._id.toString() === testProblem._id.toString());
    expect(found).toBeDefined();
    expect(found.title).toBe('Two Sum');
  });

  it('retrieves problem details by slug without exposing hidden test cases', async () => {
    const res = await request(app).get(`/api/v1/coding/problems/${testProblem.slug}`).expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Two Sum');
    expect(res.body.data.sampleTestCases).toHaveLength(1);
  });

  it('executes sample test run synchronously with mock Judge0', async () => {
    const res = await request(app)
      .post(`/api/v1/coding/problems/${testProblem._id}/run`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        sourceCode: 'print("0 1")',
        language: 'python',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.totalSamples).toBe(1);
    expect(res.body.data.passedSamples).toBe(1);
    expect(res.body.data.sampleResults[0].passed).toBe(true);
  });

  it('submits solution asynchronously, evaluates via worker, and awards ACCEPTED verdict', async () => {
    const res = await request(app)
      .post(`/api/v1/coding/problems/${testProblem._id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        sourceCode: 'def solve(): pass',
        language: 'python',
      })
      .expect(202);

    expect(res.body.success).toBe(true);
    expect(res.body.data.submissionId).toBeDefined();

    // Verify submission record was evaluated to accepted by test-mode synchronous worker
    const subRes = await request(app)
      .get(`/api/v1/coding/submissions/${res.body.data.submissionId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(subRes.body.success).toBe(true);
    expect(subRes.body.data.status).toBe('accepted');
    expect(subRes.body.data.testCasesPassed).toBe(2);
    expect(subRes.body.data.sourceCode).toBe('def solve(): pass');
    expect(subRes.body.data.executionTrace).toHaveLength(2);
  });

  it('handles compilation error properly when simulated', async () => {
    const res = await request(app)
      .post(`/api/v1/coding/problems/${testProblem._id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        sourceCode: 'TRIGGER_COMPILE_ERROR class Foo',
        language: 'python',
      })
      .expect(202);

    const subRes = await request(app)
      .get(`/api/v1/coding/submissions/${res.body.data.submissionId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(subRes.body.data.status).toBe('compile_error');
    expect(subRes.body.data.compileError).toContain('syntax error');
  });

  it('lists user submission history', async () => {
    // Make a submission
    await request(app)
      .post(`/api/v1/coding/problems/${testProblem._id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        sourceCode: 'solution code',
        language: 'python',
      })
      .expect(202);

    const histRes = await request(app)
      .get(`/api/v1/coding/submissions?problemId=${testProblem._id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(histRes.body.success).toBe(true);
    expect(histRes.body.data.length).toBeGreaterThan(0);
  });
});
