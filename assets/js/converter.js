/* ============================================
   Fluxora — Real File Conversion Engine v2
   Image: Canvas API  |  Audio/Video: FFmpeg.wasm
   PDF: PDF.js + jsPDF
   ============================================ */

(function () {
  'use strict';

  var MIME_MAP = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', avif: 'image/avif', bmp: 'image/bmp',
    svg: 'image/svg+xml', gif: 'image/gif', ico: 'image/x-icon'
  };

  /* FFmpeg output format → MIME type */
  var AUDIO_MIME = {
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    aac: 'audio/aac', flac: 'audio/flac',
    m4a: 'audio/mp4', mp4: 'audio/mp4'
  };

  var VIDEO_MIME = {
    mp4: 'video/mp4', webm: 'video/webm', gif: 'image/gif'
  };

  /* FFmpeg codec arguments per output format */
  var AUDIO_CODEC_ARGS = {
    mp3:  ['-acodec', 'libmp3lame'],
    ogg:  ['-acodec', 'libvorbis'],
    aac:  ['-acodec', 'aac'],
    flac: ['-acodec', 'flac'],
    m4a:  ['-acodec', 'aac', '-f', 'ipod'],
    mp4:  ['-acodec', 'aac', '-f', 'mp4']
  };

  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  }

  // Detect if SharedArrayBuffer is available (requires COOP/COEP headers)
  var hasSAB = typeof SharedArrayBuffer !== 'undefined'; // set by browser-check.js
  var VIDEO_MAX_MB = hasSAB ? 200 : 40;  // 200MB with SAB, 40MB without

  var loadedLibs = {};

  /* ---- Dynamic Library Loader ---- */
  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      if (loadedLibs[url]) { resolve(); return; }
      var s = document.createElement('script');
      s.src = url;
      s.onload = function () { loadedLibs[url] = true; resolve(); };
      s.onerror = function () { reject(new Error('Failed to load: ' + url)); };
      document.head.appendChild(s);
    });
  }

  /* ---- Shared FFmpeg.wasm Loader (lazy, cached) ---- */
  var ffmpegInstance = null;
  var ffmpegLoading = null;

  function getFFmpeg(onProgress) {
    if (ffmpegInstance) return Promise.resolve(ffmpegInstance);
    if (ffmpegLoading) return ffmpegLoading;

    ffmpegLoading = new Promise(function (resolve, reject) {
      var VENDOR_BASE = 'assets/vendor/ffmpeg';
      var FFMPEG_JS   = VENDOR_BASE + '/ffmpeg.js';
      var UTIL_JS     = VENDOR_BASE + '/ffmpeg-util.js';
      var CORE_BASE   = VENDOR_BASE;

      Promise.all([loadScript(FFMPEG_JS), loadScript(UTIL_JS)])
        .then(function () {
          if (onProgress) onProgress(8);
          var FFmpegClass = (window.FFmpegWASM && window.FFmpegWASM.FFmpeg) || window.FFmpeg;
          var toBlobURL   = (window.FFmpegUtil && window.FFmpegUtil.toBlobURL);

          if (!FFmpegClass) { reject(new Error('FFmpegWASM not available')); return; }
          if (!toBlobURL)   { reject(new Error('FFmpegUtil not available')); return; }

          var ffmpeg = new FFmpegClass();

          Promise.all([
            toBlobURL(CORE_BASE + '/ffmpeg-core.js', 'text/javascript'),
            toBlobURL(CORE_BASE + '/ffmpeg-core.wasm', 'application/wasm')
          ]).then(function (urls) {
            if (onProgress) onProgress(12);
            ffmpeg.load({ coreURL: urls[0], wasmURL: urls[1] })
              .then(function () {
                ffmpegInstance = ffmpeg;
                ffmpegLoading = null;
                if (onProgress) onProgress(20);
                resolve(ffmpeg);
              })
              .catch(function (e) {
                ffmpegLoading = null;
                reject(new Error('FFmpeg core load failed: ' + (e.message || e)));
              });
          }).catch(function (e) {
            ffmpegLoading = null;
            reject(new Error('FFmpeg core fetch failed: ' + (e.message || e)));
          });
        })
        .catch(function (e) {
          ffmpegLoading = null;
          reject(e);
        });
    });

    return ffmpegLoading;
  }

  /* ==========================================
     Image Conversion (Canvas API — native)
     ========================================== */
  function convertImage(file, outputFormat, quality, onProgress) {
    return new Promise(function (resolve, reject) {
      onProgress(10);
      var reader = new FileReader();
      reader.onload = function (e) {
        onProgress(30);
        var img = new Image();
        img.onload = function () {
          onProgress(50);
          var canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          onProgress(70);

          var mime = MIME_MAP[outputFormat] || 'image/png';
          var q = (quality || 85) / 100;

          canvas.toBlob(function (blob) {
            onProgress(100);
            if (!blob) { reject(new Error('Conversion failed')); return; }
            var url = URL.createObjectURL(blob);
            resolve({
              blob: blob, url: url,
              name: file.name.replace(/\.[^.]+$/, '') + '.' + outputFormat,
              size: blob.size, originalSize: file.size
            });
          }, mime, q);
        };
        img.onerror = function () { reject(new Error('Invalid image file')); };
        img.src = e.target.result;
      };
      reader.onerror = function () { reject(new Error('Failed to read file')); };
      reader.readAsDataURL(file);
    });
  }

  /* ==========================================
     PDF → Image Conversion (requires PDF.js)
     ========================================== */
  function convertPDFToImage(file, outputFormat, quality, onProgress) {
    return new Promise(function (resolve, reject) {
      var pdfjsUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
      loadScript(pdfjsUrl).then(function () {
        onProgress(10);
        var reader = new FileReader();
        reader.onload = function (e) {
          onProgress(20);
          var loadingTask = window.pdfjsLib.getDocument({ data: e.target.result });
          loadingTask.promise.then(function (pdf) {
            var totalPages = pdf.numPages;
            var results = [];
            var completed = 0;

            function renderPage(pageNum) {
              pdf.getPage(pageNum).then(function (page) {
                var viewport = page.getViewport({ scale: 2.0 });
                var canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                var ctx = canvas.getContext('2d');

                page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
                  var mime = MIME_MAP[outputFormat] || 'image/jpeg';
                  var q = (quality || 90) / 100;
                  canvas.toBlob(function (blob) {
                    var url = URL.createObjectURL(blob);
                    results.push({
                      blob: blob, url: url,
                      name: file.name.replace(/\.pdf$/i, '') + '_page' + pageNum + '.' + outputFormat,
                      size: blob.size
                    });
                    completed++;
                    onProgress(20 + Math.round((completed / totalPages) * 80));
                    if (completed === totalPages) { resolve(results); }
                  }, mime, q);
                });
              });
            }

            for (var i = 1; i <= totalPages; i++) { renderPage(i); }
          }).catch(function () { reject(new Error('Failed to load PDF')); });
        };
        reader.onerror = function () { reject(new Error('Failed to read file')); };
        reader.readAsArrayBuffer(file);
      }).catch(function () { reject(new Error('PDF.js library failed to load')); });
    });
  }

  /* ==========================================
     Images → PDF (requires jsPDF)
     ========================================== */
  function convertImagesToPDF(files, onProgress) {
    return new Promise(function (resolve, reject) {
      var jsPdfUrl = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      loadScript(jsPdfUrl).then(function () {
        onProgress(10);
        var doc = new window.jspdf.jsPDF();
        var loaded = 0;

        function addNext(index) {
          if (index >= files.length) {
            onProgress(100);
            var blob = doc.output('blob');
            var url = URL.createObjectURL(blob);
            resolve({ blob: blob, url: url, name: 'converted.pdf', size: blob.size });
            return;
          }
          var reader = new FileReader();
          reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
              var pageW = doc.internal.pageSize.getWidth();
              var pageH = doc.internal.pageSize.getHeight();
              var ratio = Math.min(pageW / img.width, pageH / img.height);
              var w = img.width * ratio, h = img.height * ratio;
              if (index > 0) doc.addPage();
              doc.addImage(img, 'JPEG', (pageW - w) / 2, (pageH - h) / 2, w, h);
              loaded++;
              onProgress(10 + Math.round((loaded / files.length) * 90));
              addNext(index + 1);
            };
            img.onerror = function () { addNext(index + 1); };
            img.src = e.target.result;
          };
          reader.onerror = function () { addNext(index + 1); };
          reader.readAsDataURL(files[index]);
        }

        addNext(0);
      }).catch(function () { reject(new Error('jsPDF library failed to load')); });
    });
  }

  /* ==========================================
     PDF Merge (requires pdf-lib — real merge)
     ========================================== */
  function mergePDFs(files, onProgress) {
    return new Promise(function (resolve, reject) {
      onProgress(5);
      var pdfLibUrl = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
      loadScript(pdfLibUrl).then(function () {
        onProgress(10);
        var PDFLib = window.PDFLib;
        if (!PDFLib) { reject(new Error('pdf-lib not available')); return; }

        PDFLib.PDFDocument.create().then(function (mergedDoc) {
          var total = files.length;
          var processed = 0;

          function addDocument(index) {
            if (index >= total) {
              onProgress(95);
              mergedDoc.save().then(function (pdfBytes) {
                onProgress(100);
                var blob = new Blob([pdfBytes], { type: 'application/pdf' });
                var url = URL.createObjectURL(blob);
                resolve({
                  blob: blob, url: url,
                  name: 'merged_document.pdf',
                  size: blob.size, pageCount: mergedDoc.getPageCount()
                });
              });
              return;
            }

            var file = files[index];
            var reader = new FileReader();
            reader.onload = function (e) {
              PDFLib.PDFDocument.load(new Uint8Array(e.target.result)).then(function (doc) {
                var pageIndices = doc.getPageIndices();
                mergedDoc.copyPages(doc, pageIndices).then(function (pages) {
                  pages.forEach(function (p) { mergedDoc.addPage(p); });
                  processed++;
                  onProgress(10 + Math.round((processed / total) * 85));
                  addDocument(index + 1);
                });
              }).catch(function () {
                // Skip corrupt files, continue with others
                processed++;
                addDocument(index + 1);
              });
            };
            reader.onerror = function () {
              processed++;
              addDocument(index + 1);
            };
            reader.readAsArrayBuffer(file);
          }

          if (total === 0) { reject(new Error('No files selected')); return; }
          addDocument(0);
        }).catch(function () { reject(new Error('Failed to create PDF')); });
      }).catch(function () { reject(new Error('pdf-lib library failed to load')); });
    });
  }

  /* ==========================================
     PDF Split (requires pdf-lib — real split)
     ========================================== */
  function splitPDF(file, onProgress) {
    return new Promise(function (resolve, reject) {
      onProgress(5);
      var pdfLibUrl = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
      loadScript(pdfLibUrl).then(function () {
        onProgress(10);
        var PDFLib = window.PDFLib;
        if (!PDFLib) { reject(new Error('pdf-lib not available')); return; }

        var reader = new FileReader();
        reader.onload = function (e) {
          PDFLib.PDFDocument.load(new Uint8Array(e.target.result)).then(function (doc) {
            var pageCount = doc.getPageCount();
            var results = [];
            var completed = 0;

            function extractPage(pageIndex) {
              PDFLib.PDFDocument.create().then(function (newDoc) {
                newDoc.copyPages(doc, [pageIndex]).then(function (pages) {
                  newDoc.addPage(pages[0]);
                  newDoc.save().then(function (pdfBytes) {
                    var blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    var url = URL.createObjectURL(blob);
                    results.push({
                      blob: blob, url: url,
                      name: file.name.replace(/\.pdf$/i, '') + '_page' + (pageIndex + 1) + '.pdf',
                      size: blob.size, pageNumber: pageIndex + 1
                    });
                    completed++;
                    onProgress(10 + Math.round((completed / pageCount) * 90));
                    if (completed === pageCount) {
                      // Sort by page number
                      results.sort(function (a, b) { return a.pageNumber - b.pageNumber; });
                      resolve(results);
                    }
                  });
                });
              });
            }

            for (var i = 0; i < pageCount; i++) { extractPage(i); }
          }).catch(function () { reject(new Error('Failed to load PDF for splitting')); });
        };
        reader.onerror = function () { reject(new Error('Failed to read file')); };
        reader.readAsArrayBuffer(file);
      }).catch(function () { reject(new Error('pdf-lib library failed to load')); });
    });
  }

  /* ==========================================
     Native WAV conversion (Web Audio API)
     Fast, no external deps. True WAV output.
     ========================================== */
  function convertToWavNative(file, onProgress) {
    return new Promise(function (resolve, reject) {
      onProgress(10);
      var reader = new FileReader();
      reader.onload = function (e) {
        onProgress(30);
        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtx.decodeAudioData(e.target.result).then(function (buffer) {
          onProgress(60);
          var offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
          var source = offlineCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(offlineCtx.destination);
          source.start(0);

          offlineCtx.startRendering().then(function (rendered) {
            onProgress(80);
            var wavBlob = audioBufferToWav(rendered);
            var url = URL.createObjectURL(wavBlob);
            onProgress(100);
            resolve({
              blob: wavBlob, url: url,
              name: file.name.replace(/\.[^.]+$/, '') + '.wav',
              size: wavBlob.size, originalSize: file.size
            });
          });
        }).catch(function () { reject(new Error('Failed to decode audio. Unsupported format.')); });
      };
      reader.onerror = function () { reject(new Error('Failed to read file')); };
      reader.readAsArrayBuffer(file);
    });
  }

  /* WAV encoder helper */
  function audioBufferToWav(buffer) {
    var numChannels = buffer.numberOfChannels;
    var sampleRate = buffer.sampleRate;
    var format = 1; // PCM
    var bitsPerSample = 16;
    var data = buffer.getChannelData(0);
    var dataLength = data.length * (bitsPerSample / 8);
    var headerLength = 44;
    var totalLength = headerLength + dataLength;
    var arrayBuffer = new ArrayBuffer(totalLength);
    var view = new DataView(arrayBuffer);

    function writeString(offset, str) {
      for (var i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    }

    writeString(0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    var offset = 44;
    for (var i = 0; i < data.length; i++) {
      var sample = Math.max(-1, Math.min(1, data[i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /* ==========================================
     Audio Conversion via FFmpeg.wasm
     (MP3, OGG, AAC, FLAC, M4A, MP4 — REAL encoding)
     ========================================== */
  function convertAudioWithFFmpeg(file, outputFormat, bitrate, onProgress) {
    return new Promise(function (resolve, reject) {
      onProgress(5);

      getFFmpeg(onProgress).then(function (ffmpeg) {
        var reader = new FileReader();
        reader.onload = function (e) {
          onProgress(25);
          var inputExt = (file.name.split('.').pop() || 'mp3').toLowerCase();
          var inputName = 'audio_in.' + inputExt;
          var outputName = 'audio_out.' + outputFormat;

          ffmpeg.writeFile(inputName, new Uint8Array(e.target.result))
            .then(function () {
              onProgress(35);

              var args = ['-i', inputName, '-y'];

              // Apply codec-specific arguments
              var codecArgs = AUDIO_CODEC_ARGS[outputFormat];
              if (codecArgs) {
                args = args.concat(codecArgs);
              }

              // Add bitrate for lossy formats
              if (['mp3','ogg','aac','m4a','mp4'].indexOf(outputFormat) !== -1) {
                args.push('-b:a', (bitrate || 128) + 'k');
              }

              args.push(outputName);

              onProgress(40);
              return ffmpeg.exec(args);
            })
            .then(function () {
              onProgress(85);
              return ffmpeg.readFile(outputName);
            })
            .then(function (data) {
              // Clean up temp files
              ffmpeg.deleteFile(inputName).catch(function () {});
              ffmpeg.deleteFile(outputName).catch(function () {});

              var mime = AUDIO_MIME[outputFormat] || 'audio/mpeg';
              var blob = new Blob([data.buffer || data], { type: mime });
              var url = URL.createObjectURL(blob);
              onProgress(100);
              resolve({
                blob: blob, url: url,
                name: file.name.replace(/\.[^.]+$/, '') + '.' + outputFormat,
                size: blob.size, originalSize: file.size
              });
            })
            .catch(function (err) {
              reject(new Error('FFmpeg audio conversion failed: ' + (err.message || err)));
            });
        };
        reader.onerror = function () { reject(new Error('Failed to read file')); };
        reader.readAsArrayBuffer(file);
      }).catch(function (err) {
        reject(new Error('FFmpeg.wasm failed to load (~31MB download on first use). ' + (err.message || err)));
      });
    });
  }

  /* ---- Main Audio Conversion (routes to native or FFmpeg) ---- */
  function convertAudio(file, outputFormat, bitrate, onProgress) {
    if (outputFormat === 'wav') {
      return convertToWavNative(file, onProgress);
    }
    return convertAudioWithFFmpeg(file, outputFormat, bitrate, onProgress);
  }

  /* ==========================================
     Video → GIF (FFmpeg.wasm)
     ========================================== */
  function convertVideoToGIF(file, onProgress) {
    return new Promise(function (resolve, reject) {
      onProgress(5);

      getFFmpeg(onProgress).then(function (ffmpeg) {
        var reader = new FileReader();
        reader.onload = function (e) {
          onProgress(25);
          var inputExt = (file.name.split('.').pop() || 'mp4').toLowerCase();
          var inputName = 'video_in.' + inputExt;
          var outputName = 'output.gif';

          ffmpeg.writeFile(inputName, new Uint8Array(e.target.result))
            .then(function () {
              onProgress(35);
              return ffmpeg.exec([
                '-i', inputName, '-y',
                '-vf', 'fps=10,scale=480:-1:flags=lanczos',
                '-t', '15', '-f', 'gif', outputName
              ]);
            })
            .then(function () {
              onProgress(90);
              return ffmpeg.readFile(outputName);
            })
            .then(function (data) {
              ffmpeg.deleteFile(inputName).catch(function () {});
              ffmpeg.deleteFile(outputName).catch(function () {});

              var blob = new Blob([data.buffer || data], { type: 'image/gif' });
              var url = URL.createObjectURL(blob);
              onProgress(100);
              resolve({
                blob: blob, url: url,
                name: file.name.replace(/\.[^.]+$/, '') + '.gif',
                size: blob.size, originalSize: file.size
              });
            })
            .catch(function (err) {
              var msg = err.message || String(err);
              if (msg.indexOf('FS error') !== -1 || msg.indexOf('ErrnoError') !== -1) {
                reject(new Error('Video file too large for browser memory. Try a smaller file (under 30MB).'));
              } else {
                reject(new Error('FFmpeg video→GIF failed: ' + msg));
              }
            });
        };
        reader.onerror = function () { reject(new Error('Failed to read file')); };
        reader.readAsArrayBuffer(file);
      }).catch(function (err) {
        reject(new Error('FFmpeg.wasm failed to load. ' + (err.message || err)));
      });
    });
  }

  /* ==========================================
     Video → MP4 / WebM (FFmpeg.wasm)
     ========================================== */
  function convertVideo(file, outputFormat, onProgress) {
    return new Promise(function (resolve, reject) {
      var maxSize = VIDEO_MAX_MB * 1024 * 1024;
      if (file.size > maxSize) {
        reject(new Error('Video too large (' + formatFileSize(file.size) + '). Max: ' + VIDEO_MAX_MB + 'MB.'));
        return;
      }

      onProgress(5);

      getFFmpeg(onProgress).then(function (ffmpeg) {
        var reader = new FileReader();
        reader.onload = function (e) {
          onProgress(25);
          var inputExt = (file.name.split('.').pop() || 'mp4').toLowerCase();
          var inputName = 'video_in.' + inputExt;
          var outputName = 'video_out.' + outputFormat;

          // Detect inputs without audio (GIF, image sequences)
          var noAudioInput = (inputExt === 'gif');

          ffmpeg.writeFile(inputName, new Uint8Array(e.target.result))
            .then(function () {
              onProgress(35);

              // With SAB: multi-threaded, higher quality
              // Without: single-threaded, minimal quality
              var threads = hasSAB ? '0' : '1'; // '0' = auto-detect cores
              var preset = hasSAB ? 'medium' : 'ultrafast';
              var vBitrate = hasSAB ? '1500k' : '600k';
              var aBitrate = hasSAB ? '192k' : '96k';
              var scale = hasSAB ? '1280:-2' : '480:-2';
              var maxrate = hasSAB ? '3M' : '800k';
              var bufsize = hasSAB ? '6M' : '1M';
              var fsLimit = hasSAB ? '100M' : '20M';

              var args = ['-i', inputName, '-y', '-threads', threads];
              if (outputFormat === 'mp4') {
                if (noAudioInput) {
                  // No audio source — video only
                  args.push(
                    '-c:v', 'libx264', '-preset', preset, '-b:v', vBitrate,
                    '-an',
                    '-vf', 'scale=' + scale,
                    '-maxrate', maxrate, '-bufsize', bufsize,
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                    '-fs', fsLimit
                  );
                } else {
                  args.push(
                    '-c:v', 'libx264', '-preset', preset, '-b:v', vBitrate,
                    '-c:a', 'libmp3lame', '-b:a', aBitrate,
                    '-vf', 'scale=' + scale,
                    '-maxrate', maxrate, '-bufsize', bufsize,
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
                    '-fs', fsLimit
                  );
                }
              } else if (outputFormat === 'webm') {
                var webmSpeed = hasSAB ? '1' : '5';
                var webmDeadline = hasSAB ? 'good' : 'realtime';
                if (noAudioInput) {
                  args.push(
                    '-c:v', 'libvpx', '-b:v', vBitrate, '-cpu-used', webmSpeed,
                    '-deadline', webmDeadline,
                    '-an',
                    '-vf', 'scale=' + scale,
                    '-fs', fsLimit
                  );
                } else {
                  args.push(
                    '-c:v', 'libvpx', '-b:v', vBitrate, '-cpu-used', webmSpeed,
                    '-deadline', webmDeadline,
                    '-c:a', 'libvorbis', '-b:a', aBitrate,
                    '-vf', 'scale=' + scale,
                    '-fs', fsLimit
                  );
                }
              }
              args.push(outputName);

              return ffmpeg.exec(args);
            })
            .then(function () {
              onProgress(90);
              return ffmpeg.readFile(outputName);
            })
            .then(function (data) {
              ffmpeg.deleteFile(inputName).catch(function () {});
              ffmpeg.deleteFile(outputName).catch(function () {});

              var mime = VIDEO_MIME[outputFormat] || 'video/mp4';
              var blob = new Blob([data.buffer || data], { type: mime });
              var url = URL.createObjectURL(blob);
              onProgress(100);
              resolve({
                blob: blob, url: url,
                name: file.name.replace(/\.[^.]+$/, '') + '.' + outputFormat,
                size: blob.size, originalSize: file.size
              });
            })
            .catch(function (err) {
              var msg = err.message || String(err);
              if (msg.indexOf('FS error') !== -1 || msg.indexOf('ErrnoError') !== -1) {
                reject(new Error('Video file too large for browser memory. Try a smaller/shorter video (under 30MB).'));
              } else {
                reject(new Error('FFmpeg video→' + outputFormat.toUpperCase() + ' failed: ' + msg));
              }
            });
        };
        reader.onerror = function () { reject(new Error('Failed to read file')); };
        reader.readAsArrayBuffer(file);
      }).catch(function (err) {
        reject(new Error('FFmpeg.wasm failed to load. ' + (err.message || err)));
      });
    });
  }

  /* ==========================================
     Compression (images: Canvas, video: FFmpeg)
     ========================================== */
  function compressImage(file, outputFormat, quality, onProgress) {
    return convertImage(file, outputFormat || 'webp', quality || 60, onProgress);
  }

  function compressVideo(file, onProgress) {
    return new Promise(function (resolve, reject) {
      onProgress(5);

      getFFmpeg(onProgress).then(function (ffmpeg) {
        var reader = new FileReader();
        reader.onload = function (e) {
          onProgress(25);
          var inputExt = (file.name.split('.').pop() || 'mp4').toLowerCase();
          var inputName = 'compress_in.' + inputExt;
          var outputName = 'compressed.' + inputExt;

          ffmpeg.writeFile(inputName, new Uint8Array(e.target.result))
            .then(function () {
              onProgress(35);
              var threads = hasSAB ? '0' : '1';
              var preset = hasSAB ? 'fast' : 'ultrafast';
              var vBitrate = hasSAB ? '800k' : '500k';
              var aBitrate = hasSAB ? '128k' : '64k';
              var scale = hasSAB ? '854:-2' : '480:-2';
              var maxrate = hasSAB ? '2M' : '800k';
              var bufsize = hasSAB ? '4M' : '1M';
              return ffmpeg.exec([
                '-i', inputName, '-y', '-threads', threads,
                '-c:v', 'libx264', '-b:v', vBitrate, '-preset', preset,
                '-c:a', 'libmp3lame', '-b:a', aBitrate,
                '-vf', 'scale=' + scale,
                '-maxrate', maxrate, '-bufsize', bufsize,
                '-pix_fmt', 'yuv420p',
                outputName
              ]);
            })
            .then(function () {
              onProgress(90);
              return ffmpeg.readFile(outputName);
            })
            .then(function (data) {
              ffmpeg.deleteFile(inputName).catch(function () {});
              ffmpeg.deleteFile(outputName).catch(function () {});

              var mime = file.type || 'video/mp4';
              var blob = new Blob([data.buffer || data], { type: mime });
              var url = URL.createObjectURL(blob);
              onProgress(100);
              resolve({
                blob: blob, url: url,
                name: 'compressed_' + file.name,
                size: blob.size, originalSize: file.size
              });
            })
            .catch(function (err) {
              reject(new Error('Video compression failed: ' + (err.message || err)));
            });
        };
        reader.onerror = function () { reject(new Error('Failed to read file')); };
        reader.readAsArrayBuffer(file);
      }).catch(function (err) {
        reject(new Error('FFmpeg.wasm failed to load. ' + (err.message || err)));
      });
    });
  }

  /* ---- Public API ---- */
  window.Converter = {
    image: convertImage,
    pdfToImage: convertPDFToImage,
    imagesToPdf: convertImagesToPDF,
    mergePDFs: mergePDFs,
    splitPDF: splitPDF,
    audio: convertAudio,
    videoToGIF: convertVideoToGIF,
    video: convertVideo,
    compress: compressImage,
    compressVideo: compressVideo,
    MIME_MAP: MIME_MAP,
    AUDIO_MIME: AUDIO_MIME
  };

})();
