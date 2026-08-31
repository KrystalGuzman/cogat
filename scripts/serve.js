#!/usr/bin/env node
/* Minimal static file server for local development: `npm run serve`. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const target = path.join(root, url === '/' ? 'index.html' : url);

  // Never serve anything outside the project directory.
  if (!target.startsWith(root + path.sep) && target !== path.join(root, 'index.html')) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.readFile(target, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(target)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, () => {
  console.log(`CogAT practice running at http://localhost:${port}`);
});
