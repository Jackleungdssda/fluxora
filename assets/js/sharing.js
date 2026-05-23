/* ============================================
   Fluxora — Share-for-Free Logic
   ============================================ */

(function () {
  'use strict';

  var PREFIX = 'wtb_';
  var FREE_USES_KEY = PREFIX + 'free_uses';
  var SHARE_DATA_KEY = PREFIX + 'share_data';

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

  /** Claim one free HD conversion via sharing. Returns { success, message } */
  function claim() {
    var shareData = getItem(SHARE_DATA_KEY) || { count: 0, date: '', lastClaim: 0 };
    var freeUses = getItem(FREE_USES_KEY) || 0;
    var today = new Date().toISOString().slice(0, 10);
    var now = Date.now();

    if (shareData.date !== today) {
      shareData = { count: 0, date: today, lastClaim: 0 };
    }

    if (shareData.count >= 3) {
      return { success: false, message: 'Daily limit reached (3/3)' };
    }

    if (now - shareData.lastClaim < 10000) {
      var wait = Math.ceil((10000 - (now - shareData.lastClaim)) / 1000);
      return { success: false, message: 'Please wait ' + wait + 's before claiming again' };
    }

    shareData.count += 1;
    shareData.lastClaim = now;
    freeUses += 1;

    setItem(SHARE_DATA_KEY, shareData);
    setItem(FREE_USES_KEY, freeUses);

    return { success: true, message: 'You earned 1 free HD conversion! (' + freeUses + ' remaining)' };
  }

  /** Get remaining free uses */
  function getFreeUses() {
    return getItem(FREE_USES_KEY) || 0;
  }

  /** Consume one free use. Returns true if successful. */
  function useFreeUse() {
    var freeUses = getItem(FREE_USES_KEY) || 0;
    if (freeUses <= 0) return false;
    setItem(FREE_USES_KEY, freeUses - 1);
    return true;
  }

  /** Generate share text + URL for clipboard or Web Share API */
  function getShareContent() {
    return {
      title: 'Fluxora — Free Online File Converter',
      text: 'Try Fluxora — free online file conversion. Images, PDFs, audio, and video. All processed in your browser, nothing uploaded!',
      url: window.location.origin + window.location.pathname
    };
  }

  /** Trigger share via Web Share API or fallback to clipboard */
  function share() {
    var content = getShareContent();
    if (navigator.share) {
      return navigator.share({ title: content.title, text: content.text, url: content.url });
    } else {
      return navigator.clipboard.writeText(content.text + ' ' + content.url).then(function () {
        return { clipboard: true };
      });
    }
  }

  window.Sharing = {
    claim: claim,
    getFreeUses: getFreeUses,
    useFreeUse: useFreeUse,
    share: share,
    getShareContent: getShareContent
  };

})();
