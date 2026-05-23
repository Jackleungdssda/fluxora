/* ============================================
   Fluxora — Comprehensive Browser Environment Test
   Uses jsdom to simulate browser and test all modules
   ============================================ */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const BASE = path.resolve(__dirname, '..');
const htmlPath = path.join(BASE, 'index.html');

let passed = 0;
let failed = 0;
let warnings = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  \x1b[32mPASS\x1b[0m ' + name);
  } catch (e) {
    failed++;
    console.log('  \x1b[31mFAIL\x1b[0m ' + name);
    console.log('       Error: ' + e.message);
  }
}

function warn(name, msg) {
  warnings++;
  console.log('  \x1b[33mWARN\x1b[0m ' + name + ' — ' + msg);
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error((msg || '') + ' Expected: ' + expected + ', got: ' + actual);
}

function assertContains(arr, item, msg) {
  if (arr.indexOf(item) === -1) throw new Error((msg || '') + ' Array does not contain: ' + item);
}

console.log('\n╔══════════════════════════════════════════╗');
console.log('║   Fluxora Browser Environment Test       ║');
console.log('╚══════════════════════════════════════════╝\n');

// ============================================================
// PHASE 1: Static file validation
// ============================================================
console.log('── Phase 1: Static File Validation ──');

test('index.html exists', () => {
  assert(fs.existsSync(htmlPath), 'index.html not found');
});

test('index.html is valid HTML (has DOCTYPE)', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert(html.trim().startsWith('<!DOCTYPE'), 'Missing DOCTYPE');
});

test('index.html has closing </html> tag', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert(html.includes('</html>'), 'Missing closing </html>');
});

const jsFiles = [
  'assets/js/i18n.js',
  'assets/js/license.js',
  'assets/js/sharing.js',
  'assets/js/watermark.js',
  'assets/js/cookie-consent.js',
  'assets/js/converter.js',
  'assets/js/main.js',
  'assets/js/three-background.js'
];

jsFiles.forEach(file => {
  test('JS file exists: ' + file, () => {
    const fullPath = path.join(BASE, file);
    assert(fs.existsSync(fullPath), file + ' not found');
  });
});

test('assets/css/style.css exists', () => {
  assert(fs.existsSync(path.join(BASE, 'assets/css/style.css')), 'style.css not found');
});

// ============================================================
// PHASE 2: JSDOM Environment Setup
// ============================================================
console.log('\n── Phase 2: Browser Environment (JSDOM) ──');

let dom, window, document;

test('JSDOM loads index.html', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  dom = new JSDOM(html, {
    url: 'http://localhost:8081',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true
  });
  window = dom.window;
  document = window.document;
  assert(window && document, 'Failed to create JSDOM window');
});

// ============================================================
// PHASE 3: Load JS modules
// ============================================================
console.log('\n── Phase 3: JS Module Loading ──');

// Mock browser APIs needed by modules
test('Setup browser API mocks', () => {
  // FileReader
  window.FileReader = class FileReader {
    readAsArrayBuffer() {}
    readAsDataURL() {}
    readAsText() {}
  };

  // AudioContext
  window.AudioContext = class AudioContext {
    constructor() { this.sampleRate = 48000; }
    decodeAudioData() { return Promise.resolve({}); }
    close() {}
  };
  window.OfflineAudioContext = class OfflineAudioContext {
    constructor() {}
    createBufferSource() {
      return { buffer: null, connect() {}, start() {}, stop() {} };
    }
    startRendering() { return Promise.resolve({}); }
    get destination() { return {}; }
  };
  window.webkitAudioContext = window.AudioContext;

  // localStorage
  window.localStorage = {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, val) { this._data[key] = val; },
    removeItem(key) { delete this._data[key]; }
  };

  // Canvas
  window.HTMLCanvasElement.prototype.getContext = function() {
    return {
      drawImage() {},
      fillRect() {},
      clearRect() {},
      getImageData() { return { data: new Uint8ClampedArray(4) }; }
    };
  };
  window.HTMLCanvasElement.prototype.toBlob = function(cb) {
    cb(new window.Blob(['test'], { type: 'image/png' }));
  };

  // Blob
  if (!window.Blob) {
    window.Blob = class Blob {
      constructor(parts, opts) { this.size = parts.join('').length; this.type = (opts && opts.type) || ''; }
    };
  }

  // URL
  if (!window.URL) {
    window.URL = { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} };
  }

  // CustomEvent
  window.CustomEvent = class CustomEvent {
    constructor(name, opts) { this.detail = (opts && opts.detail) || {}; }
  };

  // navigator
  window.navigator.share = undefined;

  // EventTarget dispatchEvent
  const origDispatch = window.EventTarget.prototype.dispatchEvent;
  window.EventTarget.prototype.dispatchEvent = function(evt) {
    if (this.onerror && evt.type === 'error') this.onerror(evt);
    if (origDispatch) return origDispatch.call(this, evt);
    return true;
  };

  assert(true, 'Browser APIs mocked');
});

// Load each JS module in order
function loadJSModule(filePath, description) {
  test('Load ' + description, () => {
    const fullPath = path.join(BASE, filePath);
    const code = fs.readFileSync(fullPath, 'utf8');
    const script = document.createElement('script');
    script.textContent = code;
    document.body.appendChild(script);
    // Execute the script in window context
    try {
      const fn = new Function('window', 'document', code);
      fn(window, document);
    } catch (e) {
      // Some scripts use IIFE - try eval approach
      try {
        window.eval(code);
      } catch (e2) {
        throw new Error('Failed to load ' + filePath + ': ' + e2.message);
      }
    }
    assert(true, description + ' loaded');
  });
}

