/* ============================================
   Fluxora — Output Quality Control
   ============================================ */

(function () {
  'use strict';

  /**
   * Quality presets for free (SD) vs premium (HD) output.
   * All processing is done in-browser; these settings
   * control the output parameters based on user license.
   */

  var QUALITY = {
    // Free / trial mode — standard definition
    sd: {
      image: {
        maxResolution: 1280,
        jpegQuality: 0.6,
        webpQuality: 0.55
      },
      pdf: {
        imageQuality: 0.5,
        maxPages: 3
      },
      audio: {
        bitrate: 128, // kbps
        sampleRate: 44100
      },
      video: {
        maxResolution: 480, // p
        fps: 10,
        maxDuration: 5   // seconds
      }
    },

    // Premium / paid mode — full quality
    hd: {
      image: {
        maxResolution: Infinity,
        jpegQuality: 0.92,
        webpQuality: 0.85
      },
      pdf: {
        imageQuality: 0.9,
        maxPages: Infinity
      },
      audio: {
        bitrate: 320,
        sampleRate: 48000
      },
      video: {
        maxResolution: 1080,
        fps: 30,
        maxDuration: Infinity
      }
    }
  };

  /** Determine current quality tier based on license + trial state */
  function getQualityTier(trialUsed, licensePlan) {
    if (licensePlan && licensePlan !== 'none') return 'hd';
    if (!trialUsed) return 'sd'; // trial: SD quality
    return 'sd'; // default: SD
  }

  /** Get quality settings for a specific tool type */
  function getQuality(toolType, trialUsed, licensePlan) {
    var tier = getQualityTier(trialUsed, licensePlan);
    var settings = QUALITY[tier];
    if (!settings) return QUALITY.sd;

    switch (toolType) {
      case 'image': return settings.image;
      case 'pdf': return settings.pdf;
      case 'audio': return settings.audio;
      case 'video': return settings.video;
      default: return settings.image;
    }
  }

  /** Check if the current quality tier is HD */
  function isHD(trialUsed, licensePlan) {
    return getQualityTier(trialUsed, licensePlan) === 'hd';
  }

  window.Watermark = {
    QUALITY: QUALITY,
    getQualityTier: getQualityTier,
    getQuality: getQuality,
    isHD: isHD
  };

})();
