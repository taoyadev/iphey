export interface IpInfoPrivacy {
  vpn?: boolean;
  proxy?: boolean;
  tor?: boolean;
  hosting?: boolean;
  relay?: boolean;
  service?: string;
}

export interface IpInfoDetails {
  ip: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  postal?: string;
  timezone?: string;
  org?: string;
  asn?: {
    asn?: string;
    name?: string;
    domain?: string;
    route?: string;
    type?: string;
  };
  company?: {
    name?: string;
    domain?: string;
    type?: string;
  };
  privacy?: IpInfoPrivacy;
  abuse?: {
    address?: string;
    country?: string;
    email?: string;
    name?: string;
    network?: string;
    phone?: string;
  };
  anycast?: boolean;
  bogon?: boolean;
}

export interface RadarIpResponse {
  ip: string;
  autonomous_system?: {
    asn?: number;
    name?: string;
  };
  location?: {
    city?: string;
    subdivision?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  traits?: {
    organization?: string;
    isp?: string;
    network_type?: string;
    anonymization?: {
      vpn?: boolean;
      proxy?: boolean;
      tor?: boolean;
    };
  };
  risk?: {
    score?: number;
    level?: 'low' | 'medium' | 'high';
    categories?: string[];
  };
}

export interface NormalizedIpInsight {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  postal?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  org?: string;
  asn?: string;
  networkType?: string;
  privacy?: IpInfoPrivacy & {
    vpn?: boolean;
    proxy?: boolean;
    tor?: boolean;
    hosting?: boolean;
  };
  riskScore?: number;
  riskReasons?: string[];
  anycast?: boolean;
  bogon?: boolean;
  source: 'ipinfo' | 'radar';
  fetchedAt: number;
}
