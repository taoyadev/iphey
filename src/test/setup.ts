import { afterEach, vi } from 'vitest';
import '../utils/loadEnv';

afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});
