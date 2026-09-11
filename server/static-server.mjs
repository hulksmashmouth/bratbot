#!/usr/bin/env node
// Serves the static web build (from `npx expo export --platform web`) so the
// Pi's kiosk browser can load Dolly Pocket from localhost instead of a dev server.
// Single-page app with no router, so any unmatched path falls back to
// index.html rather than 404ing.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT ?? 8080);

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

async function readIndex() {
  return readFile(join(DIST_DIR, 'index.html'));
}

createServer(async (req, res) => {
  const urlPath = (req.url ?? '/').split('?')[0];
  const filePath = join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);

  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    try {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(await readIndex());
    } catch {
      res.writeHead(404);
      res.end(`Not found. Did you run "npx expo export --platform web" yet? Looked in ${DIST_DIR}`);
    }
  }
}).listen(PORT, () => {
  console.log(`Serving ${DIST_DIR} on http://localhost:${PORT}`);
});
