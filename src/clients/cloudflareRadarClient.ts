import { config } from '../config';
import type { RadarIpResponse } from '../types/ip';
import { httpRequest } from '../utils/httpClient';

const CF_BASE = 'https://api.cloudflare.com/client/v4';

const getHeaders = () => ({
  Authorization: `Bearer ${config.CLOUDFLARE_RADAR_TOKEN}`,
  'Content-Type': 'application/json',
});

export async function verifyRadarToken(): Promise<boolean> {
  if (!config.CLOUDFLARE_ACCOUNT_ID || !config.CLOUDFLARE_RADAR_TOKEN) {
    return false;
  }
  try {
    const url = `${CF_BASE}/accounts/${config.CLOUDFLARE_ACCOUNT_ID}/tokens/verify`;
    const response = await httpRequest<{ success: boolean }>(url, { headers: getHeaders() });
    return Boolean(response.success);
  } catch {
    return false;
  }
}

export async function fetchRadarIp(ip: string): Promise<RadarIpResponse> {
  if (!config.CLOUDFLARE_ACCOUNT_ID || !config.CLOUDFLARE_RADAR_TOKEN) {
    throw new Error('Cloudflare Radar credentials missing');
  }
  const url = `${CF_BASE}/accounts/${config.CLOUDFLARE_ACCOUNT_ID}/intelligence/ip?ip=${encodeURIComponent(ip)}`;
  const response = await httpRequest<{ success: boolean; result: RadarIpResponse }>(url, { headers: getHeaders() });
  if (!response.success) {
    throw new Error('Cloudflare Radar lookup failed');
  }
  return response.result;
}
