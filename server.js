/* ============================================
   Fluxora — Local Dev Server
   Sends COOP/COEP headers to enable
   SharedArrayBuffer (needed for FFmpeg.wasm
   multi-threading & large memory).
   ============================================ */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.wasm': 'application/wasm',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.pdf':  'application/pdf',
  '.woff2':'font/woff2'
};

const server = http.createServer(function (req, res) {
  var urlPath = req.url.split('?')[0].split('#')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  var filePath = path.join(ROOT, urlPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  var ext = path.extname(filePath).toLowerCase();
  var contentType = MIME[ext] || 'application/octet-stream';

  fs.stat(filePath, function (err, stats) {
    if (err || !stats.isFile()) {
      // SPA fallback
      fs.readFile(path.join(ROOT, 'index.html'), function (err2, data) {
        if (err2) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp'
        });
        res.end(data);
      });
      return;
    }

    var headers = { 'Content-Type': contentType };

    // ── Basic Security ──
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'SAMEORIGIN';
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';

    // Cache static assets
    if (ext.match(/\.(js|css|wasm|woff2|png|jpg|webp|svg|ico)$/)) {
      headers['Cache-Control'] = 'public, max-age=86400';
    }

    res.writeHead(200, headers);

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    var stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', function () {
      res.end();
    });
  });
});

server.listen(PORT, function () {
  console.log('');
  console.log('  Fluxora Dev Server');
  console.log('  ─────────────────');
  console.log('  Local:   http://localhost:' + PORT);
  console.log('  FFmpeg.wasm: ready (auto single/multi-thread)');
  console.log('');
});
