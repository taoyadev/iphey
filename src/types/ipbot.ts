/**
 * IPbot API types — GET {IPBOT_API_ORIGIN}/v1/ip/{ip}
 *
 * Shape captured from a live `/v1/ip` response. All nested fields are optional
 * and an index signature is preserved on the top-level / classification objects
 * so forward-compatible additions from the API do not break parsing.
 */

export interface IpbotLocation {
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  postal?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface IpbotNetwork {
  asn?: string;
  org?: string;
  category?: string;
  operator?: string;
  operator_type?: string;
  service_role?: string;
  service_name?: string;
  routability?: string;
  owner?: string;
  allocation?: {
    cidr?: string;
    range?: string;
    registry?: string;
  };
}

export interface IpbotScore {
  ip_score?: number;
  /** 0-100, higher = riskier */
  risk_score?: number;
  /** e.g. 'good' | 'neutral' | 'suspicious' | 'bad' */
  band?: string;
  /** e.g. 'allow' | 'review' | 'block' */
  verdict?: string;
  recommended_action?: string;
}

export interface IpbotClassification {
  usage_type?: string;
  is_datacenter?: boolean;
  is_proxy?: boolean;
  is_vpn?: boolean;
  is_tor?: boolean;
  is_public_resolver?: boolean;
  is_anycast?: boolean;
  /** e.g. 'Low' | 'Medium' | 'High' | 'Critical' */
  threat_level?: string;
  confidence?: string;
  traits?: string[];
  [key: string]: unknown;
}

export interface IpbotSignal {
  category?: string;
  label?: string;
  severity?: string;
  confidence?: string;
  description?: string;
}

export interface IpbotLookupResponse {
  ip: string;
  stack?: string;
  location?: IpbotLocation;
  network?: IpbotNetwork;
  routing?: Record<string, unknown>;
  score?: IpbotScore;
  classification?: IpbotClassification;
  evidence?: { signals?: IpbotSignal[] };
  [key: string]: unknown;
}

/** Parsed `X-RateLimit-*` response headers, recorded for observability. */
export interface IpbotRateLimit {
  limit?: number;
  remaining?: number;
  /** Unix epoch seconds at which the window resets. */
  reset?: number;
  tier?: string;
}

export interface IpbotResult {
  data: IpbotLookupResponse;
  rateLimit: IpbotRateLimit;
  /** Epoch ms when the upstream response was received. */
  fetchedAt: number;
}
