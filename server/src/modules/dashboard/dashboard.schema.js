import { z } from 'zod';

export const updateTaskSchema = z.object({
  status: z.enum(['pending', 'completed', 'snoozed'], {
    required_error: 'Status is required',
    invalid_type_error: "Status must be 'pending', 'completed', or 'snoozed'",
  }),
});

export const getHeatmapQuerySchema = z.object({
  months: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 12))
    .refine(val => !isNaN(val) && val > 0 && val <= 24, {
      message: 'Months must be a positive integer up to 24',
    }),
});

