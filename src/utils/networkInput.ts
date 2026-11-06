export interface ParsedIP {
  ip: string;
  family: 4 | 6;
  category: 'public' | 'private' | 'loopback' | 'link-local' | 'reserved';
}

export function parseIP(input: string): ParsedIP | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value || value.length > 45 || /[\s/%[\]]/.test(value)) return null;
  if (value.includes(':')) {
    try {
      const ip = new URL(`http://[${value}]/`).hostname.slice(1, -1);
      if (!ip || !ip.includes(':')) return null;
      if (ip === '::') return { ip, family: 6, category: 'reserved' };
      if (ip === '::1') return { ip, family: 6, category: 'loopback' };
      if (ip.startsWith('::ffff:')) {
        const tail = ip.slice(7).split(':');
        if (tail.length === 2) {
          const n = parseInt(tail[0], 16) * 65536 + parseInt(tail[1], 16);
          const mapped = parseIP([n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'));
          return { ip, family: 6, category: mapped?.category ?? 'reserved' };
        }
      }
      const first = parseInt(ip.split(':')[0] || '0', 16);
      const category =
        (first & 0xfe00) === 0xfc00
          ? 'private'
          : (first & 0xffc0) === 0xfe80
            ? 'link-local'
            : (first & 0xe000) !== 0x2000 || /^2001:(db8|0|2|10|20):/.test(ip) || /^3fff:/.test(ip)
              ? 'reserved'
              : 'public';
      return { ip, family: 6, category };
    } catch {
      return null;
    }
  }
  const parts = value.split('.');
  if (parts.length !== 4 || !parts.every(p => /^(0|[1-9]\d{0,2})$/.test(p) && Number(p) <= 255)) return null;
  const [a, b, c, d] = parts.map(Number);
  const category =
    a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
      ? 'private'
      : a === 127
        ? 'loopback'
        : a === 169 && b === 254
          ? 'link-local'
          : a === 0 ||
              a >= 224 ||
              (a === 100 && b >= 64 && b <= 127) ||
              (a === 192 && b === 0 && ((c === 0 && d !== 9 && d !== 10) || c === 2)) ||
              (a === 192 && b === 88 && c === 99) ||
              (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
              (a === 203 && b === 0 && c === 113)
            ? 'reserved'
            : 'public';
  return { ip: parts.join('.'), family: 4, category };
}

export function parseASN(input: string | number | undefined): number | null {
  if (input === undefined || !/^(?:AS)?\d+$/i.test(String(input).trim())) return null;
  const n = Number(String(input).trim().replace(/^AS/i, ''));
  return Number.isSafeInteger(n) && n > 0 && n < 4294967295 && n !== 23456 && n !== 65535 ? n : null;
}

// IANA special-purpose AS registry, checked 2026-11-06.
export function asnCategory(asn: number): 'public' | 'private-use' | 'documentation' {
  if ((asn >= 64512 && asn <= 65534) || (asn >= 4200000000 && asn <= 4294967294)) return 'private-use';
  if ((asn >= 64496 && asn <= 64511) || (asn >= 65536 && asn <= 65551)) return 'documentation';
  return 'public';
}
