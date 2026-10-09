import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env in non-production environments
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  HOST: z.string().default('0.0.0.0'),
  CLIENT_URL: z.string().default('http://localhost:3000'),

  // Database & Cache
  MONGODB_URI: z.string().default('mongodb://localhost:27017/engineeros'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Security & Authentication
  JWT_ACCESS_SECRET: z
    .string()
    .min(16)
    .default('local-dev-jwt-access-secret-minimum-32-chars-long'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16)
    .default('local-dev-jwt-refresh-secret-minimum-32-chars-long'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  COOKIE_SECRET: z.string().default('local-dev-cookie-secret-minimum-32-chars'),

  // External Integration Providers
  CODE_EXEC_PROVIDER: z.enum(['mock', 'judge0']).default('mock'),
  JUDGE0_API_URL: z.string().default('http://localhost:2358'),
  JUDGE0_API_KEY: z.string().optional().default(''),

  LLM_PROVIDER: z.enum(['mock', 'anthropic']).default('mock'),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  LLM_MODEL: z.string().default('claude-3-5-sonnet-20241022'),

  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./uploads'),

  EMAIL_PROVIDER: z.enum(['console', 'ses', 'smtp']).default('console'),
  EMAIL_FROM: z.string().default('noreply@engineeros.dev'),

  // Rate Limiting
  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().default(120),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().default(10),
  RATE_LIMIT_CODE_EXEC_MAX: z.coerce.number().default(15),
  RATE_LIMIT_AI_MAX: z.coerce.number().default(10),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ FATAL: Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
export default env;
