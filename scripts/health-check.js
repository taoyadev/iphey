#!/usr/bin/env node
// Simple smoke check for API readiness.

const baseUrl = process.env.API_URL || 'http://localhost:4310';
const timeoutMs = Number(process.env.HEALTH_TIMEOUT_MS || 4000);

const withTimeout = (promise, ms, label) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise.finally(() => clearTimeout(timer)), timeout]);
};

async function checkHealth() {
  const res = await withTimeout(fetch(`${baseUrl}/api/health`), timeoutMs, 'health');
  if (!res.ok) throw new Error(`health status ${res.status}`);
  const data = await res.json();
  const healthy = data?.status === 'ok' || data?.ipinfoConfigured || data?.radarHealthy;
  if (!healthy) throw new Error(`health payload not ready: ${JSON.stringify(data)}`);
  return data;
}

async function checkEnhancedIp() {
  const res = await withTimeout(fetch(`${baseUrl}/api/v1/ip/1.1.1.1/enhanced`), timeoutMs, 'enhanced');
  if (!res.ok) throw new Error(`enhanced status ${res.status}`);
  const data = await res.json();
  if (!data?.ip || !data?.country) throw new Error('enhanced payload missing fields');
  return data;
}

async function main() {
  try {
    const health = await checkHealth();
    const enhanced = await checkEnhancedIp();
    console.log('✅ API healthy', { baseUrl, status: health.status, country: enhanced.country });
  } catch (error) {
    console.error('❌ API health check failed:', error.message);
    process.exit(1);
  }
}

main();
