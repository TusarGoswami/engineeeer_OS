import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { User } from '../users/user.model.js';
import { CodingProblem } from '../coding/codingProblem.model.js';
import { Assessment } from '../assessments/assessment.model.js';
import { AssessmentAttempt } from '../assessments/assessmentAttempt.model.js';
import { TokenService } from '../auth/token.service.js';
import { PasswordService } from '../auth/password.service.js';
import '../../test/setupDb.js';

describe('Admin & Faculty Console Integration Tests (Phase 6)', () => {
  let app;
  let studentToken;
  let studentUser;
  let adminToken;
  let adminUser;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(async () => {
    const passwordHash = await PasswordService.hash('Password123');

    studentUser = await User.create({
      email: `student_admin_test_${Date.now()}_${Math.random()}@engineeros.dev`,
      username: `student_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      passwordHash,
      name: 'Regular Student',
      role: 'student',
      university: 'MIT',
      branch: 'Computer Science and Engineering',
      semester: 4,
    });
    studentToken = TokenService.signAccessToken(studentUser);

    adminUser = await User.create({
      email: `admin_faculty_test_${Date.now()}_${Math.random()}@engineeros.dev`,
      username: `admin_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      passwordHash,
      name: 'Dr. Faculty Admin',
      role: 'platformAdmin',
      university: 'MIT',
      branch: 'Computer Science and Engineering',
    });
    adminToken = TokenService.signAccessToken(adminUser);
  });

  describe('RBAC Access Control', () => {
    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/admin/stats');
      expect(res.status).toBe(401);
    });

    it('rejects normal student user with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('allows platformAdmin to access admin stats', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.coding).toBeDefined();
      expect(res.body.data.assessments).toBeDefined();
    });
  });

  describe('Problem Authoring Studio', () => {
    it('creates a new algorithm problem with starter code', async () => {
      const payload = {
        title: 'Binary Tree Level Order Traversal II',
        slug: `binary-tree-level-order-${Date.now()}`,
        statementMarkdown: 'Given the root of a binary tree, return bottom-up level order traversal.',
        difficulty: 'medium',
        tags: ['tree', 'bfs', 'queue'],
        constraints: { timeLimitMs: 1500, memoryLimitKb: 256000 },
        starterCode: {
          python: 'def levelOrderBottom(root):\n    pass\n',
        },
        sampleTestCases: [
          { input: '[3,9,20,null,null,15,7]', output: '[[15,7],[9,20],[3]]' },
        ],
      };

      const res = await request(app)
        .post('/api/v1/admin/problems')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(payload.title);
      expect(res.body.data.slug).toBe(payload.slug);
    });

    it('adds a custom hidden test case to an existing problem', async () => {
      const problem = await CodingProblem.create({
        title: 'Sample Test Problem',
        slug: `sample-test-${Date.now()}`,
        statementMarkdown: 'Problem statement',
        difficulty: 'easy',
      });

      const testCasePayload = {
        input: '[1,2,3]',
        expectedOutput: '[[2,3],[1]]',
        isHidden: true,
        weight: 2,
      };

      const res = await request(app)
        .post(`/api/v1/admin/problems/${problem._id}/testcases`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testCasePayload);

      expect(res.status).toBe(201);
      expect(res.body.data.problemId).toBe(problem._id.toString());
      expect(res.body.data.isHidden).toBe(true);
    });

    it('retrieves the problem with test cases', async () => {
      const problem = await CodingProblem.create({
        title: 'Sample Retrieval Problem',
        slug: `sample-retrieval-${Date.now()}`,
        statementMarkdown: 'Problem statement',
        difficulty: 'hard',
      });

      await request(app)
        .post(`/api/v1/admin/problems/${problem._id}/testcases`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ input: '5', expectedOutput: '25', isHidden: false });

      const res = await request(app)
        .get(`/api/v1/admin/problems/${problem._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.testCases).toHaveLength(1);
    });

    it('filters algorithm problems by difficulty in admin query', async () => {
      const res = await request(app)
        .get('/api/v1/admin/problems?difficulty=easy')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.problems)).toBe(true);
    });
  });

  describe('Assessment Creator & Scheduler', () => {
    it('creates a new proctored exam with questions and anti-cheat rules', async () => {
      const examPayload = {
        title: 'Midterm 2026: Operating Systems & Virtual Memory',
        description: 'Comprehensive proctored exam on page replacement and thrashing.',
        durationMinutes: 45,
        totalMarks: 20,
        rules: { fullScreenRequired: true, trackTabSwitches: true },
        questions: [
          {
            questionId: 'q1',
            questionText: 'Which page replacement algorithm suffers from Belady Anomaly?',
            type: 'mcq',
            marks: 5,
            options: [
              { id: 'A', text: 'LRU' },
              { id: 'B', text: 'FIFO' },
              { id: 'C', text: 'OPT' },
            ],
            correctOptions: ['B'],
            explanation: 'FIFO can result in more page faults when allocated more frames.',
          },
        ],
      };

      const res = await request(app)
        .post('/api/v1/admin/assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(examPayload);

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(examPayload.title);
      expect(res.body.data.questions).toHaveLength(1);
    });

    it('lists created assessments', async () => {
      await Assessment.create({
        title: 'Mock Assessment List Check',
        durationMinutes: 30,
        totalMarks: 50,
        questions: [
          {
            questionId: 'q1',
            questionText: 'Test',
            type: 'mcq',
            options: [{ id: 'A', text: 'A' }],
            correctOptions: ['A'],
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/admin/assessments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.assessments.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Student Integrity Moderation Queue', () => {
    let testAttempt;

    beforeEach(async () => {
      const assessment = await Assessment.create({
        title: 'Integrity Test Exam',
        questionsCount: 1,
        questions: [
          {
            questionId: 'q1',
            questionText: 'Test Question',
            type: 'mcq',
            options: [{ id: 'A', text: 'Option A' }],
            correctOptions: ['A'],
          },
        ],
      });

      testAttempt = await AssessmentAttempt.create({
        assessmentId: assessment._id,
        userId: studentUser._id,
        score: 18,
        status: 'submitted',
        isFlaggedForReview: true,
        reviewSignalsCount: 4,
        expiresAt: new Date(Date.now() + 3600000),
      });
    });

    it('retrieves flagged attempts in the integrity moderation queue', async () => {
      const res = await request(app)
        .get('/api/v1/admin/integrity-signals')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.attempts.length).toBeGreaterThanOrEqual(1);
      const target = res.body.data.attempts.find((a) => a._id.toString() === testAttempt._id.toString());
      expect(target).toBeDefined();
      expect(target.userId.name).toBe(studentUser.name);
    });

    it('applies a penalty verdict to the flagged attempt', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/attempts/${testAttempt._id}/verdict`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'penalize',
          penaltyMarks: 5,
          notes: 'Excessive tab switches detected during section 2.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(13); // 18 - 5 = 13
      expect(res.body.data.facultyReview.verdict).toBe('penalize');
      expect(res.body.data.facultyReview.penaltyMarks).toBe(5);
    });
  });

  describe('User Governance & Verified Alumni Badges', () => {
    it('verifies alumni status and awards Verified Alumni badge', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/users/${studentUser._id}/alumni-status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isAlumni: true,
          currentCompany: 'Google (SDE-2)',
          graduationYear: 2024,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isAlumni).toBe(true);
      expect(res.body.data.role).toBe('senior');
      expect(res.body.data.profile.currentCompany).toBe('Google (SDE-2)');

      const updatedUser = await User.findById(studentUser._id);
      expect(updatedUser.isAlumni).toBe(true);
    });

    it('promotes user role to contentAdmin', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${studentUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'contentAdmin' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('contentAdmin');
    });
  });
});
