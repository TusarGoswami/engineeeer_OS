import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  university: z.string().max(150).optional(),
  branch: z.string().max(100).optional(),
  semester: z.number().int().min(1).max(8).optional(),
  bio: z.string().max(500).optional(),
  profile: z
    .object({
      avatarUrl: z.string().url().or(z.literal('')).optional(),
      githubHandle: z.string().max(50).optional(),
      linkedinUrl: z.string().url().or(z.literal('')).optional(),
      graduationYear: z.number().int().min(1980).max(2035).optional(),
      currentCompany: z.string().max(100).optional(),
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

export default { updateProfileSchema };
