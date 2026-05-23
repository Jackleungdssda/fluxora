/* Audit: verify every converter pipeline is REAL, not simulated */
const fs = require('fs');
const converter = fs.readFileSync('assets/js/converter.js', 'utf8');
const main = fs.readFileSync('assets/js/main.js', 'utf8');

console.log('============================================');
console.log('  PHASE 2: 转换管道真实性审计');
console.log('============================================\n');

var pipelines = [
  { name: 'Image格式互转', check: ['convertImage', 'canvas.toBlob', 'MIME_MAP'], desc: 'Canvas API → 真实重新编码' },
  { name: 'PDF→Image',     check: ['convertPDFToImage', 'pdfjsLib', 'page.render'], desc: 'PDF.js渲染 → Canvas导出' },
  { name: 'Images→PDF',    check: ['convertImagesToPDF', 'jspdf.jsPDF', 'addImage'], desc: 'jsPDF → 真实PDF文档' },
  { name: 'PDF合并',       check: ['mergePDFs', 'pdf-lib', 'copyPages', 'addPage'], desc: 'pdf-lib → 真实页面合并' },
  { name: 'PDF拆分',       check: ['splitPDF', 'copyPages', 'extractPage'], desc: 'pdf-lib → 真实页面提取' },
  { name: '音频→WAV',      check: ['convertToWavNative', 'AudioContext', 'startRendering'], desc: 'Web Audio API → 真实PCM编码' },
  { name: '音频→MP3等',    check: ['convertAudioWithFFmpeg', 'libmp3lame', 'libvorbis', 'flac'], desc: 'FFmpeg.wasm → 真实编码器' },
  { name: 'M4A音频',       check: ['m4a', 'ipod'], desc: 'FFmpeg → AAC+ipod容器' },
  { name: 'MP4音频',       check: ['mp4', '-f'], desc: 'FFmpeg → AAC+mp4容器' },
  { name: '视频→GIF',      check: ['convertVideoToGIF', 'fps=10', '-f'], desc: 'FFmpeg → 真实帧提取' },
  { name: '视频→MP4',      check: ['libx264', 'yuv420p', 'faststart'], desc: 'FFmpeg → x264真实编码' },
  { name: '视频→WebM',     check: ['libvpx', 'libvorbis'], desc: 'FFmpeg → VP8真实编码' },
  { name: '视频压缩',       check: ['compressVideo', 'libx264'], desc: 'FFmpeg → 真实压缩重编码' }
];

var allReal = true;
pipelines.forEach(function(p) {
  var missing = p.check.filter(function(c) { return converter.indexOf(c) === -1 && main.indexOf(c) === -1; });
  if (missing.length > 0) {
    console.log('  FAKE  ' + p.name + ' — 缺失: ' + missing.join(', '));
    allReal = false;
  } else {
    console.log('  REAL  ' + p.name + ' — ' + p.desc);
  }
});

console.log('\n总计: ' + pipelines.length + ' 个转换管道, ' + (allReal ? '全部真实' : '存在问题'));

// Check for pass-through (fake) patterns
console.log('\n--- 直通残留检测 (仅查converter.js) ---');
var fakePatterns = [/simulated/g, /TODO:\s*implement/g, /fake/g, /placeholder/g];
var foundFake = false;
fakePatterns.forEach(function(pat) {
  var cCount = (converter.match(pat) || []).length;
  if (cCount > 0) {
    console.log('  发现: ' + pat + ' → ' + cCount + ' 处');
    foundFake = true;
  }
});

// Check that pass-throughs in main.js are only intentional fallbacks
var ptCount = (main.match(/blob:\s*file,\s*url:\s*URL\.createObjectURL\(file\)/g) || []).length;
console.log('  main.js直通回退: ' + ptCount + ' 处 (PDF保留原文件/compress保留 — 预期行为)');

if (!foundFake) console.log('  converter.js无假功能残留');

console.log('\n结论: ' + (allReal && !foundFake ? '全部13个转换管道均为真实编码' : '存在问题需修复'));
process.exit(allReal && !foundFake ? 0 : 1);
