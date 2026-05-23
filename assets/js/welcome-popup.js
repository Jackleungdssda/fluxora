/* ============================================
   Fluxora — Welcome Surprise Popup
   Shows after cookie consent for first-time users
   ============================================ */

(function () {
  'use strict';

  var WELCOME_KEY = 'wtb_welcome_shown';

  function hasSeen() {
    try { return localStorage.getItem(WELCOME_KEY) === '1'; } catch (e) { return true; }
  }

  function markSeen() {
    try { localStorage.setItem(WELCOME_KEY, '1'); } catch (e) {}
  }

  function show() {
    if (hasSeen()) return;
    var popup = document.getElementById('welcome-popup');
    if (!popup) return;
    popup.classList.add('show');
    markSeen();
  }

  function dismiss() {
    var popup = document.getElementById('welcome-popup');
    if (!popup) return;
    popup.classList.remove('show');
  }

  window.WelcomePopup = {
    show: show,
    dismiss: dismiss
  };

  // Listen for cookie consent — show welcome after cookie banner dismissed
  window.addEventListener('cookieConsent', function () {
    // Small delay so cookie banner animation finishes
    setTimeout(show, 600);
  });

  // Fallback: if cookie consent already given (returning user who accepted before),
  // still show on first visit (DOMContentLoaded)
  document.addEventListener('DOMContentLoaded', function () {
    // Only if cookie consent already exists and welcome not yet shown
    var hasCookieConsent = false;
    try {
      var d = JSON.parse(localStorage.getItem('wtb_cookie_consent'));
      hasCookieConsent = d && d.version;
    } catch (e) {}
    if (hasCookieConsent && !hasSeen()) {
      setTimeout(show, 300);
    }
  });

})();
