import { savedScanSchema, savedScansSchema, legacyRecordsSchema } from '../../../src/schemas/scan';
import type { ScanRecord } from '../../../src/types/scan';
export const RECORD_KEY = 'iphey-scans-v2';
export const MAX_RECORD_CHARS = 2000000;
const readBounded = (key: string) => {
  const raw = localStorage.getItem(key);
  if (raw && raw.length > MAX_RECORD_CHARS)
    throw new Error('Saved records exceed the supported size. Existing data has not been overwritten.');
  return raw ? (JSON.parse(raw) as unknown) : [];
};
export function readRecords(): ScanRecord[] {
  const parsed = readBounded(RECORD_KEY);
  if (!savedScansSchema.safeParse(parsed).success)
    throw new Error('Saved records could not be read. They have not been overwritten.');
  return parsed as ScanRecord[];
}
export function readLegacyRecords(): Array<{ id: string; timestamp: number; [key: string]: unknown }> {
  const parsed = legacyRecordsSchema.safeParse(readBounded('iphey-history'));
  if (!parsed.success) throw new Error('Legacy records could not be read. They have not been changed.');
  return parsed.data;
}
function writeRecords(records: ScanRecord[]) {
  const encoded = JSON.stringify(records);
  if (encoded.length > MAX_RECORD_CHARS)
    throw new Error('Saved records would exceed the supported size. Export or delete a record before saving.');
  if (!savedScansSchema.safeParse(JSON.parse(encoded)).success)
    throw new Error('This record is incomplete or invalid and was not saved.');
  localStorage.setItem(RECORD_KEY, encoded);
  return records;
}
export function saveRecord(record: ScanRecord) {
  if (!savedScanSchema.safeParse(record).success) throw new Error('Wait for a valid, completed scan before saving.');
  const records = readRecords();
  const updated = [record, ...records.filter(r => r.scanId !== record.scanId)];
  if (updated.length > 50) throw new Error('50 records are already saved. Delete a record before saving another.');
  return writeRecords(updated);
}
export function deleteRecord(scanId: string) {
  return writeRecords(readRecords().filter(record => record.scanId !== scanId));
}
export function clearRecords() {
  for (const key of [RECORD_KEY, 'iphey-history', 'iphey-last-history-save', 'iphey-last-remediation'])
    localStorage.removeItem(key);
}
export function exportRecord(record: ScanRecord, includeValues = false, selectedFields: string[] = []) {
  const output = includeValues
    ? {
        schemaVersion: record.schemaVersion,
        collectorVersion: record.collectorVersion,
        rulesVersion: record.rulesVersion,
        startedAt: record.startedAt,
        completedAt: record.completedAt,
        scope: record.scope.filter(key => selectedFields.includes(key)),
        redacted: false,
        observations: Object.fromEntries(
          Object.entries(record.observations).filter(([key]) => selectedFields.includes(key))
        ),
      }
    : {
        schemaVersion: record.schemaVersion,
        collectorVersion: record.collectorVersion,
        rulesVersion: record.rulesVersion,
        startedAt: record.startedAt,
        completedAt: record.completedAt,
        scope: record.scope,
        redacted: true,
        observations: Object.fromEntries(
          Object.entries(record.observations).map(([key, item]) => [
            key,
            { status: item.status, source: item.source, observedAt: item.observedAt, limitation: item.limitation },
          ])
        ),
      };
  const url = URL.createObjectURL(new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `iphey-${record.startedAt}${includeValues ? '-technical' : '-redacted'}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
