import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import '../../test/setupDb.js';
import { createApp } from '../../app.js';
import { Assessment } from './assessment.model.js';
import { AssessmentAttempt } from './assessmentAttempt.model.js';
import { MonitoringEvent } from './monitoringEvent.model.js';
import { User } from '../users/user.model.js';
import { TokenService } from '../auth/token.service.js';

describe('Assessments & Integrity Monitoring Integration Tests', () => {
  const app = createApp();
  let studentToken;
  let adminToken;
  let sampleAssessment;

  beforeEach(async () => {
    // Student user
    const studentUser = await User.create({
      email: `student_exam_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash',
      name: 'Examinee',
      role: 'student',
      isEmailVerified: true,
    });
    studentToken = TokenService.signAccessToken(studentUser);

    // Content Admin user
    const adminUser = await User.create({
      email: `admin_proctor_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash',
      name: 'Proctor Admin',
      role: 'contentAdmin',
      isEmailVerified: true,
    });
    adminToken = TokenService.signAccessToken(adminUser);

    // Seed sample assessment
    sampleAssessment = await Assessment.create({
      title: 'Operating Systems Midterm Assessment',
      description: 'Midterm covering CPU scheduling, memory management, and synchronization.',
      durationMinutes: 45,
      totalMarks: 4,
      questions: [
        {
          questionId: 'q1',
          questionText: 'Which CPU scheduling algorithm is non-preemptive by definition?',
          type: 'mcq',
          marks: 2,
          options: [
            { id: 'A', text: 'Round Robin' },
            { id: 'B', text: 'First-Come, First-Served (FCFS)' },
            { id: 'C', text: 'Shortest Remaining Time First (SRTF)' },
          ],
          correctOptions: ['B'],
        },
        {
          questionId: 'q2',
          questionText: 'What is the optimal page replacement algorithm in theory?',
          type: 'mcq',
          marks: 2,
          options: [
            { id: 'A', text: 'Belady Optimal (OPT)' },
            { id: 'B', text: 'FIFO' },
            { id: 'C', text: 'LRU' },
          ],
          correctOptions: ['A'],
        },
      ],
      rules: { fullScreenRequired: true, trackTabSwitches: true },
      isPublished: true,
    });
  });

  it('starts an assessment attempt and calculates server-authoritative timer', async () => {
    const res = await request(app)
      .post(`/api/v1/assessments/${sampleAssessment._id}/start`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.attempt).toBeDefined();
    expect(res.body.data.remainingSeconds).toBeGreaterThan(0);
    expect(res.body.data.isResumed).toBe(false);

    // Starting again resumes active attempt
    const resumeRes = await request(app)
      .post(`/api/v1/assessments/${sampleAssessment._id}/start`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(201);

    expect(resumeRes.body.data.isResumed).toBe(true);
    expect(resumeRes.body.data.attempt._id).toBe(res.body.data.attempt._id);
  });

  it('supports 30-second periodic autosave of student answers', async () => {
    const startRes = await request(app)
      .post(`/api/v1/assessments/${sampleAssessment._id}/start`)
      .set('Authorization', `Bearer ${studentToken}`);

    const attemptId = startRes.body.data.attempt._id;

    const autosaveRes = await request(app)
      .post(`/api/v1/assessments/attempts/${attemptId}/autosave`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        answers: [{ questionId: 'q1', selectedOptions: ['B'] }],
      })
      .expect(200);

    expect(autosaveRes.body.success).toBe(true);
    expect(autosaveRes.body.data.answersCount).toBe(1);

    const saved = await AssessmentAttempt.findById(attemptId);
    expect(saved.answers[0].selectedOptions).toContain('B');
  });

  it('audits client integrity events and flags attempt after threshold violations', async () => {
    const startRes = await request(app)
      .post(`/api/v1/assessments/${sampleAssessment._id}/start`)
      .set('Authorization', `Bearer ${studentToken}`);

    const attemptId = startRes.body.data.attempt._id;

    // Send 3 integrity events (tab switch, window blur, fullscreen exit)
    await request(app)
      .post(`/api/v1/assessments/attempts/${attemptId}/integrity`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventType: 'tab_hidden', metadata: { durationMs: 2500 } })
      .expect(200);

    await request(app)
      .post(`/api/v1/assessments/attempts/${attemptId}/integrity`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventType: 'window_blur', metadata: {} })
      .expect(200);

    const thirdRes = await request(app)
      .post(`/api/v1/assessments/attempts/${attemptId}/integrity`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventType: 'fullscreen_exit', metadata: {} })
      .expect(200);

    expect(thirdRes.body.data.signalsCount).toBe(3);
    expect(thirdRes.body.data.isFlaggedForReview).toBe(true);

    const events = await MonitoringEvent.find({ attemptId });
    expect(events).toHaveLength(3);
  });

  it('submits assessment, evaluates score, and updates student record', async () => {
    const startRes = await request(app)
      .post(`/api/v1/assessments/${sampleAssessment._id}/start`)
      .set('Authorization', `Bearer ${studentToken}`);

    const attemptId = startRes.body.data.attempt._id;

    // Student submits answers: q1 correct ('B'), q2 incorrect ('B' instead of 'A')
    const submitRes = await request(app)
      .post(`/api/v1/assessments/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        answers: [
          { questionId: 'q1', selectedOptions: ['B'] },
          { questionId: 'q2', selectedOptions: ['B'] },
        ],
      })
      .expect(200);

    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.data.score).toBe(2); // 2 out of 4
    expect(submitRes.body.data.status).toBe('submitted');
  });

  it('allows contentAdmin to view proctoring review signals and rejects students', async () => {
    // 1. Student attempting to access reviewer signals gets 403
    await request(app)
      .get(`/api/v1/assessments/${sampleAssessment._id}/review-signals`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);

    // 2. Admin gets review signals list
    const adminRes = await request(app)
      .get(`/api/v1/assessments/${sampleAssessment._id}/review-signals`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(adminRes.body.success).toBe(true);
    expect(Array.isArray(adminRes.body.data)).toBe(true);
  });
});
