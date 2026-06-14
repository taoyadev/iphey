/**
 * IPbot API Client
 *
 * Calls `GET {origin}/v1/ip/{ip}` with an `X-API-Key` header.
 * The key is supplied explicitly by the caller — never hardcoded.
 *
 * Behaviour:
 * - Per-request timeout via AbortController
 * - Exponential backoff on 429 / 5xx / network errors, honouring `Retry-After`
 * - Records the `X-RateLimit-*` response headers for observability
 */

import { logger } from '../utils/logger';
import type { IpbotLookupResponse, IpbotRateLimit, IpbotResult } from '../types/ipbot';

const RETRY_BASE_MS = 300;
const MAX_BACKOFF_MS = 30_000;
const DEFAULT_ORIGIN = 'https://api.ipbot.com';
const DEFAULT_TIMEOUT_MS = 4000;
const DEFAULT_MAX_RETRIES = 3;

export interface IpbotClientOptions {
  origin?: string;
  apiKey?: string;
  timeoutMs?: number;
  maxRetries?: number;
  fetchImpl?: typeof fetch;
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const toNumber = (value: string | null): number | undefined => {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

function parseRateLimit(headers: Headers): IpbotRateLimit {
  return {
    limit: toNumber(headers.get('x-ratelimit-limit')),
    remaining: toNumber(headers.get('x-ratelimit-remaining')),
    reset: toNumber(headers.get('x-ratelimit-reset')),
    tier: headers.get('x-ratelimit-tier') ?? undefined,
  };
}

/**
 * Backoff delay for the given attempt. Honours `Retry-After` (seconds) when the
 * server provides it, otherwise falls back to capped exponential backoff.
 */
function backoffDelay(attempt: number, retryAfter: string | null): number {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, MAX_BACKOFF_MS);
    }
  }
  return Math.min(RETRY_BASE_MS * 2 ** attempt, MAX_BACKOFF_MS);
}

/**
 * Fetch IP intelligence for a single IP from IPbot.
 * Returns the parsed payload together with the rate-limit snapshot.
 * Throws after exhausting retries.
 */
export async function fetchIpbotIp(ip: string, options: IpbotClientOptions): Promise<IpbotResult> {
  if (!options.apiKey) {
    throw new Error('IPBOT_API_KEY is required for IPbot requests');
  }

  const origin = (options.origin ?? DEFAULT_ORIGIN).replace(/\/+$/, '');
  const url = `${origin}/v1/ip/${encodeURIComponent(ip)}`;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        method: 'GET',
        headers: {
          'X-API-Key': options.apiKey,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const rateLimit = parseRateLimit(response.headers);
      logger.debug({ ip, status: response.status, ...rateLimit }, 'IPbot rate-limit headers');
      if (typeof rateLimit.remaining === 'number' && rateLimit.remaining <= 5) {
        logger.warn({ ip, ...rateLimit }, 'IPbot rate-limit budget nearly exhausted');
      }

      // Rate limited — back off (honouring Retry-After) and retry.
      if (response.status === 429) {
        const delay = backoffDelay(attempt, response.headers.get('retry-after'));
        logger.warn({ ip, attempt, delayMs: delay, ...rateLimit }, 'IPbot rate limited (429), backing off');
        lastError = new Error('IPbot rate limited: 429');
        if (attempt < maxRetries) {
          await sleep(delay);
          continue;
        }
        throw lastError;
      }

      // Transient upstream error — retry with exponential backoff.
      if (response.status >= 500) {
        const text = await response.text().catch(() => '');
        lastError = new Error(`IPbot upstream error: ${response.status} ${response.statusText} ${text}`.trim());
        if (attempt < maxRetries) {
          await sleep(backoffDelay(attempt, null));
          continue;
        }
        throw lastError;
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`IPbot request failed: ${response.status} ${response.statusText} ${text}`.trim());
      }

      const data = (await response.json()) as IpbotLookupResponse;
      return { data, rateLimit, fetchedAt: Date.now() };
    } catch (error) {
      clearTimeout(timeout);
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable = lastError.name === 'AbortError' || lastError.message.includes('fetch failed');
      if (attempt < maxRetries && isRetryable) {
        await sleep(backoffDelay(attempt, null));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error('IPbot request failed after retries');
}
