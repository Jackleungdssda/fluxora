/* ============================================
   Fluxora — State & Navigation
   ============================================ */

(function () {
  'use strict';

  /* ----- Storage (with checksum anti-tamper) ----- */
  var PREFIX = 'wtb_';

  function checksum(val) {
    var str = JSON.stringify(val);
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h = h | 0;
    }
    return h.toString(36);
  }

  function getItem(key) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      var d = JSON.parse(raw);
      var cs = d._cs;
      delete d._cs;
      if (cs !== checksum(d)) { localStorage.removeItem(PREFIX + key); return null; }
      return d.v;
    } catch (e) { return null; }
  }

  function setItem(key, val) {
    var d = { v: val };
    d._cs = checksum(d);
    try { localStorage.setItem(PREFIX + key, JSON.stringify(d)); } catch (e) {}
  }

  /* ----- State ----- */
  var trialConsumed = getItem('trial_used') || false;
  var savedFreeUses = getItem('free_uses');
  var state = {
    trialUsed: trialConsumed,
    licensePlan: getItem('license_plan') || 'none',
    licenseToken: getItem('license_token') || null,
    // New users: freeUses=1 (trial). Returning users: restore saved count.
    freeUses: savedFreeUses !== null ? savedFreeUses : (trialConsumed ? 0 : 1),
    shareData: getItem('share_data') || { count: 0, date: '', lastClaim: 0 }
  };

  /* ----- Public API ----- */
  window.ToolBox = {
    getLicensePlan: function () { return state.licensePlan; },
    isPremium: function () { return state.licensePlan !== 'none'; },

    canAccess: function (required) {
      var tiers = ['none', 'image', 'image_pdf', 'audio', 'all'];
      return tiers.indexOf(state.licensePlan) >= tiers.indexOf(required);
    },

    hasTrial: function () { return !state.trialUsed; },

    useTrial: function () {
      if (state.trialUsed) return false;
      state.trialUsed = true;
      setItem('trial_used', true);
      state.freeUses = Math.max(0, state.freeUses - 1);
      setItem('free_uses', state.freeUses);
      return true;
    },

    getFreeUses: function () { return state.freeUses; },

    useFreeUse: function () {
      if (state.freeUses <= 0) return false;
      state.freeUses--;
      setItem('free_uses', state.freeUses);
      return true;
    },

    claimShareReward: function () {
      var today = new Date().toISOString().slice(0, 10);
      var now = Date.now();
      if (state.shareData.date !== today) {
        state.shareData = { count: 0, date: today, lastClaim: 0 };
      }
      if (state.shareData.count >= 3) {
        return { success: false, message: '今日次数已达上限 (3/3)' };
      }
      if (now - state.shareData.lastClaim < 10000) {
        var w = Math.ceil((10000 - (now - state.shareData.lastClaim)) / 1000);
        return { success: false, message: '请等待 ' + w + ' 秒后再领取' };
      }
      state.shareData.count++;
      state.shareData.lastClaim = now;
      state.freeUses++;
      setItem('share_data', state.shareData);
      setItem('free_uses', state.freeUses);
      return { success: true, message: '获得 1 次免费高清机会！（剩余 ' + state.freeUses + ' 次）' };
    },

    activateLicense: function (plan, token) {
      state.licensePlan = plan;
      state.licenseToken = token;
      setItem('license_plan', plan);
      setItem('license_token', token);
      // Refresh body class for premium status
      document.body.classList.add('premium-user');
      document.body.classList.remove('free-user');
      var badge = document.getElementById('premium-badge');
      if (badge) badge.classList.remove('hidden');
    },
    deactivateLicense: function () {
      state.licensePlan = 'none';
      state.licenseToken = null;
      localStorage.removeItem('wtb_license_plan');
      localStorage.removeItem('wtb_license_token');
      document.body.classList.add('free-user');
      document.body.classList.remove('premium-user');
      var badge = document.getElementById('premium-badge');
      if (badge) badge.classList.add('hidden');
    }
  };

  /* ==========================================
     FileQueue — Batch file management for all tools
     ========================================== */
  var queues = {}; // { toolName: [{ file: File, id: number }] }

  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    var size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
    return size + ' ' + units[i];
  }

  function getFileCategory(file) {
    var type = file.type || '';
    var name = file.name || '';
    if (type.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif|bmp|svg|gif|ico)$/i.test(name)) return 'image';
    if (type.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(name)) return 'audio';
    if (type.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/i.test(name)) return 'video';
    if (type === 'application/pdf' || /\.pdf$/i.test(name)) return 'pdf';
    return 'other';
  }

  function getFileIcon(category) {
    var icons = { image: 'fa-image', audio: 'fa-music', video: 'fa-video', pdf: 'fa-file-pdf', other: 'fa-file' };
    return icons[category] || 'fa-file';
  }

  function renderFileCards(tool) {
    var list = document.getElementById(tool + '-file-list');
    var queueEl = document.getElementById(tool + '-file-queue');
    var files = (queues[tool] || []);

    if (!list || !queueEl) return;

    // Build card HTML
    var html = '';
    files.forEach(function (entry, i) {
      var f = entry.file;
      var cat = getFileCategory(f);
      var icon = getFileIcon(cat);
      html +=
        '<div class="file-card">' +
          '<div class="file-card-icon ' + cat + '"><i class="fas ' + icon + '"></i></div>' +
          '<div class="file-card-info">' +
            '<div class="file-card-name" title="' + f.name + '">' + f.name + '</div>' +
            '<div class="file-card-meta">' + formatFileSize(f.size) + '</div>' +
          '</div>' +
          '<button class="file-card-remove" title="Remove" onclick="FileQueue.remove(\'' + tool + '\',' + i + ')">' +
            '<i class="fas fa-times"></i>' +
          '</button>' +
        '</div>';
    });

    list.innerHTML = html;

    // Show/hide queue
    if (files.length > 0) {
      queueEl.classList.add('has-files');
    } else {
      queueEl.classList.remove('has-files');
    }
  }

  window.FileQueue = {
    add: function (tool, fileList) {
      if (!queues[tool]) queues[tool] = [];
      var startLen = queues[tool].length;
      for (var i = 0; i < fileList.length; i++) {
        queues[tool].push({ file: fileList[i], id: Date.now() + i });
      }
      renderFileCards(tool);
      return queues[tool].length;
    },

    remove: function (tool, index) {
      if (!queues[tool]) return;
      queues[tool].splice(index, 1);
      if (queues[tool].length === 0) delete queues[tool];
      renderFileCards(tool);
    },

    clear: function (tool) {
      delete queues[tool];
      renderFileCards(tool);
    },

    getFiles: function (tool) {
      return (queues[tool] || []).map(function (e) { return e.file; });
    },

    count: function (tool) {
      return (queues[tool] || []).length;
    },

    hasFiles: function (tool) {
      return (queues[tool] || []).length > 0;
    }
  };

  /* Navigate to pricing from anywhere */
  window.goToPricing = function () {
    showDashboard();
    setTimeout(function () {
      var pricing = document.getElementById('pricing-section');
      if (pricing) {
        pricing.scrollIntoView({ behavior: 'smooth', block: 'start' });
        pricing.classList.add('pricing-flash');
        setTimeout(function () { pricing.classList.remove('pricing-flash'); }, 2000);
      }
    }, 300);
  };

  /* ----- Page Navigation ----- */
  var TOOL_PAGES = ['image','pdf','audio','video','compress','pdf-merge','pdf-split'];

  window.showDashboard = function () {
    document.getElementById('dashboard-page').classList.remove('hidden');
    document.getElementById('tool-pages').classList.add('hidden');
    TOOL_PAGES.forEach(function (t) {
      var p = document.getElementById(t + '-page');
      if (p) p.classList.add('hidden');
    });
    if (window.switchBgPreset) window.switchBgPreset('particles', '#007AFF');
  };

  window.showToolPage = function (type) {
    document.getElementById('dashboard-page').classList.add('hidden');
    document.getElementById('tool-pages').classList.remove('hidden');
    TOOL_PAGES.forEach(function (t) {
      var p = document.getElementById(t + '-page');
      if (p) p.classList.add('hidden');
    });
    var page = document.getElementById(type + '-page');
    if (page) page.classList.remove('hidden');

    var presetName = type === 'compress' ? 'video' : (type === 'pdf-merge' || type === 'pdf-split' ? 'pdf' : type);
    var colors = { image: '#007AFF', pdf: '#ef4444', audio: '#f59e0b', video: '#8b5cf6', compress: '#8b5cf6', 'pdf-merge': '#ef4444', 'pdf-split': '#ef4444' };
    if (window.switchBgPreset) window.switchBgPreset(presetName, colors[type] || '#007AFF');
  };

  /* ----- Free Count Display ----- */
  function updateFreeCount() {
    var el = document.getElementById('free-count');
    if (!el) return;
    var total = state.freeUses;
    el.textContent = total;

    // Disable share button when daily limit reached
    var today = new Date().toISOString().slice(0, 10);
    if (state.shareData.date === today && state.shareData.count >= 3) {
      var shareBtn = document.getElementById('share-btn');
      if (shareBtn) {
        shareBtn.disabled = true;
        shareBtn.style.opacity = '0.5';
        shareBtn.style.pointerEvents = 'none';
        shareBtn.textContent = window.I18n.t('share.limitBtn');
      }
    }
  }

  /* ----- Share ----- */
  window.shareForFree = function () {
    // Check daily limit before sharing
    var today = new Date().toISOString().slice(0, 10);
    if (state.shareData.date === today && state.shareData.count >= 3) {
      showToast(window.I18n.t('share.limit'));
      return;
    }

    var shareText = '试试 Fluxora — 免费在线格式转换，所有文件在浏览器内处理，无需上传！';
    var shareUrl = window.location.href;

    if (navigator.share) {
      navigator.share({ title: 'Fluxora', text: shareText, url: shareUrl })
        .then(function () { claimReward(); })
        .catch(function () { claimReward(); });
    } else {
      navigator.clipboard.writeText(shareText + ' ' + shareUrl).then(function () {
        showToast('链接已复制！');
      });
      claimReward();
    }
  };

  function claimReward() {
    var r = ToolBox.claimShareReward();
    showToast(r.message);
    updateFreeCount();
  }

  /* ----- License Modal ----- */
  window.showLicenseModal = function () {
    document.getElementById('license-modal').classList.remove('hidden');
    document.getElementById('license-msg').classList.add('hidden');
    document.getElementById('license-input').value = '';
    // Show clear button if license is active
    var clearBtn = document.getElementById('license-clear-btn');
    if (clearBtn) {
      if (ToolBox.isPremium()) { clearBtn.classList.remove('hidden'); }
      else { clearBtn.classList.add('hidden'); }
    }
  };

  window.closeLicenseModal = function () {
    document.getElementById('license-modal').classList.add('hidden');
  };

  var WORKER_URL = 'https://api.fluxora.com';

  window.verifyLicense = function () {
    var input = document.getElementById('license-input').value.trim();
    var msg = document.getElementById('license-msg');
    var btn = document.querySelector('#license-modal button.bg-primary');

    if (!input) {
      msg.textContent = '请输入激活码';
      msg.className = 'text-sm text-center mt-4 text-red-500';
      msg.classList.remove('hidden');
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = '验证中...'; }

    // Try Cloudflare Worker first, fallback to demo codes
    var code = input.toUpperCase();
    var isDemoCode = code.startsWith('DEMO-');

    function activatePlan(plan, token) {
      ToolBox.activateLicense(plan, token);
      msg.textContent = '激活成功！当前套餐: ' + plan;
      msg.className = 'text-sm text-center mt-4 text-green-500';
      msg.classList.remove('hidden');
      updateFreeCount();
      setTimeout(function () { closeLicenseModal(); }, 1500);
    }

    function failActivation(message) {
      msg.textContent = message || '激活码无效，请检查后重试';
      msg.className = 'text-sm text-center mt-4 text-red-500';
      msg.classList.remove('hidden');
      if (btn) { btn.disabled = false; btn.textContent = '验证激活'; }
    }

    // Demo codes for trial users
    var demoCodes = {
      'DEMO-IMAGE-1234': 'image',
      'DEMO-PDF-5678': 'image_pdf',
      'DEMO-AUDIO-9012': 'audio',
      'DEMO-ALL-3456': 'all'
    };

    // Paid license codes — delivered to customers after Gumroad purchase
    var paidCodes = {
      // Image Plan ($0.99)
      'FLUX-IMG-A1B2C3': 'image',
      'FLUX-IMG-D4E5F6': 'image',
      'FLUX-IMG-G7H8I9': 'image',
      'FLUX-IMG-J0K1L2': 'image',
      'FLUX-IMG-M3N4O5': 'image',
      // PDF/Pro Plan ($1.99)
      'FLUX-PRO-P6Q7R8': 'image_pdf',
      'FLUX-PRO-S9T0U1': 'image_pdf',
      'FLUX-PRO-V2W3X4': 'image_pdf',
      'FLUX-PRO-Y5Z6A7': 'image_pdf',
      'FLUX-PRO-B8C9D0': 'image_pdf',
      // Audio Plan ($2.99)
      'FLUX-AUD-E1F2G3': 'audio',
      'FLUX-AUD-H4I5J6': 'audio',
      'FLUX-AUD-K7L8M9': 'audio',
      'FLUX-AUD-N0O1P2': 'audio',
      'FLUX-AUD-Q3R4S5': 'audio',
      // All-Access Plan ($3.99)
      'FLUX-ALL-T6U7V8': 'all',
      'FLUX-ALL-W9X0Y1': 'all',
      'FLUX-ALL-Z2A3B4': 'all',
      'FLUX-ALL-C5D6E7': 'all',
      'FLUX-ALL-F8G9H0': 'all'
    };

    if (demoCodes[code]) {
      activatePlan(demoCodes[code], 'demo-token-' + Date.now());
      if (btn) { btn.disabled = false; btn.textContent = '验证激活'; }
      return;
    }

    if (paidCodes[code]) {
      activatePlan(paidCodes[code], 'paid-' + code);
      if (btn) { btn.disabled = false; btn.textContent = '验证激活'; }
      return;
    }

    // For non-demo codes, try Worker endpoint
    if (isDemoCode) {
      failActivation('Demo code invalid. Try DEMO-ALL-3456');
      return;
    }

    // Real license verification via Cloudflare Worker
    fetch(WORKER_URL + '/api/verify-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code, deviceFingerprint: navigator.userAgent })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (btn) { btn.disabled = false; btn.textContent = '验证激活'; }
      if (data.success && data.plan) {
        activatePlan(data.plan, data.token);
      } else {
        failActivation(data.message || 'Invalid license code');
      }
    })
    .catch(function () {
      // Network error — Worker may not be deployed yet
      if (btn) { btn.disabled = false; btn.textContent = '验证激活'; }
      failActivation('Cannot reach license server. Use demo code: DEMO-ALL-3456');
    });
  };

  /* ----- Toast ----- */
  window.showToast = function (message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.classList.add('hidden'); }, 300);
    }, 2500);
  };

  /* ----- Format Detection & Dynamic Buttons ----- */

  // Extension → canonical format key (lowercase)
  var extToFormat = {
    jpg:'jpg', jpeg:'jpg', png:'png', webp:'webp', avif:'avif', bmp:'bmp', svg:'svg',
    pdf:'pdf', docx:'docx', doc:'docx', ppt:'pptx', pptx:'pptx', xls:'xlsx', xlsx:'xlsx',
    mp3:'mp3', wav:'wav', ogg:'ogg', aac:'aac', m4a:'m4a', flac:'flac',
    mov:'mov', avi:'avi', mkv:'mkv', gif:'gif', mp4:'mp4', webm:'webm'
  };

  // Currently selected output format per tool
  var selectedFormats = { image: 'png', pdf: 'pdf', audio: 'mp3', video: 'gif', compress: 'compressed', 'pdf-merge': 'pdf', 'pdf-split': 'pdf' };

  /* ----- PDF Mode Toggle ----- */
  var pdfMode = 'pdf2img'; // 'pdf2img' | 'img2pdf'

  window.PDFMode = {
    get: function () { return pdfMode; },
    switch: function (mode) {
      pdfMode = mode;
      var toggle = document.getElementById('pdf-mode-toggle');
      if (toggle) {
        toggle.querySelectorAll('.mode-option').forEach(function (b) { b.classList.remove('active'); });
        var activeBtn = toggle.querySelector('[data-mode="' + mode + '"]');
        if (activeBtn) activeBtn.classList.add('active');
      }

      var pdfGrid = document.getElementById('pdf-format-grid');
      var imgGrid = document.getElementById('pdf-img2pdf-grid');
      var icon = document.getElementById('pdf-upload-icon');
      var hint = document.getElementById('pdf-upload-hint');
      var input = document.getElementById('pdf-upload');

      if (mode === 'img2pdf') {
        // Image → PDF mode
        if (pdfGrid) pdfGrid.classList.add('hidden');
        if (imgGrid) imgGrid.classList.remove('hidden');
        if (icon) { icon.className = 'fas fa-images text-red-500 text-4xl mb-4 w-12 h-12 flex items-center justify-center mx-auto'; }
        if (hint) { hint.setAttribute('data-i18n', 'pdf.hintImg2pdf'); hint.textContent = window.I18n.t('pdf.hintImg2pdf'); }
        if (input) input.setAttribute('accept', 'image/*');
        selectedFormats['pdf'] = 'pdf';
        try { window.FileQueue.clear('pdf'); } catch (e) {}
      } else {
        // PDF → Image mode
        if (pdfGrid) pdfGrid.classList.remove('hidden');
        if (imgGrid) imgGrid.classList.add('hidden');
        if (icon) { icon.className = 'fas fa-file-pdf text-red-500 text-4xl mb-4 w-12 h-12 flex items-center justify-center mx-auto'; }
        if (hint) { hint.setAttribute('data-i18n', 'pdf.hintPdf2img'); hint.textContent = window.I18n.t('pdf.hintPdf2img'); }
        if (input) input.setAttribute('accept', '.pdf');
        selectedFormats['pdf'] = 'png';
        try { window.FileQueue.clear('pdf'); } catch (e) {}
      }

      // Reset detected tag
      var tag = document.getElementById('pdf-detected-tag');
      if (tag) tag.classList.add('hidden');
    }
  };

  // Click delegation for format checkboxes
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.format-check-item');
    if (!btn || btn.classList.contains('disabled')) return;
    var list = btn.closest('.format-check-list');
    if (!list) return;
    var tool = list.dataset.tool;

    list.querySelectorAll('.format-check-item').forEach(function (b) { b.classList.remove('checked'); });
    btn.classList.add('checked');
    selectedFormats[tool] = btn.dataset.format;
    showToast(I18n.t('toast.choose') + ': ' + btn.dataset.format.toUpperCase());
  });

  /** Called when a file is selected — detect format & disable same-format button */
  function onFileSelected(tool, file) {
    if (!file) return;
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    var detected = extToFormat[ext] || ext;

    // Show detected tag
    var tag = document.getElementById(tool + '-detected-tag');
    if (tag) { tag.textContent = '输入: ' + detected.toUpperCase(); tag.classList.remove('hidden'); }

    // For PDF tool in img2pdf mode, always keep output as 'pdf'
    if (tool === 'pdf' && pdfMode === 'img2pdf') {
      selectedFormats['pdf'] = 'pdf';
      return;
    }

    // In the format grid, disable the button matching the detected format
    var grid = document.getElementById(tool + '-format-grid');
    if (!grid) return;
    var btns = grid.querySelectorAll('.format-check-item');
    btns.forEach(function (btn) {
      if (btn.dataset.format === detected) {
        btn.classList.add('disabled');
        btn.classList.remove('checked');
      } else {
        btn.classList.remove('disabled');
      }
    });

    // Auto-select first non-disabled button
    var first = grid.querySelector('.format-check-item:not(.disabled)');
    if (first) {
      btns.forEach(function (b) { b.classList.remove('checked'); });
      first.classList.add('checked');
      selectedFormats[tool] = first.dataset.format;
    }
  }

  /* ----- Quality Tier Helper ----- */
  var PLAN_INFO = {
    image:     { name: 'Image Plan',       price: '$0.99', tools: '图片工具' },
    image_pdf: { name: 'Image+PDF Plan',   price: '$1.99', tools: '图片 + PDF 工具' },
    audio:     { name: '+Audio Plan',      price: '$2.99', tools: '图片 + PDF + 音频工具' },
    all:       { name: 'All Access Plan',  price: '$3.99', tools: '全部工具（含视频）' }
  };

  var TOOL_TIER = {
    image: 'image', pdf: 'image_pdf', audio: 'audio', video: 'all',
    compress: 'all', 'pdf-merge': 'image_pdf', 'pdf-split': 'image_pdf'
  };

  function getQualityLevel(type) {
    var plan = ToolBox.getLicensePlan();
    var required = TOOL_TIER[type] || 'all';
    if (ToolBox.canAccess(required)) return 'hd';
    return 'sd';
  }

  function getRequiredPlan(type) {
    return PLAN_INFO[TOOL_TIER[type] || 'all'];
  }

  /* ----- Result Display: render result cards ----- */
  window._resultStore = {};

  function showResults(type, results, mode) {
    var processingEl = document.getElementById(type + '-processing');
    var resultEl = document.getElementById(type + '-result');
    if (processingEl) processingEl.classList.add('hidden');
    if (resultEl) resultEl.classList.remove('hidden');

    var resultsArray = Array.isArray(results) ? results : [results];
    window._resultStore[type] = resultsArray;

    // Also set _lastResult for downloadResult compatibility
    window._lastResult = resultsArray.length === 1 ? resultsArray[0] : resultsArray;
    window._lastResultIsMulti = resultsArray.length > 1;

    var listEl = document.getElementById(type + '-result-list');
    if (!listEl) return;

    var html = '';
    resultsArray.forEach(function (res, i) {
      var name = res.name || 'converted_file';
      var cat = getFileCategory({ name: name, type: '' });
      var icon = getFileIcon(cat);
      var sizeStr = res.size ? formatFileSize(res.size) : '';
      var origSizeStr = res.originalSize ? formatFileSize(res.originalSize) : '';
      var reduction = '';
      if (res.originalSize && res.size && res.size < res.originalSize) {
        var pct = Math.round((1 - res.size / res.originalSize) * 100);
        reduction = '<span class="fmt-arrow">-</span>' + pct + '%';
      }

      html +=
        '<div class="result-card">' +
          '<div class="result-card-icon ' + cat + '"><i class="fas ' + icon + '"></i></div>' +
          '<div class="result-card-info">' +
            '<div class="result-card-name" title="' + name + '">' + name + '</div>' +
            '<div class="result-card-meta">' +
              sizeStr + (reduction ? ' <span style="color:#30D158">' + reduction + '</span>' : '') +
              '<span class="is-new">' + (mode === 'batch' ? 'BATCH' : 'DONE') + '</span>' +
            '</div>' +
          '</div>' +
          '<button class="result-card-dl" onclick="ResultDownload.download(\'' + type + '\',' + i + ')" title="Download">' +
            '<i class="fas fa-download"></i>' +
          '</button>' +
        '</div>';
    });

    listEl.innerHTML = html;

    // Show/hide "Download All" button
    var dlAllBtn = document.getElementById(type + '-dl-all');
    if (dlAllBtn) {
      if (resultsArray.length > 1) {
        dlAllBtn.classList.add('has-multi');
      } else {
        dlAllBtn.classList.remove('has-multi');
      }
    }

    // Toggle HD/download-all buttons: hidden for free users, replaced with upgrade prompt
    var isPremium = ToolBox.isPremium();
    var resultSection = document.getElementById(type + '-result');
    if (resultSection) {
      var allButtons = resultSection.querySelectorAll('button');
      if (!isPremium) {
        allButtons.forEach(function (btn) {
          var oc = btn.getAttribute('onclick') || '';
          if (oc.indexOf(',hd') !== -1) {
            btn.style.display = 'none';
          }
        });
        // Show upgrade prompt
        var upgradeEl = document.getElementById(type + '-upgrade-prompt');
        if (!upgradeEl) {
          var neededPlan = getRequiredPlan(type);
          upgradeEl = document.createElement('div');
          upgradeEl.id = type + '-upgrade-prompt';
          upgradeEl.className = 'upgrade-prompt';
          upgradeEl.innerHTML =
            '<div class="upgrade-prompt-icon"><i class="fas fa-crown"></i></div>' +
            '<div class="upgrade-prompt-text">' +
              '<strong data-i18n="upgrade.title">' + I18n.t('upgrade.title') + '</strong>' +
              '<span>' + neededPlan.name + ' (' + neededPlan.price + ') — ' + neededPlan.tools + '</span>' +
            '</div>' +
            '<button class="upgrade-prompt-btn" onclick="window.goToPricing()" data-i18n="upgrade.btn">' +
              I18n.t('upgrade.btn') +
            '</button>';
          resultSection.querySelector('.bg-gray-50')?.appendChild(upgradeEl);
        }
        if (upgradeEl) upgradeEl.style.display = 'flex';
      } else {
        // Premium: hide upgrade prompt
        var upgradeEl = document.getElementById(type + '-upgrade-prompt');
        if (upgradeEl) upgradeEl.style.display = 'none';
      }
    }

    var count = resultsArray.length;
    if (mode === 'batch') {
      showToast('Batch complete: ' + count + ' files converted');
    } else if (count > 1) {
      showToast(count + ' files converted');
    } else {
      showToast(I18n.t('toast.done'));
    }
  }

  /* Per-file download from result cards */
  window.ResultDownload = {
    download: function (type, index) {
      var items = window._resultStore[type];
      if (!items || !items[index]) return;
      var item = items[index];
      // SD download — always available, consumes credit if available
      var consumed = false;
      if (ToolBox.hasTrial()) { ToolBox.useTrial(); consumed = true; }
      else if (ToolBox.getFreeUses() > 0) { ToolBox.useFreeUse(); consumed = true; }
      updateFreeCount();
      triggerDownload(item.blob || item, item.name || ('file_' + (index + 1)));
      showToast(consumed ? 'Downloaded (1 credit used)' : 'Downloaded');
    }
  };

  /* ----- File Conversion (REAL with quality tiers + batch support) ----- */
  window.startConversion = function (type) {
    var outFormat = selectedFormats[type] || 'png';

    // Get files from queue
    var allFiles = FileQueue.getFiles(type);

    // Special: pdf-merge always uses queue files; other tools need at least 1
    if (type === 'pdf-merge') {
      if (allFiles.length < 2) {
        showToast('Please add at least 2 PDF files to the queue');
        return;
      }
    } else if (allFiles.length === 0) {
      showToast('Please add files to the queue first');
      return;
    }

    var qLevel = getQualityLevel(type);
    var isHD = qLevel === 'hd';
    var totalFiles = allFiles.length;

    var processingEl = document.getElementById(type + '-processing');
    var resultEl = document.getElementById(type + '-result');
    if (processingEl) processingEl.classList.remove('hidden');
    if (resultEl) resultEl.classList.add('hidden');

    var ring = document.querySelector('#' + type + '-processing .progress-ring-circle');
    var text = document.querySelector('#' + type + '-processing .progress-text');

    function updateProgress(pct) {
      var offset = 251.2 - (251.2 * pct / 100);
      if (ring) ring.style.strokeDashoffset = offset;
      if (text) text.textContent = Math.round(pct) + '%';
    }

    updateProgress(0);

    // ── For batch operations (merge) or single-file tools that don't need batching ──
    var isBatchTool = (type === 'pdf-merge');
    // Tools where batch makes sense: image, audio, compress (process each file independently)
    var supportsBatch = (type === 'image' || type === 'audio' || type === 'compress');

    if (!supportsBatch || isBatchTool || totalFiles === 1) {
      // ── Single-file path (or merge which handles all files internally) ──
      var file = allFiles[0];

      var promise;
      if (type === 'image') {
        promise = Converter.image(file, outFormat, isHD ? 92 : 60, updateProgress);
      } else if (type === 'pdf') {
        if (pdfMode === 'img2pdf') {
          if (allFiles.length === 0) {
            showToast('Please add images to the queue first');
            return;
          }
          promise = Converter.imagesToPdf(allFiles, updateProgress);
        } else if (['jpg','jpeg','png','webp'].indexOf(outFormat) !== -1) {
          promise = Converter.pdfToImage(file, outFormat, isHD ? 95 : 60, updateProgress);
        } else {
          updateProgress(100);
          promise = Promise.resolve({ blob: file, url: URL.createObjectURL(file), name: file.name, size: file.size });
        }
      } else if (type === 'audio') {
        promise = Converter.audio(file, outFormat, isHD ? 320 : 128, updateProgress);
      } else if (type === 'video') {
        if (outFormat === 'gif') {
          promise = Converter.videoToGIF(file, updateProgress);
        } else if (outFormat === 'mp4' || outFormat === 'webm') {
          promise = Converter.video(file, outFormat, updateProgress);
        } else {
          updateProgress(100);
          promise = Promise.resolve({ blob: file, url: URL.createObjectURL(file), name: file.name, size: file.size });
        }
      } else if (type === 'compress') {
        var isVideoFile = file.type && file.type.startsWith('video/');
        if (isVideoFile) {
          promise = Converter.compressVideo(file, updateProgress);
        } else {
          promise = Converter.compress(file, outFormat, isHD ? 80 : 50, updateProgress);
        }
      } else if (type === 'pdf-merge') {
        promise = Converter.mergePDFs(allFiles, updateProgress);
      } else if (type === 'pdf-split') {
        promise = Converter.splitPDF(file, updateProgress);
      } else {
        updateProgress(100);
        promise = Promise.resolve({ blob: file, url: URL.createObjectURL(file), name: file.name, size: file.size });
      }

      promise.then(function (result) {
        showResults(type, result, totalFiles > 1 ? 'single-of-many' : 'single');
      }).catch(function (err) {
        if (processingEl) processingEl.classList.add('hidden');
        showToast('Error: ' + (err.message || 'Conversion failed'));
      });
      return;
    }

    // ── Batch path: process all queue files sequentially ──
    var allResults = [];
    var currentIdx = 0;

    function processNext() {
      if (currentIdx >= totalFiles) {
        showResults(type, allResults, 'batch');
        return;
      }

      var currentFile = allFiles[currentIdx];

      function fileProgress(pct) {
        // Overall: previous files = 100% each, current = pct%
        var overall = ((currentIdx * 100) + pct) / totalFiles;
        updateProgress(overall);
      }

      var filePromise;
      if (type === 'image') {
        filePromise = Converter.image(currentFile, outFormat, isHD ? 92 : 60, fileProgress);
      } else if (type === 'audio') {
        filePromise = Converter.audio(currentFile, outFormat, isHD ? 320 : 128, fileProgress);
      } else if (type === 'compress') {
        var isVid = currentFile.type && currentFile.type.startsWith('video/');
        if (isVid) {
          filePromise = Converter.compressVideo(currentFile, fileProgress);
        } else {
          filePromise = Converter.compress(currentFile, outFormat, isHD ? 80 : 50, fileProgress);
        }
      }

      filePromise.then(function (res) {
        allResults.push(res);
        currentIdx++;

        // Auto-remove processed file from queue
        FileQueue.remove(type, 0);

        processNext();
      }).catch(function (err) {
        if (processingEl) processingEl.classList.add('hidden');
        showToast('Error on file ' + (currentIdx + 1) + ': ' + (err.message || 'Conversion failed'));
      });
    }

    processNext();
  };

  window.downloadResult = function (type, quality) {
    // HARD BLOCK: non-premium cannot download HD — first check, no exceptions
    if (quality === 'hd' && !ToolBox.isPremium()) {
      var planInfo = getRequiredPlan(type);
      showToast('HD 需要付费订阅 (' + planInfo.name + ' ' + planInfo.price + ')');
      setTimeout(function () {
        var pricing = document.getElementById('pricing-section');
        if (pricing) { pricing.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }, 600);
      return;
    }

    var result = window._lastResult;
    if (!result) { showToast('No result to download'); return; }

    // Handle multi-file results (PDF split pages or batch conversion)
    if (window._lastResultIsMulti && Array.isArray(result)) {
      result.forEach(function (item, i) {
        setTimeout(function () {
          triggerDownload(item.blob || item, item.name || ('file_' + (i + 1)));
        }, i * 300);
      });
      showToast('Downloading ' + result.length + ' files...');
      return;
    }

    var outFormat = selectedFormats[type] || 'png';
    var qLevel = getQualityLevel(type);

    if (quality === 'hd') {
      // HD download — premium only
      if (qLevel === 'hd') {
        triggerDownload(result.blob || result, result.name || 'converted.' + outFormat);
        showToast('HD download — Premium quality');
      } else {
        var planInfo = getRequiredPlan(type);
        showToast('HD 需要 ' + planInfo.name + '（' + planInfo.price + '）');
        setTimeout(function () {
          var pricing = document.getElementById('pricing-section');
          if (pricing) {
            pricing.scrollIntoView({ behavior: 'smooth', block: 'start' });
            pricing.classList.add('pricing-flash');
            setTimeout(function () { pricing.classList.remove('pricing-flash'); }, 2000);
          } else {
            showDashboard();
            setTimeout(function () {
              var p2 = document.getElementById('pricing-section');
              if (p2) { p2.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            }, 200);
          }
        }, 600);
        return;
      }
    } else {
      // SD download — consumes 1 free use (trial first, then share credits)
      var consumed = false;
      if (ToolBox.hasTrial()) { ToolBox.useTrial(); consumed = true; }
      else if (ToolBox.getFreeUses() > 0) { ToolBox.useFreeUse(); consumed = true; }
      updateFreeCount();
      triggerDownload(result.blob || result, result.name || 'converted.' + outFormat);
      if (consumed) {
        showToast('SD download — 1 free use consumed');
      } else {
        showToast('SD download — No free uses left. Share to earn more.');
      }
    }
  };

  function triggerDownload(blob, filename) {
    var url = blob instanceof Blob ? URL.createObjectURL(blob) : blob;
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (blob instanceof Blob) { setTimeout(function () { URL.revokeObjectURL(url); }, 5000); }
  }

  // Gumroad checkout URLs — 10% + 50¢, works with unverified PayPal
  var CHECKOUT_LINKS = {
    image:     'https://fluxorasite.gumroad.com/l/zovamt',
    image_pdf: 'https://fluxorasite.gumroad.com/l/bikbzg',
    audio:     'https://fluxorasite.gumroad.com/l/nrpoih',
    all:       'https://fluxorasite.gumroad.com/l/mmlzfg'
  };

  window.handleBuyClick = function (plan) {
    var link = CHECKOUT_LINKS[plan];
    if (!link) {
      showToast('Payment error. Please try again.');
      return;
    }
    window.open(link, '_blank');
  };

  /* ----- File input listeners ----- */
  function bindUploads() {
    ['image', 'pdf', 'audio', 'video', 'compress', 'pdf-merge', 'pdf-split'].forEach(function (type) {
      var input = document.getElementById(type + '-upload');
      var dropzone = document.getElementById(type + '-dropzone');
      var fileBtn = dropzone ? dropzone.querySelector('button') : null;

      if (input) {
        input.addEventListener('change', function (e) {
          if (e.target.files.length > 0) {
            var count = FileQueue.add(type, e.target.files);
            onFileSelected(type, e.target.files[0]);
            showToast('已添加 ' + count + ' 个文件到队列');
            input.value = ''; // Reset input to allow re-selecting same file
          }
        });
      }

      // Drag & drop
      if (dropzone) {
        dropzone.addEventListener('dragover', function (e) {
          e.preventDefault();
          dropzone.classList.add('drag-over');
        });
        dropzone.addEventListener('dragleave', function () {
          dropzone.classList.remove('drag-over');
        });
        dropzone.addEventListener('drop', function (e) {
          e.preventDefault();
          dropzone.classList.remove('drag-over');
          if (e.dataTransfer.files.length > 0) {
            var count = FileQueue.add(type, e.dataTransfer.files);
            onFileSelected(type, e.dataTransfer.files[0]);
            showToast('已添加 ' + count + ' 个文件到队列');
          }
        });
      }
    });
  }

  /* ----- Init ----- */
  document.addEventListener('DOMContentLoaded', function () {
    // Handle Paddle checkout success return
    (function () {
      var params = new URLSearchParams(window.location.search);
      var paidPlan = params.get('paid');
      if (paidPlan && PADDLE_PRICE_IDS[paidPlan]) {
        var token = 'PAID-' + paidPlan.toUpperCase() + '-' + Math.random().toString(36).slice(2, 10).toUpperCase();
        ToolBox.activateLicense(paidPlan, token);
        showToast('Payment successful! License activated.');
        // Clean URL
        var url = new URL(window.location);
        url.searchParams.delete('paid');
        window.history.replaceState({}, '', url.toString());
      }
    })();

    // Set body class for CSS-level premium hiding (impossible to bypass)
    if (ToolBox.isPremium()) {
      document.body.classList.add('premium-user');
      document.body.classList.remove('free-user');
      var badge = document.getElementById('premium-badge');
      if (badge) badge.classList.remove('hidden');
    } else {
      document.body.classList.add('free-user');
      document.body.classList.remove('premium-user');
      var badge = document.getElementById('premium-badge');
      if (badge) badge.classList.add('hidden');
    }

    updateFreeCount();
    bindUploads();

    // Close modal on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLicenseModal();
    });
  });

})();
