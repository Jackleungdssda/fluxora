/* ============================================
   Fluxora — Browser Compatibility Check
   Runs before all other scripts to ensure
   the user's browser can run the site.
   ============================================ */
(function () {
  'use strict';

  var REQUIRED = [
    { api: 'WebAssembly',     name: 'WebAssembly' },
    { api: 'Worker',          name: 'Web Workers' },
    { api: 'FileReader',      name: 'FileReader API' },
    { api: 'Blob',            name: 'Blob API' },
    { api: 'URL',             name: 'URL API' },
    { api: 'Promise',         name: 'Promise API' },
    { api: 'localStorage',    name: 'localStorage' },
    { api: 'AudioContext',    name: 'Web Audio API', aliases: ['webkitAudioContext'] },
    { api: 'HTMLCanvasElement', name: 'Canvas API' }
  ];

  var missing = [];

  REQUIRED.forEach(function (req) {
    var found = typeof window[req.api] !== 'undefined';
    if (!found && req.aliases) {
      found = req.aliases.some(function (a) { return typeof window[a] !== 'undefined'; });
    }
    if (!found) {
      missing.push(req.name);
    }
  });

  if (missing.length > 0) {
    // Show minimal fallback page
    document.documentElement.innerHTML =
      '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Browser Not Supported — Fluxora</title>' +
      '<style>' +
        'body{background:#000;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center}' +
        '.box{background:rgba(44,44,46,0.8);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:40px 32px;max-width:480px}' +
        'h1{font-size:1.4rem;margin-bottom:12px}' +
        'p{color:rgba(255,255,255,0.55);font-size:0.9rem;line-height:1.6;margin-bottom:20px}' +
        'ul{text-align:left;color:rgba(255,255,255,0.5);font-size:0.8rem}' +
        'a{color:#0A84FF}' +
      '</style></head><body><div class="box">' +
      '<h1>Browser Not Supported</h1>' +
      '<p>Your browser is missing required features to run Fluxora. Please update to the latest version of Chrome, Firefox, Safari, or Edge.</p>' +
      '<ul><li>Missing: ' + missing.join(', ') + '</li></ul>' +
      '<p style="margin-top:16px"><a href="https://www.google.com/chrome/">Download Chrome</a></p>' +
      '</div></body>';
    throw new Error('Browser not supported: ' + missing.join(', '));
  }

  // Check for SharedArrayBuffer (enables multi-threaded FFmpeg)
  window.__hasSAB = typeof SharedArrayBuffer !== 'undefined';

  // Mark browser as compatible
  window.__browserOK = true;

})();
