// ===== Procedural mech art, portraits and backgrounds =====
'use strict';
const ART = (() => {
  const TAU = Math.PI * 2;
  function shade(hex, amt) { // amt -1..1
    let c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
    let r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; } else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  function rgba(hex, a) {
    if (hex.startsWith('rgb(')) return hex.replace('rgb(', 'rgba(').replace(')', `,${a})`);
    let c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
    return `rgba(${parseInt(c.substr(0, 2), 16)},${parseInt(c.substr(2, 2), 16)},${parseInt(c.substr(4, 2), 16)},${a})`;
  }
  const OUT = 'rgba(8,10,16,0.9)';
  function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); }
  function fillPoly(ctx, pts, fill, stroke = OUT, lw = 1.6) { poly(ctx, pts); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); } }
  function grad(ctx, x0, y0, x1, y1, c, amtA = 0.35, amtB = -0.35) { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, shade(c, amtA)); g.addColorStop(0.5, c); g.addColorStop(1, shade(c, amtB)); return g; }
  function glowDot(ctx, x, y, r, col, a = 1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.25, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  // tapered limb segment: from joint (x,y) at angle a (0=down, +=forward)
  function seg(ctx, x, y, a, len, w1, w2, col, opt = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-a);
    const g = ctx.createLinearGradient(-w1 / 2, 0, w1 / 2, 0); g.addColorStop(0, shade(col, -0.35)); g.addColorStop(0.45, shade(col, 0.18)); g.addColorStop(1, shade(col, -0.2));
    ctx.beginPath(); ctx.moveTo(-w1 / 2, 0); ctx.lineTo(w1 / 2, 0); ctx.lineTo(w2 / 2, len); ctx.lineTo(-w2 / 2, len); ctx.closePath();
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = OUT; ctx.stroke();
    if (opt.stripe) { ctx.fillStyle = opt.stripe; ctx.fillRect(-w1 * 0.12, len * 0.2, w1 * 0.24, len * 0.55); }
    if (opt.plate) { ctx.fillStyle = shade(opt.plate, 0.05); ctx.beginPath(); ctx.moveTo(-w1 * 0.55, len * 0.1); ctx.lineTo(w1 * 0.55, len * 0.05); ctx.lineTo(w2 * 0.5, len * 0.7); ctx.lineTo(-w2 * 0.5, len * 0.75); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    return [x + Math.sin(a) * len, y + Math.cos(a) * len];
  }
  function joint(ctx, x, y, r, col) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = shade(col, -0.45); ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = OUT; ctx.stroke(); }

  const POSES = {
    idle:  { arm: 0.35, fore: 0.5, barm: -0.15, bfore: 0.4, lean: 0, fl: 0.18, bl: -0.12, crouch: 0 },
    aim:   { arm: 1.5, fore: 0.06, barm: 0.5, bfore: 0.9, lean: 0.05, fl: 0.25, bl: -0.2, crouch: 2 },
    raise: { arm: 2.7, fore: 0.35, barm: -0.4, bfore: 0.6, lean: -0.08, fl: 0.2, bl: -0.2, crouch: 0 },
    swing: { arm: 0.85, fore: -0.1, barm: -0.6, bfore: 0.3, lean: 0.22, fl: 0.45, bl: -0.35, crouch: 6 },
    punch: { arm: 1.57, fore: 0, barm: -0.5, bfore: 1.2, lean: 0.2, fl: 0.4, bl: -0.35, crouch: 4 },
    chest: { arm: -0.35, fore: 0.6, barm: 0.35, bfore: 0.6, lean: -0.12, fl: 0.3, bl: -0.3, crouch: 4 },
    hurt:  { arm: -0.2, fore: 0.8, barm: -0.6, bfore: 0.5, lean: -0.28, fl: 0.05, bl: -0.3, crouch: 3 },
    dash:  { arm: 0.9, fore: 0.6, barm: -0.9, bfore: 0.4, lean: 0.42, fl: 0.1, bl: -0.7, crouch: 2 },
    guard: { arm: 1.9, fore: 1.6, barm: 0.2, bfore: 1.0, lean: -0.05, fl: 0.25, bl: -0.2, crouch: 5 },
  };
  function lerpPose(a, b, t) { const o = {}; for (const k in a) o[k] = a[k] + (b[k] - a[k]) * t; return o; }

  // ---------- Humanoid ----------
  function humanoid(ctx, v, pose, t, o) {
    const b = v.bulk || 1, H = v.h || 1;
    const c1 = v.c1, c2 = v.c2, c3 = v.c3, gl = v.g;
    const heavy = v.legs === 'heavy';
    const legW = (heavy ? 15 : 11) * b, legL = 27 * H;
    ctx.save();
    ctx.translate(0, pose.crouch || 0);
    const hipY = -legL * 2 + 6;
    // lean around hips
    ctx.translate(0, hipY); ctx.rotate(pose.lean * 0.5); ctx.translate(0, -hipY);
    const neckY = hipY - 40 * H, shY = neckY + 6;
    // cape
    if (v.cape) {
      const w = Math.sin(t * 3) * 4;
      ctx.beginPath(); ctx.moveTo(-6 * b, shY); ctx.quadraticCurveTo(-34 * b + w, hipY + 10, -30 * b + w * 2, -6);
      ctx.lineTo(-8 * b + w, -10); ctx.quadraticCurveTo(-4, hipY, 4 * b, shY); ctx.closePath();
      const g = ctx.createLinearGradient(0, shY, 0, 0); g.addColorStop(0, shade(c2, -0.1)); g.addColorStop(1, shade(c2, -0.6));
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // back equipment
    backpack(ctx, v, b, H, shY, t, o);
    // back arm
    const bsx = -12 * b, bsy = shY + 2;
    let [ex, ey] = seg(ctx, bsx, bsy, pose.barm, 19 * H, 9 * b, 8 * b, shade(c1, -0.25));
    joint(ctx, ex, ey, 3.5 * b, c1);
    let [hx, hy] = seg(ctx, ex, ey, pose.barm + pose.bfore, 18 * H, 8.5 * b, 10 * b, shade(c1, -0.22), { stripe: shade(c2, -0.2) });
    ctx.fillStyle = shade(c2, -0.4); ctx.beginPath(); ctx.arc(hx, hy, 4.5 * b, 0, TAU); ctx.fill();
    // back leg
    leg(ctx, v, -6 * b, hipY, pose.bl, legL, legW, true);
    // front leg
    leg(ctx, v, 5 * b, hipY, pose.fl, legL, legW, false);
    // skirt / waist
    fillPoly(ctx, [-14 * b, hipY - 6, 14 * b, hipY - 6, 16 * b, hipY + 6, -16 * b, hipY + 6], grad(ctx, 0, hipY - 6, 0, hipY + 6, c2));
    if (v.legs === 'skirt') {
      fillPoly(ctx, [-16 * b, hipY + 2, -6 * b, hipY + 2, -10 * b, hipY + 26, -22 * b, hipY + 22], grad(ctx, -20, 0, 0, 0, c1, 0.2, -0.4));
      fillPoly(ctx, [4 * b, hipY + 2, 17 * b, hipY + 2, 22 * b, hipY + 22, 10 * b, hipY + 26], grad(ctx, 0, 0, 20, 0, c1, 0.3, -0.3));
    } else {
      fillPoly(ctx, [2 * b, hipY + 3, 14 * b, hipY + 3, 13 * b, hipY + 14, 5 * b, hipY + 15], c1);
      ctx.fillStyle = c3; ctx.fillRect(-3 * b, hipY + 1, 6 * b, 9);
    }
    // torso
    const tw = 17 * b, cw = 22 * b;
    fillPoly(ctx, [-tw * 0.7, hipY - 4, tw * 0.7, hipY - 4, tw, hipY - 18, -tw * 0.9, hipY - 18], grad(ctx, -tw, 0, tw, 0, shade(c2, -0.2)));
    fillPoly(ctx, [-cw * 0.9, hipY - 16, cw, hipY - 16, cw * 1.08, neckY + 6, cw * 0.55, neckY - 2, -cw * 0.5, neckY - 2, -cw * 1.0, neckY + 6], grad(ctx, -cw, neckY, cw, hipY, c1, 0.4, -0.3));
    // chest panels
    ctx.save(); poly(ctx, [-cw * 0.9, hipY - 16, cw, hipY - 16, cw * 1.08, neckY + 6, cw * 0.55, neckY - 2, -cw * 0.5, neckY - 2, -cw * 1.0, neckY + 6]); ctx.clip();
    ctx.fillStyle = c2; ctx.fillRect(-cw * 1.2, neckY + 2, cw * 2.4, 6 * H);
    ctx.fillStyle = shade(c1, -0.25); ctx.fillRect(-cw * 1.2, hipY - 22, cw * 2.4, 6);
    if (v.chest === 'vent') { ctx.fillStyle = shade(c2, -0.5); for (let i = 0; i < 3; i++) ctx.fillRect(2 * b, neckY + 12 + i * 5, 14 * b, 2.5); }
    if (v.chest === 'plate') { ctx.strokeStyle = shade(c1, -0.4); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, neckY + 8); ctx.lineTo(0, hipY - 18); ctx.stroke(); }
    ctx.restore();
    // chest core
    const coreX = 6 * b, coreY = neckY + 16 * H;
    if (v.chest === 'core' || v.chest === 'gem') {
      fillPoly(ctx, v.chest === 'gem' ? [coreX, coreY - 8, coreX + 7, coreY, coreX, coreY + 8, coreX - 7, coreY] : [coreX - 8, coreY - 6, coreX + 8, coreY - 6, coreX + 6, coreY + 6, coreX - 6, coreY + 6], shade(c3, -0.2));
      glowDot(ctx, coreX, coreY, (o.coreGlow || 1) * 11, gl, 0.9);
    }
    // neck & head
    ctx.fillStyle = shade(c1, -0.5); ctx.fillRect(-3, neckY - 6, 8, 8);
    head(ctx, v, 2, neckY - 9 * H, b, H, t, o);
    // back shoulder (behind front arm, in front of torso edge)
    shoulder(ctx, v, -13 * b, shY - 1, b * 0.85, true);
    // front arm
    const fsx = 13 * b, fsy = shY + 2;
    [ex, ey] = seg(ctx, fsx, fsy, pose.arm, 19 * H, 10 * b, 9 * b, c1);
    joint(ctx, ex, ey, 4 * b, c1);
    const foreA = pose.arm + pose.fore;
    [hx, hy] = seg(ctx, ex, ey, foreA, 18 * H, 9.5 * b, 11.5 * b, c1, { plate: c2 });
    weapon(ctx, v, hx, hy, foreA, b, H, t, o);
    ctx.fillStyle = shade(c2, -0.2); ctx.beginPath(); ctx.arc(hx, hy, 5 * b, 0, TAU); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
    shoulder(ctx, v, 14 * b, shY - 1, b, false);
    ctx.restore();
    return { coreX, coreY: coreY + (pose.crouch || 0), handX: hx, handY: hy + (pose.crouch || 0), headY: neckY - 10, shY };
  }
  function leg(ctx, v, x, y, a, L, w, back) {
    const c = back ? shade(v.c1, -0.25) : v.c1;
    let [kx, ky] = seg(ctx, x, y, a, L, w, w * 0.85, shade(c, -0.1));
    joint(ctx, kx, ky, w * 0.35, c);
    const sa = a > 0 ? -a * 0.25 : -a * 0.15;
    const digit = v.legs === 'digit';
    let [fx, fy] = seg(ctx, kx, ky, sa, L, w * 1.05, w * (digit ? 0.7 : 1.1), c, { plate: back ? null : v.c2 });
    // knee guard
    fillPoly(ctx, [kx - w * 0.3, ky - 6, kx + w * 0.62, ky - 3, kx + w * 0.55, ky + 7, kx - w * 0.2, ky + 5], shade(v.c3, back ? -0.4 : 0));
    // foot
    const fw = w * 1.5;
    fillPoly(ctx, [fx - fw * 0.55, fy - 3, fx + fw * 0.2, fy - 6, fx + fw * 0.95, fy + 2, fx + fw * 0.9, fy + 5, fx - fw * 0.6, fy + 5], grad(ctx, 0, fy - 6, 0, fy + 5, shade(v.c2, back ? -0.35 : 0)));
  }
  function shoulder(ctx, v, x, y, b, back) {
    const c = back ? shade(v.c1, -0.25) : v.c1, c2 = back ? shade(v.c2, -0.25) : v.c2;
    switch (v.shoulder) {
      case 'round': ctx.beginPath(); ctx.ellipse(x, y + 2, 10 * b, 9 * b, 0, 0, TAU); ctx.fillStyle = grad(ctx, x - 8, y - 8, x + 8, y + 8, c); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke(); break;
      case 'spike':
        fillPoly(ctx, [x - 9 * b, y + 10 * b, x - 11 * b, y - 4 * b, x - 2 * b, y - 10 * b, x + 11 * b, y - 6 * b, x + 12 * b, y + 10 * b], grad(ctx, x, y - 10, x, y + 10, c2));
        fillPoly(ctx, [x - 4 * b, y - 8 * b, x + 2 * b, y - 22 * b, x + 6 * b, y - 7 * b], shade(v.c3, back ? -0.3 : 0));
        break;
      case 'block': fillPoly(ctx, [x - 11 * b, y - 7 * b, x + 11 * b, y - 7 * b, x + 12 * b, y + 11 * b, x - 11 * b, y + 11 * b], grad(ctx, x, y - 7, x, y + 11, c2)); ctx.fillStyle = shade(v.c3, back ? -0.3 : 0); ctx.fillRect(x - 11 * b, y - 2 * b, 22 * b, 3 * b); break;
      case 'fin':
        fillPoly(ctx, [x - 10 * b, y + 9 * b, x - 9 * b, y - 6 * b, x + 2 * b, y - 9 * b, x + 11 * b, y - 2 * b, x + 10 * b, y + 10 * b], grad(ctx, x, y - 9, x, y + 9, c));
        fillPoly(ctx, [x - 8 * b, y - 5 * b, x - 22 * b, y - 16 * b, x - 2 * b, y - 8 * b], c2);
        break;
      case 'pod':
        fillPoly(ctx, [x - 12 * b, y - 12 * b, x + 10 * b, y - 12 * b, x + 12 * b, y + 8 * b, x - 12 * b, y + 8 * b], grad(ctx, x, y - 12, x, y + 8, c2));
        ctx.fillStyle = '#111'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(x - 6 * b + i * 6 * b, y - 7 * b + j * 6 * b, 1.8 * b, 0, TAU); ctx.fill(); }
        break;
      default: break;
    }
  }
  function head(ctx, v, x, y, b, H, t, o) {
    const c1 = v.c1, c2 = v.c2, c3 = v.c3, gl = v.g;
    const s = 1 + (b - 1) * 0.3;
    // helmet
    fillPoly(ctx, [x - 7 * s, y + 6, x - 8 * s, y - 4, x - 3 * s, y - 10, x + 6 * s, y - 9, x + 9 * s, y - 2, x + 8 * s, y + 7], grad(ctx, x - 8, y - 10, x + 8, y + 8, c1, 0.4, -0.25));
    // face plate
    fillPoly(ctx, [x + 1 * s, y - 1, x + 9 * s, y - 1, x + 8 * s, y + 7, x + 2 * s, y + 7], shade(c1, -0.1));
    const eyeCol = o.eyeFlash ? '#ffffff' : gl;
    switch (v.head) {
      case 'vfin':
        fillPoly(ctx, [x + 1, y - 7, x - 14 * s, y - 20 * s, x - 1, y - 9], c3, OUT, 1.2);
        fillPoly(ctx, [x + 3, y - 7, x + 14 * s, y - 21 * s, x + 4, y - 10], shade(c3, 0.1), OUT, 1.2);
        fillPoly(ctx, [x - 1, y - 11, x + 3, y - 15, x + 6, y - 11, x + 3, y - 8], '#ff3344', OUT, 1);
        break;
      case 'horns':
        fillPoly(ctx, [x - 2, y - 7, x - 16 * s, y - 14 * s, x - 18 * s, y - 24 * s, x - 6, y - 10], c3, OUT, 1.2);
        fillPoly(ctx, [x + 4, y - 8, x + 14 * s, y - 16 * s, x + 16 * s, y - 27 * s, x + 7, y - 6], shade(c3, 0.15), OUT, 1.2);
        break;
      case 'crest': fillPoly(ctx, [x - 4, y - 9, x + 1, y - 22 * s, x + 6, y - 9], c3, OUT, 1.2); break;
      case 'crown':
        fillPoly(ctx, [x - 7 * s, y - 7, x - 10 * s, y - 20 * s, x - 3 * s, y - 11, x + 1, y - 24 * s, x + 4 * s, y - 11, x + 11 * s, y - 21 * s, x + 8 * s, y - 6], c3, OUT, 1.2);
        glowDot(ctx, x + 1, y - 12, 4, gl, 0.8);
        break;
      case 'sensor': fillPoly(ctx, [x - 6, y - 9, x - 4, y - 18, x - 1, y - 9], c3, OUT, 1); fillPoly(ctx, [x - 9, y - 4, x - 18, y - 6, x - 9, y - 1], c2, OUT, 1); break;
      case 'dome': ctx.beginPath(); ctx.arc(x + 1, y - 2, 9 * s, Math.PI, 0); ctx.fillStyle = grad(ctx, x, y - 10, x, y, c2); ctx.fill(); ctx.strokeStyle = OUT; ctx.stroke(); break;
      default: break;
    }
    // eyes
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (v.head === 'mono' || v.head === 'dome') {
      ctx.fillStyle = '#111'; ctx.fillRect(x - 1, y - 1, 11 * s, 4);
      const ex = x + 4 * s + Math.sin(t * 2) * 2.5 * s; glowDot(ctx, ex, y + 1, 6, eyeCol, 1);
    } else if (v.head === 'visor' || v.head === 'sensor') {
      ctx.fillStyle = rgba(eyeCol, 0.95); ctx.fillRect(x + 1, y - 1, 9 * s, 3); glowDot(ctx, x + 7 * s, y, 6, eyeCol, 0.8);
    } else {
      fillPoly(ctx, [x + 3 * s, y - 1, x + 9 * s, y - 2, x + 8.5 * s, y + 1.5, x + 3.5 * s, y + 1.5], eyeCol, null);
      glowDot(ctx, x + 6.5 * s, y, 7, eyeCol, 0.9);
    }
    ctx.restore();
    if (v.head === 'vfin' || v.head === 'horns' || v.head === 'crown' || v.head === 'crest') { ctx.fillStyle = shade(c2, -0.1); ctx.fillRect(x + 4 * s, y + 3, 4 * s, 3); }
  }
  function backpack(ctx, v, b, H, shY, t, o) {
    const c1 = shade(v.c1, -0.3), c2 = shade(v.c2, -0.2), gl = v.g;
    switch (v.back) {
      case 'thruster':
        fillPoly(ctx, [-14 * b, shY - 4, -4 * b, shY - 6, -2 * b, shY + 26, -16 * b, shY + 24], c2);
        fillPoly(ctx, [-24 * b, shY + 2, -12 * b, shY - 2, -12 * b, shY + 12, -26 * b, shY + 14], c1);
        if (o.thrust) flame(ctx, -26 * b, shY + 10, Math.PI * 0.85, 18 * o.thrust, gl, t);
        break;
      case 'wings': {
        const f = Math.sin(t * 2) * 0.05;
        ctx.save(); ctx.translate(-8 * b, shY + 4); ctx.rotate(-0.2 + f);
        fillPoly(ctx, [0, 0, -48 * b, -28 * H, -54 * b, -18 * H, -20 * b, 10], grad(ctx, -50, -28, 0, 10, v.c1));
        fillPoly(ctx, [-6, 8, -46 * b, 0, -44 * b, 10, -14, 16], v.c2);
        ctx.fillStyle = v.c3; poly(ctx, [-48 * b, -28 * H, -54 * b, -18 * H, -50 * b, -20 * H]); ctx.fill();
        ctx.restore();
        if (o.thrust) flame(ctx, -16 * b, shY + 20, Math.PI * 0.8, 20 * o.thrust, gl, t);
        break; }
      case 'feather': {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) {
          const a = -0.5 - i * 0.28 + Math.sin(t * 2 + i) * 0.05, L = (40 + i * 4) * H * (o.wingScale || 1);
          ctx.save(); ctx.translate(-8 * b, shY + 4); ctx.rotate(a);
          const g = ctx.createLinearGradient(0, 0, -L, 0); g.addColorStop(0, rgba(gl, 0.95)); g.addColorStop(1, rgba(gl, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -3); ctx.quadraticCurveTo(-L * 0.6, -9, -L, 0); ctx.quadraticCurveTo(-L * 0.6, 6, 0, 3); ctx.fill();
          ctx.restore();
        }
        ctx.restore();
        fillPoly(ctx, [-14 * b, shY - 4, -4 * b, shY - 6, -2 * b, shY + 22, -14 * b, shY + 20], c2);
        break; }
      case 'cannons':
        for (let i = 0; i < 2; i++) {
          const yy = shY - 14 - i * 6;
          fillPoly(ctx, [-20 * b, yy, 26 * b - i * 6, yy - 2, 26 * b - i * 6, yy + 5, -20 * b, yy + 7], grad(ctx, 0, yy, 0, yy + 7, i ? c1 : v.c2));
          ctx.fillStyle = '#111'; ctx.fillRect(24 * b - i * 6, yy - 1, 3, 5);
        }
        fillPoly(ctx, [-16 * b, shY - 8, -4 * b, shY - 10, -2 * b, shY + 22, -16 * b, shY + 20], c2);
        break;
      case 'fins':
        fillPoly(ctx, [-6 * b, shY, -36 * b, shY - 28 * H, -30 * b, shY + 2, -16 * b, shY + 20], grad(ctx, -36, shY - 28, -6, shY + 20, v.c2));
        fillPoly(ctx, [-30 * b, shY - 22 * H, -36 * b, shY - 28 * H, -26 * b, shY - 14 * H], v.c3);
        if (o.thrust) flame(ctx, -18 * b, shY + 22, Math.PI * 0.8, 18 * o.thrust, gl, t);
        break;
      case 'halo': {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(gl, 0.85); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(-12 * b, shY - 4, 22 * b, 26 * b, 0.3, 0, TAU); ctx.stroke();
        for (let i = 0; i < 6; i++) { const a = t * 0.6 + i * TAU / 6; glowDot(ctx, -12 * b + Math.cos(a) * 22 * b, shY - 4 + Math.sin(a) * 26 * b, 6, gl, 0.9); }
        ctx.restore(); break; }
      default: break;
    }
  }
  function flame(ctx, x, y, a, len, col, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.rotate(a);
    const L = len * (0.85 + Math.sin(t * 40) * 0.15);
    const g = ctx.createLinearGradient(0, 0, L, 0); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.3, rgba(col, 0.8)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -5); ctx.quadraticCurveTo(L * 0.5, -4, L, 0); ctx.quadraticCurveTo(L * 0.5, 4, 0, 5); ctx.fill(); ctx.restore();
  }
  function weapon(ctx, v, x, y, a, b, H, t, o) {
    const w = o.weapon || v.weapon; const gl = o.weaponGlow || v.g;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-a);
    // local: +y along forearm direction; weapon held perpendicular-ish, pointing along arm
    switch (w) {
      case 'rifle':
        fillPoly(ctx, [-4, -2, 4, -2, 5, 36, -3, 36], grad(ctx, -4, 0, 4, 0, '#3a4252'));
        fillPoly(ctx, [-6, 4, -3, 4, -3, 18, -7, 16], shade(v.c2, -0.2));
        ctx.fillStyle = '#111'; ctx.fillRect(-1.5, 36, 3, 6);
        ctx.fillStyle = v.g; ctx.fillRect(3, 10, 2, 6);
        break;
      case 'lance':
        fillPoly(ctx, [-3, -14, 3, -14, 3, 52, -3, 52], grad(ctx, -3, 0, 3, 0, '#4a5262'));
        fillPoly(ctx, [-5, 52, 5, 52, 0, 66], shade(v.c3, 0.1));
        ctx.fillStyle = v.c2; ctx.fillRect(-5, 6, 10, 10);
        break;
      case 'cannon':
        fillPoly(ctx, [-7, -8, 7, -8, 7, 40, -7, 40], grad(ctx, -7, 0, 7, 0, shade(v.c2, -0.1)));
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 41, 5, 0, TAU); ctx.fill();
        break;
      case 'gatling':
        fillPoly(ctx, [-8, -4, 8, -4, 8, 18, -8, 18], grad(ctx, -8, 0, 8, 0, shade(v.c2, 0)));
        for (let i = 0; i < 3; i++) { ctx.fillStyle = shade('#59606e', i * 0.1); ctx.fillRect(-6 + i * 4 + Math.sin(t * (o.spin || 1) * 30 + i) * 1, 18, 3, 22); }
        break;
      case 'axe':
        ctx.fillStyle = '#3a3a44'; ctx.fillRect(-2, -6, 4, 38);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; fillPoly(ctx, [2, 22, 16, 18, 18, 36, 2, 34], rgba('#ff7a2e', 0.9), null); ctx.restore();
        break;
      case 'drill': {
        ctx.fillStyle = shade(v.c2, -0.1); ctx.fillRect(-7, -2, 14, 10);
        const sp = t * 20 * (o.spin || 1);
        fillPoly(ctx, [-8, 8, 8, 8, 0, 44], grad(ctx, -8, 0, 8, 0, '#c8ccd6', 0.5, -0.5));
        ctx.strokeStyle = 'rgba(30,30,40,0.8)'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) { const yy = 10 + ((i * 7 + sp * 3) % 34); const ww = 8 * (1 - (yy - 8) / 36); ctx.beginPath(); ctx.moveTo(-ww, yy); ctx.lineTo(ww, yy + 4); ctx.stroke(); }
        break; }
      case 'sword': case 'saber': {
        ctx.fillStyle = '#2a2f3a'; ctx.fillRect(-2.5, -4, 5, 10);
        ctx.fillStyle = v.c3; ctx.fillRect(-6, 5, 12, 3);
        const L = (w === 'sword' ? 58 : 52) * (o.bladeLen || 1);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const bc = o.bladeCol || gl;
        const g = ctx.createLinearGradient(-6, 0, 6, 0); g.addColorStop(0, rgba(bc, 0)); g.addColorStop(0.5, rgba(bc, 0.9)); g.addColorStop(1, rgba(bc, 0));
        ctx.fillStyle = g; ctx.fillRect(-7, 8, 14, L);
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(-1.5, 8, 3, L - 2);
        ctx.restore();
        break; }
      case 'fist': break;
      default: break;
    }
    ctx.restore();
  }

  // ---------- Non-humanoids ----------
  function beast(ctx, v, pose, t, o) {
    const big = v.big ? 1.25 : 1; const c1 = v.c1, c2 = v.c2, gl = v.g;
    const bob = Math.sin(t * 4) * 2;
    ctx.save(); ctx.scale(big, big);
    // legs
    for (let i = 0; i < 4; i++) {
      const lx = -30 + i * 18, ph = Math.sin(t * 6 + i * 1.6) * 0.25;
      const back = i % 2 === 0;
      let [kx, ky] = seg(ctx, lx, -30 + bob, -0.9 + ph, 20, 7, 5, back ? shade(c1, -0.3) : c1);
      seg(ctx, kx, ky, 0.3 + ph, 22, 5, 2, back ? shade(c2, -0.3) : c2);
    }
    // body segments
    for (let i = 3; i >= 0; i--) {
      const sx = -34 + i * 20, sy = -40 + bob + Math.sin(t * 3 + i) * 1.5, r = 16 - Math.abs(i - 1.5) * 2;
      ctx.beginPath(); ctx.ellipse(sx, sy, r * 1.2, r, 0, 0, TAU);
      ctx.fillStyle = grad(ctx, sx, sy - r, sx, sy + r, i % 2 ? c1 : c2, 0.25, -0.5); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
      if (v.big) fillPoly(ctx, [sx - 6, sy - r + 2, sx, sy - r - 16, sx + 6, sy - r + 2], shade(v.c3, -0.3));
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, sx, sy + 4, 5, gl, 0.6 + Math.sin(t * 5 + i) * 0.3); ctx.restore();
    }
    // head
    const hx = 40, hy = -44 + bob;
    fillPoly(ctx, [hx - 12, hy - 12, hx + 10, hy - 10, hx + 22, hy, hx + 10, hy + 10, hx - 12, hy + 12], grad(ctx, hx, hy - 12, hx, hy + 12, c2));
    const m = o.mouth ? 0.6 : Math.sin(t * 5) * 0.15;
    ctx.save(); ctx.translate(hx + 16, hy + 2); ctx.rotate(-m); fillPoly(ctx, [0, -2, 18, 2, 4, 4], shade(v.c3, -0.3)); ctx.restore();
    ctx.save(); ctx.translate(hx + 16, hy + 4); ctx.rotate(m); fillPoly(ctx, [0, 2, 18, 4, 4, -2], shade(v.c3, -0.3)); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, hx + 8, hy - 4, 7, gl); glowDot(ctx, hx + 2, hy - 6, 5, gl); ctx.restore();
    ctx.restore();
    return { coreX: 40 * big, coreY: -44 * big, handX: 56 * big, handY: -42 * big, headY: -60 * big, shY: -50 };
  }
  function wyrm(ctx, v, pose, t, o) {
    const c1 = v.c1, c2 = v.c2, gl = v.g;
    const pts = [];
    for (let i = 0; i < 12; i++) { const x = 40 - i * 9; pts.push([x, -60 + Math.sin(t * 4 - i * 0.6) * 8]); }
    // wings
    const flap = Math.sin(t * 6) * 0.5;
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(18, -62); ctx.rotate(side > 0 ? -0.4 - flap : -0.1 + flap * 0.4);
      fillPoly(ctx, [0, 0, -30, -46 * (side > 0 ? 1 : 0.6), -50, -20, -20, 6], rgba(side > 0 ? shade(c2, 0.1) : shade(c2, -0.3), 0.9));
      ctx.restore();
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const [x, y] = pts[i], r = 9 - i * 0.55;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = grad(ctx, x, y - r, x, y + r, i % 2 ? c1 : c2); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke();
    }
    const [hx, hy] = pts[0];
    fillPoly(ctx, [hx - 6, hy - 8, hx + 18, hy - 2, hx + 20, hy + 4, hx - 4, hy + 8], grad(ctx, hx, hy - 8, hx, hy + 8, c2));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, hx + 8, hy - 2, 7, gl); ctx.restore();
    return { coreX: hx, coreY: hy, handX: hx + 18, handY: hy, headY: hy - 10, shY: hy };
  }
  function dragon(ctx, v, pose, t, o) {
    const c1 = v.c1, c2 = v.c2, c3 = v.c3, gl = v.g;
    const bob = Math.sin(t * 2.5) * 3, flap = Math.sin(t * 3) * 0.18;
    ctx.save(); ctx.translate(0, bob);
    // back wing
    ctx.save(); ctx.translate(-4, -88); ctx.rotate(-0.15 + flap);
    fillPoly(ctx, [0, 0, -40, -60, -90, -50, -70, -20, -96, -6, -50, 10], rgba(shade(c2, -0.3), 0.95));
    ctx.restore();
    // tail
    ctx.beginPath(); ctx.moveTo(-14, -56);
    for (let i = 1; i <= 10; i++) ctx.lineTo(-14 - i * 7, -50 + i * 3 + Math.sin(t * 3 - i * 0.5) * 5);
    for (let i = 10; i >= 1; i--) ctx.lineTo(-14 - i * 7, -44 + i * 3.4 + Math.sin(t * 3 - i * 0.5) * 5 + (10 - i) * 0.5);
    ctx.closePath(); ctx.fillStyle = grad(ctx, -80, -60, -10, -30, c1); ctx.fill(); ctx.strokeStyle = OUT; ctx.stroke();
    // legs
    seg(ctx, -6, -56, -0.3, 26, 12, 9, shade(c1, -0.3)); seg(ctx, 8, -56, 0.25, 26, 13, 9, c1);
    fillPoly(ctx, [-2, -32, 22, -32, 26, -26, 0, -26], shade(c2, -0.1)); // claws
    // torso
    fillPoly(ctx, [-18, -54, 14, -54, 22, -92, 4, -104, -14, -92], grad(ctx, -18, -104, 22, -54, c1, 0.4, -0.3));
    fillPoly(ctx, [-2, -62, 10, -62, 14, -88, 4, -94], c2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, 6, -78, 12 * (o.coreGlow || 1), gl); ctx.restore();
    // neck & head
    const nx = 14 + Math.sin(t * 2) * 2, ny = -116;
    fillPoly(ctx, [2, -100, 14, -96, nx + 10, ny + 6, nx, ny - 2], shade(c1, -0.1));
    const m = o.mouth ? 0.5 : 0.05;
    ctx.save(); ctx.translate(nx + 4, ny);
    fillPoly(ctx, [-8, -8, 18, -6, 34, 0, 18, 2, -6, 6], grad(ctx, 0, -8, 0, 6, c1, 0.5, -0.2));
    ctx.save(); ctx.rotate(m); fillPoly(ctx, [-2, 4, 30, 4, 16, 10, -4, 8], shade(c1, -0.3)); ctx.restore();
    fillPoly(ctx, [-6, -6, -24, -24, -10, -10], c3); fillPoly(ctx, [0, -8, -12, -30, -2, -10], shade(c3, 0.2));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, 14, -2, 7, gl); ctx.restore();
    ctx.restore();
    // arms
    seg(ctx, 10, -90, 0.9 + (o.armUp || 0), 20, 9, 7, c1);
    // front wing
    ctx.save(); ctx.translate(0, -92); ctx.rotate(-0.35 - flap);
    const g = ctx.createLinearGradient(0, 0, -100, -60); g.addColorStop(0, c2); g.addColorStop(1, rgba(gl, 0.7));
    fillPoly(ctx, [0, 0, -36, -70, -96, -70, -76, -36, -106, -20, -56, 8], g);
    ctx.strokeStyle = rgba(gl, 0.7); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-96, -70); ctx.moveTo(0, 0); ctx.lineTo(-106, -20); ctx.stroke();
    ctx.restore();
    ctx.restore();
    return { coreX: 6, coreY: -78 + bob, handX: nx + 38, handY: ny + bob, headY: ny - 10, shY: -90 };
  }
  function ship(ctx, v, pose, t, o) {
    const c1 = v.c1, c2 = v.c2, c3 = v.c3, gl = v.g;
    ctx.save(); ctx.translate(0, -50 + Math.sin(t * 1.5) * 2);
    // engines glow
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { flame(ctx, -92, -12 + i * 12, Math.PI, 30 + Math.sin(t * 20 + i) * 4, gl, t); }
    ctx.restore();
    fillPoly(ctx, [-95, -20, 40, -22, 100, -4, 110, 4, 60, 18, -95, 20], grad(ctx, 0, -22, 0, 20, c1, 0.35, -0.4));
    fillPoly(ctx, [-95, 6, 60, 8, 90, 4, 60, 18, -95, 20], c2);
    ctx.fillStyle = c3; ctx.fillRect(-60, -6, 120, 3);
    // bridge
    fillPoly(ctx, [-50, -20, -20, -20, -14, -44, -40, -46], grad(ctx, -50, -46, -14, -20, c1));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(gl, 0.9); ctx.fillRect(-38, -40, 20, 3); ctx.restore();
    // turrets
    for (const tx of [0, 30]) { fillPoly(ctx, [tx - 8, -22, tx + 8, -22, tx + 6, -30, tx - 6, -30], c2); ctx.fillStyle = '#222'; ctx.fillRect(tx, -29, 18, 3); }
    // windows
    ctx.fillStyle = rgba(gl, 0.7); for (let i = 0; i < 10; i++) ctx.fillRect(-80 + i * 14, 0, 6, 2);
    ctx.restore();
    return { coreX: 104, coreY: -50, handX: 108, handY: -48, headY: -96, shY: -70 };
  }
  function shard(ctx, v, pose, t, o) {
    const gl = v.g; const y0 = -60 + Math.sin(t * 2) * 5;
    ctx.save(); ctx.translate(0, y0); ctx.rotate(Math.sin(t) * 0.2);
    const g = ctx.createLinearGradient(-20, -34, 20, 34); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, v.c1); g.addColorStop(1, v.c2);
    fillPoly(ctx, [0, -36, 18, 0, 0, 36, -18, 0], g, rgba(gl, 0.9), 1.5);
    fillPoly(ctx, [0, -36, 18, 0, 0, 0], 'rgba(255,255,255,0.35)', null);
    ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, 0, 0, 18, gl);
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const a = t * 1.5 + i * TAU / 4; const x = Math.cos(a) * 32, y = y0 + Math.sin(a) * 12;
      fillPoly(ctx, [x, y - 7, x + 4, y, x, y + 7, x - 4, y], v.c1, rgba(gl, 0.8), 1);
    }
    return { coreX: 0, coreY: y0, handX: 16, handY: y0, headY: y0 - 40, shY: y0 };
  }
  function colossus(ctx, v, pose, t, o) {
    const c1 = v.c1, c2 = v.c2, gl = v.g;
    // tentacles
    for (let i = 0; i < 7; i++) {
      ctx.beginPath(); const bx = -60 + i * 20; ctx.moveTo(bx, -40);
      let x = bx, y = -40;
      for (let k = 1; k <= 8; k++) { x = bx + Math.sin(t * 2 + i + k * 0.6) * 10 + (i - 3) * k * 2.5; y = -40 + k * 6; ctx.lineTo(x, y); }
      ctx.lineWidth = 9 - i % 3; ctx.strokeStyle = shade(i % 2 ? c1 : c2, -0.2); ctx.lineCap = 'round'; ctx.stroke();
    }
    // upper tendrils
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); const a0 = -Math.PI * (0.15 + i * 0.17); let x = Math.cos(a0) * 50, y = -100 + Math.sin(a0) * 40; ctx.moveTo(x, y);
      for (let k = 1; k <= 8; k++) { x += Math.cos(a0 + Math.sin(t * 2 + i + k) * 0.5) * 9; y += Math.sin(a0 + Math.sin(t * 1.7 + k) * 0.4) * 9; ctx.lineTo(x, y); }
      ctx.lineWidth = 6; ctx.strokeStyle = shade(c2, -0.1); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, x, y, 6, gl, 0.8); ctx.restore();
    }
    // body mass
    const pulse = 1 + Math.sin(t * 2) * 0.03;
    ctx.beginPath(); ctx.ellipse(0, -100, 70 * pulse, 64 * pulse, 0, 0, TAU);
    const g = ctx.createRadialGradient(10, -120, 10, 0, -100, 80); g.addColorStop(0, shade(c2, 0.2)); g.addColorStop(0.6, c1); g.addColorStop(1, shade(c1, -0.6));
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
    // ribs
    ctx.strokeStyle = shade(c2, -0.2); ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(0, -100, 64 - i * 4, 20 + i * 9, 0, 0.2, Math.PI - 0.2); ctx.stroke(); }
    if (v.crown) { for (let i = 0; i < 5; i++) fillPoly(ctx, [-40 + i * 20, -150, -32 + i * 20, -196 - (i === 2 ? 20 : 0), -24 + i * 20, -150], shade(v.c3, -0.2)); }
    // eye/core
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, 20, -110, 34 * (o.coreGlow || 1), gl); ctx.restore();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(20, -110, 4, 12, 0, 0, TAU); ctx.fill();
    return { coreX: 20, coreY: -110, handX: 60, handY: -100, headY: -170, shY: -120 };
  }
  function hollow(ctx, v, pose, t, o) {
    const y0 = -110;
    ctx.save(); ctx.translate(0, y0);
    // dark absence shards
    for (let i = 0; i < 9; i++) {
      const a = t * 0.3 + i * TAU / 9, r = 70 + Math.sin(t + i) * 10;
      ctx.save(); ctx.rotate(a); ctx.translate(r, 0); ctx.rotate(t + i);
      fillPoly(ctx, [0, -16, 10, 0, 0, 16, -10, 0], '#000', 'rgba(255,255,255,0.8)', 1.2); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, 58, 0, TAU); ctx.fillStyle = '#000'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(180,140,255,0.5)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 64 + Math.sin(t * 3) * 3, 0, TAU); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    // eye
    const open = 0.5 + Math.sin(t * 0.7) * 0.4;
    ctx.beginPath(); ctx.ellipse(0, 0, 30, 14 * open, 0, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(Math.sin(t) * 6, 0, 7 * open + 2, 0, TAU); ctx.fillStyle = '#000'; ctx.fill();
    ctx.restore();
    return { coreX: 0, coreY: y0, handX: 30, handY: y0, headY: y0 - 70, shY: y0 };
  }

  // Main entry: draws mech with feet at (0,0), facing right. Returns anchor points.
  function drawMech(ctx, v, opts = {}) {
    const t = opts.t || 0; const pose = opts.pose || POSES.idle;
    switch (v.body) {
      case 'beast': return beast(ctx, v, pose, t, opts);
      case 'wyrm': return wyrm(ctx, v, pose, t, opts);
      case 'dragon': return dragon(ctx, v, pose, t, opts);
      case 'ship': return ship(ctx, v, pose, t, opts);
      case 'shard': return shard(ctx, v, pose, t, opts);
      case 'colossus': return colossus(ctx, v, pose, t, opts);
      case 'hollow': return hollow(ctx, v, pose, t, opts);
      default: return humanoid(ctx, v, pose, t, opts);
    }
  }

  // cached map sprite
  const spriteCache = {};
  function mapSprite(mechId, size, flip) {
    const key = mechId + '|' + size + '|' + flip;
    if (spriteCache[key]) return spriteCache[key];
    const m = MECHS[mechId]; const c = document.createElement('canvas'); c.width = c.height = size * 2;
    const ctx = c.getContext('2d');
    const isBig = ['colossus', 'hollow'].includes(m.vis.body);
    const sc = size / (m.vis.body === 'ship' ? 230 : isBig ? 230 : m.vis.body === 'dragon' ? 170 : 125) * 1.7 * (0.85 + 0.15 * SIZE_SCALE[m.size]);
    ctx.translate(size, size * 1.55); if (flip) ctx.scale(-1, 1); ctx.scale(sc, sc);
    drawMech(ctx, m.vis, { t: 0.6 });
    spriteCache[key] = c; return c;
  }

  // ---------- Portraits ----------
  const portraitCache = {};
  function portrait(pid, expr = 'normal', w = 240, h = 300) {
    const key = pid + expr + w + 'x' + h;
    if (portraitCache[key]) return portraitCache[key];
    if (typeof ASSETS !== 'undefined') { const apid = pid === 'rei' && typeof SAVE !== 'undefined' && SAVE.hero && SAVE.hero.gender === 'f' ? 'rina' : pid; const art = ASSETS.portrait(apid, expr, w, h); if (art) { portraitCache[key] = art; return art; } }
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    drawPortrait(c.getContext('2d'), PORTRAITS[pid] || PORTRAITS.grunt_c, w, h, expr);
    portraitCache[key] = c; return c;
  }
  function drawPortrait(ctx, p, W, H, expr) {
    ctx.save(); ctx.scale(W / 240, H / 300);
    // bg
    const bg = ctx.createLinearGradient(0, 0, 240, 300); bg.addColorStop(0, shade(p.bg, 0.15)); bg.addColorStop(1, shade(p.bg, -0.6));
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 240, 300);
    ctx.strokeStyle = rgba('#ffffff', 0.06); ctx.lineWidth = 10;
    for (let i = -300; i < 300; i += 34) { ctx.beginPath(); ctx.moveTo(i, 300); ctx.lineTo(i + 300, 0); ctx.stroke(); }
    if (p.acc === 'void') { // non-human silhouettes
      ctx.fillStyle = p.suit; ctx.beginPath(); ctx.ellipse(120, 180, 80, 110, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, 100, 150, 30, p.eye); glowDot(ctx, 145, 150, 30, p.eye); ctx.restore(); return;
    }
    const cx = 120, fy = 128; // face center
    const old = p.age === 'old', young = p.age === 'young';
    // hair back layer
    ctx.fillStyle = shade(p.hair, -0.2);
    if (p.hs === 'long') { ctx.beginPath(); ctx.moveTo(cx - 62, fy - 40); ctx.quadraticCurveTo(cx - 80, fy + 80, cx - 70, fy + 150); ctx.lineTo(cx + 70, fy + 150); ctx.quadraticCurveTo(cx + 80, fy + 80, cx + 62, fy - 40); ctx.closePath(); ctx.fill(); }
    if (p.hs === 'pony') { ctx.beginPath(); ctx.moveTo(cx + 40, fy - 50); ctx.quadraticCurveTo(cx + 110, fy - 30, cx + 90, fy + 90); ctx.quadraticCurveTo(cx + 70, fy + 20, cx + 30, fy - 20); ctx.fill(); }
    if (p.hs === 'braid') { for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(cx + 52, fy + 20 + i * 18, 11 - i, 10, 0.3, 0, TAU); ctx.fill(); } }
    if (p.hs === 'bob') { ctx.beginPath(); ctx.ellipse(cx, fy + 5, 66, 70, 0, 0, TAU); ctx.fill(); }
    // shoulders / suit
    const sg = ctx.createLinearGradient(0, 200, 0, 300); sg.addColorStop(0, shade(p.suit, 0.15)); sg.addColorStop(1, shade(p.suit, -0.4));
    ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(10, 300); ctx.quadraticCurveTo(20, 222, 80, 210); ctx.lineTo(160, 210); ctx.quadraticCurveTo(220, 222, 230, 300); ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = p.suit2; ctx.beginPath(); ctx.moveTo(85, 212); ctx.lineTo(120, 260); ctx.lineTo(155, 212); ctx.lineTo(145, 210); ctx.lineTo(120, 244); ctx.lineTo(95, 210); ctx.fill();
    ctx.fillRect(28, 250, 40, 8); ctx.fillRect(172, 250, 40, 8);
    // neck
    ctx.fillStyle = shade(p.skin, -0.15); ctx.fillRect(cx - 18, fy + 50, 36, 45);
    ctx.fillStyle = shade(p.skin, -0.3); ctx.beginPath(); ctx.moveTo(cx - 18, fy + 58); ctx.lineTo(cx + 18, fy + 72); ctx.lineTo(cx + 18, fy + 58); ctx.fill();
    // collar
    ctx.fillStyle = shade(p.suit, -0.1); ctx.beginPath(); ctx.moveTo(cx - 34, fy + 80); ctx.lineTo(cx, fy + 96); ctx.lineTo(cx + 34, fy + 80); ctx.lineTo(cx + 30, fy + 104); ctx.lineTo(cx - 30, fy + 104); ctx.fill(); ctx.stroke();
    // ears
    ctx.fillStyle = shade(p.skin, -0.1);
    ctx.beginPath(); ctx.ellipse(cx - 47, fy + 6, 8, 13, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + 47, fy + 6, 8, 13, 0, 0, TAU); ctx.fill();
    // face
    const chin = p.jaw === 'square' ? 58 : p.jaw === 'sharp' ? 64 : 60;
    const jw = p.jaw === 'square' ? 40 : p.jaw === 'sharp' ? 30 : 32;
    ctx.beginPath(); ctx.moveTo(cx - 48, fy - 20);
    ctx.quadraticCurveTo(cx - 50, fy + 25, cx - jw, fy + 42); ctx.quadraticCurveTo(cx - 10, fy + chin, cx, fy + chin);
    ctx.quadraticCurveTo(cx + 10, fy + chin, cx + jw, fy + 42); ctx.quadraticCurveTo(cx + 50, fy + 25, cx + 48, fy - 20);
    ctx.quadraticCurveTo(cx, fy - 80, cx - 48, fy - 20);
    const fg = ctx.createLinearGradient(cx - 50, 0, cx + 50, 0); fg.addColorStop(0, shade(p.skin, -0.12)); fg.addColorStop(0.4, shade(p.skin, 0.08)); fg.addColorStop(1, shade(p.skin, -0.18));
    ctx.fillStyle = fg; ctx.fill(); ctx.strokeStyle = shade(p.skin, -0.55); ctx.lineWidth = 2; ctx.stroke();
    // blush / age lines
    if (young) { ctx.fillStyle = 'rgba(255,120,120,0.15)'; ctx.beginPath(); ctx.ellipse(cx - 28, fy + 24, 10, 5, 0, 0, TAU); ctx.ellipse(cx + 28, fy + 24, 10, 5, 0, 0, TAU); ctx.fill(); }
    if (old) { ctx.strokeStyle = shade(p.skin, -0.35); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - 22, fy + 30); ctx.quadraticCurveTo(cx - 26, fy + 40, cx - 20, fy + 46); ctx.moveTo(cx + 22, fy + 30); ctx.quadraticCurveTo(cx + 26, fy + 40, cx + 20, fy + 46); ctx.moveTo(cx - 20, fy - 26); ctx.lineTo(cx + 20, fy - 26); ctx.stroke(); }
    // eyes
    const ey = fy + 4, ex = 22;
    const eyeH = expr === 'shock' ? 15 : expr === 'smile' ? 4 : expr === 'angry' ? 9 : expr === 'sad' ? 10 : 12;
    for (const s of [-1, 1]) {
      const x = cx + s * ex;
      if (expr === 'smile') { ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(x, ey + 4, 10, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); continue; }
      ctx.fillStyle = '#fbfbff'; ctx.beginPath(); ctx.ellipse(x, ey, 13, eyeH, 0, 0, TAU); ctx.fill();
      const ig = ctx.createLinearGradient(0, ey - eyeH, 0, ey + eyeH); ig.addColorStop(0, shade(p.eye, -0.5)); ig.addColorStop(1, shade(p.eye, 0.3));
      const ir = expr === 'shock' ? 6 : 8.5;
      ctx.save(); ctx.beginPath(); ctx.ellipse(x, ey, 13, eyeH, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = ig; ctx.beginPath(); ctx.ellipse(x + s * 1, ey + 1, ir, ir * 1.25, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#0a0a12'; ctx.beginPath(); ctx.ellipse(x + s * 1, ey + 1, ir * 0.45, ir * 0.6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 3, ey - 4, 2.8, 0, TAU); ctx.fill();
      ctx.restore();
      // lash
      ctx.strokeStyle = '#121218'; ctx.lineWidth = 3.5; ctx.beginPath();
      ctx.moveTo(x - s * 14, ey - eyeH * 0.2 + (s > 0 ? 0 : 0)); ctx.quadraticCurveTo(x, ey - eyeH - 3, x + s * 15, ey - eyeH * 0.4); ctx.stroke();
      // brow
      ctx.strokeStyle = shade(p.hair, -0.3); ctx.lineWidth = 4;
      const bIn = expr === 'angry' ? 4 : expr === 'sad' ? -6 : 0, bOut = expr === 'sad' ? 4 : expr === 'angry' ? -5 : 0;
      ctx.beginPath(); ctx.moveTo(cx + s * 8, ey - 20 + bIn); ctx.lineTo(cx + s * 34, ey - 22 + bOut); ctx.stroke();
    }
    // nose & mouth
    ctx.strokeStyle = shade(p.skin, -0.4); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + 2, fy + 18); ctx.lineTo(cx - 3, fy + 28); ctx.lineTo(cx + 3, fy + 29); ctx.stroke();
    ctx.strokeStyle = '#5a2a2a'; ctx.lineWidth = 2.5; ctx.beginPath();
    if (expr === 'smile') { ctx.arc(cx, fy + 36, 10, 0.15 * Math.PI, 0.85 * Math.PI); }
    else if (expr === 'angry') { ctx.moveTo(cx - 11, fy + 43); ctx.lineTo(cx + 11, fy + 41); }
    else if (expr === 'shock') { ctx.ellipse(cx, fy + 42, 6, 8, 0, 0, TAU); }
    else if (expr === 'sad') { ctx.arc(cx, fy + 48, 9, 1.2 * Math.PI, 1.8 * Math.PI); }
    else { ctx.moveTo(cx - 8, fy + 42); ctx.quadraticCurveTo(cx, fy + 44, cx + 8, fy + 41); }
    ctx.stroke();
    if (p.acc === 'beard') { ctx.fillStyle = shade(p.hair, -0.1); ctx.beginPath(); ctx.moveTo(cx - 40, fy + 26); ctx.quadraticCurveTo(cx - 34, fy + 70, cx, fy + 72); ctx.quadraticCurveTo(cx + 34, fy + 70, cx + 40, fy + 26); ctx.quadraticCurveTo(cx + 20, fy + 50, cx + 12, fy + 38); ctx.lineTo(cx - 12, fy + 38); ctx.quadraticCurveTo(cx - 20, fy + 50, cx - 40, fy + 26); ctx.fill(); }
    // hair front
    hairFront(ctx, p, cx, fy);
    // accessories
    switch (p.acc) {
      case 'scar': ctx.strokeStyle = 'rgba(160,60,60,0.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx + 12, fy - 16); ctx.lineTo(cx + 34, fy + 22); ctx.stroke(); break;
      case 'glasses': ctx.strokeStyle = '#222'; ctx.lineWidth = 2.5; ctx.strokeRect(cx - 38, ey - 12, 30, 22); ctx.strokeRect(cx + 8, ey - 12, 30, 22); ctx.beginPath(); ctx.moveTo(cx - 8, ey - 4); ctx.lineTo(cx + 8, ey - 4); ctx.stroke(); ctx.fillStyle = 'rgba(180,220,255,0.15)'; ctx.fillRect(cx - 38, ey - 12, 30, 22); ctx.fillRect(cx + 8, ey - 12, 30, 22); break;
      case 'eyepatch': ctx.fillStyle = '#15171c'; ctx.beginPath(); ctx.ellipse(cx - ex, ey, 16, 14, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#15171c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 50, ey - 14); ctx.lineTo(cx + 48, ey - 26); ctx.stroke(); break;
      case 'visor': ctx.fillStyle = rgba('#62f3ff', 0.35); ctx.fillRect(cx - 50, ey - 8, 70, 14); ctx.strokeStyle = '#62f3ff'; ctx.lineWidth = 1.5; ctx.strokeRect(cx - 50, ey - 8, 70, 14); break;
      case 'earring': ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(cx + 48, fy + 22, 4, 0, TAU); ctx.fill(); break;
      case 'circlet': ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 50, fy - 26); ctx.quadraticCurveTo(cx, fy - 40, cx + 50, fy - 26); ctx.stroke(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, cx, fy - 34, 9, p.eye); ctx.restore(); break;
      case 'horns': fillPoly(ctx, [cx - 40, fy - 40, cx - 64, fy - 92, cx - 30, fy - 50], shade(p.suit, 0.1)); fillPoly(ctx, [cx + 40, fy - 40, cx + 64, fy - 92, cx + 30, fy - 50], shade(p.suit, 0.1)); break;
      case 'mask': ctx.fillStyle = rgba('#ffffff', 0.92); ctx.beginPath(); ctx.moveTo(cx - 50, ey - 16); ctx.lineTo(cx + 50, ey - 16); ctx.lineTo(cx + 40, ey + 14); ctx.lineTo(cx, ey + 8); ctx.lineTo(cx - 40, ey + 14); ctx.closePath(); ctx.fill(); ctx.strokeStyle = shade(p.suit2, 0); ctx.lineWidth = 2; ctx.stroke();
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, cx - 20, ey, 9, p.eye === '#ffffff' ? '#c9a6ff' : p.eye); glowDot(ctx, cx + 20, ey, 9, p.eye === '#ffffff' ? '#c9a6ff' : p.eye); ctx.restore(); break;
    }
    // rim light
    const rl = ctx.createLinearGradient(240, 0, 140, 0); rl.addColorStop(0, rgba(p.eye, 0.25)); rl.addColorStop(1, rgba(p.eye, 0));
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rl; ctx.fillRect(140, 0, 100, 300);
    ctx.restore();
  }
  function hairFront(ctx, p, cx, fy) {
    const hc = p.hair; const g = ctx.createLinearGradient(0, fy - 80, 0, fy); g.addColorStop(0, shade(hc, 0.2)); g.addColorStop(1, shade(hc, -0.25));
    ctx.fillStyle = g; ctx.strokeStyle = shade(hc, -0.6); ctx.lineWidth = 1.5;
    const cap = () => { ctx.beginPath(); ctx.moveTo(cx - 54, fy); ctx.quadraticCurveTo(cx - 60, fy - 70, cx, fy - 76); ctx.quadraticCurveTo(cx + 60, fy - 70, cx + 54, fy); };
    switch (p.hs) {
      case 'bald': ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(cx - 10, fy - 50, 20, 8, -0.3, 0, TAU); ctx.fill(); break;
      case 'spiky': case 'wild': {
        cap(); const n = p.hs === 'wild' ? 9 : 7;
        for (let i = 0; i <= n; i++) { const x = cx + 56 - i * (112 / n); const tipX = x + (p.hs === 'wild' ? Math.sin(i * 2.3) * 18 : -10), tipY = fy - 20 + (i % 2) * 14; ctx.lineTo(x + 6, fy - 30); ctx.lineTo(tipX, tipY); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        for (let i = 0; i < 6; i++) { ctx.beginPath(); const a = -Math.PI * (0.15 + i * 0.14); ctx.moveTo(cx + Math.cos(a) * 40, fy - 40 + Math.sin(a) * 30); ctx.lineTo(cx + Math.cos(a) * 80, fy - 46 + Math.sin(a) * 60); ctx.lineTo(cx + Math.cos(a + 0.25) * 40, fy - 40 + Math.sin(a + 0.25) * 30); ctx.fill(); ctx.stroke(); }
        break; }
      case 'short': cap(); ctx.lineTo(cx + 50, fy - 30); ctx.lineTo(cx + 20, fy - 40); ctx.lineTo(cx, fy - 30); ctx.lineTo(cx - 30, fy - 38); ctx.lineTo(cx - 52, fy - 20); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
      case 'slick': cap(); ctx.quadraticCurveTo(cx + 30, fy - 50, cx - 10, fy - 46); ctx.quadraticCurveTo(cx - 40, fy - 44, cx - 54, fy); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = shade(hc, 0.3); ctx.beginPath(); ctx.moveTo(cx - 40, fy - 50); ctx.quadraticCurveTo(cx, fy - 70, cx + 40, fy - 52); ctx.stroke(); break;
      case 'undercut': ctx.beginPath(); ctx.moveTo(cx - 50, fy - 30); ctx.quadraticCurveTo(cx - 40, fy - 84, cx + 20, fy - 80); ctx.quadraticCurveTo(cx + 70, fy - 70, cx + 52, fy - 10); ctx.lineTo(cx + 30, fy - 30); ctx.lineTo(cx + 10, fy - 50); ctx.lineTo(cx - 20, fy - 46); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = rgba(shade(hc, -0.4), 0.5); ctx.fillRect(cx - 54, fy - 30, 10, 26); break;
      case 'long': case 'bob': case 'pony': case 'braid': default:
        cap(); ctx.lineTo(cx + 58, fy + 30); ctx.lineTo(cx + 44, fy - 10); ctx.lineTo(cx + 30, fy - 34); ctx.lineTo(cx + 18, fy - 12); ctx.lineTo(cx + 4, fy - 36); ctx.lineTo(cx - 12, fy - 14); ctx.lineTo(cx - 26, fy - 36); ctx.lineTo(cx - 44, fy - 8); ctx.lineTo(cx - 58, fy + 30); ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
    }
  }

  // ---------- Backgrounds (story + battle) ----------
  const starCache = {};
  function stars(ctx, w, h, seed, n, off = 0) {
    let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) { const x = (r() * w * 1.5 - off * (0.2 + r() * 0.8)) % w; const xx = x < 0 ? x + w : x; const y = r() * h, sz = r() * 1.6 + 0.3; ctx.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; ctx.fillRect(xx, y, sz, sz); }
  }
  function skyline(ctx, w, h, base, col, seed, off, burning) {
    let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    ctx.fillStyle = col; let x = -((off) % 200) - 200;
    while (x < w + 200) { const bw = 30 + r() * 60, bh = 40 + r() * 140; ctx.fillRect(x, base - bh, bw, bh + h); if (burning && r() > 0.6) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, x + bw / 2, base - bh, 40, '#ff6a2a', 0.5); ctx.restore(); ctx.fillStyle = col; } x += bw + 4; }
  }
  function drawBG(ctx, w, h, key, t = 0, off = 0) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    const pal = {
      base: ['#233456', '#c76b4a', '#2a1c22'], fire: ['#1a0c10', '#7a2618', '#1a0a08'], hangar: ['#11161f', '#202a38', '#0b0e14'],
      bridge: ['#0a1220', '#12243a', '#060a12'], sky: ['#3a6fb4', '#a9cdea', '#d8e8f0'], lab: ['#1a1410', '#4a2a18', '#100c08'],
      elevator: ['#0b1730', '#3a5a8a', '#c8b48a'], space: ['#02030a', '#070b1a', '#02030a'], colony: ['#050814', '#14223a', '#0a1020'],
      hive: ['#140810', '#3a1424', '#0a0408'], vael: ['#0c0418', '#2a1050', '#05020c'], ice: ['#1a2a40', '#8aa6c4', '#e8f0f8'],
      void: ['#000000', '#05020a', '#000000'], dawn: ['#1a2a5a', '#ff9a6a', '#ffd9a0'], black: ['#000', '#000', '#000'], ruins: ['#2a2a30', '#6a5a50', '#2a2420'],
      city: ['#2a4a7a', '#8ab0d0', '#c0ccd8'],
    }[key] || ['#111', '#222', '#111'];
    g.addColorStop(0, pal[0]); g.addColorStop(0.6, pal[1]); g.addColorStop(1, pal[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    switch (key) {
      case 'space': case 'colony': case 'vael': case 'void':
        stars(ctx, w, h, 7, 220, off * 0.3); stars(ctx, w, h, 13, 80, off);
        if (key === 'space') { const pg = ctx.createRadialGradient(w * 0.8, h * 1.3, h * 0.3, w * 0.8, h * 1.3, h * 0.75); pg.addColorStop(0, '#2a6ab8'); pg.addColorStop(0.9, '#0c2a5a'); pg.addColorStop(1, 'rgba(60,140,255,0)'); ctx.fillStyle = pg; ctx.fillRect(0, 0, w, h); }
        if (key === 'colony') { ctx.save(); ctx.translate(w * 0.3 - off * 0.05, h * 0.45); ctx.fillStyle = '#2a3448'; ctx.fillRect(-260, -40, 520, 80); ctx.fillStyle = '#ffd98a'; for (let i = 0; i < 26; i++) ctx.fillRect(-250 + i * 20, -6, 8, 3); ctx.fillStyle = '#3a4a64'; ctx.beginPath(); ctx.ellipse(-260, 0, 20, 40, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(260, 0, 20, 40, 0, 0, TAU); ctx.fill(); ctx.restore(); }
        if (key === 'vael') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { ctx.strokeStyle = `rgba(200,140,255,${0.08 + i * 0.02})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.4, 100 + i * 70 + Math.sin(t + i) * 10, 40 + i * 24, 0.2, 0, TAU); ctx.stroke(); } ctx.restore(); }
        if (key === 'void') { ctx.save(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.45, h * 0.3, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
        break;
      case 'base': case 'fire': case 'city': case 'ruins':
        if (key === 'base') { const sg = ctx.createRadialGradient(w * 0.7, h * 0.62, 10, w * 0.7, h * 0.62, 200); sg.addColorStop(0, 'rgba(255,200,140,0.9)'); sg.addColorStop(1, 'rgba(255,120,80,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h); }
        skyline(ctx, w, h, h * 0.78, key === 'city' ? '#5a6a80' : '#1a1418', 3, off * 0.3, key === 'fire');
        skyline(ctx, w, h, h * 0.88, key === 'city' ? '#3a4658' : '#0c0a0c', 11, off * 0.7, key === 'fire');
        if (key === 'fire' || key === 'ruins') { ctx.fillStyle = 'rgba(30,20,20,0.35)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse((i * 260 + t * 20) % (w + 300) - 150, h * 0.4 - i * 20, 180, 60, 0, 0, TAU); ctx.fill(); } }
        ctx.fillStyle = key === 'city' ? '#2a3240' : '#0a0808'; ctx.fillRect(0, h * 0.88, w, h);
        break;
      case 'sky': case 'dawn': case 'elevator': case 'ice':
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let i = 0; i < 8; i++) { const x = ((i * 220 - off * (0.3 + i * 0.05) - t * 8) % (w + 400)); const xx = x < -200 ? x + w + 400 : x; ctx.beginPath(); ctx.ellipse(xx, h * (0.2 + (i % 4) * 0.15), 120 + i * 10, 22, 0, 0, TAU); ctx.fill(); }
        if (key === 'elevator') { ctx.fillStyle = 'rgba(30,40,60,0.85)'; ctx.fillRect(w * 0.55 - off * 0.1, 0, 26, h); ctx.fillStyle = 'rgba(120,200,255,0.5)'; for (let y = (t * 60) % 40; y < h; y += 40) ctx.fillRect(w * 0.55 - off * 0.1 + 4, y, 18, 4); }
        if (key === 'ice') { ctx.fillStyle = '#d0dceb'; ctx.beginPath(); ctx.moveTo(0, h * 0.8); for (let x = 0; x <= w; x += 80) ctx.lineTo(x, h * (0.72 + Math.sin(x * 0.01 + off * 0.002) * 0.04)); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill(); }
        if (key === 'sky') { ctx.fillStyle = '#7a9a6a'; ctx.beginPath(); ctx.moveTo(0, h); for (let x = 0; x <= w + 100; x += 100) ctx.lineTo(x - off * 0.4 % 100, h * 0.88 + Math.sin(x * 0.02) * 10); ctx.lineTo(w, h); ctx.fill(); }
        break;
      case 'hangar': case 'bridge': case 'lab': {
        ctx.strokeStyle = 'rgba(120,160,220,0.08)'; ctx.lineWidth = 2;
        for (let x = 0; x < w; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (x - w / 2) * 0.3, h); ctx.stroke(); }
        if (key === 'bridge') { for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(40,120,200,0.25)'; ctx.fillRect(60 + i * (w - 120) / 5, h * 0.25, (w - 160) / 5, h * 0.25); ctx.strokeStyle = 'rgba(98,243,255,0.4)'; ctx.strokeRect(60 + i * (w - 120) / 5, h * 0.25, (w - 160) / 5, h * 0.25); ctx.fillStyle = 'rgba(98,243,255,0.5)'; for (let k = 0; k < 6; k++) ctx.fillRect(70 + i * (w - 120) / 5, h * 0.28 + k * 14, ((Math.sin(t + i * 3 + k) + 1) * 0.5) * (w - 200) / 5, 3); } stars(ctx, w, h * 0.2, 5, 60, 0); }
        if (key === 'hangar') { ctx.fillStyle = 'rgba(255,200,80,0.12)'; for (let i = 0; i < 6; i++) ctx.fillRect(i * w / 6 + 20, 30, w / 6 - 40, 8); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, h * 0.8, w, h * 0.2); ctx.save(); ctx.globalAlpha = 0.3; ctx.translate(w * 0.5, h * 0.9); ctx.scale(3, 3); drawMech(ctx, MECHS.alteon.vis, { t }); ctx.restore(); }
        if (key === 'lab') { ctx.fillStyle = 'rgba(255,140,60,0.1)'; for (let i = 0; i < 12; i++) ctx.fillRect((i * 97) % w, h * 0.3 + (i % 3) * 40, 60, 30); }
        break; }
      case 'hive':
        for (let i = 0; i < 14; i++) { ctx.strokeStyle = `rgba(140,40,80,${0.2 + (i % 3) * 0.1})`; ctx.lineWidth = 14 + i % 4 * 6; ctx.beginPath(); const x = (i * 140 - off * 0.4) % (w + 200); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + 60, h * 0.3, x - 60 + Math.sin(t + i) * 10, h * 0.6, x + 30, h); ctx.stroke(); }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 20; i++) glowDot(ctx, (i * 173 - off * 0.6) % w + (i * 173 - off * 0.6 < 0 ? w : 0), (i * 97) % h, 10 + (i % 3) * 6, '#c6ff4a', 0.15 + 0.1 * Math.sin(t * 2 + i)); ctx.restore();
        break;
    }
  }

  function clearPortraits() { for (const k in portraitCache) delete portraitCache[k]; }
  return { clearPortraits, drawMech, POSES, lerpPose, mapSprite, portrait, drawPortrait, drawBG, shade, rgba, glowDot, flame };
})();
