export const requestExecutionTime = async <T>(fn: () => Promise<T>): Promise<{ durationMs: number; result: T }> => {
  const start = Date.now();
  const result = await fn();
  return { durationMs: Date.now() - start, result };
};
