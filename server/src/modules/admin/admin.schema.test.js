import { describe, it, expect } from 'vitest';
import { createProblemSchema, createAssessmentSchema, verifyAlumniSchema } from './admin.schema.js';

describe('Admin Zod Schemas Unit Tests', () => {
  it('validates a correct problem creation payload', () => {
    const validProblem = {
      title: 'Valid Problem',
      slug: 'valid-problem',
      statementMarkdown: 'Detailed problem description here.',
      difficulty: 'medium',
      tags: ['arrays'],
    };
    const parsed = createProblemSchema.safeParse(validProblem);
    expect(parsed.success).toBe(true);
    expect(parsed.data.slug).toBe('valid-problem');
  });

  it('rejects invalid slug containing uppercase or special characters', () => {
    const invalidProblem = {
      title: 'Bad Slug Problem',
      slug: 'Bad_Slug!@#',
      statementMarkdown: 'Detailed description.',
      difficulty: 'easy',
    };
    const parsed = createProblemSchema.safeParse(invalidProblem);
    expect(parsed.success).toBe(false);
  });

  it('validates proctored assessment payload structure', () => {
    const examPayload = {
      title: 'Midterm 2026',
      durationMinutes: 60,
      totalMarks: 50,
      rules: { fullScreenRequired: true, trackTabSwitches: true },
      questions: [
        {
          questionId: 'q1',
          questionText: 'What is CPU thrashing?',
          type: 'mcq',
          marks: 5,
          options: [
            { id: 'A', text: 'Excessive page swapping' },
            { id: 'B', text: 'High CPU utilization' },
          ],
          correctOptions: ['A'],
        },
      ],
    };
    const parsed = createAssessmentSchema.safeParse(examPayload);
    expect(parsed.success).toBe(true);
  });

  it('validates alumni verification payload with graduation year defaults', () => {
    const alumniPayload = {
      isAlumni: true,
      currentCompany: 'Google',
      graduationYear: 2024,
    };
    const parsed = verifyAlumniSchema.safeParse(alumniPayload);
    expect(parsed.success).toBe(true);
    expect(parsed.data.currentCompany).toBe('Google');
  });
});
