import { config } from '../config';

export interface HttpRequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Determine if error is retryable (network errors, 5xx, rate limits)
 */
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    // Network errors (timeout, connection refused, etc.)
    if (error.name === 'AbortError' || error.message.includes('fetch failed')) {
      return true;
    }
    // HTTP 5xx or 429 rate limit
    if (error.message.match(/Request failed: (5\d\d|429)/)) {
      return true;
    }
  }
  return false;
};

/**
 * HTTP request with exponential backoff retry logic
 */
export async function httpRequest<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
  const { timeoutMs, retries = 3, retryDelay = 100, ...fetchOptions } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs ?? config.CLIENT_TIMEOUT_MS);

    try {
      const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text();
        const error = new Error(`Request failed: ${response.status} ${response.statusText} - ${text}`);

        // Retry on retryable errors
        if (attempt < retries && isRetryableError(error)) {
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          await sleep(delay);
          continue;
        }
        throw error;
      }

      if (response.status === 204) {
        return {} as T;
      }

      const data = (await response.json()) as T;
      return data;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error instanceof Error ? error : new Error(String(error));

      // Retry on retryable errors
      if (attempt < retries && isRetryableError(lastError)) {
        const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff: 100ms, 200ms, 400ms
        await sleep(delay);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error('Request failed after retries');
}
