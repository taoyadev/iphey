import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    setupFiles: ['src/test/setup.ts'],
    env: {
      NODE_ENV: 'test',
      IPINFO_TOKEN: 'test-token',
      CACHE_TTL_MS: '1000',
      CACHE_MAX_ITEMS: '10',
      CLIENT_TIMEOUT_MS: '3000'
    },
    coverage: {
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage'
    }
  }
});