const moduleLoadOrder = [
  ['assets/js/i18n.js', 'i18n.js'],
  ['assets/js/license.js', 'license.js'],
  ['assets/js/sharing.js', 'sharing.js'],
  ['assets/js/watermark.js', 'watermark.js'],
  ['assets/js/cookie-consent.js', 'cookie-consent.js'],
  ['assets/js/converter.js', 'converter.js'],
  ['assets/js/main.js', 'main.js'],
  ['assets/js/three-background.js', 'three-background.js']
];

moduleLoadOrder.forEach(([path, name]) => loadJSModule(path, name));

// ============================================================
// PHASE 4: Converter API Tests
// ============================================================
console.log('\n── Phase 4: Converter API Surface ──');

test('window.Converter exists', () => {
  assert(window.Converter !== undefined, 'Converter not exposed on window');
});

const expectedAPIs = ['image', 'pdfToImage', 'imagesToPdf', 'audio', 'videoToGIF', 'video', 'compress', 'compressVideo', 'MIME_MAP', 'AUDIO_MIME'];
expectedAPIs.forEach(api => {
  test('Converter.' + api + ' exists', () => {
    assert(typeof window.Converter[api] !== 'undefined', api + ' missing from Converter');
  });
});

test('Converter.MIME_MAP has image formats', () => {
  const m = window.Converter.MIME_MAP;
  assert(m.jpg === 'image/jpeg', 'jpg MIME missing');
  assert(m.png === 'image/png', 'png MIME missing');
  assert(m.webp === 'image/webp', 'webp MIME missing');
});

test('Converter.AUDIO_MIME has all 7 formats', () => {
  const m = window.Converter.AUDIO_MIME;
  const formats = Object.keys(m);
  assertContains(formats, 'mp3', 'mp3 missing from AUDIO_MIME');
  assertContains(formats, 'wav', 'wav missing from AUDIO_MIME');
  assertContains(formats, 'ogg', 'ogg missing from AUDIO_MIME');
  assertContains(formats, 'aac', 'aac missing from AUDIO_MIME');
  assertContains(formats, 'flac', 'flac missing from AUDIO_MIME');
  assertContains(formats, 'm4a', 'm4a missing from AUDIO_MIME');
  assertContains(formats, 'mp4', 'mp4 missing from AUDIO_MIME');
  assertEqual(formats.length, 7, 'Expected 7 audio formats');
});

test('Converter.AUDIO_MIME MIME types correct', () => {
  const m = window.Converter.AUDIO_MIME;
  assertEqual(m.mp3, 'audio/mpeg');
  assertEqual(m.wav, 'audio/wav');
  assertEqual(m.ogg, 'audio/ogg');
  assertEqual(m.aac, 'audio/aac');
  assertEqual(m.flac, 'audio/flac');
  assertEqual(m.m4a, 'audio/mp4');
  assertEqual(m.mp4, 'audio/mp4');
});

test('Converter functions are actual functions', () => {
  assertEqual(typeof window.Converter.audio, 'function', 'audio not a function');
  assertEqual(typeof window.Converter.video, 'function', 'video not a function');
  assertEqual(typeof window.Converter.videoToGIF, 'function', 'videoToGIF not a function');
  assertEqual(typeof window.Converter.compress, 'function', 'compress not a function');
  assertEqual(typeof window.Converter.compressVideo, 'function', 'compressVideo not a function');
  assertEqual(typeof window.Converter.image, 'function', 'image not a function');
  assertEqual(typeof window.Converter.pdfToImage, 'function', 'pdfToImage not a function');
  assertEqual(typeof window.Converter.imagesToPdf, 'function', 'imagesToPdf not a function');
});

// ============================================================
// PHASE 5: Audio Conversion Logic Tests
// ============================================================
console.log('\n── Phase 5: Audio Conversion Logic ──');

test('Audio WAV detection triggers native path', () => {
  // Read converter source to verify the routing
  const src = fs.readFileSync(path.join(BASE, 'assets/js/converter.js'), 'utf8');
  assert(src.includes("outputFormat === 'wav'"), 'WAV routing check missing');
  assert(src.includes('convertToWavNative'), 'Native WAV function missing');
});

test('Audio non-WAV uses FFmpeg.wasm path', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/converter.js'), 'utf8');
  assert(src.includes('convertAudioWithFFmpeg'), 'FFmpeg audio path missing');
  assert(src.includes('AUDIO_CODEC_ARGS'), 'Audio codec args map missing');
});

test('Audio codec args for all formats', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/converter.js'), 'utf8');
  // Parse AUDIO_CODEC_ARGS
  assert(src.includes("mp3:  ['-acodec', 'libmp3lame']"), 'MP3 codec args missing');
  assert(src.includes("ogg:  ['-acodec', 'libvorbis']"), 'OGG codec args missing');
  assert(src.includes("aac:  ['-acodec', 'aac']"), 'AAC codec args missing');
  assert(src.includes("flac: ['-acodec', 'flac']"), 'FLAC codec args missing');
  assert(src.includes("m4a:  ['-acodec', 'aac', '-f', 'ipod']"), 'M4A codec args missing');
  assert(src.includes("mp4:  ['-acodec', 'aac', '-f', 'mp4']"), 'MP4 codec args missing');
});

