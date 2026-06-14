import { z } from 'zod';

const ConfigSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    IPINFO_TOKEN: z.string().trim().min(1).optional(),
    CLOUDFLARE_ACCOUNT_ID: z.string().trim().min(1).optional(),
    CLOUDFLARE_RADAR_TOKEN: z.string().trim().min(1).optional(),
    // IPbot IP intelligence provider
    IPBOT_API_ORIGIN: z.string().trim().url().default('https://api.ipbot.com'),
    IPBOT_API_KEY: z.string().trim().min(1).optional(),
    IPBOT_TIMEOUT_MS: z.coerce.number().int().positive().default(4000),
    IPBOT_MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),
    CACHE_TTL_IPBOT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(24 * 60 * 60 * 1000), // 24h for clean results
    CACHE_TTL_IPBOT_HIGH_RISK_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60 * 60 * 1000), // 1h for high-risk results
    // Threat Intelligence Configuration
    ABUSEIPDB_API_KEY: z.string().trim().min(1).optional(),
    ENABLE_THREAT_INTEL: z.coerce.boolean().default(true),
    CACHE_TTL_THREATS_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60 * 60 * 1000), // 1 hour for threat intel
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
    CACHE_BACKEND: z.enum(['memory', 'kv']).default('memory'),
    CACHE_WARMING_ENABLED: z.coerce.boolean().default(true),
    CACHE_WARMING_DELAY_MS: z.coerce.number().int().nonnegative().default(100),
    CLIENT_TIMEOUT_MS: z.coerce.number().int().positive().default(2500),
    SIGNING_SECRET: z.string().trim().optional(),
    CREEPJS_ASSETS_PATH: z
      .string()
      .default(typeof process !== 'undefined' && process.cwd ? `${process.cwd()}/../creepjs/dist` : '../creepjs/dist'),
  })
  .superRefine((value, ctx) => {
    if (!value.IPBOT_API_KEY && !value.IPINFO_TOKEN && !(value.CLOUDFLARE_ACCOUNT_ID && value.CLOUDFLARE_RADAR_TOKEN)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide IPBOT_API_KEY, IPINFO_TOKEN, or both CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_RADAR_TOKEN.',
      });
    }
  });

const parsed = ConfigSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  IPINFO_TOKEN: process.env.IPINFO_TOKEN,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_RADAR_TOKEN: process.env.CLOUDFLARE_RADAR_TOKEN,
  IPBOT_API_ORIGIN: process.env.IPBOT_API_ORIGIN,
  IPBOT_API_KEY: process.env.IPBOT_API_KEY,
  IPBOT_TIMEOUT_MS: process.env.IPBOT_TIMEOUT_MS,
  IPBOT_MAX_RETRIES: process.env.IPBOT_MAX_RETRIES,
  CACHE_TTL_IPBOT_MS: process.env.CACHE_TTL_IPBOT_MS,
  CACHE_TTL_IPBOT_HIGH_RISK_MS: process.env.CACHE_TTL_IPBOT_HIGH_RISK_MS,
  ABUSEIPDB_API_KEY: process.env.ABUSEIPDB_API_KEY,
  ENABLE_THREAT_INTEL: process.env.ENABLE_THREAT_INTEL,
  CACHE_TTL_THREATS_MS: process.env.CACHE_TTL_THREATS_MS,
  LOG_LEVEL: process.env.LOG_LEVEL,
  CACHE_TTL_MS: process.env.CACHE_TTL_MS,
  CACHE_STALE_TTL_MS: process.env.CACHE_STALE_TTL_MS,
  CACHE_MAX_ITEMS: process.env.CACHE_MAX_ITEMS,
  CACHE_BACKEND: process.env.CACHE_BACKEND,
  CACHE_WARMING_ENABLED: process.env.CACHE_WARMING_ENABLED,
  CACHE_WARMING_DELAY_MS: process.env.CACHE_WARMING_DELAY_MS,
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
