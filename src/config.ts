import { z } from 'zod';

const ConfigSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4310),
    IPINFO_TOKEN: z.string().trim().min(1).optional(),
    CLOUDFLARE_ACCOUNT_ID: z.string().trim().min(1).optional(),
    CLOUDFLARE_RADAR_TOKEN: z.string().trim().min(1).optional(),
    // Threat Intelligence Configuration
    ABUSEIPDB_API_KEY: z.string().trim().min(1).optional(),
    ENABLE_THREAT_INTEL: z.coerce.boolean().default(true),
    CACHE_TTL_THREATS_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60 * 60 * 1000), // 1 hour for threat intel
    CORS_ALLOWED_ORIGINS: z
      .string()
      .optional()
      .transform(val => {
        if (!val) return ['*']; // Allow all in development
        return val.split(',').map(origin => origin.trim());
      }),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    CACHE_TTL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(5 * 60 * 1000),
    CACHE_STALE_TTL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(30 * 60 * 1000), // 30 minutes stale time
    CACHE_MAX_ITEMS: z.coerce.number().int().positive().default(500),
    CACHE_BACKEND: z.enum(['memory', 'redis', 'kv']).default('memory'),
    CACHE_WARMING_ENABLED: z.coerce.boolean().default(true),
    CACHE_WARMING_DELAY_MS: z.coerce.number().int().nonnegative().default(100),
    REDIS_URL: z.string().optional(),
    CLIENT_TIMEOUT_MS: z.coerce.number().int().positive().default(2500),
    SIGNING_SECRET: z.string().trim().optional(),
    CREEPJS_ASSETS_PATH: z
      .string()
      .default(typeof process !== 'undefined' && process.cwd ? `${process.cwd()}/../creepjs/dist` : '../creepjs/dist'),
  })
  .superRefine((value, ctx) => {
    if (!value.IPINFO_TOKEN && !(value.CLOUDFLARE_ACCOUNT_ID && value.CLOUDFLARE_RADAR_TOKEN)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide IPINFO_TOKEN or both CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_RADAR_TOKEN.',
      });
    }
  });

const parsed = ConfigSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  IPINFO_TOKEN: process.env.IPINFO_TOKEN,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_RADAR_TOKEN: process.env.CLOUDFLARE_RADAR_TOKEN,
  ABUSEIPDB_API_KEY: process.env.ABUSEIPDB_API_KEY,
  ENABLE_THREAT_INTEL: process.env.ENABLE_THREAT_INTEL,
  CACHE_TTL_THREATS_MS: process.env.CACHE_TTL_THREATS_MS,
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
  LOG_LEVEL: process.env.LOG_LEVEL,
  CACHE_TTL_MS: process.env.CACHE_TTL_MS,
  CACHE_STALE_TTL_MS: process.env.CACHE_STALE_TTL_MS,
  CACHE_MAX_ITEMS: process.env.CACHE_MAX_ITEMS,
  CACHE_BACKEND: process.env.CACHE_BACKEND,
  CACHE_WARMING_ENABLED: process.env.CACHE_WARMING_ENABLED,
  CACHE_WARMING_DELAY_MS: process.env.CACHE_WARMING_DELAY_MS,
  REDIS_URL: process.env.REDIS_URL,
  CLIENT_TIMEOUT_MS: process.env.CLIENT_TIMEOUT_MS,
  SIGNING_SECRET: process.env.SIGNING_SECRET,
  CREEPJS_ASSETS_PATH: process.env.CREEPJS_ASSETS_PATH,
});

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export type AppConfig = z.infer<typeof ConfigSchema>;
export const config: AppConfig = parsed.data;
export const isProd = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';
