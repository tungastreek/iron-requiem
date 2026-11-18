// ===== Battle animation scene: actors, VFX (bloom, particles, beams), cut-ins =====
'use strict';
const SCENE = (() => {
  const W = 1280, H = 720, GROUND = 560;
  let cv, ctx, ecv, ectx, bcv, bctx, raf = 0, use3D = false, bgCv = null, bgCtx = null;
  let now = 0, last = 0, timeScale = 1, hitstop = 0, running = false, skipAll = false;
  let shake = 0, flashA = 0, flashCol = '#fff', tintA = 0, tintCol = '#000', bgOff = 0, bgSpeed = 20, bgKey = 'sky', zoom = 1, zoomTarget = 1;
  const parts = [], fxs = [], tweens = [], waiters = [], texts = [];
  let actors = {}; let hud = null; let cut = null; let banner = null;

  function init() {
    cv = document.getElementById('battleCanvas'); ctx = cv.getContext('2d');
    cv.width = W; cv.height = H;
    ecv = document.createElement('canvas'); ecv.width = W; ecv.height = H; ectx = ecv.getContext('2d');
    bcv = document.createElement('canvas'); bcv.width = W / 4; bcv.height = H / 4; bctx = bcv.getContext('2d');
    document.getElementById('battle3d').hidden = true;
    const ff = () => { if (running) timeScale = timeScale === 1 ? 3 : 1; };
    cv.addEventListener('pointerdown', ff);
    window.addEventListener('keydown', e => { if (!running) return; if (e.key === 'Escape') skipAll = true; if (e.key === ' ' || e.key === 'Enter') ff(); });
  }
  // ---------- timing ----------
  function wait(ms) { if (skipAll) return Promise.resolve(); return new Promise(r => waiters.push({ t: now + ms, r })); }
  const EASE = { lin: t => t, out: t => 1 - Math.pow(1 - t, 3), in: t => t * t * t, io: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, back: t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
  function tween(obj, to, dur, ease = 'out') {
    if (skipAll) { Object.assign(obj, to); return Promise.resolve(); }
    return new Promise(r => { const from = {}; for (const k in to) from[k] = obj[k]; tweens.push({ obj, from, to, start: now, dur, ease: EASE[ease], r }); });
  }
  function setPose(a, name, dur = 160) { a.poseName = name; a.poseFrom = Object.assign({}, a.pose); a.poseTo = ART.POSES[name]; a.poseStart = now; a.poseDur = dur; }

  // ---------- particles ----------
  function P(o) { parts.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, life: 600, age: 0, size: 4, col: '#fff', type: 'glow', drag: 0.98, grav: 0, rot: 0, vr: 0, em: true }, o)); }
  function sparks(x, y, n, col, spd = 9, life = 450) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = spd * (0.3 + Math.random()); P({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.5 + Math.random()), size: 2 + Math.random() * 2, col, type: 'spark', drag: 0.93, grav: 0.15 }); } }
  function explosion(x, y, sz = 1, col = '#ffb347') {
    P({ x, y, size: 80 * sz, life: 260, col: '#ffffff', type: 'glow', drag: 1 });
    P({ x, y, size: 10, life: 500, col, type: 'ring', grow: 9 * sz, drag: 1 });
    for (let i = 0; i < 18 * sz; i++) { const a = Math.random() * Math.PI * 2, s = (2 + Math.random() * 6) * sz; P({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 500 + Math.random() * 400, size: (14 + Math.random() * 22) * sz, col, type: 'fire', drag: 0.92 }); }
    for (let i = 0; i < 10 * sz; i++) { const a = Math.random() * Math.PI * 2, s = (1 + Math.random() * 3) * sz; P({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, life: 1200 + Math.random() * 800, size: (18 + Math.random() * 20) * sz, col: '#2a2224', type: 'smoke', drag: 0.96, em: false }); }
    for (let i = 0; i < 8 * sz; i++) { const a = -Math.random() * Math.PI, s = 4 + Math.random() * 8; P({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 900, size: 3 + Math.random() * 4, col: '#3a3a44', type: 'debris', drag: 0.99, grav: 0.35, vr: (Math.random() - 0.5) * 0.4, em: false }); }
    sparks(x, y, 20 * sz, '#fff1c0', 12 * sz);
    shake = Math.max(shake, 10 * sz); SFX.play(sz > 1.3 ? 'bigboom' : 'boom');
  }
  function ring(x, y, col, grow = 6, life = 500, size = 8, width = 4) { P({ x, y, size, life, col, type: 'ring', grow, drag: 1, width }); }
  // ---------- custom FX drawables ----------
  function FX(o) { const f = Object.assign({ age: 0, life: 500 }, o); fxs.push(f); return f; }
  function beam(x1, y1, x2, y2, w, col, life, opt = {}) {
    return FX({ life, draw(c, e, k) {
      const fade = Math.min(1, (1 - k) * 4) * Math.min(1, k * 12);
      const ang = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1) * (opt.grow ? Math.min(1, k * 6) : 1);
      const ww = w * (1 + Math.sin(now * 0.06) * 0.12) * fade;
      e.save(); e.translate(x1, y1); e.rotate(ang);
      let g = e.createLinearGradient(0, -ww, 0, ww); g.addColorStop(0, ART.rgba(col, 0)); g.addColorStop(0.3, ART.rgba(col, 0.7)); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(0.7, ART.rgba(col, 0.7)); g.addColorStop(1, ART.rgba(col, 0));
      e.fillStyle = g; e.fillRect(0, -ww, len, ww * 2);
      // swirl
      e.strokeStyle = ART.rgba(col, 0.6 * fade); e.lineWidth = 2;
      e.beginPath(); for (let x = 0; x < len; x += 8) e.lineTo(x, Math.sin(x * 0.05 - now * 0.03) * ww * 0.9); e.stroke();
      ART.glowDot(e, 0, 0, ww * 2.2, col, fade);
      e.restore();
    } });
  }
  function slashArc(x, y, r, a0, a1, col, width = 18, life = 320) {
    return FX({ life, draw(c, e, k) {
      const p = Math.min(1, k * 3), fade = 1 - Math.max(0, (k - 0.35) / 0.65);
      const aEnd = a0 + (a1 - a0) * p;
      e.save(); e.translate(x, y);
      for (let i = 0; i < 3; i++) {
        e.beginPath(); e.arc(0, 0, r, a0 + (aEnd - a0) * (i * 0.15), aEnd, a1 < a0);
        e.strokeStyle = i === 2 ? `rgba(255,255,255,${fade})` : ART.rgba(col, 0.5 * fade); e.lineWidth = width * (1 - i * 0.35) * fade + 1; e.lineCap = 'round'; e.stroke();
      }
      e.restore();
    } });
  }
  function lineSlash(x, y, ang, len, col, width = 14, life = 300) {
    return FX({ life, draw(c, e, k) {
      const p = Math.min(1, k * 4), fade = 1 - Math.max(0, (k - 0.3) / 0.7);
      e.save(); e.translate(x, y); e.rotate(ang);
      const g = e.createLinearGradient(-len / 2, 0, len / 2, 0); g.addColorStop(0, ART.rgba(col, 0)); g.addColorStop(0.5, '#fff'); g.addColorStop(1, ART.rgba(col, 0));
      e.fillStyle = g; e.beginPath(); e.moveTo(-len / 2, 0); e.quadraticCurveTo(0, -width * fade, -len / 2 + len * p, 0); e.quadraticCurveTo(0, width * fade * 0.4, -len / 2, 0); e.fill();
      e.strokeStyle = ART.rgba(col, fade); e.lineWidth = 3; e.beginPath(); e.moveTo(-len / 2, 0); e.lineTo(-len / 2 + len * p, 0); e.stroke();
      e.restore();
    } });
  }
  function bolt(x1, y1, x2, y2, col, life = 220, width = 3) {
    const pts = []; const n = 10; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([x1 + (x2 - x1) * t + (i && i < n ? (Math.random() - 0.5) * 50 : 0), y1 + (y2 - y1) * t + (i && i < n ? (Math.random() - 0.5) * 50 : 0)]); }
    return FX({ life, draw(c, e, k) { const f = 1 - k; e.strokeStyle = ART.rgba(col, f); e.lineWidth = width * 3; e.beginPath(); pts.forEach((p, i) => i ? e.lineTo(p[0], p[1]) : e.moveTo(p[0], p[1])); e.stroke(); e.strokeStyle = `rgba(255,255,255,${f})`; e.lineWidth = width; e.stroke(); } });
  }
  function barrierFX(x, y, r, col) {
    return FX({ life: 600, draw(c, e, k) {
      const f = 1 - k; e.save(); e.translate(x, y); e.strokeStyle = ART.rgba(col, f); e.lineWidth = 2;
      for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) { const hx = (i - 2.5) * 26 + (j % 2) * 13, hy = (j - 2) * 22; if (hx * hx + hy * hy > r * r) continue; e.beginPath(); for (let s = 0; s < 6; s++) { const a = s * Math.PI / 3; e.lineTo(hx + Math.cos(a) * 13, hy + Math.sin(a) * 13); } e.closePath(); e.stroke(); }
      const g = e.createRadialGradient(0, 0, r * 0.4, 0, 0, r); g.addColorStop(0, ART.rgba(col, 0)); g.addColorStop(1, ART.rgba(col, 0.5 * f)); e.fillStyle = g; e.beginPath(); e.arc(0, 0, r, 0, Math.PI * 2); e.fill();
      e.restore();
    } });
  }
  // projectile travelling from->to; resolves on arrival
  function projectile(kind, x1, y1, x2, y2, dur, col, opt = {}) {
    if (skipAll) return Promise.resolve();
    return new Promise(res => {
      const cx = opt.curve ? (x1 + x2) / 2 + (opt.cx || 0) : 0, cy = opt.curve ? Math.min(y1, y2) - (opt.cy || 200) : 0;
      let lastX = x1, lastY = y1;
      FX({ life: dur, draw(c, e, k) {
        let x, y;
        if (opt.curve) { const u = 1 - k; x = u * u * x1 + 2 * u * k * cx + k * k * x2; y = u * u * y1 + 2 * u * k * cy + k * k * y2; } else { x = x1 + (x2 - x1) * k; y = y1 + (y2 - y1) * k; }
        const ang = Math.atan2(y - lastY, x - lastX);
        if (kind === 'tracer' || kind === 'bolt') {
          e.save(); e.translate(x, y); e.rotate(ang); const L = kind === 'bolt' ? 70 : 34, ww = kind === 'bolt' ? 7 : 3;
          const g = e.createLinearGradient(-L, 0, 0, 0); g.addColorStop(0, ART.rgba(col, 0)); g.addColorStop(1, '#fff'); e.fillStyle = g; e.fillRect(-L, -ww / 2, L, ww); ART.glowDot(e, 0, 0, ww * 3, col); e.restore();
        } else if (kind === 'missile') {
          c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = '#d8dce4'; c.fillRect(-10, -2.5, 14, 5); c.fillStyle = '#e0373f'; c.fillRect(2, -2.5, 3, 5); c.restore();
          ART.glowDot(e, x - Math.cos(ang) * 10, y - Math.sin(ang) * 10, 10, '#ffb347');
          if (Math.random() < 0.9) P({ x: x - Math.cos(ang) * 10, y: y - Math.sin(ang) * 10, vx: (Math.random() - 0.5), vy: (Math.random() - 0.5), size: 7, life: 700, col: '#9a9aa6', type: 'smoke', em: false, drag: 0.97 });
        } else if (kind === 'shell') {
          ART.glowDot(e, x, y, 26, col); c.fillStyle = '#333'; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill();
          P({ x, y, size: 10, life: 500, col: '#6a6a70', type: 'smoke', em: false, drag: 0.97 });
        } else if (kind === 'orb') {
          const r = opt.r || 26; ART.glowDot(e, x, y, r * 2, col); ART.glowDot(e, x, y, r, '#ffffff');
          P({ x, y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, size: r * 0.8, life: 400, col, type: 'fire' });
        } else if (kind === 'fist') {
          c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = opt.c2 || '#c8102e'; c.fillRect(-26, -12, 34, 24); c.fillStyle = opt.c1 || '#333'; c.fillRect(4, -14, 16, 28); c.strokeStyle = '#000'; c.lineWidth = 2; c.strokeRect(-26, -12, 34, 24); c.restore();
          ART.flame(e, x - Math.cos(ang) * 24, y - Math.sin(ang) * 24, ang + Math.PI, 70, '#ffb347', now / 1000);
        } else if (kind === 'wave') {
          e.strokeStyle = ART.rgba(col, 0.8); e.lineWidth = 4; e.beginPath(); e.arc(x, y, 30, ang - 0.9, ang + 0.9); e.stroke();
        }
        lastX = x; lastY = y;
      }, done: () => res() });
    });
  }

  // ---------- actors ----------
  function makeActor(u, side) {
    const m = MECHS[u.mech]; const sc = SIZE_SCALE[m.size] * (['colossus', 'hollow'].includes(m.vis.body) ? 0.95 : m.vis.body === 'ship' ? 1.05 : m.vis.body === 'dragon' ? 1.25 : 1.6);
    const x = side === 'L' ? 330 : 950;
    const c = document.createElement('canvas'); c.width = 900; c.height = 900;
    const spr = (typeof ASSETS !== 'undefined') ? ASSETS.unit(u.mech) : null;
    let sprScale = 1; if (spr) { const tgt = { S: 160, M: 200, L: 245, XL: 300 }[m.size] || 200; sprScale = Math.min(tgt / (spr.h * spr.ground), (m.size === 'XL' ? 520 : 430) / spr.w); }
    return { spr, sprScale, fly: !!m.fly, poseName: 'idle', u, m, side, dir: side === 'L' ? 1 : -1, x, baseX: x, y: GROUND, ox: 0, oy: 0, scale: sc, pose: Object.assign({}, ART.POSES.idle), poseFrom: null, poseTo: null, flash: 0, alpha: 1, visible: true, after: [], opts: {}, anchors: null, cv: c, cx: c.getContext('2d'), hp: u.hp, dispHP: u.hp, maxHP: CB.mstats(u).hp, en: u.en, will: u.will, ghost: 0 };
  }
  function anchor(a, key) {
    if (use3D && a.anchors3d) return (a.anchors3d[key === 'core' ? 'core' : key === 'head' ? 'head' : 'hand']).slice();
    const an = a.anchors || { coreX: 0, coreY: -70, handX: 30, handY: -60, headY: -110 };
    const lx = key === 'core' ? an.coreX : key === 'head' ? 6 : an.handX;
    const ly = key === 'core' ? an.coreY : key === 'head' ? an.headY + 10 : an.handY;
    return [a.x + a.ox + a.dir * lx * a.scale, a.y + a.oy + ly * a.scale];
  }
  function center(a) { if (use3D && a.anchors3d) { const c = a.anchors3d.core, hd = a.anchors3d.head; return [c[0] * 0.7 + (a.x + a.ox) * 0.3, c[1] * 0.6 + (hd[1] + 40 * a.scale) * 0.4]; } const an = a.anchors; const cy = an ? (an.coreY + 8) : -70; return [a.x + a.ox + a.dir * (an ? an.coreX * 0.3 : 0) * a.scale, a.y + a.oy + cy * a.scale]; }
  const ATTACK_POSES = ['aim', 'raise', 'swing', 'punch', 'chest', 'dash'], HIT_POSES = ['hurt', 'guard'];
  function renderActor(a, t) {
    if (!a.visible) return;
    const c = a.cx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 900, 900);
    if (a.spr) {
      // painted sprite: idle A/B at ~3 fps, attack frame while attacking, hit frame while recoiling
      const fi = HIT_POSES.includes(a.poseName) ? 3 : ATTACK_POSES.includes(a.poseName) ? 2 : (Math.floor(t * 3 + (a.side === 'L' ? 0 : 0.5)) % 2);
      const f = a.spr.frames[fi] || a.spr.frames[0], s = a.sprScale, w = f.width * s, h = f.height * s;
      const hover = a.fly ? -28 + Math.sin(t * 2.2) * 6 : 0, breathe = 1 + Math.sin(t * 2.4) * 0.008;
      c.translate(450, 700 + hover); c.scale(1, breathe);
      c.drawImage(f, -w / 2, -h * a.spr.ground, w, h);
      a.scale = 1; const gh = h * a.spr.ground;
      a.anchors = { coreX: 0, coreY: -gh * 0.52 + hover, handX: w * 0.38, handY: -gh * 0.6 + hover, headY: -gh * 0.9 + hover };
      if (use3D) { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(a.x + a.ox, GROUND + 4, w * 0.32, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    } else {
      c.translate(450, 700); c.scale(a.scale, a.scale);
      a.anchors = ART.drawMech(c, a.m.vis, Object.assign({ t, pose: a.pose }, a.opts));
    }
    if (a.flash > 0) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = `rgba(255,255,255,${Math.min(1, a.flash)})`; c.fillRect(0, 0, 900, 900); c.globalCompositeOperation = 'source-over'; }
    // afterimages
    a.after.forEach(g => { ctx.save(); ctx.globalAlpha = g.a * 0.5; ctx.translate(g.x, g.y); ctx.scale(a.dir, 1); ctx.filter = 'hue-rotate(160deg) saturate(2)'; ctx.drawImage(g.img, -450, -700); ctx.restore(); });
    ctx.save(); ctx.globalAlpha = a.alpha; ctx.translate(a.x + a.ox, a.y + a.oy); ctx.scale(a.dir, 1); ctx.drawImage(a.cv, -450, -700); ctx.restore();
  }
  function afterimage(a) { if (use3D && !a.spr) { R3D.ghost(a); return; } const img = document.createElement('canvas'); img.width = 900; img.height = 900; img.getContext('2d').drawImage(a.cv, 0, 0); a.after.push({ img, x: a.x + a.ox, y: a.y + a.oy, a: 1 }); if (a.after.length > 6) a.after.shift(); }

  // ---------- text pops ----------
  function popText(x, y, str, col, size = 42, life = 1100, opt = {}) { texts.push({ x, y, str, col, size, life, age: 0, vy: opt.vy != null ? opt.vy : -0.6, italic: opt.italic !== false }); }

  // ---------- render loop ----------
  function frame(ts) {
    if (!running) return;
    const realDt = Math.min(50, ts - (last || ts)); last = ts;
    let dt = realDt * timeScale; if (skipAll) dt = 1000;
    if (hitstop > 0) { hitstop -= realDt; dt *= 0.05; }
    now += dt;
    // tweens
    for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i]; const k = Math.min(1, (now - tw.start) / tw.dur); const e = tw.ease(k); for (const key in tw.to) tw.obj[key] = tw.from[key] + (tw.to[key] - tw.from[key]) * e; if (k >= 1) { tweens.splice(i, 1); tw.r(); } }
    for (let i = waiters.length - 1; i >= 0; i--) if (now >= waiters[i].t) { waiters[i].r(); waiters.splice(i, 1); }
    for (const k in actors) { const a = actors[k]; if (a.poseTo) { const p = Math.min(1, (now - a.poseStart) / a.poseDur); a.pose = ART.lerpPose(a.poseFrom, a.poseTo, EASE.out(p)); if (p >= 1) a.poseTo = null; } a.flash = Math.max(0, a.flash - dt / 120); a.after.forEach(g => g.a -= dt / 300); a.after = a.after.filter(g => g.a > 0); a.dispHP += (a.hp - a.dispHP) * Math.min(1, dt / 160); }
    zoom += (zoomTarget - zoom) * Math.min(1, dt / 200);
    bgOff += bgSpeed * dt / 1000;
    shake *= Math.pow(0.9, dt / 16); flashA = Math.max(0, flashA - dt / 350);
    // ---- draw
    const t = now / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (use3D) ctx.clearRect(0, 0, W, H);
    ctx.save();
    const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
    ctx.translate(W / 2 + sx, H / 2 + sy); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
    if (use3D) {
      if (!ASSETS.drawBattleBG(bgCtx, W, H, bgKey, bgOff)) ART.drawBG(bgCtx, W, H, bgKey, t, bgOff); if (bgSpeed > 200) speedLines(bgCtx);
      R3D.battleFrame(actors, t, sx, sy, zoom, bgOff);
      ctx.clearRect(-W, -H, W * 3, H * 3);
    } else {
      if (!ASSETS.drawBattleBG(ctx, W, H, bgKey, bgOff)) ART.drawBG(ctx, W, H, bgKey, t, bgOff);
      if (bgSpeed > 200) speedLines(ctx);
      for (const k in actors) { const a = actors[k]; if (!a.visible || a.spr) continue; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(a.x + a.ox, GROUND + 6, 70 * a.scale / 1.6, 10, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    ectx.setTransform(1, 0, 0, 1, 0, 0); ectx.clearRect(0, 0, W, H); ectx.globalCompositeOperation = 'lighter';
    for (const k of ['L', 'R', 'S']) { const a = actors[k]; if (a && (!use3D || a.spr)) renderActor(a, t); }
    // particles
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.age += dt; if (p.age >= p.life) { parts.splice(i, 1); continue; }
      const f = dt / 16; p.vx *= Math.pow(p.drag, f); p.vy *= Math.pow(p.drag, f); p.vy += p.grav * f; p.x += p.vx * f; p.y += p.vy * f; p.rot += p.vr * f;
      const k = p.age / p.life, c = p.em ? ectx : ctx;
      switch (p.type) {
        case 'glow': ART.glowDot(c, p.x, p.y, p.size * (1 - k * 0.5), p.col, 1 - k); break;
        case 'spark': c.strokeStyle = ART.rgba(p.col.startsWith('#') ? p.col : '#ffffff', 1 - k); c.lineWidth = p.size; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 3, p.y - p.vy * 3); c.stroke(); break;
        case 'fire': { const col = k < 0.3 ? '#fff3b0' : k < 0.6 ? p.col : '#a02a10'; ART.glowDot(c, p.x, p.y, p.size * (0.6 + k), col, (1 - k) * 0.9); break; }
        case 'smoke': c.fillStyle = `rgba(40,36,40,${0.45 * (1 - k)})`; c.beginPath(); c.arc(p.x, p.y, p.size * (1 + k * 1.5), 0, 7); c.fill(); break;
        case 'debris': c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.col; c.fillRect(-p.size, -p.size / 2, p.size * 2, p.size); c.restore(); break;
        case 'ring': c.strokeStyle = ART.rgba(p.col, 1 - k); c.lineWidth = (p.width || 4) * (1 - k) + 1; c.beginPath(); c.arc(p.x, p.y, p.size + p.grow * p.age / 16, 0, 7); c.stroke(); break;
        case 'feather': c.save(); c.translate(p.x + Math.sin(p.age * 0.005) * 10, p.y); c.rotate(Math.sin(p.age * 0.004)); ART.glowDot(c, 0, 0, p.size * 2, p.col, 1 - k); c.fillStyle = `rgba(255,255,255,${1 - k})`; c.beginPath(); c.ellipse(0, 0, p.size, p.size * 0.3, 0, 0, 7); c.fill(); c.restore(); break;
        case 'shard': c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = ART.rgba(p.col, 1 - k); c.beginPath(); c.moveTo(0, -p.size); c.lineTo(p.size * 0.4, 0); c.lineTo(0, p.size); c.lineTo(-p.size * 0.4, 0); c.fill(); c.restore(); break;
        case 'dark': c.fillStyle = `rgba(0,0,0,${0.8 * (1 - k)})`; c.beginPath(); c.arc(p.x, p.y, p.size, 0, 7); c.fill(); break;
      }
    }
    for (let i = fxs.length - 1; i >= 0; i--) { const f = fxs[i]; f.age += dt; const k = Math.min(1, f.age / f.life); f.draw(ctx, ectx, k); if (f.age >= f.life) { fxs.splice(i, 1); f.done && f.done(); } }
    // bloom composite
    bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, bcv.width, bcv.height); bctx.filter = 'blur(6px)'; bctx.drawImage(ecv, 0, 0, bcv.width, bcv.height); bctx.filter = 'none';
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.9; ctx.drawImage(bcv, 0, 0, W, H); ctx.globalAlpha = 1;
    ctx.drawImage(ecv, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    if (tintA > 0.01) { ctx.fillStyle = ART.rgba(tintCol, tintA); ctx.fillRect(0, 0, W, H); }
    // vignette
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // texts
    for (let i = texts.length - 1; i >= 0; i--) {
      const tx = texts[i]; tx.age += dt; if (tx.age > tx.life) { texts.splice(i, 1); continue; }
      const k = tx.age / tx.life, pop = k < 0.12 ? 1.6 - k * 5 : 1;
      ctx.save(); ctx.translate(tx.x, tx.y + tx.vy * tx.age * 0.06); ctx.scale(pop, pop); ctx.globalAlpha = k > 0.75 ? (1 - k) * 4 : 1;
      ctx.font = `${tx.italic ? 'italic ' : ''}800 ${tx.size}px "Chakra Petch", "Arial Black", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(tx.str, 0, 0);
      ctx.shadowColor = tx.col; ctx.shadowBlur = 18; ctx.fillStyle = tx.col; ctx.fillText(tx.str, 0, 0); ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillText(tx.str, 0, -1);
      ctx.restore();
    }
    drawHUD(t);
    if (banner) drawBanner(t);
    if (cut) drawCut(t);
    if (flashA > 0) { ctx.fillStyle = ART.rgba(flashCol, Math.min(1, flashA)); ctx.fillRect(0, 0, W, H); }
    raf = requestAnimationFrame(frame);
  }
  function speedLines(c) {
    c.save(); c.globalAlpha = 0.35; c.strokeStyle = '#fff';
    for (let i = 0; i < 40; i++) { const y = (i * 37 + now * 0.3) % H; const x = (i * 97 + now * 3) % (W + 400) - 200; c.lineWidth = 1 + (i % 3); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 200 + (i % 5) * 40, y); c.stroke(); }
    c.restore();
  }
  // ---------- HUD ----------
  function drawHUD(t) {
    for (const side of ['L', 'R']) {
      const a = actors.S && actors.S.side === side && actors.S.visible ? actors.S : actors[side];
      if (!a) continue;
      const x = side === 'L' ? 24 : W - 24 - 470, y = 22;
      ctx.save();
      ctx.fillStyle = 'rgba(6,10,20,0.78)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 470, y); ctx.lineTo(x + 450, y + 92); ctx.lineTo(x, y + 92); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = a.u.team === 'player' ? 'rgba(98,243,255,0.6)' : 'rgba(255,90,90,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      const pid = a.u.portrait || a.u.pilot; const pimg = ART.portrait(pid, 'normal', 96, 120);
      ctx.save(); ctx.beginPath(); ctx.rect(x + 6, y + 6, 72, 80); ctx.clip(); ctx.drawImage(pimg, x - 6, y + 2, 96, 120); ctx.restore();
      ctx.fillStyle = '#e9f3ff'; ctx.font = '700 20px "Chakra Petch", sans-serif'; ctx.textAlign = 'left'; ctx.fillText(a.m.name, x + 88, y + 26);
      ctx.fillStyle = '#9fb3c8'; ctx.font = '500 13px "Chakra Petch", sans-serif'; ctx.fillText((a.u.pname || NAMES[a.u.pilot] || '') + '  ·  ' + ARMOR[a.m.armor].name, x + 88, y + 44);
      // HP bar
      const bw = 300, frac = Math.max(0, a.dispHP / a.maxHP);
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 88, y + 54, bw, 12);
      const hg = ctx.createLinearGradient(x + 88, 0, x + 88 + bw, 0); hg.addColorStop(0, frac < 0.3 ? '#ff3b5c' : '#2bd9a0'); hg.addColorStop(1, frac < 0.3 ? '#ff8a3d' : '#62f3ff');
      ctx.fillStyle = hg; ctx.fillRect(x + 88, y + 54, bw * frac, 12);
      ctx.fillStyle = '#fff'; ctx.font = '600 13px "Chakra Petch", sans-serif'; ctx.fillText(`HP ${Math.max(0, Math.round(a.dispHP))} / ${a.maxHP}`, x + 88, y + 82);
      ctx.fillStyle = '#ffd166'; ctx.fillText(`WILL ${a.u.will}`, x + 260, y + 82);
      ctx.fillStyle = '#7dc8ff'; ctx.fillText(`EN ${a.u.en}`, x + 340, y + 82);
      ctx.restore();
    }
  }
  function drawBanner(t) {
    const b = banner; const k = Math.min(1, (now - b.start) / 180);
    const left = b.side === 'L';
    const y = H - 150, x = left ? -620 + 640 * EASE.out(k) : W - 20 - 620 * EASE.out(k);
    ctx.save();
    ctx.fillStyle = 'rgba(4,8,16,0.86)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 620, y); ctx.lineTo(x + 590, y + 120); ctx.lineTo(x - 30, y + 120); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = ART.rgba(b.col, 0.8); ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + 116, y + 4); ctx.lineTo(x + 92, y + 116); ctx.lineTo(x - 20, y + 116); ctx.closePath(); ctx.clip();
    ctx.drawImage(ART.portrait(b.pid, b.expr, 112, 140), x - 6, y - 4, 112, 140); ctx.restore();
    ctx.fillStyle = b.col; ctx.font = '700 15px "Chakra Petch", sans-serif'; ctx.fillText(b.name, x + 126, y + 28);
    ctx.fillStyle = '#fff'; ctx.font = '600 21px "Saira", "Chakra Petch", sans-serif';
    wrap(ctx, b.text.slice(0, Math.floor((now - b.start) / 18)), x + 126, y + 58, 450, 26);
    ctx.restore();
  }
  function wrap(c, s, x, y, w, lh) { const words = s.split(' '); let line = ''; for (const wd of words) { const tst = line + wd + ' '; if (c.measureText(tst).width > w && line) { c.fillText(line, x, y); line = wd + ' '; y += lh; } else line = tst; } c.fillText(line, x, y); }
  function drawCut(t) {
    const k = Math.min(1, (now - cut.start) / 260); const out = cut.end && now > cut.end - 200 ? (cut.end - now) / 200 : 1;
    ctx.save(); ctx.globalAlpha = Math.max(0, out);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
    // radial speed lines
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.strokeStyle = ART.rgba(cut.col, 0.35);
    for (let i = 0; i < 60; i++) { const a = i * 0.105 + now * 0.0004; ctx.lineWidth = 2 + (i % 4) * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 200, Math.sin(a) * 200); ctx.lineTo(Math.cos(a) * 1000, Math.sin(a) * 1000); ctx.stroke(); }
    ctx.restore();
    // eye band
    const by = 210, bh = 170, bx = (1 - EASE.out(k)) * (cut.side === 'R' ? W : -W);
    ctx.save(); ctx.translate(bx, 0);
    ctx.fillStyle = ART.rgba(cut.col, 0.9); ctx.fillRect(0, by - 6, W, bh + 12);
    ctx.beginPath(); ctx.rect(0, by, W, bh); ctx.clip();
    const p = ART.portrait(cut.pid, 'angry', 240, 300);
    ctx.drawImage(p, 0, 70, 240, 120, W / 2 - 560, by - 40, 1120, 560 * 0.5 + 40);
    ctx.restore();
    // text
    ctx.font = 'italic 800 34px "Chakra Petch", sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 6; ctx.strokeStyle = '#000'; ctx.strokeText(cut.text, W / 2, by + bh + 70); ctx.fillStyle = '#fff'; ctx.shadowColor = cut.col; ctx.shadowBlur = 20; ctx.fillText(cut.text, W / 2, by + bh + 70);
    ctx.font = '800 64px "Saira Condensed", "Chakra Petch", sans-serif'; ctx.fillStyle = cut.col; ctx.strokeText(cut.wname.toUpperCase(), W / 2, by - 40); ctx.fillText(cut.wname.toUpperCase(), W / 2, by - 40);
    ctx.restore();
  }

  // ---------- reactions ----------
  async function react(d, a, res, ctxo) {
    // ctxo: {final, x, y, power, state}
    const st = ctxo.state; const [cx, cy] = ctxo.x != null ? [ctxo.x, ctxo.y] : center(d);
    if (!res.hit) {
      if (st.dodged) return; st.dodged = true;
      afterimage(d); SFX.play('whoosh');
      tween(d, { ox: -d.dir * 70, oy: -50 }, 140, 'out').then(() => { afterimage(d); return wait(260); }).then(() => tween(d, { ox: 0, oy: 0 }, 260, 'io'));
      popText(cx, cy - 60, 'MISS', '#9fd8ff', 46);
      return;
    }
    const pw = ctxo.power || 1;
    if (res.barrier) { barrierFX(cx, cy, 110, '#c9a6ff'); SFX.play('barrier'); if (ctxo.final || !st.barrierShown) { popText(cx, cy - 110, res.barrier.name.toUpperCase(), '#d9b8ff', 28); st.barrierShown = true; } }
    d.flash = 1; shake = Math.max(shake, 6 * pw);
    sparks(cx + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 40, Math.round(10 * pw), '#ffe9b0', 10);
    P({ x: cx, y: cy, size: 50 * pw, life: 200, col: ctxo.col || '#fff', type: 'glow', drag: 1 });
    SFX.play('hit');
    if (!st.knock) { st.knock = true; setPose(d, ctxo.mode === 'defend' ? 'guard' : 'hurt', 80); tween(d, { ox: -d.dir * 26 }, 90, 'out').then(() => wait(250)).then(() => { tween(d, { ox: 0 }, 300, 'io'); setPose(d, 'idle', 300); }); }
    if (ctxo.final) {
      hitstop = res.crit ? 140 : 70;
      d.hp = st.hpAfter;
      popText(cx, cy - 30, String(res.dmg), res.crit ? '#ffd166' : '#ffffff', res.crit ? 64 : 52, 1400);
      if (res.crit) popText(cx, cy - 100, 'CRITICAL!', '#ffd166', 34, 1200);
      const ef = effLabel(res.mult); if (res.mult !== 1) popText(cx, cy + 40, ef.t, ef.c, 26, 1300, { vy: 0.2 });
      if (res.status) popText(cx, cy + 80, STATUS[res.status].name.toUpperCase() + '!', STATUS[res.status].color, 26, 1400, { vy: 0.2 });
      if (ctxo.mode === 'defend') popText(cx, cy - 150, 'GUARD', '#9fd8ff', 26);
    }
  }
  async function destroy(d) {
    const [cx, cy] = center(d);
    SFX.play('alarm');
    for (let i = 0; i < 6; i++) { explosion(cx + (Math.random() - 0.5) * 120 * d.scale / 1.6, cy + (Math.random() - 0.5) * 120 * d.scale / 1.6, 0.8 + Math.random() * 0.5); d.flash = 1; await wait(150); }
    hitstop = 200; flashA = 1; flashCol = '#ffffff';
    explosion(cx, cy, 2.4, '#ffcc66'); ring(cx, cy, '#ffffff', 22, 700, 20, 10);
    d.visible = false;
    await wait(900);
  }

  // ---------- attack animations ----------
  function typeCol(w) { return ATK[w.type].color; }
  async function anim(kind, a, d, w, res, st, final) {
    const col = typeCol(w);
    const tgt = () => center(d);
    const hand = () => anchor(a, 'hand');
    const R = (o = {}) => react(d, a, res, Object.assign({ state: st, col, mode: st.mode }, o));
    switch (kind) {
      case 'rifle': {
        setPose(a, 'aim', 200); await wait(260);
        const n = w.big ? 1 : 3;
        for (let i = 0; i < n; i++) {
          const [hx, hy] = hand(); const [tx, ty] = tgt();
          P({ x: hx, y: hy, size: 40, life: 120, col, type: 'glow', drag: 1 }); SFX.play(w.type === 'BEAM' ? 'laser' : 'shot');
          const yy = ty + (i - 1) * 18;
          const pr = projectile(w.type === 'BEAM' ? 'bolt' : 'tracer', hx, hy, res.hit ? tx : tx - d.dir * 10, res.hit ? yy : yy - 120, 170, col);
          pr.then(() => R({ final: final && i === n - 1, x: tx, y: yy, power: 0.8 }));
          await wait(150);
        }
        await wait(500); setPose(a, 'idle', 300); break;
      }
      case 'vulcan': {
        setPose(a, 'aim', 160); a.opts.spin = 4; await wait(200);
        for (let i = 0; i < 14; i++) {
          const [hx, hy] = w.name.includes('Head') ? anchor(a, 'head') : hand(); const [tx, ty] = tgt();
          SFX.play('shot', 0.5); P({ x: hx, y: hy, size: 18, life: 60, col: '#ffe080', type: 'glow', drag: 1 });
          const ox = (Math.random() - 0.5) * 60, oy = (Math.random() - 0.5) * 60;
          projectile('tracer', hx, hy, tx + ox, ty + oy + (res.hit ? 0 : -110), 130, '#ffd27a').then(() => { if (res.hit) { sparks(tx + ox, ty + oy, 4, '#ffe9b0', 6); } if (i === 0 || i === 13) R({ final: final && i === 13, x: tx, y: ty, power: 0.6 }); });
          await wait(55);
        }
        await wait(400); a.opts.spin = 1; setPose(a, 'idle', 300); break;
      }
      case 'cannon': {
        setPose(a, 'aim', 200); await wait(300);
        const [hx, hy] = hand(); const [tx, ty] = tgt();
        explosionMuzzle(hx, hy, a.dir, w.big); tween(a, { ox: -a.dir * 20 }, 80).then(() => tween(a, { ox: 0 }, 300));
        await projectile('shell', hx, hy, tx, res.hit ? ty : ty - 140, w.big ? 380 : 260, '#ffb347');
        if (res.hit) explosion(tx, ty, w.big ? 1.6 : 1.0);
        await R({ final, x: tx, y: ty, power: w.big ? 1.6 : 1 });
        await wait(700); setPose(a, 'idle', 300); break;
      }
      case 'missile': {
        setPose(a, 'chest', 200); await wait(240);
        const n = 10; const [tx, ty] = tgt(); const ps = [];
        for (let i = 0; i < n; i++) {
          const [sx, sy] = anchor(a, 'core'); SFX.play('missile', 0.6);
          const ex = tx + (Math.random() - 0.5) * 80, ey = ty + (Math.random() - 0.5) * 80 + (res.hit ? 0 : -160);
          ps.push(projectile('missile', sx, sy - 30, ex, ey, 700 + i * 40, '#ffb347', { curve: true, cy: 180 + Math.random() * 160, cx: (Math.random() - 0.5) * 300 }).then(() => { if (res.hit) explosion(ex, ey, 0.55); if (i === 0 || i === n - 1) R({ final: final && i === n - 1, x: tx, y: ty, power: 0.8 }); }));
          await wait(50);
        }
        await Promise.all(ps); await wait(600); setPose(a, 'idle', 300); break;
      }
      case 'beam': {
        setPose(a, 'aim', 220); await wait(200);
        await charge(a, hand, col, 700);
        const [hx, hy] = hand(); const [tx, ty] = tgt(); SFX.play('beam');
        const ex = res.hit ? tx : tx - d.dir * 300, ey = res.hit ? ty : ty - 150;
        beam(hx, hy, ex, ey, 26, col, 800, { grow: true }); flashA = 0.35; flashCol = col; shake = 8;
        await wait(120); R({ final: false, x: tx, y: ty, power: 0.7 });
        for (let i = 0; i < 6; i++) { if (res.hit) sparks(tx, ty, 6, col, 12); await wait(90); }
        if (res.hit) explosion(tx, ty, 1.2, col);
        await R({ final, x: tx, y: ty, power: 1.2 });
        await wait(600); setPose(a, 'idle', 300); break;
      }
      case 'megabeam': {
        const chest = w.chestBeam || a.m.vis.body !== 'humanoid';
        setPose(a, chest ? 'chest' : 'aim', 300); a.opts.coreGlow = 1;
        const src = () => chest ? anchor(a, 'core') : hand();
        tintCol = '#000'; tween({ get v() { return tintA; }, set v(x) { tintA = x; } }, { v: 0.45 }, 300);
        await charge(a, src, col, 1100, true);
        const [sx, sy] = src(); const [tx, ty] = tgt(); SFX.play('megabeam');
        const ex = res.hit ? tx + d.dir * -40 : tx - d.dir * 300, ey = res.hit ? ty : ty - 180;
        beam(sx, sy, ex + (ex - sx) * 0.4, ey + (ey - sy) * 0.4, 70, col, 1300, { grow: true }); flashA = 0.7; flashCol = col; shake = 16; zoomTarget = 1.05;
        await wait(150); R({ x: tx, y: ty, power: 1 });
        for (let i = 0; i < 9; i++) { if (res.hit) { sparks(tx, ty, 8, col, 16); P({ x: tx, y: ty, size: 90, life: 180, col, type: 'glow' }); } shake = 14; await wait(100); }
        if (res.hit) explosion(tx, ty, 1.8, col);
        await R({ final, x: tx, y: ty, power: 1.8 });
        tween({ get v() { return tintA; }, set v(x) { tintA = x; } }, { v: 0 }, 400); zoomTarget = 1; a.opts.coreGlow = 1;
        await wait(700); setPose(a, 'idle', 300); break;
      }
      case 'slash': {
        const own = ['sword', 'axe', 'lance', 'drill'].includes(a.m.vis.weapon);
        if (!own && a.m.vis.body === 'humanoid') a.opts.weapon = 'saber';
        if (w.type === 'PLAS') { a.opts.bladeCol = '#ff7a2e'; }
        setPose(a, 'raise', 200); await wait(250);
        await dash(a, d);
        setPose(a, 'swing', 90); SFX.play('slash');
        const [tx, ty] = tgt();
        if (res.hit) { slashArc(tx - d.dir * 20, ty, 110 * (w.big ? 1.4 : 1), -2.2 * a.dir + (a.dir < 0 ? Math.PI : 0), 0.9 * a.dir + (a.dir < 0 ? Math.PI : 0), col, w.big ? 30 : 20); hitstop = 90; }
        await R({ final, x: tx, y: ty, power: w.big ? 1.4 : 1 });
        await wait(400); await dashBack(a); a.opts.weapon = null; a.opts.bladeCol = null; setPose(a, 'idle', 300); break;
      }
      case 'multislash': {
        if (!['sword', 'axe', 'lance'].includes(a.m.vis.weapon) && a.m.vis.body === 'humanoid') a.opts.weapon = 'saber';
        setPose(a, 'raise', 150); await wait(150);
        await dash(a, d);
        const [tx, ty] = tgt();
        const angs = [-0.6, 0.7, -1.4, 1.2, 0.1];
        for (let i = 0; i < angs.length; i++) {
          afterimage(a); a.ox += (Math.random() - 0.5) * 60; a.oy = (Math.random() - 0.5) * 80;
          setPose(a, i % 2 ? 'raise' : 'swing', 60); SFX.play('slash', 0.7);
          if (res.hit) lineSlash(tx, ty, angs[i], 260, col, 18, 280);
          R({ final: false, x: tx + (Math.random() - 0.5) * 30, y: ty + (Math.random() - 0.5) * 30, power: 0.7 });
          await wait(110);
        }
        a.oy = 0;
        if (res.hit) { lineSlash(tx, ty, 0.78, 360, col, 26, 420); lineSlash(tx, ty, -0.78, 360, col, 26, 420); hitstop = 160; flashA = 0.5; flashCol = '#fff'; }
        await wait(160); if (res.hit) explosion(tx, ty, 1.2, col);
        await R({ final, x: tx, y: ty, power: 1.4 });
        await wait(400); await dashBack(a); a.opts.weapon = null; setPose(a, 'idle', 300); break;
      }
      case 'punch': {
        setPose(a, 'punch', 200); await wait(300);
        const [hx, hy] = hand(); const [tx, ty] = tgt(); SFX.play('rocket');
        a.opts.weapon = 'fist';
        await projectile('fist', hx, hy, res.hit ? tx : tx - d.dir * 300, res.hit ? ty : ty - 80, 380, '#ffb347', { c1: a.m.vis.c1, c2: a.m.vis.c2 });
        if (res.hit) { explosion(tx, ty, 1.1); hitstop = 120; }
        await R({ final, x: tx, y: ty, power: 1.3 });
        await wait(500); a.opts.weapon = null; setPose(a, 'idle', 300); break;
      }
      case 'drill': {
        a.opts.spin = 3; setPose(a, 'punch', 200); await wait(200);
        await dash(a, d, 60); SFX.play('drill');
        const [tx, ty] = tgt();
        for (let i = 0; i < 10; i++) { if (res.hit) { sparks(tx, ty, 8, '#ffd27a', 14); shake = 8; } if (i === 0) R({ x: tx, y: ty, power: 0.6 }); await wait(60); }
        if (res.hit) { explosion(tx, ty, 1.1); hitstop = 100; }
        await R({ final, x: tx, y: ty, power: 1.3 });
        await wait(300); await dashBack(a); a.opts.spin = 1; setPose(a, 'idle', 300); break;
      }
      case 'funnel': {
        setPose(a, 'chest', 200);
        const bits = []; const [sx, sy] = anchor(a, 'core'); const [tx, ty] = tgt();
        for (let i = 0; i < 6; i++) bits.push({ x: sx, y: sy, i });
        let alive = true;
        FX({ life: 2400, draw(c, e) { for (const b of bits) { ART.glowDot(e, b.x, b.y, 16, col); c.fillStyle = '#ddd'; c.beginPath(); c.moveTo(b.x, b.y - 8); c.lineTo(b.x + 5, b.y); c.lineTo(b.x, b.y + 8); c.lineTo(b.x - 5, b.y); c.fill(); } } });
        SFX.play('whoosh');
        await Promise.all(bits.map((b, i) => { const ang = i / 6 * Math.PI * 2; return tween(b, { x: tx + Math.cos(ang) * 170, y: ty + Math.sin(ang) * 120 }, 500, 'io'); }));
        for (let r = 0; r < 2; r++) for (const b of bits) {
          SFX.play('laser', 0.5); beam(b.x, b.y, res.hit ? tx : tx + (Math.random() - 0.5) * 300, res.hit ? ty : ty - 200, 6, col, 180);
          R({ final: false, x: tx, y: ty, power: 0.5 }); await wait(60);
        }
        if (res.hit) explosion(tx, ty, 1, col);
        await R({ final, x: tx, y: ty, power: 1 });
        await Promise.all(bits.map(b => tween(b, { x: sx, y: sy }, 400, 'in')));
        alive = false; await wait(200); setPose(a, 'idle', 300); break;
      }
      case 'plasma': {
        setPose(a, 'aim', 200);
        await charge(a, hand, '#ff7a2e', 700);
        const [hx, hy] = hand(); const [tx, ty] = tgt(); SFX.play('fireball');
        await projectile('orb', hx, hy, res.hit ? tx : tx - d.dir * 200, res.hit ? ty : ty - 200, 450, '#ff7a2e', { r: 30 });
        if (res.hit) { explosion(tx, ty, 1.5, '#ff7a2e'); for (let i = 0; i < 30; i++) P({ x: tx, y: ty, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.7) * 10, size: 20, life: 800, col: '#ff7a2e', type: 'fire', drag: 0.94 }); }
        await R({ final, x: tx, y: ty, power: 1.5 });
        await wait(600); setPose(a, 'idle', 300); break;
      }
      case 'gravity': {
        setPose(a, 'raise', 300); SFX.play('charge');
        const [tx, ty] = tgt(); const gx = res.hit ? tx : tx - d.dir * 180, gy = res.hit ? ty : ty - 160;
        const g = { r: 0 };
        FX({ life: 1700, draw(c, e, k) {
          c.save(); c.fillStyle = '#000'; c.beginPath(); c.arc(gx, gy, g.r, 0, 7); c.fill(); c.restore();
          e.strokeStyle = ART.rgba(col, 0.9); e.lineWidth = 5; e.beginPath(); e.arc(gx, gy, g.r + 3, 0, 7); e.stroke();
          for (let i = 0; i < 3; i++) { e.strokeStyle = ART.rgba(col, 0.3); e.lineWidth = 2; e.beginPath(); e.ellipse(gx, gy, g.r * (2.2 + i * 0.6) * (1 - (now * 0.001 + i * 0.3) % 1 * 0.5), g.r * (0.6 + i * 0.2), 0.3, 0, 7); e.stroke(); }
        } });
        tween(g, { r: 70 }, 700, 'out');
        for (let i = 0; i < 40; i++) { const ang = Math.random() * 7, rr = 220 + Math.random() * 100; P({ x: gx + Math.cos(ang) * rr, y: gy + Math.sin(ang) * rr, vx: -Math.cos(ang) * 10, vy: -Math.sin(ang) * 10, life: 500, size: 3, col, type: 'spark', drag: 1.02 }); }
        await wait(400); R({ x: tx, y: ty, power: 0.6 }); await wait(500);
        tween(g, { r: 0 }, 180, 'in'); await wait(180);
        flashA = 0.6; flashCol = col; ring(gx, gy, col, 18, 600, 10, 12); ring(gx, gy, '#ffffff', 12, 500, 10, 6);
        if (res.hit) explosion(gx, gy, 1.4, col); SFX.play('bigboom');
        await R({ final, x: tx, y: ty, power: 1.6 });
        await wait(600); setPose(a, 'idle', 300); break;
      }
      case 'spirit': {
        setPose(a, 'raise', 300); SFX.play('choir');
        const [tx, ty] = tgt();
        for (let i = 0; i < 30; i++) P({ x: tx + (Math.random() - 0.5) * 400, y: -20 - Math.random() * 200, vy: 2 + Math.random() * 2, vx: 0, life: 1800, size: 8, col, type: 'feather', drag: 1 });
        await wait(500);
        for (let i = 0; i < 4; i++) {
          const px = tx + (i - 1.5) * 50;
          FX({ life: 700, draw(c, e, k) { const f = Math.sin(k * Math.PI); const g = e.createLinearGradient(px - 40, 0, px + 40, 0); g.addColorStop(0, ART.rgba(col, 0)); g.addColorStop(0.5, `rgba(255,255,255,${f})`); g.addColorStop(1, ART.rgba(col, 0)); e.fillStyle = g; e.fillRect(px - 40, 0, 80, ty + 60); } });
          R({ x: px, y: ty, power: 0.6 }); await wait(140);
        }
        flashA = 0.8; flashCol = '#ffffff'; if (res.hit) explosion(tx, ty, 1.5, col);
        await R({ final, x: tx, y: ty, power: 1.6 });
        await wait(700); setPose(a, 'idle', 300); break;
      }
      case 'breath': {
        a.opts.mouth = true; SFX.play('fireball');
        const [tx, ty] = tgt();
        for (let i = 0; i < 40; i++) {
          const [hx, hy] = hand(); const ex = res.hit ? tx : tx - d.dir * 200, ey = res.hit ? ty : ty - 180;
          const dx = ex - hx, dy = ey - hy, L = Math.hypot(dx, dy);
          P({ x: hx, y: hy, vx: dx / L * 22 + (Math.random() - 0.5) * 3, vy: dy / L * 22 + (Math.random() - 0.5) * 3, size: 16 + Math.random() * 10, life: L / 22 * 16 + 120, col: typeCol(w), type: 'fire', drag: 1 });
          if (i % 8 === 0) R({ x: tx, y: ty, power: 0.5 });
          await wait(25);
        }
        await wait(300); if (res.hit) explosion(tx, ty, 1.3, typeCol(w));
        await R({ final, x: tx, y: ty, power: 1.3 });
        a.opts.mouth = false; await wait(500); break;
      }
      case 'railgun': {
        setPose(a, 'aim', 250); await wait(250); SFX.play('charge');
        for (let i = 0; i < 8; i++) { const [hx, hy] = hand(); bolt(hx - a.dir * 40, hy, hx + a.dir * 10, hy + (Math.random() - 0.5) * 20, col, 120, 1.5); P({ x: hx, y: hy, size: 20 + i * 4, life: 100, col, type: 'glow' }); await wait(80); }
        const [hx, hy] = hand(); const [tx, ty] = tgt(); SFX.play('rail');
        const ex = res.hit ? tx : tx - d.dir * 400, ey = res.hit ? ty : ty - 90;
        beam(hx, hy, ex + (ex - hx) * 0.6, ey + (ey - hy) * 0.6, w.big ? 10 : 6, '#ffffff', 300); flashA = 0.3; flashCol = '#fff';
        tween(a, { ox: -a.dir * 30 }, 70).then(() => tween(a, { ox: 0 }, 400));
        for (let i = 0; i < 6; i++) { const k = i / 6; ring(hx + (ex - hx) * k, hy + (ey - hy) * k, col, 3, 500, 6, 3); }
        if (res.hit) { explosion(tx, ty, w.big ? 1.4 : 1, col); hitstop = 120; }
        await R({ final, x: tx, y: ty, power: 1.3 });
        await wait(600); setPose(a, 'idle', 300); break;
      }
      case 'lightning': {
        setPose(a, 'raise', 200); SFX.play('charge'); await wait(400);
        const [tx, ty] = tgt();
        for (let i = 0; i < 5; i++) { const [hx, hy] = anchor(a, 'head'); bolt(hx, hy - 20, res.hit ? tx + (Math.random() - 0.5) * 40 : tx - d.dir * 200, res.hit ? ty : ty - 200, '#ffe066', 200, 3); SFX.play('zap'); flashA = 0.25; flashCol = '#ffe066'; R({ x: tx, y: ty, power: 0.6 }); await wait(110); }
        if (res.hit) explosion(tx, ty, 1, '#ffe066');
        await R({ final, x: tx, y: ty, power: 1.1 });
        await wait(500); setPose(a, 'idle', 300); break;
      }
      case 'harpoon': {
        setPose(a,'aim',180); SFX.play('rail'); await wait(240);
        const [hx,hy]=hand(),[tx,ty]=tgt(),endY=res.hit?ty:ty-130;
        FX({life:650,draw(c,e,k){const p=Math.min(1,k*2),x=hx+(tx-hx)*p,y=hy+(endY-hy)*p;c.save();c.strokeStyle='#bccad4';c.lineWidth=3;c.beginPath();c.moveTo(hx,hy);c.quadraticCurveTo((hx+x)/2,(hy+y)/2+Math.sin(k*Math.PI)*70,x,y);c.stroke();c.fillStyle=col;c.beginPath();c.moveTo(x+a.dir*24,y);c.lineTo(x-a.dir*14,y-10);c.lineTo(x-a.dir*8,y);c.lineTo(x-a.dir*14,y+10);c.closePath();c.fill();c.restore();}});
        await wait(340);SFX.play('hit');await R({final,x:tx,y:ty,power:1.2});await wait(430);setPose(a,'idle',220);break;
      }
      case 'sonar': {
        setPose(a,'raise',200); SFX.play('sonar'); const [hx,hy]=anchor(a,'core'),[tx,ty]=tgt();
        for(let i=0;i<4;i++){FX({life:700,draw(c,e,k){const x=hx+(tx-hx)*k,y=hy+(ty-hy)*k;e.save();e.strokeStyle=ART.rgba(col,Math.sin(k*Math.PI));e.lineWidth=3;e.beginPath();e.ellipse(x,y,10+k*30,35+k*90,0,0,Math.PI*2);e.stroke();e.restore();}});await wait(100);}
        await wait(350);barrierFX(tx,ty,120,col);await R({final,x:tx,y:ty,power:1.1});await wait(450);setPose(a,'idle',220);break;
      }
      case 'shieldburst': {
        setPose(a,'guard',160);SFX.play('barrier');const [hx,hy]=anchor(a,'core');barrierFX(hx,hy,140,col);await wait(360);setPose(a,'aim',120);SFX.play('beam');const [tx,ty]=tgt();
        for(const offset of [-35,0,35])projectile('bolt',hx,hy+offset,tx,res.hit?ty+offset:ty-140+offset,300,col);
        await wait(320);P({x:tx,y:ty,size:20,life:500,col,type:'ring',grow:5,drag:1});await R({final,x:tx,y:ty,power:1.4});await wait(500);setPose(a,'idle',240);break;
      }
      case 'spores': {
        setPose(a,'raise',200);SFX.play('shriek');const [hx,hy]=anchor(a,'core'),[tx,ty]=tgt();
        for(let i=0;i<9;i++){const offset=(i-4)*19;projectile('bolt',hx,hy,tx,res.hit?ty+offset:ty-150+offset,440+i*22,'#b5f067',{curve:true,cy:100+Math.abs(offset)});P({x:hx,y:hy,size:10,life:850,col:'#abdd62',type:'ring',grow:1.5,drag:1});await wait(45);}
        await wait(430);SFX.play('spores');for(let i=0;i<24;i++)P({x:tx+(Math.random()-.5)*100,y:ty+(Math.random()-.5)*100,vx:(Math.random()-.5)*3,vy:-.4,life:950,size:3+Math.random()*6,col:'#d7f582',type:'glow',drag:.98});await R({final,x:tx,y:ty,power:1});await wait(550);setPose(a,'idle',200);break;
      }
      case 'nullring': {
        setPose(a,'raise',180);SFX.play('nullring');tintCol='#0a071c';tintA=.3;const [tx,ty]=tgt();
        FX({life:1100,draw(c,e,k){c.save();c.translate(tx,res.hit?ty:ty-140);c.rotate(-k*Math.PI*1.7);const r=150*(1-k*.75);c.strokeStyle=ART.rgba('#11101c',Math.sin(k*Math.PI));c.lineWidth=32;c.beginPath();c.arc(0,0,r,0,Math.PI*1.8);c.stroke();e.strokeStyle=ART.rgba('#b4edff',Math.sin(k*Math.PI));e.lineWidth=2;for(let i=0;i<12;i++){const a=i*Math.PI/6;e.beginPath();e.moveTo(Math.cos(a)*r,Math.sin(a)*r);e.lineTo(Math.cos(a+.16)*(r+24),Math.sin(a+.16)*(r+24));e.stroke();}c.restore();}});
        await wait(750);await R({final,x:tx,y:ty,power:1.6});flashCol='#d0eaff';flashA=.3;await wait(500);tintA=0;setPose(a,'idle',200);break;
      }
      case 'wave': {
        const [tx, ty] = tgt(); SFX.play('shriek'); a.opts.mouth = true;
        for (let i = 0; i < 6; i++) { const [hx, hy] = anchor(a, 'head'); projectile('wave', hx, hy, res.hit ? tx : tx, res.hit ? ty : ty - 160, 400, col); await wait(80); }
        await wait(380); await R({ final, x: tx, y: ty, power: 0.9 });
        a.opts.mouth = false; await wait(500); break;
      }
      default: return anim('rifle', a, d, w, res, st, final);
    }
  }
  async function charge(a, srcFn, col, dur, big) {
    SFX.play('charge');
    const steps = Math.floor(dur / 40);
    for (let i = 0; i < steps; i++) {
      const [x, y] = srcFn(); const ang = Math.random() * 7, r = (big ? 160 : 90) * (1 - i / steps * 0.4);
      P({ x: x + Math.cos(ang) * r, y: y + Math.sin(ang) * r, vx: -Math.cos(ang) * r / 14, vy: -Math.sin(ang) * r / 14, life: 240, size: 3, col, type: 'spark', drag: 1 });
      P({ x, y, size: (big ? 30 : 16) + i * (big ? 2 : 1), life: 60, col, type: 'glow', drag: 1 });
      if (i % 6 === 0) ring(x, y, col, -1.5, 300, big ? 90 : 50, 2);
      await wait(40);
    }
  }
  function explosionMuzzle(x, y, dir, big) {
    P({ x, y, size: big ? 90 : 50, life: 150, col: '#ffcc66', type: 'glow', drag: 1 });
    for (let i = 0; i < 8; i++) P({ x, y, vx: dir * (3 + Math.random() * 4), vy: (Math.random() - 0.5) * 3, size: 14, life: 900, col: '#555', type: 'smoke', em: false, drag: 0.95 });
    SFX.play(big ? 'bigboom' : 'cannon'); shake = big ? 12 : 6;
  }
  async function dash(a, d, gap = 110) {
    a.opts.thrust = 1.5; setPose(a, 'dash', 120); SFX.play('dash'); bgSpeed = 600;
    const tx = d.x + d.ox - a.dir * gap * (d.scale / 1.6 + 0.4) - a.x;
    for (let i = 0; i < 4; i++) { afterimage(a); await tween(a, { ox: a.ox + (tx - a.ox) * 0.5 }, 45, 'lin'); }
    a.ox = tx; bgSpeed = 20; a.opts.thrust = 0;
  }
  async function dashBack(a) { a.opts.thrust = 1; afterimage(a); await tween(a, { ox: 0, oy: 0 }, 300, 'io'); a.opts.thrust = 0; }
  async function cutIn(a, w) {
    const pid = a.u.portrait || a.u.pilot;
    cut = { start: now, pid, text: w.cut || '', wname: w.name, col: typeCol(w), side: a.side, end: now + 1700 };
    SFX.play('cutin'); await wait(1700); cut = null;
  }
  function say(a, kind) {
    const lines = (PILOTS[a.u.pilot] && PILOTS[a.u.pilot].lines) || (EPILOTS[a.u.lineSet] && EPILOTS[a.u.lineSet].lines) || EPILOTS.grunt_c.lines;
    const pool = lines[kind] || lines.atk; const text = pool[Math.floor(Math.random() * pool.length)];
    banner = { start: now, side: a.side, pid: a.u.portrait || a.u.pilot, name: a.u.pname || NAMES[a.u.pilot] || '', text, col: a.u.team === 'player' ? '#62f3ff' : '#ff6b6b', expr: kind === 'hit' ? 'shock' : kind === 'kill' ? 'smile' : 'angry' };
  }

  async function doAttack(a, d, ev) {
    const st = { mode: ev.mode, hpAfter: ev.hpAfter };
    say(a, 'atk');
    // weapon name flash
    popText(a.side === 'L' ? 330 : 950, 150, ev.w.name, typeCol(ev.w), 30, 1400, { vy: 0, italic: true });
    await wait(500);
    if (ev.w.finisher) {
      banner = null; await cutIn(a, ev.w);
      const seq = ev.w.seq || ['slash'];
      for (let i = 0; i < seq.length; i++) await anim(seq[i], a, d, ev.w, ev.res, st, i === seq.length - 1);
    } else {
      await anim(ev.w.anim, a, d, ev.w, ev.res, st, true);
    }
    if (!ev.res.hit) { st.final = true; }
    d.hp = ev.hpAfter;
    banner = null;
    if (ev.hpAfter <= 0) { await wait(200); say(d, 'hit'); await wait(400); banner = null; await destroy(d); say(a, 'kill'); await wait(900); banner = null; }
    else { say(d, ev.res.hit ? 'hit' : 'dodge'); await wait(900); banner = null; }
  }

  // Public: play an exchange. opts: {left, right, events:[{by:'L'|'R', w, res, mode, hpAfter, support:unit}], bg}
  async function play(opts) {
    if (!cv) init();
    // Painted actors and painted environments share one canvas. Only use the
    // 3D fallback when an exchange has no painted unit assets at all.
    use3D = false;
    if (R3D.ok && !ASSETS.unit(opts.left.mech) && !ASSETS.unit(opts.right.mech)) {
      try { if (!bgCv) { bgCv=document.createElement('canvas');bgCv.width=W;bgCv.height=H;bgCtx=bgCv.getContext('2d'); } R3D.battleInit(document.getElementById('battle3d'),bgCv);use3D=true; } catch(e) { console.warn('3D battle disabled',e); }
    }
    document.getElementById('battle3d').hidden = !use3D;
    const el = document.getElementById('battle'); el.hidden = false;
    running = true; skipAll = false; timeScale = SAVE.settings.anim === 'fast' ? 2 : 1; now = 0; last = 0;
    parts.length = 0; fxs.length = 0; tweens.length = 0; waiters.length = 0; texts.length = 0; cut = null; banner = null; tintA = 0; flashA = 0; zoom = 1; zoomTarget = 1;
    bgKey = opts.bg || 'sky'; bgSpeed = 20; if (use3D) R3D.battleBegin(bgKey, !!ASSETS.drawBattleBG(bgCtx, W, H, bgKey, 0));
    actors = { L: makeActor(opts.left, 'L'), R: makeActor(opts.right, 'R') };
    actors.L.hp = actors.L.dispHP = opts.left.hpStart; actors.R.hp = actors.R.dispHP = opts.right.hpStart;
    // intro slide
    actors.L.ox = -500; actors.R.ox = 500;
    raf = requestAnimationFrame(frame);
    SFX.play('whoosh');
    await Promise.all([tween(actors.L, { ox: 0 }, 450, 'out'), tween(actors.R, { ox: 0 }, 450, 'out')]);
    await wait(250);
    for (const ev of opts.events) {
      let a = actors[ev.by]; const d = actors[ev.by === 'L' ? 'R' : 'L'];
      if (!a.visible || !d.visible) break;
      if (ev.support) { // support attacker slides in
        const s = makeActor(ev.support, ev.by); s.ox = a.dir * -600; s.hp = s.dispHP = ev.support.hp; actors.S = s;
        tween(a, { ox: a.dir * -500, alpha: 0 }, 300, 'in'); await tween(s, { ox: 0 }, 350, 'out');
        popText(s.x, 200, 'SUPPORT ATTACK', '#7dffb0', 28, 1200, { vy: 0 });
        await doAttack(s, d, ev);
        await tween(s, { ox: a.dir * -600 }, 300, 'in'); actors.S = null; await tween(a, { ox: 0, alpha: 1 }, 300, 'out');
      } else {
        await doAttack(a, d, ev);
      }
      await wait(150);
    }
    await wait(400);
    running = false; cancelAnimationFrame(raf);
    el.hidden = true;
  }
  return { play, init };
})();
