/* ============================================
   Fluxora — Three.js Dynamic Backgrounds
   5 theme presets, iPhone dark mode aesthetic
   High visibility on black backgrounds
   ============================================ */

(function () {
  'use strict';

  var canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  function loadScript(url, cb) {
    var s = document.createElement('script');
    s.src = url;
    s.onload = cb;
    s.onerror = function () { console.warn('Failed to load: ' + url); };
    document.head.appendChild(s);
  }

  /* ----- Globals ----- */
  var THREE, renderer, scene, camera;
  var currentPreset = null;
  var cleanupFn = null;
  var animId = null;
  var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  var isMobile = window.innerWidth < 768;
  var mainGroup;

  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function color3(r, g, b) { return new THREE.Color(r / 255, g / 255, b / 255); }

  /* ----- Setup ----- */
  function setup() {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    mainGroup = new THREE.Group();
    scene.add(mainGroup);
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, 0);
  }

  function onResize() {
    if (!renderer) return;
    isMobile = window.innerWidth < 768;
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (camera.isPerspectiveCamera) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
  }

  function onMouseMove(e) {
    targetX = (e.clientX / window.innerWidth) * 2 - 1;
    targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  }
  function onTouchMove(e) {
    if (e.touches.length > 0) {
      targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  }

  /* ============================================
     Preset: particles (Dashboard)
     Bright glowing particles on dark bg
     ============================================ */
  function presetParticles(hexColor) {
    var rgb = hexToRgb(hexColor);
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    var count = isMobile ? 100 : 220;

    var positions = new Float32Array(count * 3);
    var randoms = new Float32Array(count * 4);
    var colors = new Float32Array(count * 3);

    // Brighter palette for dark mode
    var palette = [
      [r, g, b],
      [Math.min(1, r + 0.2), Math.min(1, g + 0.2), Math.min(1, b + 0.2)],
      [Math.min(1, r + 0.35), Math.min(1, g + 0.35), Math.min(1, b + 0.35)],
      [Math.min(1, r + 0.5), Math.min(1, g + 0.5), Math.min(1, b + 0.5)]
    ];

    for (var i = 0; i < count; i++) {
      var x, y, z, len;
      do { x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1; len = x * x + y * y + z * z; } while (len > 1 || len === 0);
      var rad = Math.cbrt(Math.random());
      positions[i * 3] = x * rad;
      positions[i * 3 + 1] = y * rad;
      positions[i * 3 + 2] = z * rad;
      randoms[i * 4] = Math.random();
      randoms[i * 4 + 1] = Math.random();
      randoms[i * 4 + 2] = Math.random();
      randoms[i * 4 + 3] = Math.random();
      var col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col[0]; colors[i * 3 + 1] = col[1]; colors[i * 3 + 2] = col[2];
    }

    var geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('random', new THREE.BufferAttribute(randoms, 4));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    var vertShader = [
      'attribute vec4 random; attribute vec3 color;',
      'varying vec4 vRandom; varying vec3 vColor;',
      'uniform float uTime; uniform float uSpread; uniform float uBaseSize; uniform float uSizeRandomness;',
      'void main() {',
      '  vRandom = random; vColor = color;',
      '  vec3 pos = position * uSpread; pos.z *= 10.0;',
      '  float t = uTime;',
      '  pos.x += sin(t * random.z + 6.28 * random.w) * mix(0.04, 1.0, random.x);',
      '  pos.y += sin(t * random.y + 6.28 * random.x) * mix(0.04, 1.0, random.w);',
      '  pos.z += sin(t * random.w + 6.28 * random.y) * mix(0.04, 1.0, random.z);',
      '  vec4 mv = modelViewMatrix * vec4(pos, 1.0);',
      '  gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mv.xyz);',
      '  gl_Position = projectionMatrix * mv;',
      '}'
    ].join('\n');

    var fragShader = [
      'precision highp float; varying vec4 vRandom; varying vec3 vColor; uniform float uTime; uniform float uAlpha;',
      'void main() {',
      '  vec2 uv = gl_PointCoord.xy; float d = length(uv - vec2(0.5));',
      '  float glow = 1.0 - smoothstep(0.2, 0.5, d);',
      '  float twinkle = 1.0 + 0.2 * sin(uv.y * 12.0 + uTime + vRandom.y * 6.28);',
      '  vec3 fc = vColor + 0.2 * sin(uv.yxx * 8.0 + uTime + vRandom.y * 6.28);',
      '  float alpha = glow * uAlpha * twinkle;',
      '  if (alpha < 0.02) discard;',
      '  gl_FragColor = vec4(fc, alpha);',
      '}'
    ].join('\n');

    var mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSpread: { value: 7 }, uBaseSize: { value: isMobile ? 80 : 150 }, uSizeRandomness: { value: 0.6 }, uAlpha: { value: 0.9 } },
      vertexShader: vertShader, fragmentShader: fragShader,
      transparent: true, depthTest: false, depthWrite: false, blending: THREE.NormalBlending
    });

    var points = new THREE.Points(geom, mat);
    mainGroup.add(points);

    return function animate(dt, elapsed) {
      mouseX += (targetX - mouseX) * 0.055;
      mouseY += (targetY - mouseY) * 0.045;
      mainGroup.position.x += (mouseX * 4.0 - mainGroup.position.x) * 0.04;
      mainGroup.position.y += (mouseY * 3.0 - mainGroup.position.y) * 0.04;
      mainGroup.rotation.x = Math.sin(elapsed * 0.00015) * 0.06;
      mainGroup.rotation.y = Math.cos(elapsed * 0.00035) * 0.1;
      mainGroup.rotation.z += 0.0015;
      mat.uniforms.uTime.value = elapsed * 0.001;
    };
  }

  /* ============================================
     Preset: image — Glass Lens Orbs
     Bright semi-transparent spheres, blue/cyan
     ============================================ */
  function presetImage(hexColor) {
    var rgb = hexToRgb(hexColor);
    var palette = [
      color3(rgb[0], rgb[1], rgb[2]),
      color3(Math.min(255, rgb[0] + 40), Math.min(255, rgb[1] + 80), Math.min(255, rgb[2] + 60)),
      color3(Math.min(255, rgb[0] + 100), Math.min(255, rgb[1] + 130), Math.min(255, rgb[2] + 110)),
      color3(Math.min(255, rgb[0] + 20), Math.max(0, rgb[1] - 20), Math.min(255, rgb[2] + 180))
    ];
    var count = isMobile ? 4 : 7;
    var orbs = [];

    for (var i = 0; i < count; i++) {
      var radius = Math.random() * 0.7 + 0.25;
      var geom = new THREE.SphereGeometry(radius, 48, 48);
      var col = palette[Math.floor(Math.random() * palette.length)];
      var mat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.35 + Math.random() * 0.3,
        depthWrite: false
      });
      var orb = new THREE.Mesh(geom, mat);

      // Outer glow
      var glowGeom = new THREE.SphereGeometry(radius * 2.2, 32, 32);
      var glowMat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.1 + Math.random() * 0.08,
        depthWrite: false
      });
      var glow = new THREE.Mesh(glowGeom, glowMat);
      orb.add(glow);

      orb.userData = {
        bx: (Math.random() - 0.5) * 9,
        by: (Math.random() - 0.5) * 6,
        bz: (Math.random() - 0.5) * 5,
        sp: Math.random() * 0.3 + 0.15,
        ph: Math.random() * Math.PI * 2,
        ax: Math.random() * 0.35 + 0.12,
        ay: Math.random() * 0.35 + 0.12
      };
      orb.position.set(orb.userData.bx, orb.userData.by, orb.userData.bz);
      orbs.push(orb);
      mainGroup.add(orb);
    }

    return function animate(dt, elapsed) {
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.04;
      mainGroup.rotation.y += (mouseX * 0.7 - mainGroup.rotation.y) * 0.035;
      mainGroup.rotation.x += (-mouseY * 0.2 - mainGroup.rotation.x) * 0.035;
      var t = elapsed * 0.001;
      for (var i = 0; i < orbs.length; i++) {
        var o = orbs[i];
        o.position.x = o.userData.bx + Math.sin(t * o.userData.sp + o.userData.ph) * o.userData.ax;
        o.position.y = o.userData.by + Math.cos(t * o.userData.sp * 1.3 + o.userData.ph) * o.userData.ay;
        o.position.z = o.userData.bz + Math.sin(t * o.userData.sp * 0.7 + o.userData.ph) * 0.6;
        o.rotation.x += dt * 0.08;
        o.rotation.y += dt * 0.12;
      }
    };
  }

  /* ============================================
     Preset: pdf — Floating Document Sheets
     Semi-transparent planes, red/coral
     ============================================ */
  function presetPdf(hexColor) {
    var rgb = hexToRgb(hexColor);
    var palette = [
      color3(rgb[0], rgb[1], rgb[2]),
      color3(Math.min(255, rgb[0] + 40), Math.max(0, rgb[1] - 15), Math.max(0, rgb[2] - 30)),
      color3(Math.min(255, rgb[0] + 80), Math.min(255, rgb[1] + 40), Math.max(0, rgb[2] - 10)),
      color3(rgb[0], Math.min(255, rgb[1] + 40), Math.min(255, rgb[2] + 40))
    ];
    var count = isMobile ? 5 : 9;
    var sheets = [];

    for (var i = 0; i < count; i++) {
      var w = Math.random() * 1.3 + 0.7;
      var h = Math.random() * 1.8 + 0.9;
      var geom = new THREE.PlaneGeometry(w, h);
      var col = palette[Math.floor(Math.random() * palette.length)];

      // Edge glow ring (thin border)
      var edgeGeom = new THREE.EdgesGeometry(geom);
      var edgeMat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.5,
        depthWrite: false
      });

      var mat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.22 + Math.random() * 0.22,
        side: THREE.DoubleSide, depthWrite: false
      });
      var sheet = new THREE.Mesh(geom, mat);
      sheet.userData = {
        bx: (Math.random() - 0.5) * 10,
        by: (Math.random() - 0.5) * 7,
        bz: (Math.random() - 0.5) * 6,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        rz: Math.random() * Math.PI,
        sp: Math.random() * 0.2 + 0.08,
        ph: Math.random() * Math.PI * 2,
        fa: Math.random() * 0.45 + 0.12
      };
      sheet.position.set(sheet.userData.bx, sheet.userData.by, sheet.userData.bz);
      sheet.rotation.set(sheet.userData.rx, sheet.userData.ry, sheet.userData.rz);
      sheets.push(sheet);
      mainGroup.add(sheet);
    }

    return function animate(dt, elapsed) {
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.04;
      mainGroup.rotation.y += (mouseX * 0.6 - mainGroup.rotation.y) * 0.035;
      mainGroup.rotation.x += (-mouseY * 0.18 - mainGroup.rotation.x) * 0.035;
      var t = elapsed * 0.001;
      for (var i = 0; i < sheets.length; i++) {
        var s = sheets[i];
        s.position.y = s.userData.by + Math.sin(t * s.userData.sp + s.userData.ph) * s.userData.fa;
        s.rotation.x += dt * 0.06;
        s.rotation.z += dt * 0.04;
      }
    };
  }

  /* ============================================
     Preset: audio — Circular Equalizer
     Pulsing bars in a ring, orange/amber
     ============================================ */
  function presetAudio(hexColor) {
    var rgb = hexToRgb(hexColor);
    var palette = [
      color3(rgb[0], rgb[1], rgb[2]),
      color3(Math.min(255, rgb[0] + 30), Math.min(255, rgb[1] + 60), Math.max(0, rgb[2] - 30)),
      color3(Math.min(255, rgb[0] + 100), Math.max(0, rgb[1] - 10), Math.max(0, rgb[2] - 60)),
      color3(Math.max(0, rgb[0] - 10), Math.min(255, rgb[1] + 30), Math.min(255, rgb[2] + 60))
    ];
    var numBars = isMobile ? 32 : 52;
    var ringRadius = 4.5;
    var bars = [];

    var barGeom = new THREE.BoxGeometry(0.07, 0.5, 0.07);

    for (var i = 0; i < numBars; i++) {
      var col = palette[Math.floor(Math.random() * palette.length)];
      var mat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.6 + Math.random() * 0.3,
        depthWrite: false
      });
      var bar = new THREE.Mesh(barGeom, mat);
      var angle = (i / numBars) * Math.PI * 2;
      bar.position.set(Math.cos(angle) * ringRadius, 0, Math.sin(angle) * ringRadius);
      bar.rotation.y = -angle + Math.PI / 2;
      bar.userData = {
        baseY: 0, freq: 0.5 + Math.random() * 1.8, phase: Math.random() * Math.PI * 2, amp: 0.5 + Math.random() * 2.2
      };
      bars.push(bar);
      mainGroup.add(bar);
    }

    // Center orb
    var centerGeom = new THREE.SphereGeometry(0.4, 48, 48);
    var centerMat = new THREE.MeshBasicMaterial({
      color: palette[0], transparent: true, opacity: 0.55,
      depthWrite: false
    });
    var centerOrb = new THREE.Mesh(centerGeom, centerMat);
    mainGroup.add(centerOrb);

    // Outer ring
    var ringGeom = new THREE.TorusGeometry(ringRadius, 0.04, 16, 120);
    var ringMat = new THREE.MeshBasicMaterial({
      color: palette[0], transparent: true, opacity: 0.4,
      depthWrite: false
    });
    var ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    mainGroup.add(ring);

    // Inner ring
    var innerRingGeom = new THREE.TorusGeometry(ringRadius * 0.6, 0.03, 16, 80);
    var innerRingMat = new THREE.MeshBasicMaterial({
      color: palette[1], transparent: true, opacity: 0.35,
      depthWrite: false
    });
    var innerRing = new THREE.Mesh(innerRingGeom, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    mainGroup.add(innerRing);

    return function animate(dt, elapsed) {
      mouseX += (targetX - mouseX) * 0.055;
      mouseY += (targetY - mouseY) * 0.045;
      mainGroup.rotation.y += dt * 0.15;
      mainGroup.rotation.x += (-mouseY * 0.3 - mainGroup.rotation.x) * 0.04;
      var t = elapsed * 0.001;
      for (var i = 0; i < bars.length; i++) {
        var b = bars[i];
        var pulse = Math.abs(Math.sin(t * b.userData.freq * 1.8 + b.userData.phase));
        var smoothed = pulse * pulse * (3 - 2 * pulse);
        b.scale.y = 0.5 + smoothed * b.userData.amp;
        b.position.y = (b.scale.y - 0.5) * 0.25;
        b.material.opacity = 0.35 + smoothed * 0.55;
      }
      var cp = 1 + Math.sin(t * 1.5) * 0.25;
      centerOrb.scale.setScalar(cp);
      centerOrb.material.opacity = 0.45 + Math.sin(t * 1.5) * 0.2;
      innerRing.rotation.z += dt * 0.12;
    };
  }

  /* ============================================
     Preset: video — Frame Stream
     Floating film frames, purple/violet
     ============================================ */
  function presetVideo(hexColor) {
    var rgb = hexToRgb(hexColor);
    var palette = [
      color3(rgb[0], rgb[1], rgb[2]),
      color3(Math.min(255, rgb[0] + 60), Math.max(0, rgb[1] - 20), Math.min(255, rgb[2] + 50)),
      color3(Math.max(0, rgb[0] - 10), Math.min(255, rgb[1] + 40), Math.min(255, rgb[2] + 80)),
      color3(Math.min(255, rgb[0] + 30), Math.min(255, rgb[1] + 70), rgb[2])
    ];
    var count = isMobile ? 8 : 15;
    var frames = [];

    var thickness = 0.03;

    for (var i = 0; i < count; i++) {
      var fw = Math.random() * 0.8 + 0.4;
      var fh = Math.random() * 1.0 + 0.5;
      var col = palette[Math.floor(Math.random() * palette.length)];

      var frameGroup = new THREE.Group();
      var edgeMat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.5 + Math.random() * 0.35,
        depthWrite: false
      });

      // Frame edges
      var topEdge = new THREE.Mesh(new THREE.BoxGeometry(fw, thickness, thickness), edgeMat);
      topEdge.position.y = fh / 2;
      frameGroup.add(topEdge);
      var botEdge = new THREE.Mesh(new THREE.BoxGeometry(fw, thickness, thickness), edgeMat);
      botEdge.position.y = -fh / 2;
      frameGroup.add(botEdge);
      var leftEdge = new THREE.Mesh(new THREE.BoxGeometry(thickness, fh, thickness), edgeMat);
      leftEdge.position.x = -fw / 2;
      frameGroup.add(leftEdge);
      var rightEdge = new THREE.Mesh(new THREE.BoxGeometry(thickness, fh, thickness), edgeMat);
      rightEdge.position.x = fw / 2;
      frameGroup.add(rightEdge);

      // Inner fill
      var fillGeom = new THREE.PlaneGeometry(fw - thickness * 2, fh - thickness * 2);
      var fillMat = new THREE.MeshBasicMaterial({
        color: col, transparent: true, opacity: 0.1 + Math.random() * 0.1,
        side: THREE.DoubleSide, depthWrite: false
      });
      var fill = new THREE.Mesh(fillGeom, fillMat);
      frameGroup.add(fill);

      frameGroup.userData = {
        bx: (Math.random() - 0.5) * 10,
        by: (Math.random() - 0.5) * 6,
        bz: (Math.random() - 0.5) * 8,
        rx: (Math.random() - 0.5) * 0.5,
        ry: (Math.random() - 0.5) * 0.5,
        sp: Math.random() * 0.15 + 0.06,
        ph: Math.random() * Math.PI * 2
      };
      frameGroup.position.set(frameGroup.userData.bx, frameGroup.userData.by, frameGroup.userData.bz);
      frameGroup.rotation.set(frameGroup.userData.rx, frameGroup.userData.ry, 0);
      frames.push(frameGroup);
      mainGroup.add(frameGroup);
    }

    // Play button triangle floating in center
    var triShape = new THREE.Shape();
    var triSize = 0.5;
    triShape.moveTo(triSize, 0);
    triShape.lineTo(-triSize * 0.6, triSize * 0.7);
    triShape.lineTo(-triSize * 0.6, -triSize * 0.7);
    triShape.closePath();
    var triGeom = new THREE.ShapeGeometry(triShape);
    var triMat = new THREE.MeshBasicMaterial({
      color: palette[0], transparent: true, opacity: 0.35,
      side: THREE.DoubleSide, depthWrite: false
    });
    var playBtn = new THREE.Mesh(triGeom, triMat);
    mainGroup.add(playBtn);

    return function animate(dt, elapsed) {
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.04;
      mainGroup.rotation.y += (mouseX * 0.7 - mainGroup.rotation.y) * 0.035;
      mainGroup.rotation.x += (-mouseY * 0.2 - mainGroup.rotation.x) * 0.035;
      var t = elapsed * 0.001;
      for (var i = 0; i < frames.length; i++) {
        var f = frames[i];
        f.position.y = f.userData.by + Math.sin(t * f.userData.sp + f.userData.ph) * 1.3;
        f.position.x = f.userData.bx + Math.cos(t * f.userData.sp * 0.7 + f.userData.ph) * 0.7;
        f.rotation.z += dt * 0.05;
        f.rotation.y += dt * 0.03;
      }
      // Play button pulse
      playBtn.scale.setScalar(1 + Math.sin(t * 1.2) * 0.08);
      playBtn.rotation.z += dt * 0.08;
      playBtn.material.opacity = 0.3 + Math.sin(t * 1.2) * 0.1;
    };
  }

  /* ----- Preset Registry ----- */
  var presets = {
    particles: presetParticles,
    image: presetImage,
    pdf: presetPdf,
    audio: presetAudio,
    video: presetVideo
  };

  /* ----- Switch Preset ----- */
  window.switchBgPreset = function (name, hexColor) {
    if (!THREE) return;
    if (currentPreset === name) return;

    cleanupFn = null;
    while (mainGroup.children.length > 0) mainGroup.remove(mainGroup.children[0]);
    while (scene.children.length > 0) scene.remove(scene.children[0]);
    scene.add(mainGroup);
    mainGroup.position.set(0, 0, 0);
    mainGroup.rotation.set(0, 0, 0);
    mainGroup.scale.set(1, 1, 1);

    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 14);
    camera.lookAt(0, 0, 0);

    var fn = presets[name];
    if (!fn) return;
    cleanupFn = fn(hexColor || '#007AFF');
    currentPreset = name;
  };

  /* ----- Animation Loop ----- */
  var lastTime = 0, elapsed = 0;
  function loop(time) {
    animId = requestAnimationFrame(loop);
    var dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    elapsed += dt * 1000;
    if (cleanupFn) cleanupFn(dt, elapsed);
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (animId) { cancelAnimationFrame(animId); animId = null; } }
    else { if (!animId) { lastTime = performance.now(); animId = requestAnimationFrame(loop); } }
  });

  /* ----- Init ----- */
  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('touchmove', onTouchMove, { passive: true });

  loadScript('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js', function () {
    THREE = window.THREE;
    setup();
    var preset = canvas.dataset.preset || 'particles';
    var color = canvas.dataset.color || '#007AFF';
    window.switchBgPreset(preset, color);
    lastTime = performance.now();
    animId = requestAnimationFrame(loop);
  });

})();
