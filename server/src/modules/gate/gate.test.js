import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import '../../test/setupDb.js';
import { createApp } from '../../app.js';
import { GateTest } from './gateTest.model.js';

describe('GATE Module Integration Tests', () => {
  const app = createApp();
  let studentToken;
  let sampleTest;

  beforeEach(async () => {
    // Register test student
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `gate_student_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
        password: 'Password123',
        name: 'GATE Aspirant',
        role: 'student',
      });
    studentToken = regRes.body.data.accessToken;

    // Seed GATE test with MCQ, MSQ, and NAT
    sampleTest = await GateTest.create({
      title: 'GATE CS 2026 Grand Mock 1',
      description: 'Comprehensive mock covering Algorithms, OS, and DBMS',
      subject: 'Computer Science and Information Technology',
      durationMinutes: 180,
      totalMarks: 5,
      totalQuestions: 3,
      questions: [
        {
          questionId: 'q1',
          questionText: 'What is the worst-case time complexity of QuickSort?',
          type: 'mcq',
          marks: 1,
          negativeMarks: 0.33,
          options: [
            { id: 'A', text: 'O(n log n)' },
            { id: 'B', text: 'O(n^2)' },
            { id: 'C', text: 'O(n)' },
            { id: 'D', text: 'O(1)' },
          ],
          correctOptions: ['B'],
          topic: 'Algorithms',
          explanation: 'Worst case occurs when partition is highly unbalanced, leading to O(n^2).',
        },
        {
          questionId: 'q2',
          questionText:
            'Which of the following are CPU scheduling algorithms? (Select all that apply)',
          type: 'msq',
          marks: 2,
          negativeMarks: 0,
          options: [
            { id: 'A', text: 'Round Robin' },
            { id: 'B', text: 'Shortest Job First' },
            { id: 'C', text: 'LRU Page Replacement' },
            { id: 'D', text: 'First-Come, First-Served' },
          ],
          correctOptions: ['A', 'B', 'D'],
          topic: 'Operating Systems',
          explanation:
            'Round Robin, SJF, and FCFS are CPU scheduling algorithms. LRU is a page replacement policy.',
        },
        {
          questionId: 'q3',
          questionText:
            'In a B+ tree of order 4, what is the maximum number of keys in a leaf node?',
          type: 'nat',
          marks: 2,
          negativeMarks: 0,
          natRange: { min: 3, max: 3 },
          topic: 'Databases',
          explanation: 'For order p=4, maximum keys in a node is p - 1 = 3.',
        },
      ],
      isPublished: true,
    });
  });

  it('lists published GATE mock tests', async () => {
    const res = await request(app)
      .get('/api/v1/gate/tests')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    const test = res.body.data.find(t => t._id.toString() === sampleTest._id.toString());
    expect(test).toBeDefined();
    expect(test.title).toBe('GATE CS 2026 Grand Mock 1');
  });

  it('retrieves test without exposing correct answers or explanations during attempt', async () => {
    const res = await request(app)
      .get(`/api/v1/gate/tests/${sampleTest._id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.questions).toHaveLength(3);
    const q1 = res.body.data.questions[0];
    expect(q1.questionText).toBeDefined();
    expect(q1.correctOptions).toBeUndefined();
    expect(q1.explanation).toBeUndefined();
  });

  it('accurately scores attempt according to GATE rules and computes weak topics', async () => {
    // Student answers:
    // q1: MCQ incorrect -> 'A' (expected 'B') => -0.33
    // q2: MSQ exact match -> ['A', 'B', 'D'] => +2.00
    // q3: NAT correct -> 3 => +2.00
    // Expected Total: 3.67 / 5
    const submitRes = await request(app)
      .post(`/api/v1/gate/tests/${sampleTest._id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        timeTakenSeconds: 3600,
        answers: [
          { questionId: 'q1', selectedOptions: ['A'] },
          { questionId: 'q2', selectedOptions: ['A', 'B', 'D'] },
          { questionId: 'q3', natAnswer: 3 },
        ],
      })
      .expect(201);

    expect(submitRes.body.success).toBe(true);
    const attempt = submitRes.body.data;
    expect(attempt.score).toBe(3.67);
    expect(attempt.correctCount).toBe(2);
    expect(attempt.incorrectCount).toBe(1);
    expect(attempt.unattemptedCount).toBe(0);
    expect(attempt.weakTopics).toContain('Algorithms'); // 0% accuracy in Algorithms
    expect(attempt.weakTopics).not.toContain('Operating Systems'); // 100% in OS
  });

  it('retrieves completed attempt with question review and solutions', async () => {
    // Submit test
    const submitRes = await request(app)
      .post(`/api/v1/gate/tests/${sampleTest._id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        timeTakenSeconds: 1200,
        answers: [{ questionId: 'q1', selectedOptions: ['B'] }],
      });

    const attemptId = submitRes.body.data._id;

    // Fetch review
    const reviewRes = await request(app)
      .get(`/api/v1/gate/attempts/${attemptId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(reviewRes.body.success).toBe(true);
    expect(reviewRes.body.data.reviewQuestions).toBeDefined();
    expect(reviewRes.body.data.reviewQuestions).toHaveLength(3);

    const q1Review = reviewRes.body.data.reviewQuestions.find(q => q.questionId === 'q1');
    expect(q1Review.isCorrect).toBe(true);
    expect(q1Review.explanation).toContain('Worst case occurs');
  });

  it('lists user previous attempts', async () => {
    await request(app)
      .post(`/api/v1/gate/tests/${sampleTest._id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        timeTakenSeconds: 900,
        answers: [],
      });

    const listRes = await request(app)
      .get('/api/v1/gate/attempts')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThan(0);
  });
});