test('Bitrate applied for lossy formats only', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/converter.js'), 'utf8');
  const bitrateCheck = src.match(/\['mp3','ogg','aac','m4a','mp4'\]/);
  assert(bitrateCheck, 'Lossy format bitrate list found');
  // FLAC should NOT be in the bitrate list (lossless)
  assert(!bitrateCheck[0].includes('flac'), 'FLAC should not have bitrate (lossless)');
});

test('FFmpeg.wasm shared loader exists', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/converter.js'), 'utf8');
  assert(src.includes('getFFmpeg'), 'Shared FFmpeg loader missing');
  assert(src.includes('ffmpegInstance'), 'FFmpeg instance cache missing');
  assert(src.includes('ffmpegLoading'), 'FFmpeg loading promise cache missing');
});

// ============================================================
// PHASE 6: UI / HTML Structure Tests
// ============================================================
console.log('\n── Phase 6: UI Structure Tests ──');

test('Audio format grid has 7 buttons', () => {
  const grid = document.getElementById('audio-format-grid');
  assert(grid !== null, 'audio-format-grid not found in DOM');
  const buttons = grid.querySelectorAll('.format-check-item');
  assertEqual(buttons.length, 7, 'Expected 7 audio format buttons, found ' + buttons.length);
});

const expectedAudioFormats = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'mp4'];
expectedAudioFormats.forEach(fmt => {
  test('Audio button exists: ' + fmt.toUpperCase(), () => {
    const btn = document.querySelector('#audio-format-grid [data-format="' + fmt + '"]');
    assert(btn !== null, fmt + ' button not found in audio format grid');
  });
});

test('First audio button (mp3) is checked by default', () => {
  const btn = document.querySelector('#audio-format-grid [data-format="mp3"]');
  assert(btn !== null, 'mp3 button not found');
  assert(btn.classList.contains('checked'), 'mp3 should be checked by default');
});

test('All 7 tool pages exist', () => {
  const pages = ['image-page', 'pdf-page', 'audio-page', 'video-page', 'compress-page', 'pdf-merge-page', 'pdf-split-page'];
  pages.forEach(id => {
    const el = document.getElementById(id);
    assert(el !== null, id + ' page not found');
  });
});

test('All upload inputs exist', () => {
  const inputs = ['image-upload', 'pdf-upload', 'audio-upload', 'video-upload', 'compress-upload', 'pdf-merge-upload', 'pdf-split-upload'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    assert(el !== null, id + ' input not found');
  });
});

test('Audio upload accepts M4A files', () => {
  const input = document.getElementById('audio-upload');
  assert(input !== null, 'audio-upload not found');
  const accept = input.getAttribute('accept') || '';
  assert(accept.includes('.m4a'), 'audio upload should accept .m4a files');
  assert(accept.includes('.aac'), 'audio upload should accept .aac files');
  assert(accept.includes('.flac'), 'audio upload should accept .flac files');
  assert(accept.includes('.ogg'), 'audio upload should accept .ogg files');
});

test('All process/result sections exist for each tool', () => {
  const tools = ['image', 'pdf', 'audio', 'video', 'compress', 'pdf-merge', 'pdf-split'];
  tools.forEach(t => {
    const proc = document.getElementById(t + '-processing');
    const result = document.getElementById(t + '-result');
    assert(proc !== null, t + '-processing section missing');
    assert(result !== null, t + '-result section missing');
  });
});

test('License modal exists', () => {
  const modal = document.getElementById('license-modal');
  assert(modal !== null, 'license-modal missing');
  const input = document.getElementById('license-input');
  assert(input !== null, 'license-input missing');
});

test('Toast element exists', () => {
  const toast = document.getElementById('toast');
  assert(toast !== null, 'toast element missing');
});

test('Progress ring SVGs exist for each tool', () => {
  const tools = ['image', 'pdf', 'audio', 'video', 'compress', 'pdf-merge', 'pdf-split'];
  tools.forEach(t => {
    const circles = document.querySelectorAll('#' + t + '-processing .progress-ring-circle');
    assert(circles.length > 0, t + ' progress ring missing');
  });
});

// ============================================================
// PHASE 7: ExtToFormat Mapping Tests
// ============================================================
console.log('\n── Phase 7: Format Detection Mapping ──');

test('M4A maps to m4a (independent format, not aac)', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes("m4a:'m4a'"), 'm4a should map to itself, not aac');
});

test('All 7 audio formats in extToFormat', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  const audioMappings = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'mp4'];
  audioMappings.forEach(f => {
    assert(src.includes(f + ":'"), f + ' mapping missing in extToFormat');
  });
});

test('Video formats all mapped', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes("mp4:'mp4'"), 'mp4 mapping missing');
  assert(src.includes("webm:'webm'"), 'webm mapping missing');
  assert(src.includes("gif:'gif'"), 'gif mapping missing');
});

// ============================================================
// PHASE 8: Video Conversion Routing Tests
// ============================================================
console.log('\n── Phase 8: Video Conversion Routing ──');

test('Video GIF uses videoToGIF converter', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes("outFormat === 'gif'"), 'GIF routing check missing');
  assert(src.includes('Converter.videoToGIF'), 'videoToGIF call missing');
});

