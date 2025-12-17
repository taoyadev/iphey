import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let version = '0.0.0';
try {
  const pkgRaw = readFileSync(join(process.cwd(), 'package.json'), 'utf-8');
  const pkg = JSON.parse(pkgRaw);
  version = pkg.version ?? version;
} catch {
  // ignore
}

export const appVersion = version;
