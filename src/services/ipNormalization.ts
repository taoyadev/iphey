import type { IpInfoDetails, NormalizedIpInsight, RadarIpResponse } from '../types/ip';

export const normalizeIpInfo = (payload: IpInfoDetails): NormalizedIpInsight => {
  const [latitude, longitude] = payload.loc?.split(',').map(v => Number.parseFloat(v)) ?? [];

  // Extract ASN from org field if not in dedicated asn field
  // Format: "AS46844 Sharktech" -> asn: "AS46844", orgName: "Sharktech"
  let asn = payload.asn?.asn;
  let orgName = payload.org ?? payload.company?.name;

  if (!asn && payload.org) {
    const match = payload.org.match(/^(AS\d+)\s+(.*)$/);
    if (match) {
      asn = match[1];
      orgName = match[2];
    }
  }

  return {
    ip: payload.ip,
    city: payload.city,
    region: payload.region,
    country: payload.country,
    postal: payload.postal,
    timezone: payload.timezone,
    latitude,
    longitude,
    org: orgName,
    asn: asn,
    networkType: payload.asn?.type ?? payload.company?.type,
    privacy: payload.privacy,
    riskScore: payload.privacy?.vpn || payload.privacy?.proxy ? 65 : 10,
    riskReasons: payload.privacy?.vpn ? ['VPN detected'] : payload.privacy?.proxy ? ['Proxy detected'] : [],
    anycast: payload.anycast,
    bogon: payload.bogon,
    source: 'ipinfo',
    fetchedAt: Date.now(),
  };
};

export const normalizeRadar = (payload: RadarIpResponse): NormalizedIpInsight => {
  return {
    ip: payload.ip,
    city: payload.location?.city,
    region: payload.location?.subdivision,
    country: payload.location?.country,
    latitude: payload.location?.latitude,
    longitude: payload.location?.longitude,
    org: payload.traits?.organization ?? payload.traits?.isp,
    asn: payload.autonomous_system?.asn ? `AS${payload.autonomous_system.asn}` : undefined,
    networkType: payload.traits?.network_type,
    privacy: payload.traits?.anonymization,
    riskScore: payload.risk?.score,
    riskReasons: payload.risk?.categories,
    source: 'radar',
    fetchedAt: Date.now(),
  };
};
