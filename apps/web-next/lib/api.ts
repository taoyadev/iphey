/**
 * API Client Functions
 * Handles all API calls to the backend services
 */

import type { EnhancedIPResponse, ServiceStatus, ThreatIntelligence, ASNAnalysis } from '@/types/report';
import { API_URL, FALLBACK_API_URL } from '@/lib/site';

// Use environment variable for API URL, fallback to relative path for development
export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? API_URL : '');

export const getApiFallbackBaseUrl = () =>
  process.env.NODE_ENV === 'production' && getApiBaseUrl() !== FALLBACK_API_URL ? FALLBACK_API_URL : '';

const getApiCandidateBaseUrls = () => {
  const primary = getApiBaseUrl();
  const fallback = getApiFallbackBaseUrl();

  return [primary, fallback].filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index);
};

export const buildApiUrl = (path: string, baseUrl = getApiBaseUrl()) => `${baseUrl}${path}`;

export async function fetchWithApiFallback(path: string, init?: RequestInit): Promise<Response> {
  const candidates = getApiCandidateBaseUrls();
  let lastResponse: Response | undefined;
  let lastError: unknown;

  for (const [index, baseUrl] of candidates.entries()) {
    const isLastCandidate = index === candidates.length - 1;

    try {
      const response = await fetch(buildApiUrl(path, baseUrl), init);
      if (response.ok || response.status < 500 || isLastCandidate) {
        return response;
      }

      lastResponse = response;
    } catch (error) {
      lastError = error;
      if (isLastCandidate) {
        break;
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch ${path}`);
}

/**
 * Fetches enhanced IP information including geolocation, threats, and ASN
 */
export async function fetchEnhancedIP(
  ip: string,
  options: {
    includeThreat?: boolean;
    includeASN?: boolean;
  } = {}
): Promise<EnhancedIPResponse> {
  const params = new URLSearchParams();

  if (options.includeThreat === false) {
    params.set('threats', 'false');
  }
  if (options.includeASN === false) {
    params.set('asn', 'false');
  }

  const query = params.toString();
  const response = await fetchWithApiFallback(
    `/api/v1/ip/${encodeURIComponent(ip)}/enhanced${query ? `?${query}` : ''}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch enhanced IP data: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches the status of all backend services
 */
export async function fetchServiceStatus(): Promise<ServiceStatus> {
  const response = await fetchWithApiFallback('/api/v1/services/status');

  if (!response.ok) {
    throw new Error(`Failed to fetch service status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches threat intelligence for a specific IP
 */
export async function fetchThreatIntel(ip: string): Promise<ThreatIntelligence> {
  const response = await fetchWithApiFallback(`/api/v1/threats/${encodeURIComponent(ip)}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch threat intelligence: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches ASN analysis for a specific ASN number
 */
export async function fetchASNAnalysis(asn: number): Promise<ASNAnalysis> {
  const response = await fetchWithApiFallback(`/api/v1/asn/${asn}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ASN analysis: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches client's own IP with enhanced analysis
 */
export async function fetchClientEnhancedIP(
  options: {
    includeThreat?: boolean;
    includeASN?: boolean;
  } = {}
): Promise<EnhancedIPResponse> {
  const params = new URLSearchParams();

  if (options.includeThreat === false) {
    params.set('threats', 'false');
  }
  if (options.includeASN === false) {
    params.set('asn', 'false');
  }

  const query = params.toString();
  const response = await fetchWithApiFallback(`/api/v1/ip/enhanced${query ? `?${query}` : ''}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch client enhanced IP: ${response.statusText}`);
  }

  return response.json();
}
