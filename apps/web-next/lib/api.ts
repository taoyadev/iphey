/**
 * API Client Functions
 * Handles all API calls to the backend services
 */

import type { EnhancedIPResponse, ServiceStatus, ThreatIntelligence, ASNAnalysis } from '@/types/report';

// Use environment variable for API URL, fallback to relative path for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const API_BASE = `${API_BASE_URL}/api/v1`;

// Check if we're in demo mode (no backend API configured)
const IS_DEMO_MODE = !process.env.NEXT_PUBLIC_API_URL;

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
  const url = `${API_BASE}/ip/${encodeURIComponent(ip)}/enhanced${query ? `?${query}` : ''}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch enhanced IP data: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches the status of all backend services
 */
export async function fetchServiceStatus(): Promise<ServiceStatus> {
  const response = await fetch(`${API_BASE}/services/status`);

  if (!response.ok) {
    throw new Error(`Failed to fetch service status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches threat intelligence for a specific IP
 */
export async function fetchThreatIntel(ip: string): Promise<ThreatIntelligence> {
  const response = await fetch(`${API_BASE}/threats/${encodeURIComponent(ip)}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch threat intelligence: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches ASN analysis for a specific ASN number
 */
export async function fetchASNAnalysis(asn: number): Promise<ASNAnalysis> {
  const response = await fetch(`${API_BASE}/asn/${asn}`);

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
  const url = `${API_BASE}/ip/enhanced${query ? `?${query}` : ''}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch client enhanced IP: ${response.statusText}`);
  }

  return response.json();
}
