import { z } from 'zod';
const text = z.string().max(512).optional();
export const ipInsightSchema = z.object({
  ip: z.string().max(45),
  city: text,
  region: text,
  country: text,
  postal: text,
  timezone: text,
  latitude: z.number().finite().min(-90).max(90).optional(),
  longitude: z.number().finite().min(-180).max(180).optional(),
  org: text,
  asn: text,
  networkType: text,
  privacy: z
    .object({
      vpn: z.boolean().optional(),
      proxy: z.boolean().optional(),
      tor: z.boolean().optional(),
      hosting: z.boolean().optional(),
      relay: z.boolean().optional(),
      service: text,
    })
    .optional(),
  riskScore: z.number().finite().optional(),
  riskReasons: z.array(z.string().max(512)).max(100).optional(),
  anycast: z.boolean().optional(),
  bogon: z.boolean().optional(),
  source: z.enum(['ipinfo', 'radar', 'ipbot']),
  fetchedAt: z.number().finite(),
});
