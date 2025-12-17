import type { KVNamespace } from '@cloudflare/workers-types';

export interface Env {
  IP_CACHE: KVNamespace;
  IPINFO_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_RADAR_TOKEN?: string;
  ABUSEIPDB_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  NODE_ENV?: string;
  CACHE_BACKEND?: string;
  CACHE_TTL_MS?: string;
  CACHE_STALE_TTL_MS?: string;
  CACHE_WARMING_ENABLED?: string;
  CACHE_WARMING_DELAY_MS?: string;
  LOG_LEVEL?: string;
  CLIENT_TIMEOUT_MS?: string;
  PORT?: string;
}
