/* ============================================
   Fluxora — Cookie Consent Banner v2
   iPhone-style slide animation (JS-driven)
   ============================================ */

(function () {
  'use strict';

  var CONSENT_KEY = 'wtb_cookie_consent';
  var CONSENT_VERSION = 2; // bumped to re-show for testing

  function hasConsent() {
    try {
      var data = JSON.parse(localStorage.getItem(CONSENT_KEY));
      return data && data.version === CONSENT_VERSION;
    } catch (e) { return false; }
  }

  function getConsentLevel() {
    try {
      var data = JSON.parse(localStorage.getItem(CONSENT_KEY));
      return data ? data.level : null;
    } catch (e) { return null; }
  }

  function saveConsent(level) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      level: level, timestamp: Date.now(), version: CONSENT_VERSION
    }));
    window.__cookieConsent = level;
  }

  /* ---- Build banner DOM ---- */
  function buildBanner() {
    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML =
      '<div class="cookie-banner-content">' +
        '<div class="cookie-banner-text">' +
          '<p class="cookie-banner-title">Cookie Preferences</p>' +
          '<p class="cookie-banner-desc">We use cookies for essential functionality, analytics, and personalized advertising. By clicking "Accept All", you consent to all cookies. You may reject non-essential cookies or manage preferences in our <a href="pages/cookie-policy.html">Cookie Policy</a>.</p>' +
        '</div>' +
        '<div class="cookie-banner-actions">' +
          '<button class="cookie-btn cookie-btn--reject" id="cookie-reject">Reject Non-Essential</button>' +
          '<button class="cookie-btn cookie-btn--accept" id="cookie-accept">Accept All</button>' +
        '</div>' +
      '</div>';
    return banner;
  }

  /* ---- JS-driven slide-in ---- */
  function animateIn(banner) {
    var startY = 120;
    var duration = 550;
    var startTime = null;

    banner.style.opacity = '0';
    banner.style.transform = 'translateX(-50%) translateY(' + startY + 'px)';
    banner.style.display = 'block';

    void banner.offsetWidth;

    function step(ts) {
      if (!startTime) startTime = ts;
      var elapsed = ts - startTime;
      var progress = Math.min(elapsed / duration, 1);

      // iOS ease-out curve: cubic-bezier(0.22, 0.61, 0.36, 1)
      var t = easeOutiOS(progress);
      banner.style.opacity = t;
      banner.style.transform = 'translateX(-50%) translateY(' + (startY * (1 - t)) + 'px)';

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        banner.style.opacity = '1';
        banner.style.transform = 'translateX(-50%) translateY(0)';
      }
    }

    requestAnimationFrame(step);
  }

  /* ---- JS-driven slide-out ---- */
  function animateOut(banner, callback) {
    var endY = 200;
    var duration = 480;
    var startTime = null;
    var startOpacity = 1;

    function step(ts) {
      if (!startTime) startTime = ts;
      var elapsed = ts - startTime;
      var progress = Math.min(elapsed / duration, 1);

      // iOS ease-in curve: cubic-bezier(0.55, 0, 1, 0.45)
      var t = easeIniOS(progress);
      banner.style.opacity = startOpacity * (1 - t);
      banner.style.transform = 'translateX(-50%) translateY(' + (endY * t) + 'px) scale(' + (1 - 0.08 * t) + ')';

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        if (banner.parentNode) banner.parentNode.removeChild(banner);
        if (callback) callback();
      }
    }

    requestAnimationFrame(step);
  }

  function easeOutiOS(t) {
    return 1 - Math.pow(1 - t, 3.5);
  }

  function easeIniOS(t) {
    return t * t * t;
  }

  /* ---- Show banner ---- */
  function showBanner() {
    if (hasConsent()) return;

    var banner = buildBanner();
    document.body.appendChild(banner);

    // Wait a beat so DOM settles, then animate in
    setTimeout(function () { animateIn(banner); }, 150);

    // Click handlers
    banner.querySelector('#cookie-accept').addEventListener('click', function () {
      saveConsent('all');
      applyConsent('all');
      animateOut(banner);
    });

    banner.querySelector('#cookie-reject').addEventListener('click', function () {
      saveConsent('essential');
      applyConsent('essential');
      animateOut(banner);
    });
  }

  /* ---- Consent application ---- */
  function applyConsent(level) {
    window.__cookieConsent = level;
    window.dispatchEvent(new CustomEvent('cookieConsent', { detail: { level: level } }));
    if (level !== 'all') {
      document.cookie.split(';').forEach(function (c) {
        var name = c.split('=')[0].trim();
        if (name.indexOf('_ga') === 0 || name.indexOf('_gid') === 0 || name.indexOf('_gat') === 0 || name.indexOf('__g') === 0 || name === 'DSID' || name === 'IDE') {
          document.cookie = name + '=;expires=' + new Date().toUTCString() + ';path=/';
        }
      });
    }
  }

  /* ---- Init ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      showBanner();
      if (hasConsent()) applyConsent(getConsentLevel());
    });
  } else {
    showBanner();
    if (hasConsent()) applyConsent(getConsentLevel());
  }

  window.CookieConsent = { hasConsent: hasConsent, getConsentLevel: getConsentLevel, showBanner: showBanner };

})();
