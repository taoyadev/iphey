'use client';
import { useEffect, useState } from 'react';
import type { ScanRecord } from '../../../../src/types/scan';
import { compareScans } from '../../../../src/utils/compareScans';
import { readRecords, readLegacyRecords, deleteRecord, clearRecords, exportRecord, saveRecord } from '@/lib/records';
import CheckWorkspace, { controlClass } from './CheckWorkspace';

export default function CompareWorkspace() {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [baseline, setBaseline] = useState('');
  const [current, setCurrent] = useState('');
  const [all, setAll] = useState(false);
  const [message, setMessage] = useState('');
  const [legacy, setLegacy] = useState<ReturnType<typeof readLegacyRecords>>([]);
  const [legacyError, setLegacyError] = useState('');
  const [rename, setRename] = useState('');
  function reload() {
    try {
      const items = readRecords();
      setRecords(items);
      setBaseline(value => (items.some(r => r.scanId === value) ? value : (items[1]?.scanId ?? '')));
      setCurrent(value => (items.some(r => r.scanId === value) ? value : (items[0]?.scanId ?? '')));

      setMessage(
        items.length
          ? `${items.length} records on this device.`
          : 'No records saved yet. Run a check and choose Save on this device.'
      );
    } catch {
      setMessage('Saved records are unavailable or invalid. Existing data has not been overwritten.');
    }
    try {
      setLegacy(readLegacyRecords());
      setLegacyError('');
    } catch {
      setLegacy([]);
      setLegacyError(
        'Legacy history is unavailable or invalid. It has not been changed; current records remain available.'
      );
    }
  }
  useEffect(() => {
    reload();
    const refresh = (event: StorageEvent) => {
      if (event.key === null || ['iphey-scans-v2', 'iphey-history'].includes(event.key)) reload();
    };
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);
  const left = records.find(r => r.scanId === baseline),
    right = records.find(r => r.scanId === current);
  const rows = left && right && left !== right ? compareScans(left, right) : [];
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-semibold">Compare before and after</h1>
      <p className="text-slate-300">
        Save a baseline, change one setting or switch networks, then repeat the same check and save again. Records stay
        on this device.
      </p>
      <p role="status">{message}</p>
      {legacy.length > 0 && (
        <p className="text-amber-200">
          {legacy.length} legacy records retained. Their collection scope and versions are unknown, so they cannot be
          compared as equivalent measurements.
        </p>
      )}
      {legacyError && (
        <p role="status" className="text-amber-200">
          {legacyError}
        </p>
      )}
      {legacy.length > 0 && (
        <details className="rounded-xl border border-white/10 p-4">
          <summary className="min-h-11 cursor-pointer">View retained legacy records</summary>
          <p className="my-3 text-sm text-slate-400">
            Original saved data, including any IP or fingerprint fields, is shown only on this device. Legacy scores are
            uncalibrated historical values.
          </p>
          {legacy.slice(0, 50).map((record, index) => (
            <details key={`${record.id}-${index}`} className="border-t border-white/10 py-3">
              <summary className="min-h-11 cursor-pointer">
                Legacy record · {new Date(record.timestamp).toLocaleString()}
              </summary>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all text-sm">
                {JSON.stringify(record, null, 2)}
              </pre>
            </details>
          ))}
          {legacy.length > 50 && <p>Showing the first 50 legacy records. All original records remain stored.</p>}
        </details>
      )}
      <button className={controlClass} onClick={reload}>
        Refresh saved records
      </button>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          ['Baseline', baseline, setBaseline],
          ['Current record', current, setCurrent],
        ].map(([label, value, setter]) => (
          <label key={String(label)} className="space-y-2">
            <span>{String(label)}</span>
            <select
              className={`${controlClass} block w-full`}
              value={String(value)}
              onChange={e => (setter as (v: string) => void)(e.target.value)}
            >
              <option value="">Select a record</option>
              {records.map(r => (
                <option key={r.scanId} value={r.scanId}>
                  {r.name} · {new Date(r.completedAt).toLocaleString()}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {baseline && baseline === current && <p>Select two different records.</p>}
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} />
        Show unchanged fields too
      </label>
      {!!rows.length && (
        <>
          <p>
            {rows.filter(r => r.status === 'changed').length} changed ·{' '}
            {rows.filter(r => r.status === 'unchanged').length} unchanged ·{' '}
            {rows.filter(r => r.status === 'missing' || r.status === 'incomparable').length} missing or incomparable.
            Changes do not imply improvement.
          </p>
          <div className="space-y-3">
            {rows
              .filter(r => all || r.status !== 'unchanged')
              .map(row => (
                <details key={row.field} className="rounded-xl border border-white/10 p-4">
                  <summary className="min-h-11 break-all">
                    {row.field} · {row.status}
                  </summary>
                  <div className="grid gap-3 md:grid-cols-2">
                    <pre className="whitespace-pre-wrap break-all text-sm">
                      Before: {JSON.stringify(row.before, null, 2) ?? 'Missing'}
                    </pre>
                    <pre className="whitespace-pre-wrap break-all text-sm">
                      After: {JSON.stringify(row.after, null, 2) ?? 'Missing'}
                    </pre>
                  </div>
                </details>
              ))}
          </div>
        </>
      )}
      {right && (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <label className="block">
            Rename selected record
            <input
              maxLength={80}
              className={`${controlClass} ml-3`}
              value={rename}
              onChange={e => setRename(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              className={controlClass}
              disabled={!rename.trim()}
              onClick={() => {
                try {
                  saveRecord({ ...right, name: rename.trim() });
                  reload();
                } catch {
                  setMessage('Rename failed. Storage may be unavailable.');
                }
              }}
            >
              Save name
            </button>
            <button className={controlClass} onClick={() => exportRecord(right)}>
              Export redacted summary
            </button>
            <button
              className={controlClass}
              onClick={() => {
                try {
                  deleteRecord(right.scanId);
                  reload();
                } catch {
                  setMessage('Delete failed. Please try again.');
                }
              }}
            >
              Delete selected record
            </button>
          </div>
        </div>
      )}
      <details className="border-t border-white/10 pt-4">
        <summary className="min-h-11 cursor-pointer">Clear all local records</summary>
        <p className="mb-3">This removes saved scans, legacy history and associated saved copies on this device.</p>
        <button
          className={controlClass}
          onClick={() => {
            try {
              clearRecords();
              setRecords([]);
              setLegacy([]);
              reload();
            } catch {
              setMessage('Some local data could not be cleared. Retry before assuming it is deleted.');
            }
          }}
        >
          Confirm clear all records
        </button>
      </details>
      <details className="border-t border-white/10 pt-4">
        <summary className="min-h-11 cursor-pointer">Run another check here</summary>
        <CheckWorkspace embedded />
      </details>
    </div>
  );
}