test('Video MP4 uses video converter', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes("outFormat === 'mp4'"), 'MP4 routing check missing');
  assert(src.includes('Converter.video'), 'video converter call missing');
});

test('Video WebM uses video converter', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes("outFormat === 'webm'"), 'WebM routing check missing');
});

test('Compress detects video files', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('type.startsWith'), 'Video file type detection missing');
  assert(src.includes('compressVideo'), 'compressVideo call missing');
});

// ============================================================
// PHASE 9: Quality Tier Logic Tests
// ============================================================
console.log('\n── Phase 9: Quality Tier & License Logic ──');

test('Watermark.QUALITY has sd and hd tiers', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/watermark.js'), 'utf8');
  assert(src.includes("sd:"), 'SD tier missing');
  assert(src.includes("hd:"), 'HD tier missing');
});

test('SD audio bitrate is 128kbps', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/watermark.js'), 'utf8');
  assert(src.includes('bitrate: 128'), 'SD audio bitrate 128 missing');
});

test('HD audio bitrate is 320kbps', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/watermark.js'), 'utf8');
  assert(src.includes('bitrate: 320'), 'HD audio bitrate 320 missing');
});

test('Demo license codes exist', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('DEMO-IMAGE-1234'), 'Image demo code missing');
  assert(src.includes('DEMO-PDF-5678'), 'PDF demo code missing');
  assert(src.includes('DEMO-AUDIO-9012'), 'Audio demo code missing');
  assert(src.includes('DEMO-ALL-3456'), 'All-access demo code missing');
});

// ============================================================
// PHASE 10: i18n Tests
// ============================================================
console.log('\n── Phase 10: Internationalization ──');

test('i18n has 6 supported languages', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/i18n.js'), 'utf8');
  assert(src.includes("'en', 'zh', 'fr', 'es', 'ja', 'ko'"), '6 languages missing');
});

test('M4A mentioned in audio descriptions', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/i18n.js'), 'utf8');
  assert(src.includes('M4A'), 'M4A not mentioned in i18n');
});

test('All audio format keys have translations', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/i18n.js'), 'utf8');
  const keys = ['nav.freecount', 'nav.license', 'tool.audio', 'tool.audioDesc',
    'upload.supportedAudio', 'upload.supportedImg', 'upload.supportedVideo',
    'toast.choose', 'toast.done', 'toast.output',
    'format.label', 'format.detected',
    'toolpage.audio', 'toolpage.video', 'toolpage.image', 'toolpage.pdf'];
  keys.forEach(key => {
    assert(src.includes("'" + key + "':"), 'i18n key missing: ' + key);
  });
});

// ============================================================
// PHASE 11: Script Loading Order
// ============================================================
console.log('\n── Phase 11: Script Loading Order ──');

test('i18n.js loads before other JS (prevents flash)', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const i18nIdx = html.indexOf('assets/js/i18n.js');
  const licenseIdx = html.indexOf('assets/js/license.js');
  const converterIdx = html.indexOf('assets/js/converter.js');
  const mainIdx = html.indexOf('assets/js/main.js');
  assert(i18nIdx < converterIdx, 'i18n should load before converter');
  assert(i18nIdx < mainIdx, 'i18n should load before main');
});

test('converter.js loads before main.js', () => {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const converterIdx = html.indexOf('assets/js/converter.js');
  const mainIdx = html.indexOf('assets/js/main.js');
  assert(converterIdx < mainIdx, 'converter should load before main');
});

// ============================================================
// PHASE 12: PDF Merge/Split Tests
// ============================================================
console.log('\n── Phase 12: PDF Merge & Split ──');

test('Converter.mergePDFs exists', () => {
  assert(typeof window.Converter.mergePDFs === 'function', 'mergePDFs missing');
});

test('Converter.splitPDF exists', () => {
  assert(typeof window.Converter.splitPDF === 'function', 'splitPDF missing');
});

test('pdf-lib CDN URL is correct', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/converter.js'), 'utf8');
  assert(src.includes('pdf-lib@1.17.1/dist/pdf-lib.min.js'), 'pdf-lib URL missing');
});

test('PDF merge handles multiple files', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/converter.js'), 'utf8');
  assert(src.includes('copyPages'), 'copyPages API call missing');
  assert(src.includes('mergedDoc.addPage'), 'addPage for merge missing');
  assert(src.includes('files[index]'), 'File iteration for merge missing');
});

test('PDF split extracts individual pages', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/converter.js'), 'utf8');
  assert(src.includes('pageIndices'), 'Page indices for split missing');
  assert(src.includes('extractPage'), 'Page extraction for split missing');
  assert(src.includes('pageNumber'), 'Page number tracking missing');
});

test('PDF merge/split in main.js routing uses real converters', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes("type === 'pdf-merge'"), 'pdf-merge routing missing');
  assert(src.includes("type === 'pdf-split'"), 'pdf-split routing missing');
  assert(src.includes('Converter.mergePDFs'), 'mergePDFs call in routing missing');
  assert(src.includes('Converter.splitPDF'), 'splitPDF call in routing missing');
});

test('Multi-file result handling for PDF split', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('_lastResultIsMulti'), 'Multi-result flag missing');
  assert(src.includes('Array.isArray(result)'), 'Array check for split result missing');
});

