import type { ScanRecord } from '../types/scan';
export interface ScanDifference {
  field: string;
  status: 'changed' | 'unchanged' | 'missing' | 'incomparable';
  before: unknown;
  after: unknown;
}
const volatile = new Set([
  'fetchedAt',
  'observedAt',
  'systemTime',
  'renderingTime',
  'requestId',
  'cacheStatus',
  'refreshFailed',
]);
function flatten(value: unknown, prefix = ''): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return { [prefix]: value };
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !volatile.has(key))
      .flatMap(([key, child]) => Object.entries(flatten(child, prefix ? `${prefix}.${key}` : key)))
  );
}
export function compareScans(before: ScanRecord, after: ScanRecord): ScanDifference[] {
  const compatible =
    before.schemaVersion === after.schemaVersion &&
    before.collectorVersion === after.collectorVersion &&
    before.rulesVersion === after.rulesVersion &&
    before.subject === after.subject;
  const rows: ScanDifference[] = [];
  for (const key of new Set([...Object.keys(before.observations), ...Object.keys(after.observations)])) {
    const a = before.observations[key],
      b = after.observations[key];
    if (!compatible || !before.scope.includes(key) || !after.scope.includes(key) || a?.source !== b?.source) {
      rows.push({ field: key, status: 'incomparable', before: a?.value, after: b?.value });
      continue;
    }
    if (a?.status !== 'observed' || b?.status !== 'observed') {
      rows.push({ field: key, status: 'missing', before: a?.status, after: b?.status });
      continue;
    }
    const left = flatten(a.value, key),
      right = flatten(b.value, key);
    for (const field of new Set([...Object.keys(left), ...Object.keys(right)]))
      rows.push({
        field,
        status:
          left[field] == null || right[field] == null
            ? 'missing'
            : JSON.stringify(left[field]) === JSON.stringify(right[field])
              ? 'unchanged'
              : 'changed',
        before: left[field],
        after: right[field],
      });
  }
  return rows;
}
