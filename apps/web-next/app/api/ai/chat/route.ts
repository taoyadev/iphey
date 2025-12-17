import { z } from 'zod';

export const runtime = 'edge';

// Request schema
const ChatRequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  context: z.object({
    overallScore: z.number().optional(),
    verdict: z.enum(['trustworthy', 'suspicious', 'unreliable']).optional(),
    panels: z.record(z.string(), z.object({
      score: z.number(),
      status: z.string(),
      signals: z.array(z.string()).optional(),
    })).optional(),
    ip: z.object({
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      timezone: z.string().optional(),
      isp: z.string().optional(),
      asn: z.string().optional(),
    }).optional(),
    threats: z.object({
      level: z.string(),
      score: z.number(),
      factors: z.array(z.string()),
    }).optional(),
  }).optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

// System prompt
function buildSystemPrompt(context?: ChatRequest['context']): string {
  let systemPrompt = `You are IPH, an AI assistant for IPhey - a browser fingerprint analysis tool.

Your role:
- Explain browser fingerprinting concepts clearly
- Help users understand their trust scores
- Provide actionable privacy recommendations
- Answer questions about IP reputation, geolocation, and digital identity

Guidelines:
- Be concise and helpful (2-3 paragraphs max)
- Use simple language, avoid jargon
- Provide specific, actionable recommendations
- Use emojis sparingly for friendliness
- If asked about something not in the context, be honest about limitations`;

  if (context) {
    systemPrompt += '\n\n--- User Context ---\n';

    if (context.overallScore !== undefined && context.verdict) {
      systemPrompt += `Overall Trust Score: ${context.overallScore}/100 (${context.verdict})\n`;
    }

    if (context.panels) {
      systemPrompt += '\nPanel Scores:\n';
      for (const [key, panel] of Object.entries(context.panels)) {
        systemPrompt += `- ${key}: ${panel.score}/100 (${panel.status})`;
        if (panel.signals?.length) {
          systemPrompt += ` - Signals: ${panel.signals.slice(0, 3).join(', ')}`;
        }
        systemPrompt += '\n';
      }
    }

    if (context.ip) {
      systemPrompt += '\nIP Information:\n';
      if (context.ip.address) systemPrompt += `- IP: ${context.ip.address}\n`;
      if (context.ip.city && context.ip.country) {
        systemPrompt += `- Location: ${context.ip.city}, ${context.ip.country}\n`;
      }
      if (context.ip.timezone) systemPrompt += `- Timezone: ${context.ip.timezone}\n`;
      if (context.ip.isp) systemPrompt += `- ISP: ${context.ip.isp}\n`;
      if (context.ip.asn) systemPrompt += `- ASN: ${context.ip.asn}\n`;
    }

    if (context.threats) {
      systemPrompt += `\nThreat Assessment: ${context.threats.level} (score: ${context.threats.score})\n`;
      if (context.threats.factors.length > 0) {
        systemPrompt += `Risk Factors: ${context.threats.factors.join(', ')}\n`;
      }
    }

    systemPrompt += '\n--- End Context ---\n';
    systemPrompt += '\nReference this data when answering user questions about their fingerprint.';
  }

  return systemPrompt;
}

// Fallback response when API is unavailable
function getFallbackResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('fingerprint') || lowerPrompt.includes('what is')) {
    return "Browser fingerprinting is a technique websites use to identify and track users by collecting information about their browser, device, and settings. This creates a unique 'fingerprint' that can identify you even without cookies. IPhey helps you understand what information is being collected and how unique your fingerprint is.";
  }

  if (lowerPrompt.includes('privacy') || lowerPrompt.includes('improve')) {
    return "To improve your privacy: 1) Use a privacy-focused browser like Firefox or Brave, 2) Enable anti-fingerprinting features, 3) Use a reputable VPN, 4) Keep your browser updated, 5) Consider using browser extensions like Privacy Badger. Check your panel scores to see which areas need the most attention.";
  }

  if (lowerPrompt.includes('vpn') || lowerPrompt.includes('proxy')) {
    return "To check if your VPN/proxy is working effectively, look at your IP Address panel score and location data. If they show your VPN's exit location instead of your real location, it's working. However, browser fingerprinting can still identify you even with a VPN - that's why checking all panels is important.";
  }

  if (lowerPrompt.includes('score') || lowerPrompt.includes('trust')) {
    return "Your trust score reflects how consistent your digital identity appears. A low score may indicate: timezone mismatches, unusual browser settings, detected automation, or inconsistencies between your IP location and browser settings. Check individual panel details to see specific issues.";
  }

  return "I'm IPH, your fingerprint analysis assistant. I can help you understand your browser fingerprint, explain trust scores, and provide privacy recommendations. Unfortunately, I'm currently unable to connect to my AI service. Please try again later, or explore the detailed panel information in IPhey for insights.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { prompt, context, messages = [] } = parsed.data;
    const apiKey = process.env.OPENROUTER_API_KEY;

    // If no API key, return fallback response
    if (!apiKey) {
      return new Response(JSON.stringify({
        content: getFallbackResponse(prompt),
        fallback: true,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build messages array for OpenRouter
    const systemPrompt = buildSystemPrompt(context);
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: prompt },
    ];

    // Call OpenRouter API with streaming
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://iphey.org',
        'X-Title': 'IPhey AI Assistant',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: chatMessages,
        stream: true,
        max_tokens: 512,
        temperature: 0.7,
      }),
    });

    if (!openRouterResponse.ok) {
      // Try fallback model
      const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://iphey.org',
          'X-Title': 'IPhey AI Assistant',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: chatMessages,
          stream: true,
          max_tokens: 512,
          temperature: 0.7,
        }),
      });

      if (!fallbackResponse.ok) {
        return new Response(JSON.stringify({
          content: getFallbackResponse(prompt),
          fallback: true,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Forward fallback stream
      return new Response(fallbackResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Forward the stream directly
    return new Response(openRouterResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return new Response(JSON.stringify({
      content: getFallbackResponse(''),
      fallback: true,
      error: 'Internal server error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