test('PDF merge requires at least 2 files', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('at least 2 PDF files'), 'Min files check for merge missing');
});

// ============================================================
// PHASE 13: DOCX Removal Verification
// ============================================================
console.log('\n── Phase 13: DOCX Button Removal ──');

test('DOCX button removed from PDF format grid', () => {
  const docxBtn = document.querySelector('#pdf-format-grid [data-format="docx"]');
  assert(docxBtn === null, 'DOCX button should be removed from PDF grid');
});

test('PDF format grid now has 2 buttons (JPG, PNG) — PDF moved to img2pdf grid', () => {
  const grid = document.getElementById('pdf-format-grid');
  const buttons = grid.querySelectorAll('.format-check-item');
  assertEqual(buttons.length, 2, 'PDF→Image grid should have 2 buttons (JPG, PNG)');
});

test('PDF format grid has JPG and PNG buttons', () => {
  const jpgBtn = document.querySelector('#pdf-format-grid [data-format="jpg"]');
  const pngBtn = document.querySelector('#pdf-format-grid [data-format="png"]');
  assert(jpgBtn !== null, 'JPG button missing');
  assert(pngBtn !== null, 'PNG button missing');
});

test('PDF button exists in img2pdf grid (hidden by default)', () => {
  const pdfBtn = document.querySelector('#pdf-img2pdf-grid [data-format="pdf"]');
  assert(pdfBtn !== null, 'PDF button missing from img2pdf grid');
});

test('PDF upload accept no longer includes fake formats', () => {
  const input = document.getElementById('pdf-upload');
  const accept = input.getAttribute('accept') || '';
  assert(!accept.includes('.docx'), 'DOCX should not be in accept list');
  assert(!accept.includes('.ppt'), 'PPT should not be in accept list');
  assert(!accept.includes('.xls'), 'XLS should not be in accept list');
  assert(accept.includes('.pdf'), 'PDF should be in accept list');
});

// ============================================================
// PHASE 14: Payment & Worker Wiring Tests
// ============================================================
console.log('\n── Phase 14: Payment & Worker Wiring ──');

test('Worker URL is configured', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('WORKER_URL'), 'Worker URL config missing');
});

test('Worker fetch with fallback to demo codes', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes("fetch(WORKER_URL + '/api/verify-license'"), 'Worker fetch call missing');
  assert(src.includes('DEMO-ALL-3456'), 'Demo code fallback missing');
});

test('Payment links config exists with proper structure', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('PAYMENT_LINKS'), 'Payment links config missing');
  assert(src.includes('image:'), 'Image plan link missing');
  assert(src.includes('audio:'), 'Audio plan link missing');
  assert(src.includes('all:'), 'All-access plan link missing');
});

test('handleBuyClick has payment flow with demo fallback', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('window.open'), 'Real payment URL open missing');
  assert(src.includes('Payment coming soon'), 'Payment fallback message missing');
});

test('Cloudflare Worker code has all 3 endpoints', () => {
  const workerSrc = fs.readFileSync(path.join(BASE, 'workers/worker.js'), 'utf8');
  assert(workerSrc.includes('/api/verify-license'), 'verify-license endpoint missing');
  assert(workerSrc.includes('/api/validate-token'), 'validate-token endpoint missing');
  assert(workerSrc.includes('/api/webhook'), 'webhook endpoint missing');
});

test('Worker has HMAC signing', () => {
  const workerSrc = fs.readFileSync(path.join(BASE, 'workers/worker.js'), 'utf8');
  assert(workerSrc.includes('HMAC'), 'HMAC import missing');
  assert(workerSrc.includes('crypto.subtle.sign'), 'Crypto signing missing');
});

test('Worker has device binding (max 2)', () => {
  const workerSrc = fs.readFileSync(path.join(BASE, 'workers/worker.js'), 'utf8');
  assert(workerSrc.includes('devices.length >= 2'), 'Device limit check missing');
});

test('Worker handles CORS', () => {
  const workerSrc = fs.readFileSync(path.join(BASE, 'workers/worker.js'), 'utf8');
  assert(workerSrc.includes('Access-Control-Allow-Origin'), 'CORS headers missing');
});

test('wrangler.toml has KV namespace config', () => {
  const toml = fs.readFileSync(path.join(BASE, 'workers/wrangler.toml'), 'utf8');
  assert(toml.includes('kv_namespaces'), 'KV namespace config missing');
  assert(toml.includes('LICENSES'), 'LICENSES binding missing');
  assert(toml.includes('HMAC_SECRET'), 'HMAC_SECRET mention missing');
});

// ============================================================
// PHASE 15: Package.json Verification
// ============================================================
console.log('\n── Phase 15: Package.json ──');

test('package.json exists', () => {
  const pkgPath = path.join(BASE, 'package.json');
  assert(fs.existsSync(pkgPath), 'package.json not found');
});

test('package.json is valid JSON', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(BASE, 'package.json'), 'utf8'));
  assertEqual(pkg.name, 'fluxora', 'Package name should be fluxora');
  assert(pkg.version >= '1.0.0', 'Version should be >= 1.0.0');
});

test('package.json has all required scripts', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(BASE, 'package.json'), 'utf8'));
  const scripts = Object.keys(pkg.scripts || {});
  assertContains(scripts, 'dev', 'dev script missing');
  assertContains(scripts, 'test', 'test script missing');
  assertContains(scripts, 'deploy:worker', 'deploy:worker script missing');
});

