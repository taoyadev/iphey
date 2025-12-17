import { config } from '../config';
import type { IpInfoDetails } from '../types/ip';
import { httpRequest } from '../utils/httpClient';

const BASE_URL = 'https://ipinfo.io';

export async function fetchIpInfo(ip: string): Promise<IpInfoDetails> {
  if (!config.IPINFO_TOKEN) {
    throw new Error('IPINFO_TOKEN is required for ipinfo requests');
  }
  const url = `${BASE_URL}/${encodeURIComponent(ip)}`;
  return httpRequest<IpInfoDetails>(url, {
    headers: {
      Authorization: `Bearer ${config.IPINFO_TOKEN}`,
      Accept: 'application/json',
    },
  });
}

export async function fetchIpInfoBatch(ips: string[]): Promise<IpInfoDetails[]> {
  if (!config.IPINFO_TOKEN) {
    throw new Error('IPINFO_TOKEN is required for ipinfo requests');
  }
  if (ips.length === 0) {
    return [];
  }
  if (ips.length > 100) {
    throw new Error('Batch size cannot exceed 100 IPs');
  }
  const url = `${BASE_URL}/batch`;
  return httpRequest<IpInfoDetails[]>(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.IPINFO_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(ips),
  });
}
