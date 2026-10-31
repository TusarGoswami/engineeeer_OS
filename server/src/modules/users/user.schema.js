import { z } from 'zod';

export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'api',
  'dashboard',
  'settings',
  'profile',
  'auth',
  'null',
  'undefined',
  'engineeros',
  'explore',
  'search',
  'root',
  'system',
  'support',
  'help',
  'login',
  'register',
  'logout',
  'terms',
  'privacy',
  'u',
]);

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username must only contain letters, numbers, underscores, and dashes')
    .refine((val) => !RESERVED_USERNAMES.has(val.toLowerCase()), {
      message: 'This username is reserved by the platform',
    })
    .optional(),
  headline: z.string().max(120).optional(),
  university: z.string().max(150).optional(),
  branch: z.string().max(100).optional(),
  semester: z.number().int().min(1).max(8).optional(),
  bio: z.string().max(500).optional(),
  timezone: z.string().max(50).optional(),
  profile: z
    .object({
      avatarUrl: z.string().url().or(z.literal('')).optional(),
      githubHandle: z.string().max(50).optional(),
      linkedinUrl: z.string().url().or(z.literal('')).optional(),
      graduationYear: z.number().int().min(1980).max(2035).optional(),
      currentCompany: z.string().max(100).optional(),
    })
    .optional(),
  profileSettings: z
    .object({
      visibility: z.enum(['private', 'unlisted', 'public']).optional(),
      theme: z.enum(['terminal', 'minimalist', 'silicon', 'varsity', 'brutal']).optional(),
      sections: z
        .object({
          showHeatmap: z.boolean().optional(),
          showGate: z.boolean().optional(),
          showInterviews: z.boolean().optional(),
          showUniversity: z.boolean().optional(),
          showPhoto: z.boolean().optional(),
          showSkills: z.boolean().optional(),
          showBadges: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  goals: z.array(z.string().max(100)).max(10).optional(),
  settings: z
    .object({
      theme: z.enum(['dark', 'light', 'system']).optional(),
      emailNotifications: z.boolean().optional(),
    })
    .optional(),
});

export default { updateProfileSchema, RESERVED_USERNAMES };
