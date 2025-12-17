'use client';

import { motion } from 'framer-motion';
import { Code, Server, Database, Key, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslations } from '@/lib/translations';
import { PageLayout } from '@/components/Layout/PageLayout';
import { Section } from '@/components/Layout/Section';

export default function APIReferencePage() {
  const t = useTranslations('apiReference');
  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/report',
      description: 'Generate a complete digital identity report including fingerprint analysis and IP reputation.',
      request: {
        fingerprint: {
          userAgent: 'string',
          languages: 'string[]',
          timezone: 'string',
          screen: { width: 'number', height: 'number' },
          webglVendor: 'string',
          canvasFingerprint: 'string',
          cookiesEnabled: 'boolean',
        },
      },
      response: {
        verdict: '"trustworthy" | "suspicious" | "unreliable"',
        score: t('number0100'),
        ip: 'string',
        source: 'string',
        panels: 'Panel[]',
        enhanced: 'EnhancedAnalysis',
      },
    },
    {
      method: 'GET',
      path: '/api/v1/health',
      description: 'Check API health status and build information.',
      response: {
        status: '"ok"',
        timestamp: 'string',
        buildInfo: {
          version: 'string',
          environment: 'string',
        },
      },
    },
  ];

  const responseFields = [
    {
      field: 'verdict',
      type: 'string',
      description: 'Overall assessment of digital identity: "trustworthy", "suspicious", or "unreliable"',
    },
    {
      field: 'score',
      type: 'number',
      description: 'Identity trust score from 0 (unreliable) to 100 (trustworthy)',
    },
    {
      field: 'panels',
      type: 'object',
      description: t('detailedAnalysis'),
    },
    {
      field: 'enhanced',
      type: 'object',
      description: 'Advanced analysis with confidence scores, entropy metrics, and detailed signals',
    },
  ];

  return (
    <PageLayout>
      <div className="space-y-16">
        {/* Hero Section */}
        <Section variant="elevated">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mb-6">
              <Code className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">API Reference</h1>
            <p className="text-lg text-slate-400 leading-relaxed">
              RESTful API for digital identity analysis and browser fingerprinting. All endpoints return JSON responses
              with comprehensive telemetry data.
            </p>
          </motion.div>
        </Section>

        {/* Base URL */}
        <Section variant="ghost" icon={Server} title="Base URL">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-white/5 bg-surface/60 p-6"
          >
            <div className="font-mono text-accent text-sm mb-2">Production</div>
            <code className="block bg-black/40 rounded-lg p-4 text-white font-mono text-sm">
              https://iphey.com/api/v1
            </code>
            <div className="font-mono text-accent text-sm mt-4 mb-2">Development</div>
            <code className="block bg-black/40 rounded-lg p-4 text-white font-mono text-sm">
              http://localhost:4310/api/v1
            </code>
          </motion.div>
        </Section>

        {/* Endpoints */}
        <Section variant="elevated" title="Endpoints">
          <div className="space-y-8">
            {endpoints.map((endpoint, index) => (
              <motion.div
                key={endpoint.path}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl border border-white/5 bg-surface/60 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`px-3 py-1 rounded-lg font-mono text-xs font-semibold ${
                      endpoint.method === 'POST'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-green-500/10 text-green-400 border border-green-500/20'
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <code className="text-white font-mono text-sm">{endpoint.path}</code>
                </div>
                <p className="text-slate-400 text-sm mb-4">{endpoint.description}</p>

                {endpoint.request && (
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-white mb-2">Request Body</div>
                    <pre className="bg-black/40 rounded-lg p-4 overflow-x-auto">
                      <code className="text-xs text-slate-300 font-mono">
                        {JSON.stringify(endpoint.request, null, 2)}
                      </code>
                    </pre>
                  </div>
                )}

                <div>
                  <div className="text-sm font-semibold text-white mb-2">Response</div>
                  <pre className="bg-black/40 rounded-lg p-4 overflow-x-auto">
                    <code className="text-xs text-slate-300 font-mono">
                      {JSON.stringify(endpoint.response, null, 2)}
                    </code>
                  </pre>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Response Fields */}
        <Section variant="ghost" icon={Database} title="Response Fields">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-white/5 bg-surface/60 overflow-hidden"
          >
            <div className="divide-y divide-white/5">
              {responseFields.map(field => (
                <div key={field.field} className="p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-4">
                    <code className="font-mono text-accent text-sm font-semibold flex-shrink-0">{field.field}</code>
                    <div className="flex-1">
                      <div className="font-mono text-xs text-slate-500 mb-1">{field.type}</div>
                      <p className="text-sm text-slate-400">{field.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </Section>

        {/* Authentication */}
        <Section variant="elevated" icon={Key} title="Authentication">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-white/5 bg-surface/60 p-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-2">No Authentication Required</h3>
                <p className="text-slate-400 text-sm">
                  The IPhey API is currently open and does not require authentication. All endpoints can be accessed
                  without API keys or tokens.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-yellow-400/80">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                <strong className="font-semibold">Rate Limiting:</strong> The API implements rate limiting to prevent
                abuse. Please implement reasonable request throttling in your applications.
              </p>
            </div>
          </motion.div>
        </Section>

        {/* Example Usage */}
        <Section variant="ghost" title="Example Usage">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-white font-semibold mb-3">JavaScript / TypeScript</h3>
              <pre className="bg-surface/60 border border-white/5 rounded-2xl p-6 overflow-x-auto">
                <code className="text-sm text-slate-300 font-mono">{`const response = await fetch('https://iphey.com/api/v1/report', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fingerprint: {
      userAgent: navigator.userAgent,
      languages: navigator.languages,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: { width: screen.width, height: screen.height },
      cookiesEnabled: navigator.cookieEnabled,
    },
  }),
});

const data = await response.json();
console.log('Identity verdict:', data.verdict);
console.log('Trust score:', data.score);`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3">Python</h3>
              <pre className="bg-surface/60 border border-white/5 rounded-2xl p-6 overflow-x-auto">
                <code className="text-sm text-slate-300 font-mono">{`import requests

response = requests.post(
    'https://iphey.com/api/v1/report',
    json={
        'fingerprint': {
            'userAgent': 'Mozilla/5.0...',
            'languages': ['en-US', 'en'],
            'timezone': 'America/New_York',
            'cookiesEnabled': True,
        }
    }
)

data = response.json()
print(f"Verdict: {data['verdict']}")
print(f"Score: {data['score']}")`}</code>
              </pre>
            </div>
          </motion.div>
        </Section>
      </div>
    </PageLayout>
  );
}