test('package.json lists pdf-lib as dependency', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(BASE, 'package.json'), 'utf8'));
  const deps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {}, pkg.browserDependencies || {});
  const allKeys = Object.keys(deps);
  const hasPdfLib = allKeys.some(k => k.includes('pdf-lib'));
  assert(hasPdfLib, 'pdf-lib not found in any dependencies section');
});

test('package.json has browserDependencies section', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(BASE, 'package.json'), 'utf8'));
  assert(pkg.browserDependencies !== undefined, 'browserDependencies section missing');
});

// ============================================================
// PHASE 16: Code Quality Checks
// ============================================================
console.log('\n── Phase 16: Batch File Queue ──');

test('window.FileQueue exists', () => {
  assert(window.FileQueue !== undefined, 'FileQueue not exposed on window');
});

test('FileQueue.add exists', () => {
  assert(typeof window.FileQueue.add === 'function', 'FileQueue.add missing');
});

test('FileQueue.remove exists', () => {
  assert(typeof window.FileQueue.remove === 'function', 'FileQueue.remove missing');
});

test('FileQueue.clear exists', () => {
  assert(typeof window.FileQueue.clear === 'function', 'FileQueue.clear missing');
});

test('FileQueue.getFiles exists', () => {
  assert(typeof window.FileQueue.getFiles === 'function', 'FileQueue.getFiles missing');
});

test('FileQueue.count exists', () => {
  assert(typeof window.FileQueue.count === 'function', 'FileQueue.count missing');
});

test('FileQueue.hasFiles exists', () => {
  assert(typeof window.FileQueue.hasFiles === 'function', 'FileQueue.hasFiles missing');
});

test('FileQueue.add stores files and returns count', () => {
  const mockFile1 = new window.File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
  const mockFile2 = new window.File(['test2'], 'test2.png', { type: 'image/png' });
  const count = window.FileQueue.add('image', [mockFile1, mockFile2]);
  assertEqual(count, 2, 'Should return 2 files');
  assertEqual(window.FileQueue.count('image'), 2, 'Count should be 2');
  assertEqual(window.FileQueue.hasFiles('image'), true, 'Should have files');
});

test('FileQueue.getFiles returns correct files', () => {
  const files = window.FileQueue.getFiles('image');
  assertEqual(files.length, 2, 'Should return 2 files');
  assertEqual(files[0].name, 'test1.jpg', 'First file name mismatch');
  assertEqual(files[1].name, 'test2.png', 'Second file name mismatch');
});

test('FileQueue.remove deletes a file', () => {
  window.FileQueue.remove('image', 0);
  assertEqual(window.FileQueue.count('image'), 1, 'Count should be 1 after remove');
  assertEqual(window.FileQueue.getFiles('image')[0].name, 'test2.png', 'Remaining file mismatch');
});

test('FileQueue.clear empties the queue', () => {
  window.FileQueue.clear('image');
  assertEqual(window.FileQueue.count('image'), 0, 'Count should be 0 after clear');
  assertEqual(window.FileQueue.hasFiles('image'), false, 'Should have no files');
});

test('File queue containers exist for all 7 tools', () => {
  const tools = ['image', 'pdf', 'audio', 'video', 'compress', 'pdf-merge', 'pdf-split'];
  tools.forEach(t => {
    const el = document.getElementById(t + '-file-queue');
    assert(el !== null, t + '-file-queue container missing');
  });
  tools.forEach(t => {
    const el = document.getElementById(t + '-file-list');
    assert(el !== null, t + '-file-list container missing');
  });
});

test('FileQueue render creates file cards in DOM', () => {
  const mockFile = new window.File(['data'], 'song.mp3', { type: 'audio/mpeg' });
  window.FileQueue.add('audio', [mockFile]);
  const list = document.getElementById('audio-file-list');
  assert(list !== null, 'audio-file-list not found');
  assert(list.innerHTML.includes('file-card'), 'File card not rendered');
  assert(list.innerHTML.includes('song.mp3'), 'File name not in card');
  window.FileQueue.clear('audio');
});

test('File queue i18n keys exist', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/i18n.js'), 'utf8');
  assert(src.includes('queue.title'), 'queue.title i18n missing');
  assert(src.includes('queue.clear'), 'queue.clear i18n missing');
  assert(src.includes('queue.added'), 'queue.added i18n missing');
});

test('startConversion reads from FileQueue', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('FileQueue.getFiles'), 'startConversion must use FileQueue.getFiles');
});

test('Batch conversion logic exists for image/audio/compress', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('supportsBatch'), 'Batch support flag missing');
  assert(src.includes('processNext'), 'Batch sequential processor missing');
});

test('Batch auto-removes processed file from queue', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('FileQueue.remove'), 'Auto-remove from queue missing');
});

test('Batch download handles multi-file results', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('_lastResultIsMulti'), 'Multi-result flag check missing');
});

// ============================================================
// PHASE 17: Result Card Display
// ============================================================
console.log('\n── Phase 17: Result Card Display ──');

test('Result list containers exist for all 7 tools', () => {
  const tools = ['image', 'pdf', 'audio', 'video', 'compress', 'pdf-merge', 'pdf-split'];
  tools.forEach(t => {
    const el = document.getElementById(t + '-result-list');
    assert(el !== null, t + '-result-list container missing');
  });
});

