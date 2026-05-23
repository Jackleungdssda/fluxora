/* ============================================
   Fluxora — License Activation & Verification
   ============================================ */

(function () {
  'use strict';

  var PREFIX = 'wtb_';
  var LICENSE_KEY = PREFIX + 'license_plan';
  var TOKEN_KEY = PREFIX + 'license_token';

  function checksum(val) {
    var str = JSON.stringify(val);
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h = h | 0; }
    return h.toString(36);
  }

  function getItem(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var d = JSON.parse(raw);
      var cs = d._cs; delete d._cs;
      if (cs !== checksum(d)) { localStorage.removeItem(key); return null; }
      return d.v;
    } catch (e) { return null; }
  }

  function setItem(key, val) {
    var d = { v: val }; d._cs = checksum(d);
    try { localStorage.setItem(key, JSON.stringify(d)); } catch (e) {}
  }

  // Demo activation codes for testing (replace with Worker endpoint)
  var DEMO_CODES = {
    'DEMO-IMAGE-1234': 'image',
    'DEMO-PDF-5678': 'image_pdf',
    'DEMO-AUDIO-9012': 'audio',
    'DEMO-ALL-3456': 'all'
  };

  /** Verify a license code against demo codes or Worker endpoint */
  function verifyCode(code) {
    return new Promise(function (resolve) {
      code = (code || '').trim().toUpperCase();

      // Try demo codes first
      if (DEMO_CODES[code]) {
        resolve({ success: true, plan: DEMO_CODES[code], token: 'demo-' + Date.now() });
        return;
      }

      // TODO: Replace with fetch to Cloudflare Worker
      // fetch('/api/verify-license', { method: 'POST', body: JSON.stringify({ code: code }) })
      //   .then(r => r.json())
      //   .then(resolve)
      //   .catch(() => resolve({ success: false, message: 'Network error' }));

      resolve({ success: false, message: 'Invalid license code' });
    });
  }

  /** Activate a license plan and store token */
  function activate(plan, token) {
    setItem(LICENSE_KEY, plan);
    if (token) setItem(TOKEN_KEY, token);
    return plan;
  }

  /** Get current license plan */
  function getPlan() {
    return getItem(LICENSE_KEY) || 'none';
  }

  /** Check if user has a paid plan */
  function isPremium() {
    return getPlan() !== 'none';
  }

  /** Check if user can access a specific tier */
  function canAccess(required) {
    var tiers = ['none', 'image', 'image_pdf', 'audio', 'all'];
    return tiers.indexOf(getPlan()) >= tiers.indexOf(required);
  }

  window.License = {
    verifyCode: verifyCode,
    activate: activate,
    getPlan: getPlan,
    isPremium: isPremium,
    canAccess: canAccess
  };

})();
