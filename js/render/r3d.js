// ===== three.js renderer: bespoke cel-shaded animated mech rigs, 3D battle stages with bloom, terrain baking =====
// Falls back to 2D art (ART) if three.js failed to load.
'use strict';
const R3D = (() => {
  const ok = typeof THREE !== 'undefined';
  if (!ok) return { ok: false };
  const V = THREE;
  const col = c => new V.Color(c).convertSRGBToLinear();
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const envCache = new WeakMap();
  function envFor(renderer) { if (envCache.has(renderer)) return envCache.get(renderer); let t = null; try { if (V.RoomEnvironment) { const pm = new V.PMREMGenerator(renderer); t = pm.fromScene(new V.RoomEnvironment(), 0.04).texture; pm.dispose(); } } catch (e) { t = null; } envCache.set(renderer, t); return t; }
  // ---------- textures ----------
  let glowTex = null, gradMap = null; const TEXS = {};
  function glowTexture() {
    if (glowTex) return glowTex;
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,0.8)'); g.addColorStop(0.5, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); glowTex = new V.CanvasTexture(c); return glowTex;
  }
  function gradient() { if (gradMap) return gradMap; gradMap = new V.DataTexture(new Uint8Array([85, 150, 210]), 3, 1, V.RedFormat); gradMap.minFilter = gradMap.magFilter = V.NearestFilter; gradMap.generateMipmaps = false; gradMap.needsUpdate = true; return gradMap; }
  function tex(kind) {
    if (TEXS[kind]) return TEXS[kind];
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    let sd = { plate: 3, rust: 7, metal: 11, hazard: 5, tread: 13, solar: 17, hex: 19, eyes: 23, cloth: 29 }[kind] || 1; const r = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
    const noise = (n, a, colr = '0,0,0') => { for (let i = 0; i < n; i++) { x.fillStyle = `rgba(${colr},${r() * a})`; x.fillRect(r() * S, r() * S, 1 + r() * 3, 1 + r() * 3); } };
    switch (kind) {
      case 'plate': case 'rust': {
        x.fillStyle = '#ffffff'; x.fillRect(0, 0, S, S);
        const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.10)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
        x.strokeStyle = 'rgba(20,18,30,0.75)'; x.lineWidth = 6; x.strokeRect(10, 10, S - 20, S - 20);
        x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 3; x.beginPath(); x.moveTo(16, S - 18); x.lineTo(16, 16); x.lineTo(S - 18, 16); x.stroke();
        x.strokeStyle = 'rgba(20,18,30,0.4)'; x.lineWidth = 2.5; const k = r(); if (k > 0.3) { x.beginPath(); x.moveTo(10, S * (0.35 + r() * 0.3)); x.lineTo(S - 10, S * (0.35 + r() * 0.3)); x.stroke(); }
        x.fillStyle = 'rgba(20,18,30,0.6)'; for (const [px, py] of [[24, 24], [S - 24, 24], [24, S - 24], [S - 24, S - 24]]) { x.beginPath(); x.arc(px, py, 4, 0, 7); x.fill(); }
        noise(400, 0.05);
        if (kind === 'rust') {
          for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(${90 + r() * 60},${40 + r() * 30},${20},${0.12 + r() * 0.2})`; x.beginPath(); x.ellipse(r() * S, r() * S, 6 + r() * 30, 3 + r() * 14, r() * 3, 0, 7); x.fill(); }
          x.strokeStyle = 'rgba(230,230,220,0.6)'; x.lineWidth = 1.2; for (let i = 0; i < 30; i++) { const px = r() * S, py = r() * S; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 30, py + (r() - 0.5) * 12); x.stroke(); }
          x.fillStyle = 'rgba(30,22,18,0.35)'; for (let i = 0; i < 40; i++) { const e = r() < 0.5; x.fillRect(e ? (r() < 0.5 ? 6 : S - 16) : r() * S, e ? r() * S : (r() < 0.5 ? 6 : S - 14), 4 + r() * 10, 3 + r() * 8); }
          const g2 = x.createLinearGradient(0, S * 0.6, 0, S); g2.addColorStop(0, 'rgba(60,40,20,0)'); g2.addColorStop(1, 'rgba(60,40,20,0.3)'); x.fillStyle = g2; x.fillRect(0, 0, S, S);
        }
        break; }
      case 'metal': x.fillStyle = '#cfd2da'; x.fillRect(0, 0, S, S); noise(900, 0.12); x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 2; for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(0, i * S / 6); x.lineTo(S, i * S / 6); x.stroke(); } break;
      case 'hazard': x.fillStyle = '#f2c230'; x.fillRect(0, 0, S, S); x.fillStyle = '#1b1b20'; for (let i = -S; i < S * 2; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 32, 0); x.lineTo(i + 32 - S, S); x.lineTo(i - S, S); x.closePath(); x.fill(); } noise(500, 0.15); break;
      case 'tread': x.fillStyle = '#3a3a40'; x.fillRect(0, 0, S, S); for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#26262c' : '#4a4a52'; x.fillRect(0, i * 16, S, 10); } noise(300, 0.2); break;
      case 'solar': x.fillStyle = '#1a2440'; x.fillRect(0, 0, S, S); x.strokeStyle = '#c8a050'; x.lineWidth = 3; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * S / 8, 0); x.lineTo(i * S / 8, S); x.stroke(); x.beginPath(); x.moveTo(0, i * S / 8); x.lineTo(S, i * S / 8); x.stroke(); } for (let i = 0; i < 64; i++) { x.fillStyle = `rgba(120,160,255,${r() * 0.35})`; x.fillRect((i % 8) * 32 + 3, Math.floor(i / 8) * 32 + 3, 26, 26); } break;
      case 'hex': x.fillStyle = '#ffffff'; x.fillRect(0, 0, S, S); x.strokeStyle = 'rgba(20,30,20,0.7)'; x.lineWidth = 5; for (let row = 0; row < 5; row++) for (let cc = 0; cc < 5; cc++) { const cx = cc * 60 + (row % 2) * 30, cy = row * 52; x.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6; x.lineTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30); } x.closePath(); x.stroke(); } x.fillStyle = 'rgba(220,190,90,0.8)'; x.beginPath(); x.arc(S / 2, S / 2, 18, 0, 7); x.fill(); noise(300, 0.08); break;
      case 'eyes': { x.fillStyle = '#ffffff'; x.fillRect(0, 0, S, S); const g = x.createRadialGradient(S * 0.55, S * 0.5, 4, S * 0.55, S * 0.5, S * 0.25); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(40,0,60,0.9)'); g.addColorStop(0.55, 'rgba(255,220,255,0.9)'); g.addColorStop(0.7, 'rgba(60,20,90,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S); x.strokeStyle = 'rgba(80,40,120,0.5)'; x.lineWidth = 2; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(0, S * 0.5); x.quadraticCurveTo(S * 0.5, S * (i / 8), S, S * (i / 8)); x.stroke(); } break; }
      case 'cloth': x.fillStyle = '#ffffff'; x.fillRect(0, 0, S, S); x.strokeStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 40; i++) { x.beginPath(); x.moveTo(r() * S, 0); x.lineTo(r() * S, S); x.stroke(); } x.fillStyle = 'rgba(230,190,90,0.9)'; x.fillRect(0, S - 22, S, 10); break;
    }
    const t = new V.CanvasTexture(c); t.encoding = V.sRGBEncoding; t.anisotropy = 4; t.wrapS = t.wrapT = V.RepeatWrapping; TEXS[kind] = t; return t;
  }
  // ---------- materials ----------
  const TOON_KEYS = ['side', 'transparent', 'opacity', 'depthWrite'];
  function T(color, kind = 'plate', o = {}) { const p = { color: col(color), gradientMap: gradient(), map: kind ? tex(kind) : null }; for (const k of TOON_KEYS) if (o[k] !== undefined) p[k] = o[k]; if (o.emissive) { p.emissive = col(o.emissive); p.emissiveIntensity = o.ei || 0.5; } return new V.MeshToonMaterial(p); }
  const M = (c, o = {}) => T(c, o.kind === undefined ? 'plate' : o.kind, o);
  function MS(color, o = {}) { return new V.MeshStandardMaterial(Object.assign({ color: col(color), metalness: 0.15, roughness: 0.8, flatShading: true }, o)); }
  function E(color, k = 1) { const m = new V.MeshBasicMaterial({ color: col(color).multiplyScalar(k), toneMapped: false }); m.userData.glow = true; return m; }
  function GT(color, op = 0.7) { const m = new V.MeshBasicMaterial({ color: col(color).multiplyScalar(1.4), transparent: true, opacity: op, side: V.DoubleSide, blending: V.AdditiveBlending, depthWrite: false, toneMapped: false }); m.userData.glow = true; return m; }
  function sprite(color, size, op = 1) { const s = new V.Sprite(new V.SpriteMaterial({ map: glowTexture(), color: col(color), blending: V.AdditiveBlending, depthWrite: false, transparent: true, opacity: op, toneMapped: false })); s.scale.set(size, size, 1); s.userData.glow = true; return s; }
  function mesh(geo, mat) { const m = new V.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; }
  // ---------- geometry ----------
  const GC = {};
  const ck = a => a.map(v => (+v || 0).toFixed(2)).join(',');
  // tapered box keeping per-face UVs (panel texture frames each face). tx/tz scale the BOTTOM; sx skews top forward.
  function pboxGeo(w, h, d, tx = 1, tz = 1, sx = 0) {
    const key = 'b' + ck([w, h, d, tx, tz, sx]); if (GC[key]) return GC[key];
    const g = new V.BoxGeometry(w, h, d); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), t = (y + h / 2) / h; p.setXYZ(i, p.getX(i) * (tx + (1 - tx) * t) + sx * (t - 0.5), y, p.getZ(i) * (tz + (1 - tz) * t)); }
    g.computeVertexNormals(); g.computeBoundingBox(); GC[key] = g; return g;
  }
  function pbox(w, h, d, mat, o = {}) { return mesh(pboxGeo(w, h, d, o.tx, o.tz, o.sx), mat); }
  function box(w, h, d, mat) { return pbox(w, h, d, mat); }
  function tbox(wTop, wBot, h, d, mat) { return pbox(Math.max(wTop, wBot), h, d, mat, { tx: wBot / Math.max(wTop, wBot) }); }
  // wedge: tapers to a point along +y
  function wedge(w, h, d, mat, tip = 0.05) { const m = pbox(w, h, d, mat, { tx: 1 / Math.max(tip, 0.001) > 1 ? 1 : 1 }); const g = pboxGeo(w, h, d, 1, 1); const key = 'w' + ck([w, h, d, tip]); if (!GC[key]) { const gg = new V.BoxGeometry(w, h, d); const p = gg.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), t = (y + h / 2) / h; const s2 = 1 - (1 - tip) * t; p.setX(i, p.getX(i) * s2); p.setZ(i, p.getZ(i) * (1 - (1 - 0.6) * t)); } gg.computeVertexNormals(); gg.computeBoundingBox(); GC[key] = gg; } m.geometry = GC[key]; return m; }
  function cyl(rt, rb, h, mat, seg = 14) { return mesh(new V.CylinderGeometry(rt, rb, h, seg), mat); }
  function cone(r, h, mat, seg = 10) { return mesh(new V.ConeGeometry(r, h, seg), mat); }
  function sph(r, mat, seg = 18) { return mesh(new V.SphereGeometry(r, seg, Math.max(8, seg >> 1)), mat); }
  function ell(rx, ry, rz, mat) { const m = sph(1, mat, 22); m.scale.set(rx, ry, rz); return m; }
  function torus(R, r, mat, seg = 32, arc = Math.PI * 2) { return mesh(new V.TorusGeometry(R, r, 6, seg, arc), mat); }
  function lathe(pts, mat, seg = 20) { const g = new V.LatheGeometry(pts.map(([a, b]) => new V.Vector2(a, b)), seg); g.computeBoundingBox(); return mesh(g, mat); }
  function shapeMesh(pts, depth, mat) { const s = new V.Shape(); s.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) s.lineTo(pts[i], pts[i + 1]); const g = new V.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.translate(0, 0, -depth / 2); const uv = g.attributes.uv; const bb = new V.Box3().setFromBufferAttribute(g.attributes.position); for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - bb.min.x) / (bb.max.x - bb.min.x + 1e-6), (uv.getY(i) - bb.min.y) / (bb.max.y - bb.min.y + 1e-6)); g.computeBoundingBox(); return mesh(g, mat); }
  function flat(pts, mat) { const s = new V.Shape(); s.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) s.lineTo(pts[i], pts[i + 1]); const g = new V.ShapeGeometry(s); const uv = g.attributes.uv, bb = new V.Box3().setFromBufferAttribute(g.attributes.position); for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - bb.min.x) / (bb.max.x - bb.min.x + 1e-6), (uv.getY(i) - bb.min.y) / (bb.max.y - bb.min.y + 1e-6)); const m = new V.Mesh(g, mat); m.userData.noOutline = true; return m; }
  function at(o, x, y, z, rx = 0, ry = 0, rz = 0) { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; }
  function grp(parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { const g = new V.Group(); at(g, x, y, z, rx, ry, rz); if (parent) parent.add(g); return g; }
  function shade(hex, a) { return ART.shade(hex, a).replace(/rgb\((\d+),(\d+),(\d+)\)/, (m, r, g, b) => '#' + [r, g, b].map(v => (+v).toString(16).padStart(2, '0')).join('')); }
  function limb(len, w1, w2, d, mat, plateMat) {
    const pivot = new V.Group(); const m = pbox(Math.max(w1, w2), len, d, mat, { tx: w2 / Math.max(w1, w2) }); m.position.y = -len / 2; pivot.add(m);
    if (plateMat) { const p = pbox(Math.max(w1, w2) * 0.5, len * 0.6, d * 1.1, plateMat); p.position.set(Math.max(w1, w2) * 0.35, -len * 0.5, 0); pivot.add(p); }
    const end = new V.Group(); end.position.y = -len; pivot.add(end); return { pivot, end };
  }
  // limb chain helper: returns {pivot, mid, end} two-segment leg
  function leg2(parent, x, y, z, l1, l2, w, matA, matB) { const a = grp(parent, x, y, z); a.add(at(pbox(w, l1, w, matA, { tx: 0.8 }), 0, -l1 / 2, 0)); const b = grp(a, 0, -l1, 0); b.add(at(sph(w * 0.42, matB), 0, 0, 0)); b.add(at(pbox(w * 0.85, l2, w * 0.85, matA, { tx: 0.6 }), 0, -l2 / 2, 0)); const e = grp(b, 0, -l2, 0); return { a, b, e }; }
  const POSE = p => ({ aim: clamp((p.arm - 0.45) / 1.0), raise: clamp((p.arm - 1.9) / 0.8), dash: clamp(p.lean / 0.4), hurt: clamp(-p.lean / 0.28), chest: p.arm < 0 ? 1 : 0, crouch: p.crouch || 0 });

  // ================= HUMANOID KIT =================
  const KITS = {
    alteon:   { build: 'normal', helm: 'falcon', wings: 'feather', feet: 'talon', weapon: 'sniper', emblem: 'core', skirt: true },
    alteonz:  { build: 'slim', helm: 'crown', wings: 'energy', feet: 'talon', weapon: 'sword', emblem: 'gem', halo: true, skirt: true },
    alteon_s: { build: 'heavy', helm: 'horned', feet: 'boot', weapon: 'none', gauntlet: true, cape: true, emblem: 'core', bigShoulder: true },
    alteonz_s:{ build: 'heavy', helm: 'crown', wings: 'energy', feet: 'boot', weapon: 'none', gauntlet: true, halo: true, emblem: 'gem', bigShoulder: true },
    sylph:    { build: 'slim', helm: 'visor', wings: 'jet', feet: 'talon', weapon: 'pistol', emblem: 'none' },
    kaiser:   { build: 'heavy', helm: 'lion', feet: 'boot', weapon: 'none', gauntlet: true, emblem: 'lion', bigShoulder: true, cape: true },
    noctis:   { build: 'slim', helm: 'insect', wings: 'moth', feet: 'talon', weapon: 'rifle', emblem: 'gem', skirt: true },
    lancer:   { build: 'normal', helm: 'mono', feet: 'boot', weapon: 'rifle', shield: 'tower', backpack: 'pack' },
    executor: { build: 'normal', helm: 'samurai', feet: 'boot', weapon: 'katana', cape: true, emblem: 'gem', skirt: true },
    zephyr:   { build: 'heavy', helm: 'diver', feet: 'fin', weapon: 'claw', backpack: 'tanks', tex: 'rust' },
    knight:   { build: 'slim', helm: 'crown', wings: 'energy', feet: 'talon', weapon: 'lance', halo: true, skirt: true },
    herald:   { build: 'slim', helm: 'crown', wings: 'solar', feet: 'talon', weapon: 'lance', halo: true, skirt: true, cape: true },
    aurelion: { build: 'heavy', helm: 'crown', wings: 'energy', feet: 'boot', weapon: 'lance', shield: 'kite', cape: true, banners: true, halo: true, skirt: true, bigShoulder: true },
    valkyr: { build:'normal',helm:'falcon',wings:'jet',feet:'fin',weapon:'pistol',emblem:'none',backpack:'pack' },
    shade: { build:'slim',helm:'visor',feet:'talon',weapon:'katana',cape:true,emblem:'none',skirt:true },
    rigger: { build:'heavy',helm:'diver',feet:'boot',weapon:'claw',backpack:'tanks',tex:'rust',bigShoulder:true },
    harpoon: { build:'slim',helm:'mono',feet:'fin',weapon:'lance',shield:'kite',backpack:'pack',tex:'rust' },
    breaker: { build:'heavy',helm:'mono',feet:'boot',weapon:'drill',gauntlet:true,backpack:'tanks',bigShoulder:true,tex:'rust' },
    seraphlancer: { build:'slim',helm:'crown',wings:'solar',feet:'talon',weapon:'lance',emblem:'gem',skirt:true },
    echo: { build:'slim',helm:'visor',wings:'energy',feet:'talon',weapon:'sword',emblem:'gem',halo:true },
  };
  function humanoid(v, kit) {
    const K = Object.assign({ build: 'normal', helm: 'visor', wings: 'none', feet: 'boot', weapon: 'rifle', emblem: 'core', tex: 'plate' }, kit || {});
    const b = K.build === 'slim' ? 0.86 : K.build === 'heavy' ? 1.28 : 1, H = (K.build === 'slim' ? 1.06 : 1) * (v.h || 1);
    const tk = K.tex;
    const A = T(v.c1, tk), A2 = T(shade(v.c1, -0.18), tk), Bm = T(v.c2, tk), B2 = T(shade(v.c2, -0.2), tk), Cm = T(v.c3, 'plate'), D = T('#454a58', 'metal'), D2 = T('#25272f', 'metal'), G = v.g;
    const root = new V.Group(); const body = grp(root);
    const thL = 25 * H, shL = 28 * H, hipY = thL + shL + 9;
    const hips = grp(body, 0, hipY, 0);
    // pelvis & skirts
    hips.add(pbox(14 * b, 10, 17 * b, D));
    hips.add(at(pbox(8 * b, 11, 8 * b, A, { tx: 0.45 }), 7.5 * b, -2, 0));
    hips.add(at(pbox(3 * b, 4, 7 * b, Cm), 11 * b, 2, 0));
    const skirt = grp(hips);
    if (K.skirt) {
      for (const z of [-1, 1]) skirt.add(at(pbox(3 * b, 20, 12 * b, A, { tx: 1.25, tz: 1.3 }), 0, -7, z * 11 * b, z * 0.18, 0, 0));
      for (const z of [-1, 1]) skirt.add(at(pbox(3, 17, 7 * b, A, { tx: 1.2 }), 8.5 * b, -6, z * 4.2 * b, 0, 0, 0.14));
      skirt.add(at(pbox(3, 18, 15 * b, Bm, { tz: 1.25 }), -8.5 * b, -6, 0, 0, 0, -0.18));
    } else { for (const z of [-1, 1]) skirt.add(at(pbox(9 * b, 12, 3 * b, A, { tx: 1.1 }), 0, -4, z * 10.5 * b)); }
    // legs
    const legs = {};
    for (const side of ['F', 'B']) {
      const z = side === 'F' ? 7 * b : -7 * b, a = side === 'F' ? A : A2, bm = side === 'F' ? Bm : B2;
      const th = grp(hips, 0, -3, z);
      th.add(at(pbox(9 * b, thL, 9 * b, D, { tx: 0.85 }), 0, -thL / 2, 0));
      th.add(at(pbox(11 * b, thL * 0.66, 11.5 * b, a, { tx: 0.88 }), 0.6, -thL * 0.52, 0));
      const knee = grp(th, 0, -thL, 0);
      knee.add(sph(4.4 * b, D));
      const sh = grp(knee);
      sh.add(at(pbox(6.5 * b, 11, 10 * b, bm, { tx: 0.35 }), 5 * b, 1, 0, 0, 0, -0.35));
      sh.add(at(pbox(12 * b, shL, 12.5 * b, a, { tx: 1.16 }), 0, -shL / 2 - 1, 0));
      sh.add(at(pbox(4 * b, shL * 0.66, 9.5 * b, bm, { tx: 0.7 }), 6.6 * b, -shL * 0.5, 0));
      sh.add(at(pbox(6 * b, shL * 0.42, 9 * b, D), -6.8 * b, -shL * 0.62, 0));
      for (let i = 0; i < 3; i++) sh.add(at(pbox(1, 1.2, 7 * b, D2), -9.9 * b, -shL * 0.5 - i * 3, 0));
      const foot = grp(sh, 0, -shL, 0);
      foot.add(sph(3.6 * b, D));
      if (K.feet === 'talon') {
        foot.add(at(pbox(9 * b, 5, 9 * b, bm), 2 * b, -3, 0));
        for (const dz of [-1, 0, 1]) foot.add(at(wedge(3 * b, 13 * b, 3 * b, Cm, 0.1), 6 * b, -5, dz * 3.2 * b, 0, dz * 0.25, -Math.PI / 2 + 0.25));
        foot.add(at(wedge(3 * b, 10 * b, 3 * b, Cm, 0.1), -3 * b, -4, 0, 0, 0, Math.PI / 2 - 0.4));
      } else if (K.feet === 'fin') {
        foot.add(at(pbox(26 * b, 3, 15 * b, bm, { tz: 1.35 }), 9 * b, -5, 0, 0, 0, 0));
        foot.add(at(pbox(10 * b, 7, 11 * b, a), 1, -2, 0));
      } else {
        foot.add(at(pbox(21 * b, 7, 12.5 * b, bm), 4 * b, -4, 0));
        foot.add(at(pbox(7 * b, 6, 11 * b, a, { tx: 0.6 }), 14 * b, -3.5, 0, 0, 0, -0.35));
        foot.add(at(pbox(5 * b, 5, 11 * b, D), -6 * b, -4.5, 0));
      }
      legs[side] = { th, sh };
    }
    // torso
    const torso = grp(hips);
    const chY = 26 * H, chH = 23 * H;
    torso.add(at(pbox(12 * b, 8, 15 * b, D2), 0, 7, 0)); torso.add(at(pbox(13 * b, 6, 16 * b, D), 0, 13, 0));
    torso.add(at(pbox(19 * b, chH, 27 * b, A, { tx: 0.72, tz: 0.74 }), 0, chY, 0));
    for (const z of [-1, 1]) torso.add(at(pbox(5 * b, 13, 11.5 * b, Bm, { tx: 0.8 }), 8.6 * b, chY + 2, z * 6.6 * b, 0, -z * 0.22, 0));
    torso.add(at(pbox(10 * b, 6, 21 * b, A), -1, chY + chH / 2 + 2, 0));
    torso.add(at(pbox(10 * b, 17, 19 * b, Bm), -8 * b, chY + 1, 0));
    const core = grp(torso, 9.8 * b, chY - 3, 0);
    if (K.emblem === 'core') { core.add(at(cyl(4.4, 4.4, 2.5, E(G, 2.2), 18), 0.6, 0, 0, 0, 0, Math.PI / 2)); core.add(at(torus(5.2, 0.9, Cm, 20), 0, 0, 0, 0, Math.PI / 2, 0)); }
    else if (K.emblem === 'gem') { core.add(mesh(new V.OctahedronGeometry(5), E(G, 2.2))); core.add(at(torus(6, 0.8, Cm, 4), -0.5, 0, 0, 0, Math.PI / 2, Math.PI / 4)); }
    else if (K.emblem === 'lion') { core.add(at(pbox(5, 12, 13, Cm, { tx: 0.6 }), 1, -1, 0)); for (const z of [-1, 1]) core.add(at(sph(1.6, E(G, 2.2), 8), 3.6, 2.5, z * 3)); core.add(at(pbox(2, 2, 8, D2), 3.8, -4, 0)); for (let i = 0; i < 8; i++) { const ang = -Math.PI * 0.85 + i * (Math.PI * 1.7 / 7); core.add(at(wedge(2.4, 9, 3, i % 2 ? Cm : Bm, 0.1), -1, Math.cos(ang) * 8, Math.sin(ang) * 8, -ang, 0, 0)); } }
    const coreGlow = sprite(G, 36, K.emblem === 'none' ? 0 : 0.8); core.add(coreGlow);
    // head
    const s = 1 + (b - 1) * 0.25;
    const head = grp(torso, 2, chY + chH / 2 + 9, 0);
    head.add(at(cyl(3, 4, 8, D, 10), -1, -6, 0));
    let monoEye = null; const eyes = (x, y, w = 8) => { head.add(at(pbox(1.2, 1.7, w * s, E(G, 2.4)), x, y, 0)); head.add(at(sprite(G, 18), x + 1, y, 0)); };
    switch (K.helm) {
      case 'falcon': head.add(at(pbox(10 * s, 9, 9 * s, A, { tx: 0.85 }), 0, 1, 0)); head.add(at(wedge(5 * s, 13 * s, 5 * s, Cm, 0.08), 6 * s, -0.5, 0, 0, 0, -Math.PI / 2 - 0.15)); eyes(5 * s, 2, 7);
        for (const z of [-1, 1]) { head.add(at(wedge(3, 18 * s, 2, Bm, 0.1), -3, 4, z * 4 * s, z * 0.25, 0, 1.95)); head.add(at(wedge(2.2, 12 * s, 1.6, A, 0.1), -2, 6, z * 3 * s, z * 0.35, 0, 2.3)); } head.add(at(wedge(2.4, 11 * s, 2, Cm, 0.1), 1, 6, 0, 0, 0, 0.3)); break;
      case 'horned': head.add(at(pbox(11 * s, 10, 10 * s, A), 0, 1, 0)); head.add(at(pbox(4 * s, 7, 8 * s, Bm, { tx: 0.7 }), 5.5 * s, -1.5, 0)); for (let i = 0; i < 3; i++) head.add(at(pbox(0.6, 0.8, 6 * s, D2), 7.6 * s, -3 + i * 1.6, 0)); eyes(5.6 * s, 2.5, 8);
        for (const z of [-1, 1]) { const c = new V.QuadraticBezierCurve3(new V.Vector3(0, 0, 0), new V.Vector3(2, 10, z * 6), new V.Vector3(-6, 22 * s, z * 12)); head.add(at(mesh(new V.TubeGeometry(c, 10, 2.2 * s, 7), Cm), 0, 5, z * 3)); } break;
      case 'crown': head.add(at(pbox(9 * s, 9, 8.5 * s, A, { tx: 0.8 }), 0, 1, 0)); head.add(at(pbox(3, 4, 8 * s, D2), 4.4 * s, 1, 0)); eyes(5.2 * s, 1.5, 7);
        for (let i = -2; i <= 2; i++) head.add(at(wedge(2.2, (i === 0 ? 20 : 13) * s, 1.6, Cm, 0.08), -1, 7, i * 2.6 * s, i * 0.32, 0, 0.2)); break;
      case 'mono': head.add(at(ell(7 * s, 6.5, 7 * s, A), 0, 1.5, 0)); head.add(at(pbox(3, 3.4, 11 * s, D2), 5.6 * s, 1, 0)); monoEye = grp(head, 7 * s, 1, 0); monoEye.add(sph(1.7, E(G, 2.5), 10)); monoEye.add(sprite(G, 16)); head.add(at(cyl(0.5, 0.5, 14, D), -3, 9, 3, 0, 0, 0.3)); head.add(at(pbox(6 * s, 2, 14 * s, Bm), -1, 6, 0)); break;
      case 'visor': head.add(at(pbox(10 * s, 8, 8.5 * s, A, { tx: 0.85, sx: 2 }), 0, 1, 0)); eyes(5.2 * s, 1.6, 8); for (const z of [-1, 1]) head.add(at(wedge(2, 13 * s, 1.5, Bm, 0.1), -2, 3, z * 4.3 * s, z * 0.2, 0, 1.75)); break;
      case 'diver': head.add(at(ell(10 * s, 10, 10 * s, Cm), 0, 3, 0)); head.add(at(torus(5.6, 1.2, D, 20), 9.4 * s, 3, 0, 0, Math.PI / 2, 0)); const pd = mesh(new V.CircleGeometry(5, 20), E('#ffcf6a', 1.4)); pd.position.set(9.8 * s, 3, 0); pd.rotation.y = Math.PI / 2; head.add(pd); head.add(at(sprite('#ffcf6a', 26), 11 * s, 3, 0)); for (const z of [-1, 1]) { head.add(at(torus(2.4, 0.8, D, 14), 3, 4, z * 9.6 * s)); } for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; head.add(at(sph(0.8, D, 6), 9.6 * s, 3 + Math.cos(a) * 7, Math.sin(a) * 7)); } break;
      case 'samurai': head.add(at(pbox(9 * s, 9, 8.5 * s, A), 0, 1, 0)); head.add(at(pbox(3.4 * s, 5, 7.5 * s, D2), 4.6 * s, -1, 0)); eyes(5 * s, 2, 7);
        for (let i = 0; i < 3; i++) head.add(at(pbox(3, 3, (13 + i * 4) * s, Bm, { tz: 1.25 }), -4 - i * 0.6, -1 - i * 3, 0, 0, 0, -0.3)); const cr = torus(9 * s, 1.1, Cm, 20, Math.PI); at(cr, 3, 8, 0, 0, Math.PI / 2, 0); head.add(cr); break;
      case 'insect': head.add(at(pbox(12 * s, 7, 7 * s, A, { tx: 0.55 }), 1, 1, 0, 0, 0, -Math.PI / 2)); for (const z of [-1, 1]) { head.add(at(ell(3.2, 3, 2.4, E(G, 1.8)), 3.5 * s, 2, z * 3 * s)); head.add(at(sprite(G, 14), 3.5 * s, 2, z * 3.5 * s)); const c = new V.QuadraticBezierCurve3(new V.Vector3(0, 0, 0), new V.Vector3(-2, 14, z * 4), new V.Vector3(-12, 26 * s, z * 9)); head.add(at(mesh(new V.TubeGeometry(c, 12, 0.7, 5), Cm), 2, 4, z * 2)); } break;
      case 'lion': head.add(at(pbox(10 * s, 10, 10 * s, A), 0, 1, 0)); head.add(at(pbox(5 * s, 5, 6.5 * s, Cm, { tx: 0.8 }), 6.5 * s, -1.5, 0)); eyes(5.4 * s, 2.6, 8);
        for (let i = 0; i < 11; i++) { const ang = -Math.PI * 0.95 + i * (Math.PI * 1.9 / 10); const w = wedge(3.6, 14 * s, 3, i % 2 ? Cm : Bm, 0.08); at(w, -4, 2 + Math.cos(ang) * 7, Math.sin(ang) * 7, -ang * 0.9, 0, 0.7); head.add(w); } for (const z of [-1, 1]) head.add(at(wedge(2, 10, 2, Cm, 0.1), 1, 7, z * 4, z * 0.4, 0, 0.3)); break;
    }
    // shoulders & arms
    const shY = chY + chH / 2 - 4;
    const arms = {}; let hand = null, wpn = null;
    for (const side of ['F', 'B']) {
      const z = side === 'F' ? 15.5 * b : -15.5 * b, a = side === 'F' ? A : A2, bm = side === 'F' ? Bm : B2;
      const up = grp(torso, 0, shY, z);
      up.add(sph(4.8 * b, D));
      up.add(at(pbox(7 * b, 16 * H, 7 * b, D), 0, -8.5 * H, 0));
      const pa = grp(up); const ps = K.bigShoulder ? 1.25 : 1;
      pa.add(at(pbox(13 * b * ps, 10 * b * ps, 12.5 * b * ps, a, { tx: 1.12, tz: 1.08 }), 0, 3 * ps, 0));
      pa.add(at(pbox(11 * b * ps, 3, 13 * b * ps, Cm), 0, -2, 0));
      if (K.build === 'heavy') for (const dz of [-0.3, 0.3]) pa.add(at(wedge(4 * b, 16 * b, 4 * b, Cm, 0.1), -1, 11 * b * ps, dz * 10 * b, dz, 0, 0.15));
      else if (K.build === 'slim') pa.add(at(wedge(3 * b, 18 * b, 8 * b, bm, 0.1), -4, 8 * b, 0, 0, 0, 1.0));
      else pa.add(at(pbox(5 * b, 10 * b, 13 * b, bm, { tx: 0.6 }), -3, 9 * b, 0, 0, 0, 0.3));
      const fo = grp(up, 0, -17 * H, 0);
      fo.add(sph(3.8 * b, D));
      const gs = K.gauntlet ? 1.3 : 1;
      fo.add(at(pbox(10 * b * gs, 18 * H, 10 * b * gs, a, { tx: 1.18 }), 0, -9.5 * H, 0));
      fo.add(at(pbox(11.5 * b * gs, 4, 11.5 * b * gs, bm), 0, -17 * H, 0));
      if (K.gauntlet) fo.add(at(wedge(3, 14, 9 * b, Cm, 0.1), 7 * b, -8 * H, 0, 0, 0, -0.5));
      const hd = grp(fo, 0, -19.5 * H, 0);
      const fist = grp(hd);
      if (K.weapon === 'claw' && side === 'F' || K.feet === 'fin' && side === 'B') {
        fist.add(at(pbox(9 * b, 8, 9 * b, D), 0, -2, 0));
        const j1 = grp(fist, 2 * b, -5, 0), j2 = grp(fist, -2 * b, -5, 0);
        j1.add(at(wedge(4 * b, 16 * b, 7 * b, Cm, 0.15), 0, -7 * b, 0)); j2.add(at(wedge(4 * b, 14 * b, 7 * b, Cm, 0.15), 0, -6 * b, 0));
        fist.userData.jaws = [j1, j2];
      } else {
        fist.add(at(pbox(8 * b * gs, 8 * b, 8 * b * gs, D2), 0, -3.5 * b, 0));
        for (let i = 0; i < 3; i++) fist.add(at(pbox(2.3 * b, 3 * b, 7 * b * gs, D), 3.2 * b - i * 2.5 * b, -8 * b, 0));
      }
      arms[side] = { up, fo, hand: fist, pa };
      if (side === 'F') { hand = hd; wpn = grp(hd, 0, -4 * b, 0); }
      if (side === 'B' && K.shield) {
        const sg = grp(fo, 0, -10 * H, -7 * b * gs);
        if (K.shield === 'tower') { sg.add(at(pbox(4, 50, 30, A, { tz: 0.9 }), 0, -4, -1)); sg.add(at(pbox(4.5, 3, 18, E('#ff3344', 1.8)), 0, 12, -1)); sg.add(at(pbox(4.3, 26, 5, T('#ffffff', 'hazard')), 0, -12, -9)); }
        else { const sh = shapeMesh([0, 20, 14, 12, 12, -14, 0, -26, -12, -14, -14, 12], 3, Bm); at(sh, 0, -2, -2, 0, Math.PI / 2, 0); sg.add(sh); sg.add(at(pbox(3.6, 30, 3, Cm), 0, -3, -3.6)); sg.add(at(pbox(3.6, 3, 20, Cm), 0, 4, -3.6)); sg.add(at(sprite(G, 20), 0, 4, -6)); }
      }
    }
    // weapons along -y of hand
    const W = {};
    const wg = (name, fn) => { const g = grp(wpn); fn(g); g.visible = false; W[name] = g; };
    const GM = T('#5a6070', 'metal'), BL = T('#e8eef6', 'metal');
    wg('sniper', g => { g.add(at(pbox(6, 30, 7, D), 0, -10, 0)); g.add(at(pbox(5, 10, 6, Bm), -1, 6, 0)); g.add(at(cyl(1.6, 1.8, 36, GM, 10), 0, -42, 0)); g.add(at(pbox(3, 6, 4, D2), 0, -60, 0)); g.add(at(cyl(2.4, 2.4, 14, D2, 12), 5, -18, 0)); g.add(at(cyl(2.6, 2.6, 0.8, E(G, 2), 12), 5, -25.5, 0)); g.add(at(pbox(5, 3, 7, Cm), 0, -26, 0)); });
    wg('rifle', g => { g.add(at(pbox(6, 26, 8, D), 0, -10, 0)); g.add(at(cyl(1.6, 1.6, 14, GM), 0, -29, 0)); g.add(at(pbox(5, 8, 3, Bm), -4, -2, 0)); g.add(at(pbox(4, 9, 4, D2), 5, -12, 0)); g.add(at(pbox(1.2, 5, 3, E(G, 1.8)), 7.1, -12, 0)); });
    wg('pistol', g => { g.add(at(pbox(5, 16, 6, D), 0, -6, 0)); g.add(at(cyl(1.4, 1.4, 8, GM), 0, -17, 0)); g.add(at(pbox(1, 5, 3, E(G, 1.8)), 3, -6, 0)); });
    wg('sword', g => { g.add(at(cyl(1.8, 1.8, 10, D2), 0, 3, 0)); g.add(at(pbox(4, 3, 16, Cm), 0, -3, 0)); g.add(at(pbox(1.6, 62, 7, BL, { tx: 0.5 }), 0, -36, 0)); g.add(at(pbox(0.6, 58, 1, E(G, 2)), 0, -36, 3.6)); });
    wg('katana', g => { g.add(at(cyl(1.5, 1.5, 12, D2), 0, 3, 0)); g.add(at(cyl(4, 4, 1.2, Cm, 12), 0, -3, 0)); const bl = pbox(1.2, 58, 4, BL, { tx: 0.4 }); at(bl, 0.8, -33, 0, 0, 0, 0.06); g.add(bl); g.add(at(pbox(0.5, 54, 0.8, E('#ff5a5a', 2)), 1.4, -33, 2, 0, 0, 0.06)); });
    wg('lance', g => { g.add(at(cyl(1.6, 1.6, 84, D2), 0, -20, 0)); g.add(at(wedge(6, 22, 2.5, BL, 0.05), 0, -71, 0, Math.PI, 0, 0)); g.add(at(torus(3, 1, Cm, 12), 0, -58, 0, Math.PI / 2, 0, 0)); g.add(at(pbox(0.6, 18, 0.8, E(G, 2)), 0, -70, 1.4)); g.add(at(wedge(3, 10, 2, Cm, 0.1), 0, 22, 0)); });
    wg('drill', g => {g.add(at(cyl(7,7,18,D2,10),0,-5,0));g.add(at(cone(10,42,BL,12),0,-34,0,Math.PI,0,0));for(let i=0;i<4;i++)g.add(at(torus(8-i*1.5,1.2,Cm,12),0,-19-i*7,0,Math.PI/2,0,0));});
    const sbm = E(G, 2.2), sabers = [];
    wg('saber', g => { g.add(at(cyl(1.8, 1.8, 10, D2), 0, 3, 0)); g.add(at(pbox(2, 54, 3.2, sbm, { tx: 0.6 }), 0, -32, 0)); g.add(at(pbox(0.8, 52, 3.6, E('#ffffff', 2)), 0, -32, 0)); const sp = sprite(G, 60, 0.45); sp.scale.set(22, 80, 1); at(sp, 0, -32, 0); g.add(sp); sabers.push(g); });
    // wings / back
    const back = grp(torso, -9 * b, chY + 4, 0);
    const flames = []; const feathers = []; const flaps = [];
    function flame(x, y, z, len) { const f = grp(back, x, y, z, 0, 0, -1.15); f.add(at(cone(4, len, E(G, 2), 12), 0, -len / 2, 0, Math.PI, 0, 0)); f.add(at(cone(1.8, len * 0.6, E('#ffffff', 2), 10), 0, -len * 0.3, 0, Math.PI, 0, 0)); const sp = sprite(G, len * 1.3, 0.8); sp.position.y = -len * 0.3; f.add(sp); f.visible = false; flames.push(f); }
    if (K.wings === 'feather' || K.wings === 'energy') {
      for (const z of [-1, 1]) { const root2 = grp(back, -2, 6, z * 8 * b, z * 0.55, 0, 0); for (let i = 0; i < 6; i++) { const L = (K.wings === 'energy' ? 50 : 42) + (5 - Math.abs(i - 2.5)) * 6; const f = grp(root2); const m = K.wings === 'energy' ? GT(G, 0.75) : (i % 2 ? Bm : A); const pl = pbox(7 - i * 0.4, L, 1.6, m, { tx: 0.25 }); if (K.wings === 'energy') pl.userData.noOutline = true; at(pl, 0, L / 2, 0); f.add(pl); if (K.wings === 'feather') f.add(at(wedge(4, 10, 1.6, Cm, 0.1), 0, L + 4, 0)); f.userData.base = 0.55 + i * 0.26; f.userData.i = i; f.userData.z = z; root2.add(f); feathers.push(f); } }
      flame(-4, -10, 0, 22);
    } else if (K.wings === 'moth') {
      const wm = new V.MeshBasicMaterial({ map: tex('eyes'), color: col(v.c2).multiplyScalar(1.3), transparent: true, opacity: 0.82, side: V.DoubleSide, depthWrite: false });
      for (const z of [-1, 1]) for (const lower of [0, 1]) { const f = grp(back, 0, lower ? -4 : 6, z * 6 * b); const L = lower ? 34 : 50, Wd = lower ? 22 : 30; const m = flat([0, 0, -L * 0.4, Wd * 0.9, -L, Wd * 0.7, -L * 1.05, Wd * 0.1, -L * 0.6, -Wd * 0.3], wm); m.rotation.x = Math.PI / 2; f.add(m); const edge = mesh(new V.TubeGeometry(new V.CatmullRomCurve3([new V.Vector3(0, 0, 0), new V.Vector3(-L * 0.4, 0, Wd * 0.9), new V.Vector3(-L, 0, Wd * 0.7), new V.Vector3(-L * 1.05, 0, Wd * 0.1)]), 12, 0.7, 5), Cm); f.add(edge); f.rotation.set(z * (0.5 + lower * 0.3), 0, lower ? -0.5 : 0.35); f.scale.z = z; f.userData.z = z; f.userData.lower = lower; flaps.push(f); }
    } else if (K.wings === 'solar') {
      const sm = T('#ffffff', 'solar');
      for (const z of [-1, 1]) for (let i = 0; i < 3; i++) { const f = grp(back, -2, 6, z * 7 * b, z * 0.5, 0, 0.5 + i * 0.5); f.add(at(cyl(0.8, 0.8, 26, Cm), 0, 13, 0)); f.add(at(pbox(18, 30, 1.4, sm, { tx: 0.8 }), 0, 40, 0)); f.userData.base = 0.5 + i * 0.5; f.userData.z = z; f.userData.i = i; feathers.push(f); }
      back.add(at(torus(14, 1, E(G, 1.6), 40), -4, 14, 0, 0, Math.PI / 2, 0));
    } else if (K.wings === 'jet') {
      for (const z of [-1, 1]) { back.add(at(cyl(4 * b, 3.4 * b, 26, A, 12), -6, 2, z * 8 * b, 0, 0, Math.PI / 2 + 0.35)); back.add(at(torus(3.4 * b, 0.6, E(G, 1.8), 14), -17, -2, z * 8 * b, 0, Math.PI / 2, 0.35)); const wgm = shapeMesh([0, 0, -36, 20, -40, 14, -10, -4], 2, Bm); at(wgm, -2, 6, z * 11 * b, z * 0.6, 0, 0); back.add(wgm); flame(-17, -3, z * 8 * b, 24); }
    } else if (!K.backpack) { back.add(at(pbox(8 * b, 18, 14 * b, Bm), 0, -2, 0)); for (const z of [-1, 1]) flame(-5, -12, z * 5 * b, 20); }
    if (K.backpack === 'tanks') { for (const z of [-1, 1]) { back.add(at(cyl(5, 5, 26, Cm, 14), -2, 2, z * 6 * b)); back.add(at(sph(5, Cm, 12), -2, 15, z * 6 * b)); back.add(at(cyl(1, 1, 8, D, 6), -2, 21, z * 6 * b)); } back.add(at(torus(6, 1.5, T('#c96a4a', 'plate'), 16), 3, -6, -16 * b, 0, 0, 0)); }
    if (K.backpack === 'pack') { back.add(at(pbox(9, 20, 16 * b, D), -1, 0, 0)); back.add(at(cyl(0.5, 0.5, 26, D2), -2, 20, 6 * b)); for (const z of [-1, 1]) flame(-5, -12, z * 4 * b, 16); }
    let halo = null; if (K.halo) { halo = grp(head, -6, 12, 0, 0, Math.PI / 2, 0.35); halo.add(torus(15 * s, 0.9, E(G, 1.8), 48)); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; halo.add(at(wedge(1.4, 5, 1.2, E(G, 2), 0.1), Math.cos(a) * 15 * s, Math.sin(a) * 15 * s, 0, 0, 0, a - Math.PI / 2)); } }
    // cloth: cape & banners
    const cloths = [];
    function cloth(w, hh, color, x, y, z, ry) { const g = new V.PlaneGeometry(w, hh, 4, 10); g.translate(0, -hh / 2, 0); const m = mesh(g, T(color, 'cloth', { side: V.DoubleSide })); m.userData.noOutline = true; at(m, x, y, z, 0, ry, 0); m.userData.base = g.attributes.position.array.slice(); torso.add(m); cloths.push(m); return m; }
    if (K.cape) cloth(30 * b, 82 * H, shade(v.c2, -0.12), -11 * b, shY + 3, 0, Math.PI / 2);
    if (K.banners) for (const z of [-1, 1]) cloth(10 * b, 70 * H, '#8a1a2a', -6 * b, shY + 6, z * 13 * b, Math.PI / 2 + z * 0.15);
    const anchors = { hand, core, head };
    function apply(p, o, t) {
      body.position.y = -(p.crouch || 0);
      torso.rotation.z = -p.lean * 0.5;
      legs.F.th.rotation.z = p.fl; legs.F.sh.rotation.z = (p.fl > 0 ? -p.fl * 0.25 : -p.fl * 0.15) - p.fl;
      legs.B.th.rotation.z = p.bl; legs.B.sh.rotation.z = (p.bl > 0 ? -p.bl * 0.25 : -p.bl * 0.15) - p.bl;
      skirt.rotation.z = Math.max(0, Math.max(p.fl, p.bl)) * 0.3;
      for (const s2 of ['F', 'B']) { const Ar = arms[s2]; Ar.up.rotation.z = s2 === 'F' ? p.arm : p.barm; Ar.fo.rotation.z = s2 === 'F' ? p.fore : p.bfore; Ar.pa.rotation.z = -Ar.up.rotation.z * 0.6; }
      let wname = o.weapon || K.weapon;
      if (wname === 'fist' || wname === 'none') wname = null;
      for (const k in W) W[k].visible = k === wname;
      arms.F.hand.visible = o.weapon !== 'fist';
      const jaws = arms.F.hand.userData.jaws; if (jaws) { const op = 0.15 + Math.max(0, p.arm - 0.4) * 0.35 + Math.sin(t * 3) * 0.05; jaws[0].rotation.z = op; jaws[1].rotation.z = -op; }
      sbm.color.copy(col(o.bladeCol || G)).multiplyScalar(2.2); sabers.forEach(g => g.scale.y = o.bladeLen || 1);
      const P = POSE(p), spread = 0.25 * P.dash + 0.15 * P.aim + (o.wingScale ? 0.2 : 0);
      feathers.forEach(f => { f.rotation.z = f.userData.base - spread * (0.5 - f.userData.i * 0.12) + Math.sin(t * 2 + f.userData.i) * 0.04; });
      flaps.forEach(f => { f.rotation.y = f.userData.z * (Math.sin(t * 3 + f.userData.lower) * 0.2 + P.dash * 0.4); });
      flames.forEach(f => { f.visible = !!o.thrust; f.scale.setScalar((o.thrust || 0) * (0.85 + Math.sin(t * 40) * 0.15)); });
      if (halo) halo.rotation.x = t * 0.5;
      if (monoEye) monoEye.position.z = Math.sin(t * 2) * 3;
      if (coreGlow.material.opacity > 0) coreGlow.scale.setScalar(36 * (o.coreGlow || 1) * (0.9 + Math.sin(t * 3) * 0.1));
      cloths.forEach((c, ci) => { const pa = c.geometry.attributes.position, base = c.userData.base; for (let i = 0; i < pa.count; i++) { const y = base[i * 3 + 1]; pa.array[i * 3 + 2] = base[i * 3 + 2] + (Math.sin(t * 2.6 + y * 0.07 + ci) * 0.1 + P.dash * 0.35) * (-y); } pa.needsUpdate = true; });
    }
    return { root, apply, anchors };
  }

  // ================= VEHICLES & ANIMALS =================
  function mats(v, tk = 'plate') { return { A: T(v.c1, tk), A2: T(shade(v.c1, -0.18), tk), Bm: T(v.c2, tk), Cm: T(v.c3, 'plate'), D: T('#454a58', 'metal'), D2: T('#25272f', 'metal'), G: v.g }; }
  function railing(parent, x0, x1, y, z, m) { for (let x = x0; x <= x1; x += (x1 - x0) / 4) parent.add(at(cyl(0.6, 0.6, 7, m, 6), x, y + 3.5, z)); const r = cyl(0.6, 0.6, x1 - x0, m, 6); at(r, (x0 + x1) / 2, y + 7, z, 0, 0, Math.PI / 2); parent.add(r); }
  // ---- quadruped walker tank (Bastion / Sovereign) ----
  function walker(v, cathedral) {
    const m = mats(v, cathedral ? 'plate' : 'rust'); const { A, A2, Bm, Cm, D, D2 } = m; const G = v.g;
    const root = new V.Group(); const body = grp(root, 0, 52, 0);
    body.add(pbox(84, 30, 48, A, { tx: 0.92 }));
    body.add(at(pbox(64, 8, 42, Bm), -6, 19, 0));
    body.add(at(pbox(24, 28, 44, A, { tx: 1.1, sx: -6 }), 46, 1, 0));
    for (let i = -1; i <= 1; i++) body.add(at(pbox(1, 6, 10, E('#ffd27a', 1.3)), 58.3, 6, i * 13));
    for (let i = 0; i < 5; i++) body.add(at(pbox(1.6, 12, 2, D2), 58.6, -6, -16 + i * 8));
    body.add(at(pbox(2, 4, 46, Cm), 58, 13, 0));
    for (const z of [-1, 1]) body.add(at(sprite('#ffe6a0', 26), 60, -6, z * 18));
    body.add(at(pbox(80, 3, 49, T('#ffffff', 'hazard')), 0, -12, 0));
    if (!cathedral) {
      for (const [x, z] of [[-30, 14], [-22, 14], [-30, -14]]) body.add(at(pbox(9, 8, 9, Bm), x, 27, z));
      body.add(at(cyl(6, 6, 30, T('#6a7a3a', 'plate'), 12), -12, 26, -12, 0, 0, Math.PI / 2));
      railing(body, 10, 34, 23, 20, Cm); railing(body, 10, 34, 23, -20, Cm);
      body.add(at(cyl(0.6, 0.4, 40, D2, 5), -36, 44, 16));
    } else {
      for (const [x, z, hh] of [[-30, 14, 40], [-30, -14, 40], [-8, 16, 28], [-8, -16, 28]]) { body.add(at(pbox(10, hh, 10, A), x, 23 + hh / 2, z)); body.add(at(cone(7, 18, Cm, 4), x, 23 + hh + 9, z, 0, Math.PI / 4, 0)); }
      for (const z of [-1, 1]) { const g = new V.PlaneGeometry(12, 40, 2, 8); g.translate(0, -20, 0); const bn = mesh(g, T('#8a1a2a', 'cloth', { side: V.DoubleSide })); bn.userData.noOutline = true; at(bn, -30, 58, z * 20, 0, 0, 0); body.add(bn); }
      body.add(at(sprite(G, 40), 10, 30, 0));
    }
    const tur = grp(body, 4, 22, 0);
    tur.add(cyl(14, 16, 8, D, 16)); tur.add(at(pbox(20, 14, 20, A), 2, 9, 0));
    const barrel = grp(tur, 10, 10, 0);
    const nb = cathedral ? [-6, 6] : [0];
    nb.forEach(zz => { barrel.add(at(cyl(4.4, 5.4, 70, D, 14), 36, 0, zz, 0, 0, -Math.PI / 2)); barrel.add(at(pbox(10, 8, 12, D2), 72, 0, zz)); });
    barrel.add(at(pbox(16, 12, 16, Bm), 4, 0, 0));
    const muzzle = grp(barrel, 78, 0, 0);
    const legs = [];
    for (const [x, z] of [[30, 22], [30, -22], [-30, 22], [-30, -22]]) {
      const L = leg2(body, x, -10, z, 28, 32, 13, A2, D); L.a.rotation.z = x > 0 ? -0.35 : 0.35; L.b.rotation.z = x > 0 ? 0.55 : -0.55; L.e.add(at(pbox(22, 8, 20, D), 0, -2, 0)); L.e.add(at(pbox(12, 10, 14, Bm), 0, 6, 0)); legs.push({ L, x, ph: (x > 0 ? 0 : Math.PI) + (z > 0 ? 0 : Math.PI / 2) });
      L.a.add(at(cyl(2, 2, 24, Cm, 8), 6, -10, 0, 0, 0, 0.2));
    }
    return { root, scaleHint: cathedral ? 0.95 : 0.78, anchors: { hand: muzzle, core: body, head: body }, apply(p, o, t) {
      const P = POSE(p); body.position.y = 52 + Math.sin(t * 2) * 0.8 - P.hurt * 3;
      barrel.rotation.z = 0.12 + P.aim * 0.18 - P.hurt * 0.1; tur.rotation.y = 0;
      const stride = P.dash > 0.1 ? 1 : 0.15;
      legs.forEach(l => { const ph = t * (P.dash > 0.1 ? 9 : 1.5) + l.ph; l.L.a.rotation.z = (l.x > 0 ? -0.35 : 0.35) + Math.sin(ph) * 0.18 * stride; l.L.b.rotation.z = (l.x > 0 ? 0.55 : -0.55) + Math.max(0, Math.cos(ph)) * 0.25 * stride; l.L.e.rotation.z = -(l.L.a.rotation.z + l.L.b.rotation.z); });
      body.rotation.z = -P.dash * 0.08 + P.hurt * 0.08;
    } };
  }
  // ---- tracked vehicles (Trinity excavator / Tyrant turtle) ----
  function treads(parent, len, z, m) {
    const g = grp(parent, 0, 13, z); const tm = T('#ffffff', 'tread'); tm.map = tex('tread').clone(); tm.map.needsUpdate = true; tm.map.repeat.set(1, 3);
    g.add(pbox(len, 24, 14, tm));
    const wheels = [];
    for (let i = 0; i < 6; i++) { const w = cyl(i === 0 || i === 5 ? 10 : 8, i === 0 || i === 5 ? 10 : 8, 15, m.Cm, 14); at(w, -len / 2 + 8 + i * (len - 16) / 5, i === 0 || i === 5 ? 1 : -2, z > 0 ? 1 : -1, Math.PI / 2, 0, 0); g.add(w); wheels.push(w); }
    g.add(at(pbox(len + 6, 4, 16, m.Bm), 0, 14, 0));
    return { g, wheels, tm };
  }
  function excavator(v) {
    const m = mats(v, 'rust'); const { A, A2, Bm, Cm, D, D2 } = m; const G = v.g; const HZ = T('#ffffff', 'hazard');
    const root = new V.Group(); const tr = [treads(root, 92, 22, m), treads(root, 92, -22, m)];
    const deck = grp(root, 0, 34, 0); deck.add(pbox(54, 10, 44, D));
    const torso = grp(deck, 0, 8, 0);
    torso.add(at(pbox(34, 36, 38, A, { tx: 0.85 }), 0, 20, 0)); torso.add(at(pbox(35, 6, 39, HZ), 0, 4, 0));
    torso.add(at(pbox(14, 12, 28, Bm), 14, 30, 0));
    for (let i = -1; i <= 1; i++) torso.add(at(pbox(1, 7, 7, E('#7ff0ff', 1.3)), 21.2, 30, i * 9));
    const head = grp(torso, 4, 44, 0); head.add(pbox(14, 10, 14, A)); head.add(at(pbox(1, 3, 10, E(G, 2)), 7.2, 1, 0)); head.add(at(sprite(G, 18), 8, 1, 0));
    for (const x of [-8, 0, 8]) { head.add(at(cyl(0.6, 0.6, 10, D2, 6), x, 9, 0)); head.add(at(sprite('#fff3c0', 16), x, 14, 6)); }
    railing(torso, -16, 10, 38, 18, D2);
    // drill arm (front, z+)
    const sh = grp(torso, 4, 30, 24); sh.add(sph(8, D)); sh.add(at(pbox(16, 16, 16, A), 0, 4, 2));
    const up = grp(sh); up.add(at(pbox(12, 20, 12, A2), 0, -10, 0));
    const fo = grp(up, 0, -20, 0); fo.add(sph(6, D)); fo.add(at(pbox(18, 10, 18, HZ), 0, -5, 0));
    const drill = grp(fo, 0, -10, 0); const spin = grp(drill); spin.add(at(cone(10, 40, T('#cfd4dc', 'metal'), 12), 0, -20, 0, Math.PI, 0, 0)); for (let i = 0; i < 4; i++) spin.add(at(torus(9 - i * 2, 1, D2, 14), 0, -6 - i * 8, 0, Math.PI / 2 + 0.3, 0, 0));
    const tip = grp(drill, 0, -40, 0);
    // excavator boom (back, z-)
    const bs = grp(torso, -4, 34, -22); bs.add(sph(7, D));
    const boom = grp(bs); boom.add(at(pbox(8, 46, 10, A), 0, 23, 0)); boom.add(at(cyl(2, 2, 34, Cm, 8), 6, 18, 0, 0, 0, 0.12));
    const stick = grp(boom, 0, 46, 0); stick.add(sph(5, D)); stick.add(at(pbox(7, 36, 8, A2), 0, -18, 0));
    const bucket = grp(stick, 0, -36, 0); bucket.add(at(pbox(16, 14, 16, D, { tx: 1.2 }), 4, -6, 0)); for (let i = -1; i <= 1; i++) bucket.add(at(wedge(3, 6, 3, D2, 0.1), 12, -12, i * 5, 0, 0, -2.4));
    boom.rotation.z = -0.65; stick.rotation.z = 2.4;
    return { root, scaleHint: 0.92, anchors: { hand: tip, core: torso, head }, apply(p, o, t) {
      const P = POSE(p); up.rotation.z = 0.6 + P.aim * 1.0 + P.raise * 0.5; fo.rotation.z = 0.2 - P.aim * 0.2;
      spin.rotation.y = t * 14 * (o.spin || 1);
      boom.rotation.z = -0.65 + Math.sin(t * 0.9) * 0.05 - P.raise * 0.2; bucket.rotation.z = Math.sin(t * 1.2) * 0.15;
      torso.rotation.z = -P.dash * 0.12 + P.hurt * 0.1; deck.rotation.y = 0;
      const roll = t * (P.dash > 0.1 ? 8 : 0.4); tr.forEach(tt => { tt.wheels.forEach(w => w.rotation.y = -roll); tt.tm.map.offset.y = roll * 0.05; });
    } };
  }
  function turtleTank(v) {
    const m = mats(v, 'plate'); const { A, A2, Bm, Cm, D, D2 } = m; const G = v.g;
    const root = new V.Group(); const tr = [treads(root, 96, 26, m), treads(root, 96, -26, m)];
    const hull = grp(root, 0, 30, 0);
    const shell = lathe([[0.1, 30], [26, 28], [40, 18], [50, 6], [52, 0]], T(v.c1, 'hex'), 8); shell.scale.set(1.05, 0.85, 0.8); hull.add(shell);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; hull.add(at(pbox(16, 10, 6, A2), Math.cos(a) * 50, -1, Math.sin(a) * 40, 0, -a, 0.3)); }
    const head = grp(hull, 54, 4, 0); head.add(pbox(20, 14, 18, A, { tx: 0.85 })); head.add(at(pbox(10, 5, 16, A2), 6, -6, 0)); for (const z of [-1, 1]) { head.add(at(pbox(1, 2.4, 4, E('#ffcc44', 2)), 10.2, 3, z * 5)); head.add(at(sprite('#ffcc44', 12), 11, 3, z * 5)); }
    const tur = grp(hull, -4, 26, 0); tur.add(cyl(14, 16, 10, A, 8)); tur.add(at(pbox(22, 12, 24, Bm), 0, 9, 0));
    const barrel = grp(tur, 8, 12, 0); for (const z of [-6, 6]) { barrel.add(at(cyl(3.4, 4, 62, D, 12), 31, 0, z, 0, 0, -Math.PI / 2)); barrel.add(at(cyl(4.6, 4.6, 6, D2, 12), 62, 0, z, 0, 0, -Math.PI / 2)); }
    const muzzle = grp(barrel, 66, 0, 0);
    const tower = grp(hull, -26, 28, 10); tower.add(at(pbox(14, 26, 14, A2), 0, 13, 0)); tower.add(at(pbox(16, 6, 16, Cm), 0, 28, 0)); tower.add(at(cyl(0.6, 0.6, 24, D2, 5), 0, 42, 0)); const g = new V.PlaneGeometry(10, 26, 2, 6); g.translate(0, -13, 0); const bn = mesh(g, T('#2d6b5a', 'cloth', { side: V.DoubleSide })); bn.userData.noOutline = true; at(bn, 8, 26, 0, 0, Math.PI / 2, 0); tower.add(bn);
    return { root, scaleHint: 0.88, anchors: { hand: muzzle, core: hull, head }, apply(p, o, t) {
      const P = POSE(p); barrel.rotation.z = 0.08 + P.aim * 0.2 - P.hurt * 0.08; head.rotation.z = Math.sin(t * 0.8) * 0.05; hull.rotation.z = -P.dash * 0.06 + P.hurt * 0.06;
      const roll = t * (P.dash > 0.1 ? 8 : 0.3); tr.forEach(tt => { tt.wheels.forEach(w => w.rotation.y = -roll); tt.tm.map.offset.y = roll * 0.05; }); bn.rotation.y = Math.PI / 2 + Math.sin(t * 2) * 0.2;
    } };
  }
  // ---- heron sniper walker (Talos) ----
  function heron(v) {
    const m = mats(v); const { A, A2, Bm, Cm, D, D2 } = m; const G = v.g;
    const root = new V.Group(); const body = grp(root, 0, 72, 0);
    body.add(at(pbox(34, 18, 22, A, { tx: 0.8 }), 0, 0, 0, 0, 0, 0.12)); body.add(at(pbox(20, 8, 23, Bm), 6, 8, 0)); body.add(at(pbox(14, 10, 18, D), -16, 2, 0));
    for (let i = 0; i < 4; i++) body.add(at(wedge(4, 16 - i * 2, 2, i % 2 ? A2 : Bm, 0.1), -18 - i * 3, 4 + i, 0, 0, 0, 1.7 + i * 0.12));
    const cg = new V.PlaneGeometry(36, 40, 6, 8); cg.translate(0, -20, 0); const cloak = mesh(cg, T('#4a5340', 'cloth', { side: V.DoubleSide })); cloak.userData.noOutline = true; at(cloak, -4, 12, 0, 0, Math.PI / 2, 0); body.add(cloak); cloak.userData.base = cg.attributes.position.array.slice();
    const neck = []; let parent = grp(body, 14, 6, 0);
    for (let i = 0; i < 3; i++) { const sgm = grp(parent); sgm.add(at(pbox(6, 14, 6, i % 2 ? A2 : A, { tx: 0.85 }), 0, 7, 0)); neck.push(sgm); parent = grp(sgm, 0, 14, 0); }
    const head = grp(parent); head.add(at(pbox(14, 7, 8, A, { tx: 0.7 }), 5, 0, 0, 0, 0, -Math.PI / 2)); head.add(at(pbox(1, 2, 7, E(G, 2.2)), 10, 2, 0)); head.add(at(sprite(G, 16), 11, 2, 0)); head.add(at(wedge(2, 10, 1.5, Cm, 0.1), -3, 4, 0, 0, 0, 2.2));
    const rail = grp(head, 10, -1, 0); rail.add(at(cyl(1.8, 2.2, 56, D, 10), 28, 0, 0, 0, 0, -Math.PI / 2)); for (let i = 0; i < 5; i++) rail.add(at(torus(3, 0.7, E(G, 1.6), 12), 10 + i * 9, 0, 0, 0, Math.PI / 2, 0)); const muzzle = grp(rail, 58, 0, 0);
    const legs = [];
    for (const z of [-1, 1]) { const th = grp(body, -2, -6, z * 8); th.add(at(pbox(8, 30, 8, z > 0 ? A : A2), 0, -15, 0)); const kn = grp(th, 0, -30, 0); kn.add(sph(4, D)); kn.add(at(pbox(6, 34, 6, D), 0, -17, 0)); const an = grp(kn, 0, -34, 0); an.add(sph(3, D)); an.add(at(pbox(5, 14, 5, A2), 0, -7, 0)); const ft = grp(an, 0, -14, 0); for (const dz of [-1, 0, 1]) ft.add(at(wedge(2.4, 12, 2.4, Cm, 0.1), 5, -1, dz * 3, 0, dz * 0.3, -Math.PI / 2 + 0.1)); ft.add(at(wedge(2.4, 8, 2.4, Cm, 0.1), -3, -1, 0, 0, 0, Math.PI / 2 - 0.2)); legs.push({ th, kn, an, ft, z }); }
    return { root, scaleHint: 0.95, anchors: { hand: muzzle, core: body, head }, apply(p, o, t) {
      const P = POSE(p); const bob = Math.sin(t * 2) * 1.2;
      body.position.y = 72 + bob - P.dash * 8 - P.crouch; body.rotation.z = -P.dash * 0.25 + P.hurt * 0.15;
      const lower = Math.max(P.aim, P.dash * 0.6);
      neck[0].rotation.z = -0.25 - lower * 0.75; neck[1].rotation.z = 0.15 - lower * 0.35; neck[2].rotation.z = 0.25 - lower * 0.2; head.rotation.z = -0.15 + lower * 0.95 - Math.sin(t * 1.3) * 0.04;
      legs.forEach((l, i) => { const ph = t * (P.dash > 0.1 ? 10 : 0) + i * Math.PI; l.th.rotation.z = 0.35 + Math.sin(ph) * 0.3 * P.dash + P.dash * 0.2; l.kn.rotation.z = -1.0 - Math.max(0, Math.cos(ph)) * 0.4 * P.dash; l.an.rotation.z = 0.9; l.ft.rotation.z = -(l.th.rotation.z + l.kn.rotation.z + l.an.rotation.z); });
      const pa = cloak.geometry.attributes.position, base = cloak.userData.base; for (let i = 0; i < pa.count; i++) { const y = base[i * 3 + 1]; pa.array[i * 3 + 2] = base[i * 3 + 2] + (Math.sin(t * 2.5 + y * 0.1) * 0.1 + P.dash * 0.4) * (-y); } pa.needsUpdate = true;
    } };
  }
  // ---- robotic wolf (Carmine Hound) ----
  function wolf(v) {
    const m = mats(v); const { A, A2, Bm, Cm, D, D2 } = m; const G = v.g;
    const root = new V.Group(); const body = grp(root, 0, 54, 0);
    body.add(at(pbox(28, 26, 26, A, { tx: 0.8 }), 14, 2, 0)); body.add(at(pbox(30, 16, 18, D), -10, 2, 0)); body.add(at(pbox(20, 22, 22, A2, { tx: 0.85 }), -30, 3, 0));
    for (let i = 0; i < 5; i++) body.add(at(wedge(3, 12 - i, 6, Cm, 0.1), 18 - i * 11, 14 + (i === 0 ? 2 : 0), 0, 0, 0, 0.5));
    body.add(at(pbox(24, 5, 27, Bm), 14, 13, 0)); body.add(at(pbox(18, 4, 23, Bm), -30, 13, 0));
    const lance = grp(body, -4, 18, 10); lance.add(at(cyl(2, 2.4, 50, D2, 10), 8, 0, 0, 0, 0, -Math.PI / 2)); lance.add(at(pbox(0.8, 30, 1, E(G, 2)), 14, 2.4, 0, 0, 0, -Math.PI / 2));
    const neck = grp(body, 26, 10, 0, 0, 0, -0.5); neck.add(at(pbox(12, 16, 13, A2), 0, 8, 0));
    const head = grp(neck, 0, 16, 0, 0, 0, 0.5);
    head.add(at(pbox(16, 12, 14, A, { tx: 0.8 }), 4, 0, 0)); head.add(at(pbox(14, 7, 9, A, { tx: 0.6 }), 16, -2, 0, 0, 0, -Math.PI / 2 + 0.1));
    for (const z of [-1, 1]) { head.add(at(wedge(4, 12, 3, Bm, 0.1), -2, 9, z * 4.5, z * 0.15, 0, 0.35)); head.add(at(pbox(1.2, 1.6, 3, E(G, 2.4)), 12, 2, z * 4.2)); head.add(at(sprite(G, 12), 13, 2, z * 4.5)); }
    const jaw = grp(head, 6, -5, 0); jaw.add(at(pbox(14, 4, 8, D, { tx: 0.6 }), 7, -1, 0, 0, 0, -Math.PI / 2)); for (let i = 0; i < 3; i++) jaw.add(at(wedge(1.2, 3, 1.2, T('#f0f0f0', 'metal'), 0.1), 4 + i * 4, 1.5, 3.5));
    const mouth = grp(head, 24, -4, 0);
    const legs = [];
    for (const [x, z, front] of [[18, 10, 1], [18, -10, 1], [-30, 10, 0], [-30, -10, 0]]) { const L = leg2(body, x, -8, z, 22, 26, 9, z > 0 ? A : A2, D); L.e.add(at(pbox(12, 5, 9, Bm), 3, -2, 0)); for (let i = -1; i <= 1; i++) L.e.add(at(wedge(1.8, 5, 1.8, Cm, 0.1), 9, -3, i * 3, 0, 0, -Math.PI / 2)); legs.push({ L, front, ph: (front ? 0 : Math.PI) + (z > 0 ? 0.6 : 0) }); }
    const tail = []; let tp = grp(body, -40, 6, 0, 0, 0, 2.2);
    for (let i = 0; i < 5; i++) { const sgm = grp(tp); sgm.add(at(pbox(5 - i * 0.5, 9, 5 - i * 0.5, i % 2 ? A2 : D), 0, 4.5, 0)); tail.push(sgm); tp = grp(sgm, 0, 9, 0); }
    tp.add(at(wedge(4, 22, 1.5, E('#ff6a2a', 2), 0.05), 0, 11, 0)); tp.add(at(sprite('#ff6a2a', 30, 0.7), 0, 10, 0));
    return { root, scaleHint: 0.95, anchors: { hand: mouth, core: body, head }, apply(p, o, t) {
      const P = POSE(p); const run = P.dash > 0.1;
      body.position.y = 54 + (run ? Math.abs(Math.sin(t * 12)) * 4 : Math.sin(t * 2) * 0.8) - P.crouch; body.rotation.z = (run ? Math.sin(t * 12) * 0.06 : 0) + P.hurt * 0.15;
      neck.rotation.z = -0.5 - P.aim * 0.3 + P.raise * 0.3; head.rotation.z = 0.5 + P.aim * 0.2;
      jaw.rotation.z = -(o.mouth || P.aim > 0.5 ? 0.5 : 0.05 + Math.sin(t * 1.5) * 0.03);
      legs.forEach(l => { const ph = t * (run ? 12 : 0) + l.ph; const sw = run ? 0.6 : 0.03 * Math.sin(t * 2 + l.ph); l.L.a.rotation.z = (l.front ? -0.1 : 0.15) + Math.sin(ph) * sw; l.L.b.rotation.z = (l.front ? 0.25 : -0.35) + (run ? Math.max(0, Math.cos(ph)) * 0.6 * (l.front ? 1 : -1) : 0); l.L.e.rotation.z = -(l.L.a.rotation.z + l.L.b.rotation.z); });
      tail.forEach((s2, i) => s2.rotation.z = Math.sin(t * 3 - i * 0.6) * 0.12 + (i === 0 ? P.aim * -0.4 : 0));
    } };
  }
  // ---- crab missile walker (Warden) ----
  function crab(v) {
    const m = mats(v); const { A, A2, Bm, Cm, D, D2 } = m; const G = v.g;
    const root = new V.Group(); const body = grp(root, 0, 34, 0);
    const shell = lathe([[0.1, 14], [20, 13], [32, 8], [38, 0], [34, -6], [0.1, -7]], A, 10); shell.scale.set(1.15, 1, 0.95); body.add(shell);
    body.add(at(pbox(12, 10, 40, A2), 36, -1, 0)); for (const z of [-1, 1]) { body.add(at(cyl(1.4, 1.4, 10, D, 6), 40, 8, z * 8)); body.add(at(sph(2.4, E('#ff3344', 2), 8), 40, 13, z * 8)); body.add(at(sprite('#ff3344', 14), 41, 13, z * 8)); }
    for (let i = 0; i < 6; i++) body.add(at(wedge(4, 12, 4, Cm, 0.1), -20 + i * 8, 13, (i % 2 ? 1 : -1) * 14, 0, 0, 0.3));
    const pods = [];
    for (const z of [-1, 1]) { const pg = grp(body, -2, 18, z * 15); pg.add(pbox(18, 16, 22, Bm)); for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) pg.add(at(cyl(1.8, 1.8, 1, E('#ff4040', 1.5), 10), 9.1, -5 + i * 5, -7.5 + j * 5, 0, 0, Math.PI / 2)); pg.add(at(cyl(0.5, 0.5, 18, D2, 5), -6, 14, 0)); pods.push(pg); }
    const legs = [];
    for (let i = 0; i < 3; i++) for (const z of [-1, 1]) { const L = leg2(body, 18 - i * 18, -2, z * 26, 22, 30, 6, A2, D); L.a.rotation.x = z * -1.0; L.b.rotation.x = z * 1.4; L.e.add(at(wedge(4, 10, 4, Cm, 0.1), 0, -4, 0, Math.PI, 0, 0)); legs.push({ L, i, z }); }
    const claws = [];
    for (const z of [-1, 1]) { const c = grp(body, 38, -2, z * 20, z * -0.3, 0, 0); c.add(at(pbox(16, 9, 9, A), 8, 0, 0)); const up = grp(c, 16, 2, 0); up.add(at(wedge(9, 20, 7, Cm, 0.1), 8, 0, 0, 0, 0, -Math.PI / 2)); const lo = grp(c, 16, -3, 0); lo.add(at(wedge(7, 16, 6, Cm, 0.1), 7, 0, 0, 0, 0, -Math.PI / 2)); claws.push({ up, lo }); }
    const muzzle = grp(body, 10, 22, 0);
    return { root, scaleHint: 0.95, anchors: { hand: muzzle, core: body, head: body }, apply(p, o, t) {
      const P = POSE(p); const sc = P.dash > 0.1 ? 1 : 0.2;
      body.position.y = 34 + Math.sin(t * 3) * 0.8; body.rotation.z = P.hurt * 0.1 - P.dash * 0.05;
      pods.forEach(pg => pg.rotation.z = P.aim * 0.5 + P.chest * 0.6);
      legs.forEach(l => { const ph = t * (P.dash > 0.1 ? 12 : 3) + l.i * 2 + (l.z > 0 ? 0 : Math.PI); l.L.a.rotation.z = Math.sin(ph) * 0.25 * sc; });
      claws.forEach((c, i) => { const op = 0.2 + Math.sin(t * 2 + i) * 0.1 + P.raise * 0.4; c.up.rotation.z = op; c.lo.rotation.z = -op; });
    } };
  }
  // ---- sky manta (Seraphyne) ----
  function manta(v) {
    const m = mats(v); const { A, A2, Bm, Cm, D, D2 } = m; const G = v.g;
    const root = new V.Group(); const body = grp(root, 0, 80, 0);
    body.add(at(ell(30, 7, 18, A), 0, 0, 0)); body.add(at(pbox(26, 4, 16, Bm, { tx: 0.6 }), 8, 5, 0, 0, 0, -Math.PI / 2 + 0.2));
    const wings = [];
    for (const z of [-1, 1]) { let par = grp(body, -2, 0, z * 14); for (let i = 0; i < 5; i++) { const sgm = grp(par); const w = 24 - i * 3.5; sgm.add(at(pbox(36 - i * 5, 2.6, w, i % 2 ? Bm : A, { tx: 0.8 }), -2 - i * 3, 0, z * w / 2)); sgm.add(at(pbox(1, 1.2, w, E(G, 1.6)), 12 - i * 3, 0.8, z * w / 2)); if (i % 2 === 0) sgm.add(at(sprite(G, 14, 0.7), 0, 2, z * w / 2)); wings.push({ s: sgm, i, z }); par = grp(sgm, 0, 0, z * w); } }
    const tail = []; let tp = grp(body, -28, 0, 0);
    for (let i = 0; i < 9; i++) { const sgm = grp(tp); sgm.add(at(pbox(8, 2.6 - i * 0.15, 2.6 - i * 0.15, i % 2 ? A2 : D), -4, 0, 0)); tail.push(sgm); tp = grp(sgm, -8, 0, 0); }
    tp.add(at(wedge(3, 16, 1.4, Cm, 0.05), -6, 0, 0, 0, 0, Math.PI / 2));
    // knight rider fused at the front
    const rider = grp(body, 14, 4, 0);
    rider.add(at(pbox(9, 16, 12, A, { tx: 0.75 }), 0, 9, 0)); rider.add(at(pbox(4, 8, 8, Bm), 4, 10, 0));
    const head = grp(rider, 1, 21, 0); head.add(pbox(7, 7, 6, A)); head.add(at(pbox(1, 1.4, 5, E(G, 2.4)), 3.6, 0.5, 0)); for (let i = -1; i <= 1; i++) head.add(at(wedge(1.6, 12, 1.2, Cm, 0.1), -2, 4, i * 2.4, i * 0.3, 0, 0.6));
    const armF = grp(rider, 0, 15, 7); armF.add(at(pbox(4, 12, 4, A2), 0, -6, 0)); const fore = grp(armF, 0, -12, 0); fore.add(at(pbox(4, 10, 4, A), 0, -5, 0));
    const tri = grp(fore, 0, -10, 0, 0, 0, -Math.PI / 2); tri.add(at(cyl(0.9, 0.9, 60, Cm, 8), 0, -10, 0)); for (const dz of [-3, 0, 3]) tri.add(at(wedge(1.4, 9, 1, Cm, 0.1), 0, -44, dz, Math.PI, 0, 0)); tri.add(at(sprite(G, 16), 0, -40, 0));
    const tip = grp(tri, 0, -46, 0);
    return { root, scaleHint: 0.95, anchors: { hand: tip, core: body, head }, apply(p, o, t) {
      const P = POSE(p); body.position.y = 80 + Math.sin(t * 1.6) * 4; body.rotation.z = Math.sin(t * 1.6 + 1) * 0.05 - P.dash * 0.2 + P.hurt * 0.2;
      const sp = 2 + P.dash * 3; wings.forEach(w => { w.s.rotation.x = w.z * (Math.sin(t * sp - w.i * 0.7) * 0.22 + (w.i === 0 ? 0.05 : 0)); });
      tail.forEach((s2, i) => { s2.rotation.y = Math.sin(t * 2.2 - i * 0.5) * 0.12; s2.rotation.z = Math.sin(t * 1.7 - i * 0.4) * 0.06; });
      armF.rotation.z = 0.4 + P.aim * 0.9 + P.raise * 0.6; fore.rotation.z = 0.3 - P.aim * 0.3;
    } };
  }
  // ---- crowned jellyfish drone (Vael Shard) ----
  function jelly(v) {
    const m = mats(v); const { A, Bm, Cm, D } = m; const G = v.g;
    const root = new V.Group(); const body = grp(root, 0, 70, 0);
    const bellM = T(v.c2, 'plate', { transparent: true, opacity: 0.92 }); const bell = lathe([[0.1, 20], [12, 18], [20, 10], [24, 0], [22, -3], [16, -1], [0.1, -2]], bellM, 18); body.add(bell);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; body.add(at(pbox(3, 18, 1.5, Cm), Math.cos(a) * 18, 8, Math.sin(a) * 18, 0, -a, Math.cos(a) * 0.5)); }
    const ring = grp(body, 0, 26, 0); ring.add(at(torus(20, 1.6, Cm, 32), 0, 0, 0, Math.PI / 2, 0, 0)); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ring.add(at(wedge(2.4, 12, 2.4, Cm, 0.08), Math.cos(a) * 20, 6, Math.sin(a) * 20)); ring.add(at(sph(1.4, E(G, 2), 8), Math.cos(a) * 20, 13, Math.sin(a) * 20)); }
    body.add(at(sph(5, E(G, 2.2), 14), 12, 6, 0)); body.add(at(sprite(G, 40), 14, 6, 0)); body.add(at(torus(7, 0.8, E(G, 1.6), 20), 12, 6, 0, 0, Math.PI / 2, 0));
    const tents = [];
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; let par = grp(body, Math.cos(a) * 12, -2, Math.sin(a) * 12); const ch = []; for (let k = 0; k < 3; k++) { const sgm = grp(par); sgm.add(at(k === 2 ? wedge(3, 18, 2, Cm, 0.06) : pbox(3 - k * 0.5, 14, 3 - k * 0.5, k % 2 ? A : Bm), 0, -7 - (k === 2 ? 2 : 0), 0, k === 2 ? Math.PI : 0, 0, 0)); ch.push(sgm); par = grp(sgm, 0, -14, 0); } tents.push({ ch, a }); }
    const halo2 = grp(body, 0, -32, 0); halo2.add(at(torus(10, 0.8, E(G, 1.8), 24), 0, 0, 0, Math.PI / 2, 0, 0));
    return { root, scaleHint: 1.05, anchors: { hand: body, core: body, head: ring }, apply(p, o, t) {
      const P = POSE(p); body.position.y = 70 + Math.sin(t * 1.8) * 5; const pulse = 1 + Math.sin(t * 3) * 0.05; bell.scale.set(pulse, 1 / pulse, pulse); ring.rotation.y = t * 0.6;
      tents.forEach((tn, i) => tn.ch.forEach((s2, k) => { s2.rotation.x = Math.sin(t * 2.4 - k * 0.8 + i) * 0.18; s2.rotation.z = Math.cos(t * 2 - k * 0.7 + i) * 0.14 - P.dash * 0.3; }));
    } };
  }

  // ---------- Creature / vehicle rigs ----------
  function beast(v) {
    const big = v.big ? 1.25 : 1; const root = new V.Group(); const g = new V.Group(); g.scale.setScalar(big); root.add(g);
    const C1 = M(v.c1, { metalness: 0.2, roughness: 0.55 }), C2 = M(v.c2, { metalness: 0.2, roughness: 0.5 }), C3 = M(v.c3, { metalness: 0.1, roughness: 0.4 });
    const segs = []; for (let i = 0; i < 4; i++) { const r = 16 - Math.abs(i - 1.5) * 2; const s = sph(r, i % 2 ? C1 : C2, 14); s.scale.set(1.25, 1, 1.1); at(s, -34 + i * 20, 40, 0); g.add(s); segs.push(s); s.add(at(sprite(v.g, 18, 0.7), 0, -6, r * 0.8)); if (v.big) s.add(at(cone(5, 18, C3, 6), 0, r + 6, 0)); }
    const legs = []; for (let i = 0; i < 4; i++) for (const z of [-1, 1]) { const l = limb(20, 7, 5, 7, z > 0 ? C1 : C2); at(l.pivot, -30 + i * 18, 34, z * 14); g.add(l.pivot); const l2 = limb(24, 5, 2, 5, C2); l.end.add(l2.pivot); legs.push({ a: l, b: l2, i, z }); }
    const head = new V.Group(); at(head, 42, 44, 0); g.add(head);
    head.add(tbox(20, 26, 24, 22, C2)); head.children[0].rotation.z = Math.PI / 2;
    const jaws = []; for (const z of [-1, 1]) { const j = new V.Group(); const m = tbox(2, 6, 20, 4, C3); m.rotation.z = -Math.PI / 2; m.position.x = 10; j.add(m); at(j, 12, -2, z * 6); head.add(j); jaws.push({ j, z }); }
    const eye = new V.Group(); eye.add(sph(4, E(v.g, 2), 8)); eye.add(sprite(v.g, 24)); at(eye, 8, 6, 8); head.add(eye);
    const eye2 = eye.clone(); eye2.position.z = -8; head.add(eye2);
    const mouth = new V.Group(); at(mouth, 24, 0, 0); head.add(mouth);
    return { root, anchors: { hand: mouth, core: segs[1], head }, apply(p, o, t) {
      const bob = Math.sin(t * 4) * 2; segs.forEach((s, i) => s.position.y = 40 + bob + Math.sin(t * 3 + i) * 1.5); head.position.y = 44 + bob;
      legs.forEach(l => { const ph = Math.sin(t * 6 + l.i * 1.6 + (l.z > 0 ? 0 : 1)) * 0.25; l.a.pivot.rotation.z = -0.9 + ph; l.b.pivot.rotation.z = 1.2; });
      const m = o.mouth ? 0.6 : Math.sin(t * 5) * 0.15; jaws.forEach(j => j.j.rotation.y = j.z * m);
    } };
  }
  function wyrm(v) {
    const root = new V.Group(); const C1 = M(v.c1, { metalness: 0.2, roughness: 0.5 }), C2 = M(v.c2, { metalness: 0.2, roughness: 0.5 });
    const segs = []; for (let i = 0; i < 12; i++) { const s = sph(9 - i * 0.55, i % 2 ? C1 : C2, 10); root.add(s); segs.push(s); }
    const wings = []; for (const z of [-1, 1]) { const w = new V.Group(); const m = shapeMesh([0, 0, -30, 46, -52, 20, -20, -6], 1.5, M(shade(v.c2, z > 0 ? 0.1 : -0.3), { side: V.DoubleSide, roughness: 0.7, metalness: 0.1, transparent: true, opacity: 0.92 })); m.rotation.x = Math.PI / 2 * z; w.add(m); at(w, 18, 62, z * 4); root.add(w); wings.push({ w, z }); }
    const head = new V.Group(); head.add(tbox(10, 16, 26, 14, C2)); head.children[0].rotation.z = -Math.PI / 2; head.add(at(sprite(v.g, 26), 8, 2, 6)); head.add(at(sph(2.5, E(v.g, 2), 6), 8, 2, 6)); root.add(head);
    const mouth = new V.Group(); mouth.position.x = 14; head.add(mouth);
    return { root, anchors: { hand: mouth, core: segs[2], head }, apply(p, o, t) {
      segs.forEach((s, i) => s.position.set(40 - i * 9, 60 + Math.sin(t * 4 - i * 0.6) * 8, Math.cos(t * 2 - i * 0.4) * 3));
      head.position.copy(segs[0].position); head.position.x += 6;
      const flap = Math.sin(t * 6) * 0.6; wings.forEach(w => w.w.rotation.x = w.z * (0.2 + flap));
    } };
  }
  function dragon(v) {
    const root = new V.Group(); const g = new V.Group(); root.add(g);
    const C1 = M(v.c1, { metalness: 0.45, roughness: 0.3 }), C1d = M(shade(v.c1, -0.3)), C2 = M(v.c2), C3 = M(v.c3, { metalness: 0.7, roughness: 0.25 });
    const legs = []; for (const z of [-1, 1]) { const l = limb(28, 13, 9, 12, z > 0 ? C1 : C1d); at(l.pivot, z > 0 ? 6 : -6, 56, z * 10); g.add(l.pivot); l.end.add(at(box(22, 6, 12, C2), 8, -2, 0)); legs.push(l); }
    const torso = tbox(30, 34, 50, 26, C1); at(torso, 0, 80, 0, 0, 0, -0.15); g.add(torso);
    g.add(at(tbox(14, 18, 30, 28, C2), 6, 80, 0, 0, 0, -0.15));
    const core = new V.Group(); at(core, 14, 80, 0); core.add(mesh(new V.OctahedronGeometry(6), E(v.g, 2))); core.add(sprite(v.g, 50)); g.add(core);
    const tail = []; for (let i = 0; i < 10; i++) { const s = sph(7 - i * 0.5, i % 2 ? C1 : C1d, 8); g.add(s); tail.push(s); }
    const neck = tbox(10, 14, 28, 12, C1); at(neck, 14, 112, 0, 0, 0, -0.5); g.add(neck);
    const head = new V.Group(); at(head, 26, 124, 0); g.add(head);
    head.add(at(tbox(10, 18, 38, 16, C1), 10, 0, 0, 0, 0, -Math.PI / 2));
    const jaw = new V.Group(); jaw.add(at(tbox(6, 12, 30, 12, C1d), 12, -6, 0, 0, 0, -Math.PI / 2)); head.add(jaw);
    for (const z of [-1, 1]) { head.add(at(cone(3, 26, C3, 5), -8, 10, z * 6, z * 0.3, 0, 0.9)); head.add(at(sph(2, E(v.g, 2), 6), 14, 3, z * 6)); head.add(at(sprite(v.g, 18), 14, 3, z * 6)); }
    const mouth = new V.Group(); mouth.position.set(30, -2, 0); head.add(mouth);
    const arm = limb(22, 9, 7, 9, C1); at(arm.pivot, 12, 96, 12); g.add(arm.pivot);
    const wings = []; for (const z of [-1, 1]) { const w = new V.Group(); const memb = shapeMesh([0, 0, -36, 70, -96, 70, -76, 36, -106, 20, -56, -8], 1.5, new V.MeshStandardMaterial({ color: col(v.c2), emissive: col(v.g), emissiveIntensity: 0.25, side: V.DoubleSide, transparent: true, opacity: 0.88, metalness: 0.3, roughness: 0.5 })); w.add(memb); w.add(at(cyl(2, 2, 110, C3, 5), -48, 35, 0, 0, 0, 0.95)); at(w, -2, 96, z * 14); g.add(w); wings.push({ w, z }); }
    return { root, anchors: { hand: mouth, core, head }, apply(p, o, t) {
      g.position.y = Math.sin(t * 2.5) * 3; const flap = Math.sin(t * 3) * 0.25;
      wings.forEach(w => w.w.rotation.set(w.z * (0.5 + flap), w.z * -0.3, 0));
      tail.forEach((s, i) => s.position.set(-16 - i * 7, 60 - i * 1 + Math.sin(t * 3 - i * 0.5) * 5, Math.sin(t * 2 - i * 0.3) * 4));
      jaw.rotation.z = o.mouth ? -0.45 : -0.05; arm.pivot.rotation.z = 0.9 + (o.armUp || 0);
      core.children[1].scale.setScalar(50 * (o.coreGlow || 1));
    } };
  }
  function ship(v) {
    const root = new V.Group(); const g = new V.Group(); g.position.y = 50; root.add(g);
    const C1 = M(v.c1, { metalness: 0.7, roughness: 0.35 }), C2 = M(v.c2), C3 = M(v.c3), DARK = M('#202530');
    const hull = tbox(26, 40, 200, 34, C1); hull.rotation.z = -Math.PI / 2; g.add(hull);
    g.add(at(cone(17, 30, C1, 4), 112, 0, 0, Math.PI / 4, 0, -Math.PI / 2));
    g.add(at(box(150, 10, 36, C2), -10, -14, 0));
    g.add(at(box(120, 3, 37, C3), 0, -2, 0));
    g.add(at(tbox(16, 26, 30, 20, C1), -40, 30, 0));
    g.add(at(box(22, 4, 21, E(v.g, 1.6)), -40, 38, 0));
    for (const x of [0, 32]) { g.add(at(cyl(9, 10, 8, C2, 10), x, 22, 0)); g.add(at(cyl(2, 2, 24, DARK, 6), x + 12, 25, 0, 0, 0, Math.PI / 2)); }
    for (let i = 0; i < 10; i++) g.add(at(box(6, 2, 0.5, E(v.g, 1.2)), -80 + i * 14, 0, 20.5));
    const flames = []; for (let i = -1; i <= 1; i++) { const f = new V.Group(); f.add(at(cone(6, 34, E(v.g, 2), 8), -17, 0, 0, 0, 0, Math.PI / 2)); f.add(sprite(v.g, 50)); at(f, -102, i * 10, 0); g.add(f); flames.push(f); }
    const prow = new V.Group(); prow.position.x = 126; g.add(prow);
    return { root, anchors: { hand: prow, core: prow, head: g }, apply(p, o, t) { g.position.y = 50 + Math.sin(t * 1.5) * 2; flames.forEach((f, i) => f.scale.setScalar(0.9 + Math.sin(t * 20 + i) * 0.1)); } };
  }
  function shard(v) {
    const root = new V.Group(); const g = new V.Group(); root.add(g);
    const crystal = mesh(new V.OctahedronGeometry(30), new V.MeshStandardMaterial({ color: col(v.c1), emissive: col(v.c2), emissiveIntensity: 0.5, metalness: 0.2, roughness: 0.1, flatShading: true, transparent: true, opacity: 0.92 })); crystal.scale.set(0.7, 1.2, 0.7); g.add(crystal);
    g.add(new V.LineSegments(new V.EdgesGeometry(crystal.geometry), new V.LineBasicMaterial({ color: col(v.g).multiplyScalar(1.8), toneMapped: false }))); g.children[1].scale.copy(crystal.scale);
    g.add(sprite(v.g, 70, 0.8));
    const orbs = []; for (let i = 0; i < 4; i++) { const o = mesh(new V.OctahedronGeometry(6), M(v.c1, { emissive: col(v.g), emissiveIntensity: 0.6 })); g.add(o); orbs.push(o); }
    return { root, anchors: { hand: g, core: g, head: g }, apply(p, o, t) { g.position.y = 60 + Math.sin(t * 2) * 5; crystal.rotation.y = t; g.children[1].rotation.y = t; orbs.forEach((b, i) => { const a = t * 1.5 + i * Math.PI / 2; b.position.set(Math.cos(a) * 34, Math.sin(a * 2) * 6, Math.sin(a) * 34); b.rotation.y = t * 2; }); } };
  }
  function colossus(v) {
    const root = new V.Group(); const g = new V.Group(); g.position.y = 100; root.add(g);
    const geo = new V.IcosahedronGeometry(66, 3); const pa = geo.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); const n = 1 + Math.sin(x * 0.09) * Math.cos(y * 0.11) * 0.08 + Math.sin(z * 0.13) * 0.05; pa.setXYZ(i, x * n, y * n * 0.95, z * n); } geo.computeVertexNormals();
    const bodyM = new V.MeshStandardMaterial({ color: col(v.c1), emissive: col(v.c2), emissiveIntensity: 0.15, roughness: 0.55, metalness: 0.2 });
    const bodyMesh = mesh(geo, bodyM); g.add(bodyMesh);
    for (let i = 0; i < 5; i++) { const r = mesh(new V.TorusGeometry(60 - i * 3, 2.5, 6, 30, Math.PI), M(v.c2, { roughness: 0.5 })); r.rotation.set(0, Math.PI / 2, Math.PI); r.position.y = 30 - i * 14; r.scale.set(1, 0.4 + i * 0.12, 1); g.add(r); }
    if (v.crown) for (let i = -2; i <= 2; i++) g.add(at(cone(7, i === 0 ? 70 : 46, M(v.c3, { emissive: col(v.g), emissiveIntensity: 0.4 }), 6), i * 18, 80 + (i === 0 ? 10 : 0), 0, 0, 0, -i * 0.15));
    const eye = new V.Group(); at(eye, 52, 10, 26); eye.add(sph(14, E(v.g, 2), 14)); const pupil = box(3, 22, 3, new V.MeshBasicMaterial({ color: 0x000000 })); pupil.position.x = 10; eye.add(pupil); const eg = sprite(v.g, 140, 0.9); eye.add(eg); g.add(eye);
    const tent = []; for (let i = 0; i < 7; i++) { const chain = []; for (let k = 0; k < 9; k++) { const s = sph(6 - k * 0.45, M(i % 2 ? v.c1 : v.c2, { roughness: 0.5 }), 8); g.add(s); chain.push(s); } tent.push(chain); }
    const up = []; for (let i = 0; i < 5; i++) { const chain = []; for (let k = 0; k < 8; k++) { const s = sph(4.5 - k * 0.3, M(v.c2), 6); g.add(s); chain.push(s); } const tip = sprite(v.g, 20); g.add(tip); up.push({ chain, tip }); }
    return { root, anchors: { hand: eye, core: eye, head: g }, apply(p, o, t) {
      const pulse = 1 + Math.sin(t * 2) * 0.03; bodyMesh.scale.setScalar(pulse); eg.scale.setScalar(140 * (o.coreGlow || 1));
      tent.forEach((c, i) => c.forEach((s, k) => s.position.set(-60 + i * 20 + Math.sin(t * 2 + i + k * 0.6) * 10 + (i - 3) * k * 2.5, -50 - k * 7, Math.cos(t + i + k * 0.5) * 12)));
      up.forEach((u, i) => { const a0 = Math.PI * (0.15 + i * 0.17); let x = Math.cos(a0) * 50, y = Math.sin(a0) * 40; u.chain.forEach((s, k) => { x += Math.cos(a0 + Math.sin(t * 2 + i + k) * 0.5) * 9; y += Math.sin(a0 + Math.sin(t * 1.7 + k) * 0.4) * 9; s.position.set(x, y + 20, Math.sin(t + k) * 8); }); u.tip.position.copy(u.chain[u.chain.length - 1].position); });
    } };
  }
  function hollow(v) {
    const root = new V.Group(); const g = new V.Group(); g.position.y = 110; root.add(g);
    g.add(mesh(new V.SphereGeometry(58, 32, 16), new V.MeshBasicMaterial({ color: 0x000000 })));
    const rim = mesh(new V.TorusGeometry(62, 1.5, 8, 64), E('#ffffff', 2)); g.add(rim);
    const rim2 = mesh(new V.TorusGeometry(68, 4, 8, 64), new V.MeshBasicMaterial({ color: col('#b48cff'), transparent: true, opacity: 0.4, blending: V.AdditiveBlending, toneMapped: false })); g.add(rim2);
    const eye = new V.Group(); eye.position.z = 58; const white = mesh(new V.CircleGeometry(30, 32), E('#ffffff', 1.5)); eye.add(white); const pupil = mesh(new V.CircleGeometry(8, 24), new V.MeshBasicMaterial({ color: 0 })); pupil.position.z = 0.5; eye.add(pupil); g.add(eye);
    const shards = []; for (let i = 0; i < 9; i++) { const s = new V.Group(); const m = mesh(new V.OctahedronGeometry(12), new V.MeshBasicMaterial({ color: 0 })); m.scale.set(0.7, 1.3, 0.7); s.add(m); const e = new V.LineSegments(new V.EdgesGeometry(m.geometry), new V.LineBasicMaterial({ color: 0xffffff, toneMapped: false })); e.scale.copy(m.scale); s.add(e); g.add(s); shards.push(s); }
    return { root, anchors: { hand: eye, core: eye, head: g }, apply(p, o, t) {
      const open = 0.5 + Math.sin(t * 0.7) * 0.4; white.scale.set(1, Math.max(0.1, open * 0.5), 1); pupil.position.x = Math.sin(t) * 6; pupil.scale.setScalar(0.6 + open * 0.5);
      shards.forEach((s, i) => { const a = t * 0.3 + i * Math.PI * 2 / 9, r = 72 + Math.sin(t + i) * 10; s.position.set(Math.cos(a) * r, Math.sin(a) * r, Math.sin(a * 2) * 20); s.rotation.set(t + i, t * 0.7, 0); });
      rim2.scale.setScalar(1 + Math.sin(t * 3) * 0.04);
    } };
  }


  // ================= rig assembly: dispatch, ink outlines, hit-flash =====
  function specialist(v,kind) {
    const m=mats(v),{A,A2,Bm,Cm,D,D2}=m,G=v.g;
    if(kind==='rigger'||kind==='harpoon'){
      const r=humanoid(v,KITS[kind]);
      if(kind==='rigger'){const crane=grp(r.root,-15,98,-10,0,0,.3);crane.add(at(pbox(6,58,8,Cm),0,20,0));crane.add(at(pbox(42,5,8,Cm),18,48,0));crane.add(at(cyl(.8,.8,38,D2,5),37,29,0));crane.add(at(torus(5,1,D2,12,Math.PI*1.5),37,8,0));}
      else{r.root.add(at(cyl(4,6,48,A2,10),22,103,17,0,0,Math.PI/2));for(let i=0;i<6;i++)r.root.add(at(torus(3,1,D2,8),-10-i*3,95-i*3,19,i%2*Math.PI/2,0,0));}
      return r;
    }
    if(kind==='spitter'||kind==='broodmaw'){
      const r=beast(v),sac=ell(kind==='broodmaw'?38:24,kind==='broodmaw'?31:22,26,Bm);at(sac,-8,76,0);r.root.add(sac);
      for(const z of [-1,1])for(let i=0;i<3;i++)r.root.add(at(sph(6,E(G,1.4),10),-28+i*20,76,z*22));
      if(kind==='spitter'){r.root.add(at(cyl(5,8,72,A,10),29,88,0,0,0,Math.PI/2));const muzzle=grp(r.root,67,88,0);r.anchors.hand=muzzle;}
      else for(let i=0;i<5;i++){const egg=ell(9,16,11,Cm);at(egg,-35+i*14,97-(i%2)*4,0);r.root.add(egg);}
      return r;
    }
    if(kind==='skyray'){const r=manta(v);r.root.scale.set(1.3,.7,1.55);for(let i=0;i<5;i++)r.root.add(at(cone(3,24,Cm,5),-40+i*13,40,0,0,0,-.6));return r;}
    if(kind==='siegecrawler'){const r=turtleTank(v);for(const z of [-10,10]){r.root.add(at(cyl(4,6,102,A,10),34,78,z,0,0,Math.PI/2));r.root.add(at(pbox(12,10,13,Cm),86,78,z));}r.anchors.hand=grp(r.root,92,78,0);r.root.scale.set(1,.8,1);return r;}
    const root=new V.Group();let core,head,hand;const moving=[];
    if(kind==='burrower'){
      for(let i=0;i<8;i++){const r=16-i*.8,s=ell(r,r*.95,r*1.05,i%2?A:Bm);at(s,38-i*17,28+Math.sin(i*.5)*10,0);root.add(s);moving.push(s);}
      head=grp(root,58,29,0);head.add(at(torus(13,4,Cm,18),0,0,0,0,Math.PI/2,0));for(let i=0;i<8;i++){const a=i*Math.PI/4;head.add(at(cone(3,16,A2,5),7,Math.cos(a)*12,Math.sin(a)*12,0,0,-Math.PI/2));}hand=grp(head,15,0,0);core=moving[3];
    }else if(kind==='aegisdrone'){
      core=grp(root,0,58,0);core.add(ell(18,11,17,A));core.add(at(torus(24,3,Cm,6),0,0,0,Math.PI/2,0,0));core.add(at(sprite(G,65,.5),0,0,0));
      for(const z of [-1,1]){const shield=shapeMesh([0,22,20,12,20,-14,0,-26,-20,-14,-20,12],4,Bm);at(shield,0,0,z*30,0,Math.PI/2,0);core.add(shield);moving.push(shield);}head=grp(core,13,5,0);head.add(sph(4,E(G,2),10));hand=grp(core,22,-3,0);
    }else if(kind==='gale'){
      core=grp(root,0,40,0);core.add(pbox(82,12,20,A,{tx:.35}));core.add(at(ell(17,10,14,Bm),3,12,0));core.add(at(pbox(8,16,16,Cm),-12,15,0));
      for(const z of [-1,1]){core.add(at(cyl(7,10,42,D2,12),-35,-3,z*18,0,0,Math.PI/2));core.add(at(sprite(G,55,.7),-58,-3,z*18));core.add(at(pbox(38,3,14,Bm,{tx:.3}),-13,0,z*27,0,z*.25,0));}head=grp(core,18,16,0);head.add(sph(5,E(G,1.6),10));hand=grp(core,45,0,0);
    }else if(kind==='monolith'){
      core=grp(root,0,74,0);core.add(at(cyl(0,24,118,A,4),0,0,0,0,Math.PI/4,0));core.add(at(cyl(24,0,32,Bm,4),0,-74,0,0,Math.PI/4,0));core.add(at(ell(12,18,12,E(G,1.4)),10,-5,10));
      const halo=torus(38,2,Cm,6);at(halo,0,0,0,Math.PI/2,0,0);root.add(halo);moving.push(halo);head=grp(core,0,50,0);hand=grp(core,20,0,0);hand.add(sprite(G,55,.5));
    }else if(kind==='cantor'){
      core=grp(root,0,76,0);const prism=shapeMesh([0,31,25,-16,-25,-16],8,A);core.add(prism);core.add(at(sph(10,E(G,2),14),0,0,8));
      for(let i=0;i<3;i++){const a=i*Math.PI*2/3,leg=grp(core,Math.cos(a)*10,-13,Math.sin(a)*10);leg.add(at(pbox(6,58,6,Bm,{tx:.4}),Math.cos(a)*12,-29,Math.sin(a)*12,0,0,-Math.cos(a)*.3));moving.push(leg);}
      const crown=torus(29,2.5,Cm,3);at(crown,0,25,0,0,0,Math.PI/2);core.add(crown);head=grp(core,0,31,0);hand=grp(core,15,0,8);
    }
    return {root,anchors:{core,head,hand},apply(p,o,t){if(kind==='burrower')moving.forEach((s,i)=>s.position.y=28+Math.sin(t*2+i*.5)*8);else if(core){core.position.y=(kind==='monolith'?74:kind==='cantor'?76:kind==='gale'?40:58)+Math.sin(t*2)*3;}if(kind==='monolith')moving[0].rotation.z=t*.3;if(kind==='aegisdrone')moving.forEach((s,i)=>s.rotation.y=Math.sin(t+i)*.15);}};
  }
  const SPECIAL = { bastion: v => walker(v, false), sovereign: v => walker(v, true), trinity: excavator, tyrant: turtleTank, talos: heron, carmine: wolf, carmine_e: wolf, warden: crab, seraphyne: manta, shard: jelly,
    spitter:v=>specialist(v,'spitter'),broodmaw:v=>specialist(v,'broodmaw'),burrower:v=>specialist(v,'burrower'),skyray:v=>specialist(v,'skyray'),aegisdrone:v=>specialist(v,'aegisdrone'),siegecrawler:v=>specialist(v,'siegecrawler'),gale:v=>specialist(v,'gale'),monolith:v=>specialist(v,'monolith'),cantor:v=>specialist(v,'cantor'),rigger:v=>specialist(v,'rigger'),harpoon:v=>specialist(v,'harpoon') };
  const OUTLINE = new V.MeshBasicMaterial({ color: 0x14121b, side: V.BackSide });
  function addOutlines(root, th = 0.7) {
    const list = []; root.traverse(o => { if (o.isMesh && o.material && o.material.isMeshToonMaterial && !o.userData.noOutline && !o.material.transparent) list.push(o); });
    const bb = new V.Vector3(), cc = new V.Vector3();
    for (const o of list) {
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      o.geometry.boundingBox.getSize(bb); o.geometry.boundingBox.getCenter(cc);
      const sx = 1 + 2 * th / Math.max(0.3, bb.x * Math.abs(o.scale.x)), sy = 1 + 2 * th / Math.max(0.3, bb.y * Math.abs(o.scale.y)), sz = 1 + 2 * th / Math.max(0.3, bb.z * Math.abs(o.scale.z));
      const hl = new V.Mesh(o.geometry, OUTLINE); hl.scale.set(sx, sy, sz); hl.position.set(cc.x * (1 - sx), cc.y * (1 - sy), cc.z * (1 - sz)); hl.userData.isOutline = true; o.add(hl);
    }
  }
  function buildRig(vis, id) {
    let r;
    if (id && SPECIAL[id]) r = SPECIAL[id](vis);
    else if (id && KITS[id]) r = humanoid(vis, KITS[id]);
    else switch (vis.body) { case 'beast': r = beast(vis); break; case 'wyrm': r = wyrm(vis); break; case 'dragon': r = dragon(vis); break; case 'ship': r = ship(vis); break; case 'shard': r = jelly(vis); break; case 'colossus': r = colossus(vis); break; case 'hollow': r = hollow(vis); break; default: r = humanoid(vis, { helm: vis.head === 'mono' ? 'mono' : 'visor', weapon: vis.weapon === 'sword' ? 'sword' : 'rifle' }); }
    if (!r.apply) r.apply = () => {};
    addOutlines(r.root);
    const set = new Set(); r.root.traverse(o => { if (o.isMesh && o.material && o.material.emissive && !o.material.userData.glow && !o.userData.isOutline) set.add(o.material); });
    r.mats = [...set]; r.mats.forEach(m => { m.userData.e0 = m.emissive.clone(); m.userData.ei0 = m.emissiveIntensity; });
    let aura=null,variantKey=null;
    r.setVariant=key=>{if(key===variantKey)return;variantKey=key;const v=typeof VARIANTS!=='undefined'&&VARIANTS[key];r.mats.forEach(m=>{m.userData.ebase ||= m.userData.e0.clone();if(m.userData.eibase==null)m.userData.eibase=m.userData.ei0;m.userData.e0.copy(m.userData.ebase);m.userData.ei0=m.userData.eibase;if(v){m.userData.e0.lerp(col(v.color),key==='corrupted'?.45:.2);m.userData.ei0=Math.max(.15,m.userData.ei0);} });if(v&&!aura){aura=sprite(v.color,140,.2);aura.position.set(0,65,0);r.root.add(aura);}if(aura){aura.material.opacity=v?(key==='commander'?.3:.18):0;if(v)aura.material.color.set(v.color);}lastF=-1;};
    let lastF = -1;
    r.setFlash = f => { const q = f > 0.01 ? Math.round(f * 10) / 10 : 0; if (q === lastF) return; lastF = q; r.mats.forEach(m => { if (q > 0) { m.emissive.setRGB(q, q, q); m.emissiveIntensity = 1; } else { m.emissive.copy(m.userData.e0); m.emissiveIntensity = m.userData.ei0; } }); };
    const outer = new V.Group(), turn = new V.Group(); turn.add(r.root); outer.add(turn);
    turn.rotation.y = vis.body === 'ship' ? -0.25 : (id && SPECIAL[id]) ? -0.42 : ['beast', 'wyrm'].includes(vis.body) ? -0.45 : -0.7;
    r.outer = outer; r.turn = turn; r.scaleHint = r.scaleHint || 1;
    return r;
  }
  // ---------- shared offscreen renderer (sprites, snapshots, terrain) ----------
  let util = null;
  function utilRenderer(w, h) {
    if (!util) { util = new V.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); util.outputEncoding = V.sRGBEncoding; util.toneMapping = V.NoToneMapping; util.shadowMap.enabled = true; util.shadowMap.type = V.PCFSoftShadowMap; util.setPixelRatio(1); }
    util.setSize(w, h, false); return util;
  }
  function studioLights(scene, warm) {
    scene.add(new V.HemisphereLight(0xdfe8ff, 0x403848, 0.28));
    const key = new V.DirectionalLight(warm ? 0xffe6c8 : 0xffffff, 0.72); key.position.set(160, 380, 40); scene.add(key);
    const rim = new V.DirectionalLight(0x7fc0ff, 0.7); rim.position.set(-260, 140, -220); scene.add(rim);
    const fill = new V.DirectionalLight(0xffffff, 0.12); fill.position.set(0, 60, 400); scene.add(fill);
    return key;
  }
  function fitCamera(rig, w, h, angle = 0.35, pad = 1.15) {
    const box3 = new V.Box3().setFromObject(rig.outer); const size = box3.getSize(new V.Vector3()), c = box3.getCenter(new V.Vector3());
    const cam = new V.PerspectiveCamera(28, w / h, 1, 5000); const hmax = Math.max(size.y, size.x / (w / h)) * pad; const dist = hmax / 2 / Math.tan(V.MathUtils.degToRad(14));
    cam.position.set(c.x + Math.sin(angle) * dist, c.y + dist * 0.18, c.z + Math.cos(angle) * dist); cam.lookAt(c); return cam;
  }
  function snapshot(mechId, w, h, opts = {}) {
    const vis = MECHS[mechId].vis; const rig = buildRig(vis, mechId); rig.apply(ART.POSES[opts.pose || 'idle'], opts, opts.t || 0.6);
    if (opts.flip) rig.outer.scale.x = -1;
    const scene = new V.Scene(); scene.add(rig.outer); studioLights(scene);
    rig.outer.updateMatrixWorld(true);
    const cam = fitCamera(rig, w, h, opts.flip ? -0.25 : 0.25, opts.pad || 1.12);
    const r = utilRenderer(w, h); r.setClearColor(0x000000, 0); r.render(scene, cam);
    const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(r.domElement, 0, 0);
    disposeScene(scene); return c;
  }
  // map sprite: mech fills lower ~80% of a (2*size) square, feet near 77% height (matches 2D sprite layout)
  const spriteCache = {};
  function mapSprite(mechId, size, flip) {
    const key = mechId + '|' + size + '|' + flip; if (spriteCache[key]) return spriteCache[key];
    const S = size * 2, R = Math.min(512, S * 2);
    const big = ['colossus', 'hollow', 'ship', 'dragon'].includes(MECHS[mechId].vis.body);
    const img = snapshot(mechId, R, R, { flip, pad: big ? 1.0 : 1.25 + (1.5 - SIZE_SCALE[MECHS[mechId].size]) * 0.6 });
    const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = S * 0.03; x.shadowOffsetY = S * 0.02;
    const k = big ? 0.95 : 0.78; const w = S * k; x.drawImage(img, (S - w) / 2, S * 0.77 - w * 0.92, w, w);
    spriteCache[key] = c; return c;
  }
  function disposeScene(scene) { scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); } }); }

  // ---------- 3D terrain bake (top-down orthographic with shadows) ----------
  function bakeTerrain(st, T, dpr, colorFn) {
    const W = st.w, Hh = st.h, px = Math.round(T * W * dpr), py = Math.round(T * Hh * dpr);
    if (px * py > 4096 * 4096) return null;
    const scene = new V.Scene();
    const r = rng(st.ch.map.seed + 77);
    const hemi = new V.HemisphereLight(0xd8e8ff, 0x203040, st.space ? 0.7 : 0.85); scene.add(hemi);
    const sun = new V.DirectionalLight(st.theme === 'hive' ? 0xffb0c0 : st.space ? 0xbfd0ff : 0xfff0d8, st.space ? 1.4 : 1.7);
    sun.position.set(-W * 0.35, 30, -Hh * 0.6); sun.target.position.set(0, 0, 0); scene.add(sun); scene.add(sun.target);
    sun.castShadow = true; const sc = sun.shadow.camera; sc.left = -W; sc.right = W; sc.top = Hh; sc.bottom = -Hh; sc.near = 1; sc.far = 100; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0008; sun.shadow.radius = 2;
    const cam = new V.OrthographicCamera(-W / 2, W / 2, Hh / 2, -Hh / 2, 0.1, 100); cam.position.set(0, 50, 0); cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
    const mats = {}; const m = (c, o) => { const k = c + JSON.stringify(o || {}); return mats[k] || (mats[k] = MS(c, Object.assign({ flatShading: true, metalness: 0.15, roughness: 0.8 }, o))); };
    const e = c => mats['e' + c] || (mats['e' + c] = E(c, 1.4));
    const add = (o, x, y, z) => { o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; scene.add(o); return o; };
    const X = x => x - W / 2 + 0.5, Z = y => y - Hh / 2 + 0.5;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      const tl = st.tile(x, y), cx = X(x), cz = Z(y); const base = colorFn(tl);
      const gH = tl === 'w' ? 0.02 : tl === 'x' ? 0.9 : 0.12;
      const g = new V.Mesh(new V.BoxGeometry(1, gH, 1), tl === 'w' ? MS('#1d5a8a', { metalness: 0.6, roughness: 0.15, flatShading: false }) : m(shade(base, (r() - 0.5) * 0.12))); g.receiveShadow = true; g.position.set(cx, gH / 2 - (tl === 'w' ? 0.08 : 0), cz); scene.add(g);
      switch (tl) {
        case 'f': for (let i = 0; i < 4; i++) { const hh = 0.35 + r() * 0.35; const tx = cx + (i % 2 - 0.5) * 0.45 + (r() - 0.5) * 0.12, tz = cz + (Math.floor(i / 2) - 0.5) * 0.45 + (r() - 0.5) * 0.12; add(new V.Mesh(new V.ConeGeometry(0.2 + r() * 0.06, hh, 7), m(st.theme === 'ice' ? '#3f6e5c' : r() > 0.5 ? '#2c6a35' : '#24582c')), tx, 0.12 + hh / 2 + 0.06, tz); } break;
        case 'm': { const hh = 0.9 + r() * 0.6; add(new V.Mesh(new V.ConeGeometry(0.5, hh, 6), m('#6e665a')), cx - 0.08, 0.12 + hh / 2, cz + 0.05).rotation.y = r() * 3; add(new V.Mesh(new V.ConeGeometry(0.17, hh * 0.3, 6), m('#eef3f8')), cx - 0.08, 0.12 + hh * 0.86, cz + 0.05); const h2 = hh * 0.6; add(new V.Mesh(new V.ConeGeometry(0.34, h2, 5), m('#5a5248')), cx + 0.22, 0.12 + h2 / 2, cz - 0.18); break; }
        case 'c': for (let i = 0; i < 4; i++) { const bw = 0.2 + r() * 0.14, bh = 0.25 + r() * 0.9; const bx = cx + (i % 2 - 0.5) * 0.46, bz = cz + (Math.floor(i / 2) - 0.5) * 0.46; add(new V.Mesh(new V.BoxGeometry(bw, bh, bw), m(r() > 0.5 ? '#2a3044' : '#323a52', { metalness: 0.4, roughness: 0.5 })), bx, 0.12 + bh / 2, bz); if (r() > 0.3) add(new V.Mesh(new V.BoxGeometry(0.04, 0.02, 0.04), e(r() > 0.5 ? '#ffd680' : '#7fe8ff')), bx + (r() - 0.5) * bw * 0.6, 0.13 + bh, bz + (r() - 0.5) * bw * 0.6); } break;
        case 'r': for (let i = 0; i < 5; i++) { const o = add(new V.Mesh(new V.BoxGeometry(0.12 + r() * 0.2, 0.06 + r() * 0.2, 0.1 + r() * 0.14), m(r() > 0.5 ? '#4a423c' : '#5f544a')), cx + (r() - 0.5) * 0.8, 0.16, cz + (r() - 0.5) * 0.8); o.rotation.set(r(), r() * 3, r()); } break;
        case 'b': { add(new V.Mesh(new V.CylinderGeometry(0.42, 0.44, 0.06, 6), m('#3a4458', { metalness: 0.5, roughness: 0.4 })), cx, 0.15, cz); const ring = new V.Mesh(new V.TorusGeometry(0.34, 0.015, 4, 6), e('#62f3ff')); ring.rotation.x = Math.PI / 2; ring.position.set(cx, 0.19, cz); scene.add(ring); add(new V.Mesh(new V.BoxGeometry(0.05, 0.05, 0.05), e('#ffcc55')), cx - 0.44, 0.15, cz - 0.44); break; }
        case 's': if (r() > 0.4) add(new V.Mesh(new V.SphereGeometry(0.012 + r() * 0.012, 4, 3), e('#ffffff')), cx + (r() - 0.5) * 0.9, 0.13, cz + (r() - 0.5) * 0.9); break;
        case 'a': for (let i = 0; i < 3; i++) { const s = 0.1 + r() * 0.16; const o = add(new V.Mesh(new V.DodecahedronGeometry(s, 0), m(r() > 0.5 ? '#4a4f5c' : '#353a46', { roughness: 0.9 })), cx + (r() - 0.5) * 0.7, 0.14 + s, cz + (r() - 0.5) * 0.7); o.rotation.set(r() * 3, r() * 3, 0); } break;
        case 'h': for (let i = 0; i < 4; i++) { const s = 0.1 + r() * 0.14; add(new V.Mesh(new V.SphereGeometry(s, 8, 6), m(r() > 0.5 ? '#7a2f4a' : '#5a2238', { roughness: 0.4, metalness: 0.1 })), cx + (r() - 0.5) * 0.7, 0.12 + s * 0.5, cz + (r() - 0.5) * 0.7); } add(new V.Mesh(new V.SphereGeometry(0.04, 6, 4), e('#c6ff4a')), cx + (r() - 0.5) * 0.6, 0.2, cz + (r() - 0.5) * 0.6); break;
        case 'x': add(new V.Mesh(new V.BoxGeometry(0.98, 0.08, 0.98), m('#2a1420')), cx, 0.94, cz); break;
        case 'v': { const d = new V.Mesh(new V.TorusGeometry(0.36, 0.012, 3, 4), e('#d48bff')); d.rotation.x = Math.PI / 2; d.position.set(cx, 0.14, cz); scene.add(d); break; }
        case 'w': break;
      }
    }
    const rr = utilRenderer(px, py); rr.setClearColor(0x05080f, 1); rr.render(scene, cam);
    const out = document.createElement('canvas'); out.width = px; out.height = py; out.getContext('2d').drawImage(rr.domElement, 0, 0);
    disposeScene(scene); return out;
  }


  // ---------- 3D battle environments ----------
  const texCache = {};
  function canvasTex(key, w, h, draw, rep) {
    if (texCache[key]) return texCache[key];
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new V.CanvasTexture(c); t.encoding = V.sRGBEncoding; t.wrapS = t.wrapT = V.RepeatWrapping; t.anisotropy = 8; if (rep) t.repeat.set(rep[0], rep[1]);
    texCache[key] = t; return t;
  }
  function groundTex(kind) {
    return canvasTex('g_' + kind, 512, 512, (x, w, h) => {
      const base = { asphalt: '#22262e', grass: '#3d5a34', snow: '#dfe8f2', flesh: '#3a1626', ruins: '#3a342e', burnt: '#1e1614' }[kind];
      x.fillStyle = base; x.fillRect(0, 0, w, h);
      let s = 11; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
      for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${kind === 'snow' ? '120,140,170' : '255,255,255'},${r() * 0.06})`; x.fillRect(r() * w, r() * h, 2 + r() * 6, 2 + r() * 6); }
      if (kind === 'asphalt' || kind === 'burnt') { x.strokeStyle = 'rgba(255,255,255,0.10)'; x.lineWidth = 3; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke(); x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.stroke(); } x.fillStyle = 'rgba(255,210,90,0.35)'; for (let i = 0; i < 8; i++) x.fillRect(i * 64 + 10, 252, 30, 6); }
      if (kind === 'flesh') { x.strokeStyle = 'rgba(200,60,110,0.35)'; x.lineWidth = 4; for (let i = 0; i < 18; i++) { x.beginPath(); x.moveTo(r() * w, r() * h); x.bezierCurveTo(r() * w, r() * h, r() * w, r() * h, r() * w, r() * h); x.stroke(); } }
      if (kind === 'grass') { for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(20,40,10,${r() * 0.25})`; x.fillRect(r() * w, r() * h, 3, 8); } }
    }, [10, 6]);
  }
  function windowTex() {
    return canvasTex('win', 128, 256, (x, w, h) => {
      x.fillStyle = '#0c0f16'; x.fillRect(0, 0, w, h);
      let s = 5; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
      for (let yy = 6; yy < h - 6; yy += 12) for (let xx = 6; xx < w - 6; xx += 14) { if (r() < 0.45) { x.fillStyle = r() < 0.7 ? 'rgba(255,214,140,0.95)' : 'rgba(150,220,255,0.9)'; x.fillRect(xx, yy, 7, 6); } }
    });
  }
  const ENV = {
    city:  { fog: '#7f9cbc', ground: 'asphalt', city: true },
    base:  { fog: '#6a5258', ground: 'asphalt', city: true },
    fire:  { fog: '#40140e', ground: 'burnt', city: true, fires: true },
    ruins: { fog: '#55483e', ground: 'ruins', city: true, broken: true },
    sky:   { fog: '#a9cdea', ground: 'grass', hills: true },
    elevator: { fog: '#8aa6c8', ground: 'grass', hills: true, tower: true },
    ice:   { fog: '#c4d4e4', ground: 'snow', crags: true },
    hive:  { fog: '#2a0c18', ground: 'flesh', pillars: true },
    space: { space: true, planet: true, rocks: true },
    colony:{ space: true, colony: true, rocks: true },
    vael:  { space: true, rings: true, crystals: true },
    void:  { space: true, voidShards: true },
  };
  function buildEnv(key) {
    const cfg = ENV[key] || ENV.sky; const g = new V.Group(); const scroll = []; const spin = [];
    let s = 3; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const GY = -200;
    if (!cfg.space) {
      const gm = new V.MeshStandardMaterial({ map: groundTex(cfg.ground), roughness: cfg.ground === 'snow' ? 0.6 : 0.85, metalness: cfg.ground === 'flesh' ? 0.2 : 0.05 });
      const ground = new V.Mesh(new V.PlaneGeometry(9000, 5000), gm); ground.rotation.x = -Math.PI / 2; ground.position.set(0, GY, -1800); ground.receiveShadow = true; g.add(ground); g.userData.groundMat = gm;
    }
    if (cfg.city) {
      const wt = windowTex();
      for (let i = 0; i < 46; i++) {
        const w = 120 + r() * 220, hh = 180 + r() * (cfg.broken ? 380 : 900), d = 120 + r() * 200, z = -420 - r() * 2600, x = -4000 + r() * 8000;
        const t2 = wt.clone(); t2.needsUpdate = true; t2.repeat.set(Math.max(1, w / 90), Math.max(1, hh / 160));
        const mat = new V.MeshStandardMaterial({ color: col(r() > 0.5 ? '#3a4458' : '#2c3444'), map: t2, emissiveMap: t2, emissive: col(cfg.fires ? '#ff9a50' : '#ffd8a0'), emissiveIntensity: cfg.broken ? 0.15 : 0.9, roughness: 0.5, metalness: 0.4 });
        const m = new V.Mesh(new V.BoxGeometry(w, hh, d), mat); m.position.set(x, GY + hh / 2 - (cfg.broken ? r() * 60 : 0), z); if (cfg.broken) m.rotation.z = (r() - 0.5) * 0.25;
        m.receiveShadow = true; g.add(m); scroll.push({ o: m, k: 1 / (1 + -z / 900) });
        if (cfg.fires && r() > 0.55) { const f = sprite('#ff7a2e', 260 + r() * 200, 0.7); f.position.set(x, GY + hh + 20, z + d / 2); g.add(f); scroll.push({ o: f, k: 1 / (1 + -z / 900) }); }
      }
      for (let i = 0; i < 6; i++) { const l = new V.Mesh(new V.CylinderGeometry(4, 6, 160, 6), new V.MeshStandardMaterial({ color: col('#4a505c'), metalness: 0.6, roughness: 0.4 })); const x = -2400 + i * 900, z = -260; l.position.set(x, GY + 80, z); l.castShadow = true; g.add(l); const lamp = sprite('#ffe0a0', 90, 0.8); lamp.position.set(x, GY + 165, z); g.add(lamp); scroll.push({ o: l, k: 0.85 }, { o: lamp, k: 0.85 }); }
    }
    if (cfg.hills) {
      for (let i = 0; i < 14; i++) { const hh = 300 + r() * 700, rr = 500 + r() * 700; const m = new V.Mesh(new V.ConeGeometry(rr, hh, 7), new V.MeshStandardMaterial({ color: col(r() > 0.5 ? '#4d6e4a' : '#3f5e3f'), flatShading: true, roughness: 0.9 })); m.position.set(-5000 + r() * 10000, GY + hh / 2 - 20, -2200 - r() * 1200); g.add(m); scroll.push({ o: m, k: 0.25 }); }
      for (let i = 0; i < 30; i++) { const hh = 60 + r() * 90; const tr = new V.Mesh(new V.ConeGeometry(22 + r() * 16, hh, 7), new V.MeshStandardMaterial({ color: col('#2f5a34'), flatShading: true })); tr.position.set(-3500 + r() * 7000, GY + hh / 2, -350 - r() * 1300); tr.castShadow = true; g.add(tr); scroll.push({ o: tr, k: 1 / (1 + -tr.position.z / 900) }); }
    }
    if (cfg.tower) { const t = new V.Mesh(new V.CylinderGeometry(40, 60, 6000, 12), new V.MeshStandardMaterial({ color: col('#9aa8bc'), metalness: 0.8, roughness: 0.25 })); t.position.set(500, 2600, -1600); g.add(t); for (let i = 0; i < 12; i++) { const ring = new V.Mesh(new V.TorusGeometry(70, 6, 6, 24), E('#7fe0ff', 1.4)); ring.rotation.x = Math.PI / 2; ring.position.set(500, -100 + i * 260, -1600); g.add(ring); } }
    if (cfg.crags) { for (let i = 0; i < 22; i++) { const hh = 120 + r() * 520, rr = 60 + r() * 160; const m = new V.Mesh(new V.ConeGeometry(rr, hh, 5), new V.MeshPhysicalMaterial({ color: col(r() > 0.5 ? '#bcd8ee' : '#9ec4e4'), roughness: 0.15, metalness: 0.1, clearcoat: 1, flatShading: true, transparent: true, opacity: 0.92 })); m.position.set(-4000 + r() * 8000, GY + hh / 2 - 10, -380 - r() * 2600); m.rotation.y = r() * 3; m.castShadow = true; g.add(m); scroll.push({ o: m, k: 1 / (1 + -m.position.z / 900) }); } }
    if (cfg.pillars) { for (let i = 0; i < 24; i++) { const hh = 400 + r() * 900; const curve = new V.CatmullRomCurve3([new V.Vector3(0, 0, 0), new V.Vector3((r() - 0.5) * 120, hh * 0.4, 0), new V.Vector3((r() - 0.5) * 160, hh * 0.75, (r() - 0.5) * 100), new V.Vector3((r() - 0.5) * 80, hh, 0)]); const m = new V.Mesh(new V.TubeGeometry(curve, 16, 26 + r() * 30, 8), new V.MeshPhysicalMaterial({ color: col(r() > 0.5 ? '#5a1f3a' : '#3e1630'), roughness: 0.35, clearcoat: 0.8, emissive: col('#3a0820'), emissiveIntensity: 0.4 })); m.position.set(-4000 + r() * 8000, GY - 10, -380 - r() * 2400); g.add(m); scroll.push({ o: m, k: 1 / (1 + -m.position.z / 900) }); for (let k = 0; k < 3; k++) { const n = sprite('#c6ff4a', 50 + r() * 50, 0.8); const p = curve.getPoint(r()); n.position.copy(p).add(m.position); g.add(n); scroll.push({ o: n, k: 1 / (1 + -m.position.z / 900) }); } } }
    if (cfg.planet) { const p = new V.Mesh(new V.SphereGeometry(1500, 64, 32), new V.MeshStandardMaterial({ color: col('#2f6fc0'), roughness: 0.6, metalness: 0.0, emissive: col('#0a1a3a'), emissiveIntensity: 0.4 })); p.position.set(1600, -1500, -3800); g.add(p); spin.push({ o: p, v: 0.01 }); const atm = sprite('#6ab8ff', 4200, 0.35); atm.position.copy(p.position); g.add(atm); }
    if (cfg.rocks) { for (let i = 0; i < 40; i++) { const rr = 14 + r() * 70; const m = new V.Mesh(new V.DodecahedronGeometry(rr, 1), new V.MeshStandardMaterial({ color: col(r() > 0.5 ? '#5a5e6a' : '#3e424c'), roughness: 0.9, flatShading: true })); m.position.set(-4000 + r() * 8000, -500 + r() * 1200, -300 - r() * 2600); m.rotation.set(r() * 3, r() * 3, 0); g.add(m); scroll.push({ o: m, k: 1 / (1 + -m.position.z / 900) }); spin.push({ o: m, v: (r() - 0.5) * 0.6 }); } }
    if (cfg.colony) { const c = new V.Mesh(new V.CylinderGeometry(520, 520, 7000, 48, 1, true), new V.MeshStandardMaterial({ color: col('#59667c'), metalness: 0.7, roughness: 0.35, side: V.DoubleSide })); c.rotation.z = Math.PI / 2; c.position.set(0, 500, -3200); g.add(c); spin.push({ o: c, v: 0.03, axis: 'y' }); for (let i = 0; i < 3; i++) { const strip = new V.Mesh(new V.BoxGeometry(7000, 30, 4), E('#ffd98a', 1.2)); strip.position.set(0, 500 + Math.cos(i * 2.1) * 525, -3200 + Math.sin(i * 2.1) * 525); g.add(strip); } }
    if (cfg.rings) { for (let i = 0; i < 5; i++) { const ring = new V.Mesh(new V.TorusGeometry(800 + i * 380, 6 + i * 2, 8, 128), E(i % 2 ? '#d48bff' : '#ffd8ff', 0.9)); ring.position.set(0, 200, -3000); ring.rotation.set(1.2, 0.2 * i, 0); g.add(ring); spin.push({ o: ring, v: 0.05 + i * 0.02, axis: 'z' }); } }
    if (cfg.crystals || cfg.voidShards) { for (let i = 0; i < 26; i++) { const sz = 20 + r() * 70; const m = new V.Mesh(new V.OctahedronGeometry(sz), cfg.voidShards ? new V.MeshBasicMaterial({ color: 0x000000 }) : new V.MeshPhysicalMaterial({ color: col('#efe2ff'), roughness: 0.05, metalness: 0.1, clearcoat: 1, emissive: col('#6b45b8'), emissiveIntensity: 0.6, transparent: true, opacity: 0.85 })); m.scale.y = 1.8; m.position.set(-3500 + r() * 7000, -500 + r() * 1200, -300 - r() * 2600); g.add(m); if (cfg.voidShards) { const e = new V.LineSegments(new V.EdgesGeometry(m.geometry), new V.LineBasicMaterial({ color: 0xffffff })); e.scale.copy(m.scale); e.position.copy(m.position); g.add(e); scroll.push({ o: e, k: 1 / (1 + -m.position.z / 900) }); spin.push({ o: e, v: 0.4 }); } scroll.push({ o: m, k: 1 / (1 + -m.position.z / 900) }); spin.push({ o: m, v: 0.4 }); } }
    return { group: g, scroll, spin, fog: cfg.fog ? new V.Fog(col(cfg.fog), 1700, 5200) : null, space: !!cfg.space };
  }

  // ---------- Battle stage ----------
  const B = { renderer: null, composer: null, scene: null, cam: null, rigs: new Map(), bgTex: null, ground: null, ghosts: [], key: null, hemi: null, env: null, lastOff: 0 };
  function battleInit(canvas, bgCanvas) {
    if (B.renderer) return;
    const r = new V.WebGLRenderer({ canvas, antialias: true }); r.setPixelRatio(1); r.setSize(1280, 720, false);
    r.outputEncoding = V.sRGBEncoding; r.toneMapping = V.NoToneMapping; r.shadowMap.enabled = true; r.shadowMap.type = V.PCFSoftShadowMap;
    const scene = new V.Scene(); scene.environment = envFor(r);
    B.bgTex = new V.CanvasTexture(bgCanvas); B.bgTex.encoding = V.sRGBEncoding; scene.background = B.bgTex;
    const fov = 30, D = 360 / Math.tan(V.MathUtils.degToRad(fov / 2));
    const cam = new V.PerspectiveCamera(fov, 1280 / 720, 10, 9000); B.D = D;
    B.hemi = new V.HemisphereLight(0xcfe0ff, 0x302028, 0.3); scene.add(B.hemi);
    const key = new V.DirectionalLight(0xfff0e0, 0.75); key.position.set(250, 700, 200); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); const sc = key.shadow.camera; sc.left = -900; sc.right = 900; sc.top = 700; sc.bottom = -700; sc.near = 10; sc.far = 3000; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.6; scene.add(key); B.key = key;
    const rim = new V.DirectionalLight(0x8ac4ff, 0.8); rim.position.set(-500, 250, -600); scene.add(rim); B.rim = rim; const fill = new V.DirectionalLight(0xffffff, 0.12); fill.position.set(0, 80, 900); scene.add(fill);
    const ground = new V.Mesh(new V.PlaneGeometry(4000, 1600), new V.ShadowMaterial({ opacity: 0.4 })); ground.rotation.x = -Math.PI / 2; ground.position.y = 360 - 560 + 1; ground.receiveShadow = true; ground.visible = false; scene.add(ground); B.ground = ground;
    const comp = new V.EffectComposer(r); comp.addPass(new V.RenderPass(scene, cam));
    const bloom = new V.UnrealBloomPass(new V.Vector2(640, 360), 0.75, 0.5, 0.86); comp.addPass(bloom);
    Object.assign(B, { renderer: r, composer: comp, scene, cam, bloom });
    if(typeof QUALITY!=='undefined'){QUALITY.configureRenderer(r);bloom.enabled=!QUALITY.low;}
  }
  function battleBegin(bgKey, painted) {
    B.rigs.forEach(rg => { B.scene.remove(rg.outer); }); B.rigs.clear();
    B.ghosts.forEach(g => B.scene.remove(g.obj)); B.ghosts = [];
    if (B.env) { B.scene.remove(B.env.group); disposeScene(B.env.group); B.env = null; }
    B.ground.visible = !!painted; if (painted) { B.scene.fog = null; } else { B.env = buildEnv(bgKey); B.scene.add(B.env.group); B.scene.fog = B.env.fog; } B.lastOff = null;
    const warm = bgKey === 'fire' ? 0xffb080 : bgKey === 'hive' ? 0xff9ac0 : bgKey === 'vael' ? 0xe0c0ff : bgKey === 'void' ? 0xbbbbff : 0xfff0e0;
    B.key.color.set(warm); B.hemi.color.set(warm);
    B.rim.color.set(bgKey === 'fire' ? 0xff5a2a : bgKey === 'hive' ? 0xc6ff4a : bgKey === 'vael' ? 0xd48bff : 0x8ac4ff);
  }
  function rigFor(a) { let rg = B.rigs.get(a); if (!rg) { rg = buildRig(a.m.vis, a.u.mech); B.scene.add(rg.outer); B.rigs.set(a, rg); } return rg; }
  const tmpV = new V.Vector3();
  function project(obj) { obj.getWorldPosition(tmpV); tmpV.project(B.cam); return [(tmpV.x + 1) * 640, (1 - tmpV.y) * 360]; }
  function battleFrame(actors, t, shakeX, shakeY, zoom, bgOff) {
    if(typeof QUALITY!=='undefined'){B.bloom.enabled=!QUALITY.low;B.renderer.shadowMap.enabled=!QUALITY.low;}
    B.bgTex.needsUpdate = true;
    if (B.env) {
      const dx = B.lastOff == null ? 0 : (bgOff - B.lastOff) * 2.2; B.lastOff = bgOff;
      for (const it of B.env.scroll) { it.o.position.x -= dx * it.k; if (it.o.position.x < -4500) it.o.position.x += 9000; }
      for (const it of B.env.spin) { if (it.axis === 'y') it.o.rotation.y = t * it.v; else if (it.axis === 'z') it.o.rotation.z = t * it.v; else { it.o.rotation.y = t * it.v; it.o.rotation.x = t * it.v * 0.5; } }
      if (B.env.group.userData.groundMat && B.env.group.userData.groundMat.map) B.env.group.userData.groundMat.map.offset.x = (bgOff * 2.2) / 900;
    }
    const seen = new Set();
    // camera first (anchors are projected through it)
    B.cam.position.set(shakeX, 70 - shakeY, B.D); B.cam.lookAt(shakeX, 10 - shakeY, 0); B.cam.zoom = zoom; B.cam.updateProjectionMatrix(); B.cam.updateMatrixWorld();
    for (const k of ['L', 'R', 'S']) {
      const a = actors[k]; if (!a || a.spr) continue; const rg = rigFor(a); seen.add(a);
      rg.outer.visible = a.visible && a.alpha > 0.35;
      rg.outer.position.set(a.x + a.ox - 640, 360 - (a.y + a.oy), 0);
      const s = a.scale * rg.scaleHint * 1.3; rg.outer.scale.set(s * a.dir, s, s);
      rg.apply(a.pose, a.opts, t); rg.setVariant(a.u.variant); rg.setFlash(Math.min(1, a.flash));
      rg.outer.updateMatrixWorld(true);
      a.anchors3d = { hand: project(rg.anchors.hand), core: project(rg.anchors.core), head: project(rg.anchors.head) };
    }
    B.rigs.forEach((rg, a) => { if (!seen.has(a)) rg.outer.visible = false; });
    for (let i = B.ghosts.length - 1; i >= 0; i--) { const g = B.ghosts[i]; g.life -= 16; g.mat.opacity = Math.max(0, g.life / 300) * 0.22; if (g.life <= 0) { B.scene.remove(g.obj); B.ghosts.splice(i, 1); } }
    B.composer.render();
  }
  function ghost(a) {
    const rg = B.rigs.get(a); if (!rg || B.ghosts.length > 10) return;
    const mat = new V.MeshBasicMaterial({ color: col(a.m.vis.g || '#62f3ff').multiplyScalar(0.5), transparent: true, opacity: 0.22, blending: V.AdditiveBlending, depthWrite: false });
    const obj = rg.outer.clone(true); obj.traverse(o => { if (o.isMesh) o.material = mat; if (o.isSprite || o.isLineSegments || o.userData.isOutline) o.visible = false; }); B.scene.add(obj); B.ghosts.push({ obj, mat, life: 300 });
  }

  // ---------- Live viewer (title screen) ----------
  function viewer(canvas, mechId) {
    const r = new V.WebGLRenderer({ canvas, antialias: true, alpha: true }); r.outputEncoding = V.sRGBEncoding; r.toneMapping = V.NoToneMapping; r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    const scene = new V.Scene(); scene.environment = envFor(r); studioLights(scene, true);
    const rig = buildRig(MECHS[mechId].vis, mechId); scene.add(rig.outer);
    const cam = new V.PerspectiveCamera(30, 1, 1, 5000);
    let raf = 0, running = false;
    function frame() {
      if (!running) return;
      const w = canvas.clientWidth, h = canvas.clientHeight; if (canvas.width !== Math.floor(w * r.getPixelRatio())) r.setSize(w, h, false);
      cam.aspect = w / Math.max(1, h); const t = performance.now() / 1000;
      rig.apply(ART.POSES.idle, { wingScale: 1.3, thrust: 0 }, t);
      rig.turn.rotation.y = -0.45 + Math.sin(t * 0.25) * 0.35;
      rig.outer.position.y = Math.sin(t) * 3;
      const D = 150 / Math.tan(V.MathUtils.degToRad(15)) * 1.1; const off = w > h ? -45 : 0; cam.position.set(off, 70, D); cam.lookAt(off, 64, 0); cam.updateProjectionMatrix();
      r.render(scene, cam); raf = requestAnimationFrame(frame);
    }
    return { start() { if (running) return; running = true; frame(); }, stop() { running = false; cancelAnimationFrame(raf); } };
  }
  return { ok: true, buildRig, snapshot, mapSprite, bakeTerrain, battleInit, battleBegin, battleFrame, ghost, viewer };
})();
