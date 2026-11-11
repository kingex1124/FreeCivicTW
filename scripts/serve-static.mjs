import http from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('out');
const port = Number(process.env.PORT ?? 4173);
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let relative = decodeURIComponent(url.pathname);
    if (base) {
      if (relative === base) {
        res.writeHead(301, { Location: base + '/' });
        res.end();
        return;
      }
      if (!relative.startsWith(base + '/')) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      relative = relative.slice(base.length);
    }
    let target = path.resolve(root, '.' + relative);
    if (target !== root && !target.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const info = await stat(target).catch(() => undefined);
    if (info?.isDirectory()) {
      if (!url.pathname.endsWith('/')) {
        res.writeHead(301, { Location: url.pathname + '/' + url.search });
        res.end();
        return;
      }
      target = path.join(target, 'index.html');
    }
    const content = await readFile(target).catch(() => undefined);
    if (!content) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(await readFile(path.join(root, '404.html')));
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime[path.extname(target)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(content);
  } catch {
    res.writeHead(400);
    res.end('Bad request');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://localhost:${port}${base}/`));