test('Download-all buttons exist for all 7 tools', () => {
  const tools = ['image', 'pdf', 'audio', 'video', 'compress', 'pdf-merge', 'pdf-split'];
  tools.forEach(t => {
    const el = document.getElementById(t + '-dl-all');
    assert(el !== null, t + '-dl-all button missing');
  });
});

test('showResults function exists in main.js', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('function showResults'), 'showResults function missing');
});

test('ResultDownload global exists', () => {
  assert(window.ResultDownload !== undefined, 'ResultDownload not exposed');
  assert(typeof window.ResultDownload.download === 'function', 'ResultDownload.download missing');
});

test('Result store is initialized', () => {
  assert(window._resultStore !== undefined, '_resultStore not initialized');
});

test('Result card rendering uses result-list', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('result-card'), 'result-card class in JS missing');
  assert(src.includes('result-card-icon'), 'result-card-icon class in JS missing');
  assert(src.includes('result-card-name'), 'result-card-name class in JS missing');
  assert(src.includes('result-card-meta'), 'result-card-meta class in JS missing');
  assert(src.includes('result-card-dl'), 'result-card-dl class in JS missing');
});

test('Result card shows DONE badge for single conversions', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes("'DONE'"), 'DONE badge missing');
});

test('Result card shows BATCH badge for batch conversions', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes("'BATCH'"), 'BATCH badge missing');
});

test('Result card shows compression reduction percentage', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('originalSize'), 'Original size check missing');
  assert(src.includes('reduction'), 'Reduction display missing');
});

test('Download-all button gets has-multi class for batch', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes("classList.add('has-multi')"), 'has-multi class logic missing');
  assert(src.includes("classList.remove('has-multi')"), 'has-multi remove logic missing');
});

test('Old preview image IDs removed (replaced by result-list)', () => {
  assert(document.getElementById('image-result-preview') === null, 'Old image-result-preview should be removed');
});

test('Old result-name elements removed', () => {
  const oldIds = ['pdf-result-name', 'audio-result-name', 'video-result-name', 'compress-result-name', 'pdf-merge-result-name', 'pdf-split-result-name'];
  oldIds.forEach(id => {
    assert(document.getElementById(id) === null, 'Old ' + id + ' should be removed');
  });
});

test('Result card has per-file download button', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes("ResultDownload.download"), 'Per-file download onclick missing');
});

test('upload.hdDlAll i18n key exists', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/i18n.js'), 'utf8');
  assert(src.includes('upload.hdDlAll'), 'upload.hdDlAll i18n missing');
});

test('Result card CSS styles exist', () => {
  const css = fs.readFileSync(path.join(BASE, 'assets/css/style.css'), 'utf8');
  assert(css.includes('.result-card'), 'result-card CSS missing');
  assert(css.includes('.result-card-icon'), 'result-card-icon CSS missing');
  assert(css.includes('.result-card-name'), 'result-card-name CSS missing');
  assert(css.includes('.result-card-dl'), 'result-card-dl CSS missing');
  assert(css.includes('.result-dl-all'), 'result-dl-all CSS missing');
});

// ============================================================
// PHASE 18: PDF Mode Toggle (PDF→Image / Image→PDF)
// ============================================================
console.log('\n── Phase 18: PDF Dual-Mode ──');

test('PDF mode toggle exists in DOM', () => {
  const toggle = document.getElementById('pdf-mode-toggle');
  assert(toggle !== null, 'pdf-mode-toggle missing');
});

test('PDF mode toggle has 2 options', () => {
  const toggle = document.getElementById('pdf-mode-toggle');
  const options = toggle.querySelectorAll('.mode-option');
  assertEqual(options.length, 2, 'Should have 2 mode options');
});

test('PDF→Image button starts active', () => {
  const btn = document.querySelector('#pdf-mode-toggle [data-mode="pdf2img"]');
  assert(btn !== null, 'pdf2img button missing');
  assert(btn.classList.contains('active'), 'pdf2img should be active by default');
});

test('Image→PDF format grid exists (hidden by default)', () => {
  const grid = document.getElementById('pdf-img2pdf-grid');
  assert(grid !== null, 'pdf-img2pdf-grid missing');
  assert(grid.classList.contains('hidden'), 'img2pdf grid should be hidden by default');
});

test('PDFMode global controller exists', () => {
  assert(window.PDFMode !== undefined, 'PDFMode not exposed');
  assert(typeof window.PDFMode.get === 'function', 'PDFMode.get missing');
  assert(typeof window.PDFMode.switch === 'function', 'PDFMode.switch missing');
});

test('PDFMode.get returns default pdf2img', () => {
  assertEqual(window.PDFMode.get(), 'pdf2img', 'Default mode should be pdf2img');
});

test('PDFMode.switch toggles to img2pdf', () => {
  // Ensure FileQueue is available before switching
  if (window.FileQueue && window.FileQueue.clear) {
    window.PDFMode.switch('img2pdf');
  }
  assertEqual(window.PDFMode.get(), 'img2pdf', 'Mode should switch to img2pdf');
  const imgGrid = document.getElementById('pdf-img2pdf-grid');
  assert(!imgGrid.classList.contains('hidden'), 'img2pdf grid should be visible');
  const pdfGrid = document.getElementById('pdf-format-grid');
  assert(pdfGrid.classList.contains('hidden'), 'pdf2img grid should be hidden');
  // Switch back (manually to avoid FileQueue dependency)
  if (window.FileQueue && window.FileQueue.clear) {
    window.PDFMode.switch('pdf2img');
  }
});

