import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('apps/web-next/out');
const port = Number(process.env.OPENCLAW_PORT || process.argv[process.argv.indexOf('--port') + 1]);
if (!Number.isInteger(port) || port < 3200 || port > 4999) throw new Error('Managed preview port required');
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon', '.woff2':'font/woff2' };
createServer(async (req,res) => {
  try {
    const path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const base = resolve(root, `.${path}`);
    if (base !== root && !base.startsWith(root + sep)) { res.writeHead(400); res.end(); return; }
    const candidates = [base, base + '.html', resolve(base,'index.html')];
    for (const file of candidates) {
      try { if (!(await stat(file)).isFile()) continue; const body = await readFile(file); res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'X-Robots-Tag':'noindex', 'Cache-Control':'no-store' }); res.end(body); return; } catch { /* next candidate */ }
    }
    res.writeHead(404, { 'Content-Type':'text/html' }); res.end(await readFile(resolve(root,'404.html')));
  } catch { res.writeHead(500); res.end('Preview error'); }
}).listen(port,'127.0.0.1',() => console.log(`IPhey preview on ${port}`));
