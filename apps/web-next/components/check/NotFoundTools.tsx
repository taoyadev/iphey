'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { parseIP, parseASN } from '../../../../src/utils/networkInput';
export default function NotFoundTools() {
  const [target, setTarget] = useState<{ href: string; label: string } | null>(null);
  useEffect(() => {
    try {
      const [, kind, value] = decodeURIComponent(window.location.pathname).split('/');
      const parsed = kind === 'ip' ? parseIP(value) : null;
      const asn = kind === 'asn' ? parseASN(value) : null;
      if (parsed) setTarget({ href: `/ip?ip=${encodeURIComponent(parsed.ip)}`, label: `Look up ${parsed.ip}` });
      if (asn) setTarget({ href: `/asn?asn=${asn}`, label: `Look up AS${asn}` });
    } catch {
      /* Keep generic query links for malformed paths. */
    }
  }, []);
  return target ? (
    <Link className="inline-block min-h-11 py-3 text-accent underline" href={target.href}>
      {target.label}
    </Link>
  ) : null;
}