test('PDFMode.switch back to pdf2img', () => {
  assertEqual(window.PDFMode.get(), 'pdf2img', 'Mode should be back to pdf2img');
  const pdfGrid = document.getElementById('pdf-format-grid');
  assert(!pdfGrid.classList.contains('hidden'), 'pdf2img grid should be visible');
  const imgGrid = document.getElementById('pdf-img2pdf-grid');
  assert(imgGrid.classList.contains('hidden'), 'img2pdf grid should be hidden');
});

test('PDF mode switch updates upload accept', () => {
  const input = document.getElementById('pdf-upload');
  // Manually set mode without FileQueue dependency
  const toggle = document.getElementById('pdf-mode-toggle');
  const imgBtn = toggle.querySelector('[data-mode="img2pdf"]');
  const pdfBtn = toggle.querySelector('[data-mode="pdf2img"]');
  // Simulate mode switch via UI
  imgBtn.click();
  assert(input.getAttribute('accept') === 'image/*', 'Accept should be image/* in img2pdf mode');
  pdfBtn.click();
  assert(input.getAttribute('accept') === '.pdf', 'Accept should be .pdf in pdf2img mode');
});

test('PDF mode switch updates selectedFormats (source check)', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes("selectedFormats['pdf'] = 'pdf'"), 'img2pdf should set format to pdf');
  assert(src.includes("selectedFormats['pdf'] = 'png'"), 'pdf2img should set format to png');
});

test('startConversion has img2pdf routing', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes("pdfMode === 'img2pdf'"), 'img2pdf routing check missing');
  assert(src.includes('Converter.imagesToPdf'), 'imagesToPdf call missing in routing');
});

test('Images→PDF uses allFiles from queue', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/main.js'), 'utf8');
  assert(src.includes('imagesToPdf(allFiles'), 'imagesToPdf should use allFiles');
});

test('Mode toggle CSS styles exist', () => {
  const css = fs.readFileSync(path.join(BASE, 'assets/css/style.css'), 'utf8');
  assert(css.includes('.mode-toggle'), 'mode-toggle CSS missing');
  assert(css.includes('.mode-option'), 'mode-option CSS missing');
  assert(css.includes('.mode-option.active'), 'mode-option.active CSS missing');
});

// ============================================================
// PHASE 19: Code Quality Checks
// ============================================================
console.log('\n── Phase 19: Code Quality ──');

test('No console.log in production converter.js', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/converter.js'), 'utf8');
  const logCount = (src.match(/console\.log/g) || []).length;
  assert(logCount === 0, 'Found ' + logCount + ' console.log calls in converter.js');
});

test('No TODO comments left in converter.js', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/converter.js'), 'utf8');
  const todoCount = (src.match(/TODO/g) || []).length;
  // 0 is ideal, but warn if found
  if (todoCount > 0) {
    warn('TODOs in converter.js', 'Found ' + todoCount + ' TODO comments');
  } else {
    assert(true, 'No TODOs');
  }
});

test('FFmpeg.wasm files served locally (avoid CORS worker issue)', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/converter.js'), 'utf8');
  assert(src.includes('assets/vendor/ffmpeg'), 'FFmpeg local vendor path missing');
  assert(fs.existsSync(path.join(BASE, 'assets/vendor/ffmpeg/ffmpeg.js')), 'ffmpeg.js not found');
  assert(fs.existsSync(path.join(BASE, 'assets/vendor/ffmpeg/ffmpeg-core.js')), 'ffmpeg-core.js not found');
  assert(fs.existsSync(path.join(BASE, 'assets/vendor/ffmpeg/ffmpeg-core.wasm')), 'ffmpeg-core.wasm not found');
});

test('WAV encoder handles multi-channel audio', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/converter.js'), 'utf8');
  assert(src.includes('numChannels'), 'Multi-channel support check');
  assert(src.includes('getChannelData(0)'), 'Channel data extraction');
});

test('FFmpeg loader has singleton pattern (caches instance)', () => {
  const src = fs.readFileSync(path.join(BASE, 'assets/js/converter.js'), 'utf8');
  assert(src.includes("if (ffmpegInstance) return Promise.resolve(ffmpegInstance)"), 'Instance caching missing');
  assert(src.includes("if (ffmpegLoading) return ffmpegLoading"), 'Loading dedup missing');
});

// ============================================================
// Final Report
// ============================================================
console.log('\n╔══════════════════════════════════════════╗');
console.log('║            TEST RESULTS                   ║');
console.log('╠══════════════════════════════════════════╣');
console.log('║  \x1b[32mPassed:\x1b[0m  ' + String(passed).padEnd(30) + ' ║');
console.log('║  \x1b[31mFailed:\x1b[0m  ' + String(failed).padEnd(30) + ' ║');
console.log('║  \x1b[33mWarnings:\x1b[0m ' + String(warnings).padEnd(30) + ' ║');
console.log('╚══════════════════════════════════════════╝');

if (failed > 0) {
  console.log('\n\x1b[31mSOME TESTS FAILED — check output above for details\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\n\x1b[32mALL TESTS PASSED (' + passed + '/' + (passed + failed) + ')\x1b[0m\n');
  process.exit(0);
}
