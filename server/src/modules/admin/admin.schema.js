import { z } from 'zod';

export const createProblemSchema = z.object({
  title: z.string().min(3).max(120),
  slug: z.string().min(3).max(100).trim().toLowerCase().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  statementMarkdown: z.string().min(10),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()).default([]),
  constraints: z.object({
    timeLimitMs: z.number().int().min(100).max(10000).default(2000),
    memoryLimitKb: z.number().int().min(16000).max(1024000).default(256000),
    customNotes: z.string().optional().default(''),
  }).default({}),
  starterCode: z.object({
    python: z.string().optional(),
    cpp: z.string().optional(),
    java: z.string().optional(),
    javascript: z.string().optional(),
  }).optional(),
  sampleTestCases: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional().default(''),
  })).default([]),
  isPublished: z.boolean().default(true),
});

export const updateProblemSchema = createProblemSchema.partial();

export const createTestCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isHidden: z.boolean().default(true),
  order: z.number().default(0),
  weight: z.number().default(1),
});

export const createAssessmentSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().default(''),
  subjectId: z.string().optional().nullable(),
  durationMinutes: z.number().int().min(5).max(300).default(60),
  totalMarks: z.number().int().min(1).default(100),
  rules: z.object({
    fullScreenRequired: z.boolean().default(true),
    trackTabSwitches: z.boolean().default(true),
    maxViolationsAllowed: z.number().default(5),
  }).default({}),
  questions: z.array(z.object({
    questionId: z.string(),
    questionText: z.string().min(3),
    type: z.enum(['mcq', 'msq', 'nat']),
    marks: z.number().default(2),
    options: z.array(z.object({
      id: z.string(),
      text: z.string(),
    })).default([]),
    correctOptions: z.array(z.string()).default([]),
    natRange: z.object({
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional(),
    }).optional(),
    explanation: z.string().optional().default(''),
    topic: z.string().default('General'),
  })).min(1, 'Assessment must contain at least one question'),
  isPublished: z.boolean().default(true),
});

export const updateAssessmentSchema = createAssessmentSchema.partial();

export const integrityVerdictSchema = z.object({
  action: z.enum(['approve', 'penalize', 'void']),
  penaltyMarks: z.number().min(0).default(0),
  notes: z.string().max(500).default(''),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['student', 'senior', 'contentAdmin', 'platformAdmin']),
});

export const verifyAlumniSchema = z.object({
  isAlumni: z.boolean(),
  currentCompany: z.string().max(100).optional().default(''),
  graduationYear: z.number().int().min(1970).max(2035).optional().default(new Date().getFullYear()),
});
