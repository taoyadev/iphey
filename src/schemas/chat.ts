import { z } from 'zod';
const text = z.string().max(512);
const panel = z.object({ score: z.number().finite(), status: text, signals: z.array(text).max(20).optional() });
export const chatRequestSchema = z
  .object({
    prompt: z.string().trim().min(1).max(2000),
    messages: z
      .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(2000) }))
      .max(10)
      .optional(),
    context: z
      .object({
        overallScore: z.number().finite().optional(),
        verdict: text.optional(),
        panels: z
          .record(z.string().max(32), panel)
          .refine(value => Object.keys(value).length <= 10)
          .optional(),
        ip: z
          .object({
            address: text.optional(),
            city: text.optional(),
            country: text.optional(),
            timezone: text.optional(),
            isp: text.optional(),
            asn: text.optional(),
          })
          .optional(),
        threats: z.object({ level: text, score: z.number().finite(), factors: z.array(text).max(20) }).optional(),
      })
      .optional(),
  })
  .strict();
