import { z } from 'zod';
import { RESERVED_USERNAMES } from '../users/user.schema.js';

export const updateProfileSettingsSchema = z.object({
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
  bio: z.string().max(500).optional(),
  university: z.string().max(150).optional(),
  branch: z.string().max(100).optional(),
  semester: z.number().int().min(1).max(8).optional(),
  timezone: z.string().max(50).optional(),
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
});

export const publicProfileQuerySchema = z.object({
  token: z.string().optional(),
});

export default { updateProfileSettingsSchema, publicProfileQuerySchema };

