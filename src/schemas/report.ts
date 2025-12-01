import { z } from 'zod';

// Simple IP validation regex (works in Workers without node:net)
const isValidIP = (ip: string): boolean => {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

export const fingerprintSchema = z.object({
  userAgent: z.string().min(5),
  acceptLanguage: z.string().optional(),
  languages: z.array(z.string()).min(1).max(10).optional(),
  timezone: z.string().optional(),
  systemTime: z.string().optional(),
  screen: z
    .object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      colorDepth: z.number().int().positive().optional(),
      pixelRatio: z.number().positive().max(10).optional(),
      availWidth: z.number().int().positive().optional(),
      availHeight: z.number().int().positive().optional(),
    })
    .optional(),
  platform: z.string().optional(),
  hardwareConcurrency: z.number().int().positive().max(512).optional(),
  deviceMemory: z.number().positive().max(96).optional(),
  webglVendor: z.string().optional(),
  webglRenderer: z.string().optional(),
  canvasFingerprint: z.string().optional(),
  audioFingerprint: z.string().optional(),
  clientRectsHash: z.string().optional(),
  fonts: z.array(z.string()).max(200).optional(),
  fontCount: z.number().int().positive().optional(),
  cookiesEnabled: z.boolean().optional(),
  javaEnabled: z.boolean().optional(),
  flashEnabled: z.boolean().optional(),
  webrtcDisabled: z.boolean().optional(),
  domStorageEnabled: z.boolean().optional(),
  permissions: z
    .array(
      z.object({
        name: z.string().min(1),
        state: z.enum(['granted', 'denied', 'prompt']),
      })
    )
    .max(25)
    .optional(),
  canvas: z
    .object({
      hash: z.string().min(5),
      dataURL: z.string().optional(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      renderingTime: z.number().nonnegative().optional(),
    })
    .optional(),
  webgl: z
    .object({
      hash: z.string().min(5),
      vendor: z.string().min(1),
      renderer: z.string().min(1),
      unmaskedVendor: z.string().optional(),
      unmaskedRenderer: z.string().optional(),
      maxTextureSize: z.number().int().positive().optional(),
      extensions: z.array(z.string()).max(500).optional(),
    })
    .optional(),
  audio: z
    .object({
      hash: z.string().min(5),
      sampleRate: z.number().positive().optional(),
      numberOfOutputs: z.number().int().nonnegative().optional(),
      channelCount: z.number().int().positive().optional(),
    })
    .optional(),
  clientRects: z
    .object({
      hash: z.string().min(5),
      elementCount: z.number().int().nonnegative(),
      totalVariance: z.number().nonnegative().optional(),
      averageVariance: z.number().nonnegative().optional(),
    })
    .optional(),
  enhancedFonts: z
    .object({
      hash: z.string().min(5),
      detected: z.array(z.string()).max(1000).optional(),
      base: z.array(z.string()).max(1000).optional(),
      totalTested: z.number().int().nonnegative().optional(),
    })
    .optional(),
  geolocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number().nonnegative(),
    })
    .optional(),
});

export const reportRequestSchema = z.object({
  ip: z
    .string()
    .refine(value => isValidIP(value), { message: 'Invalid IP address' })
    .optional(),
  fingerprint: fingerprintSchema,
});

export type ReportRequestInput = z.infer<typeof reportRequestSchema>;
