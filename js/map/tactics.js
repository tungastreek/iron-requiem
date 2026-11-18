// ===== Tactical map: generation, rendering, turn engine, AI, events, secrets =====
'use strict';
const G = { map: null };

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; }; }
function vnoise(r, w, h, scale) { // value noise grid
  const gw = Math.ceil(w / scale) + 2, gh = Math.ceil(h / scale) + 2; const g = []; for (let i = 0; i < gw * gh; i++) g.push(r());
  return (x, y) => { const fx = x / scale, fy = y / scale, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy; const v = (a, b) => g[b * gw + a]; const s = t => t * t * (3 - 2 * t); const a = v(ix, iy) + (v(ix + 1, iy) - v(ix, iy)) * s(tx), b = v(ix, iy + 1) + (v(ix + 1, iy + 1) - v(ix, iy + 1)) * s(tx); return a + (b - a) * s(ty); };
}
function genMap(theme, w, h, seed) {
  const r = rng(seed), n1 = vnoise(r, w, h, 4), n2 = vnoise(r, w, h, 3);
  const rows = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const a = n1(x, y), b = n2(x, y); let t = '.';
      switch (theme) {
        case 'urban': t = a > 0.62 ? 'c' : a < 0.25 ? 'f' : b > 0.78 ? 'r' : b < 0.12 ? 'm' : '.'; if (x <= 2 && y >= 3 && y <= 8) t = 'b'; break;
        case 'coast': t = x > w - 5 + Math.round((a - 0.5) * 4) ? 'w' : a < 0.3 ? 'f' : b > 0.8 ? 'm' : b < 0.2 ? 'c' : '.'; break;
        case 'lab': t = a < 0.3 ? 'f' : a > 0.75 ? 'm' : b > 0.8 ? 'r' : '.'; if (x >= 1 && x <= 3 && y >= 4 && y <= 7) t = 'b'; break;
        case 'elevator': t = a > 0.65 ? 'c' : a < 0.22 ? 'f' : b > 0.82 ? 'm' : '.'; if (x >= 7 && x <= 8 && y >= 4 && y <= 7) t = 'b'; if (y === 0 || y === h - 1) t = b > 0.5 ? 'w' : t; break;
        case 'hive': t = a > 0.7 ? 'x' : a > 0.55 ? 'h' : b > 0.75 ? 'r' : b < 0.25 ? 'h' : '.'; break;
        case 'ice': t = a > 0.7 ? 'm' : a < 0.2 ? 'w' : b > 0.8 ? 'r' : '.'; break;
        case 'space': t = a > 0.68 ? 'a' : 's'; break;
        case 'colony': t = (Math.abs(y - (h - 1) / 2) <= 1 && x > Math.floor(w * .18) && x < Math.ceil(w * .82)) ? (b > 0.5 ? 'c' : 'b') : a > 0.72 ? 'a' : 's'; break;
        case 'vael': t = a > 0.6 ? 'v' : b > 0.82 ? 'a' : 's'; break;
      }
      row += t;
    }
    rows.push(row);
  }
  return rows;
}

const MAP = (() => {
  let cv, ctx, terrCv, T = 48, ox = 0, oy = 0, raf = 0, hover = null, threatOn = false, threatSet = null, t0 = 0;
  const floaters = [];
  let st = null; // map state
  let ui = { mode: 'idle', sel: null, range: null, atkRange: null, path: null, origin: null, weapon: null, target: null };
  let busy = false;

  // ---------- state ----------
  function create(ch) {
    const m = ch.map; const rows = m.rows || genMap(m.theme, m.w, m.h, m.seed);
    const s = { ch, w: m.w, h: m.h, rows: rows.map(r => r.split('')), units: [], turn: 1, phase: 'player', space: !!m.space, theme: m.theme, fired: {}, uid: 1, secrets: [], defeatedTurn: {}, credits: 0, kills: 0 };
    s.tile = (x, y) => (x < 0 || y < 0 || x >= s.w || y >= s.h) ? 'x' : s.rows[y][x];
    s.unitAt = (x, y) => s.units.find(u => u.hp > 0 && u.x === x && u.y === y);
    s.find = tag => s.units.find(u => u.hp > 0 && u.tag === tag);
    return s;
  }
  function heroMech() { const z = SAVE.flags.zero; return SAVE.hero.path === 'super' ? (z ? 'alteonz_s' : 'alteon_s') : (z ? 'alteonz' : 'alteon'); }
  function pilotMech(pid) { return pid === 'rei' ? heroMech() : PILOTS[pid].mech; }
  function makeUnit(o, team) {
    const mech = o.m || pilotMech(o.p);
    const u = { uid: st.uid++, team, mech, pilot: o.p || o.pilot || null, x: o.x, y: o.y, lvl: o.lvl || 1, tag: o.tag || o.p, boss: !!o.boss, hold: o.hold || 0, retreatAt: o.retreat || 0, usePlayerStats: !!o.usePlayerStats, hpMul: o.hpMul, lineSet: o.lineSet, protect: !!(o.protect || o.retreat), buf: {}, status: {}, ammo: {}, moved: false, acted: false, kills: 0, mode: 'robot' };
    if (team === 'player') { const sp = SAVE.pilots[o.p]; u.lvl = sp.lvl; u.tag = o.p; }
    if (!u.pilot || !PILOTS[u.pilot] || (team !== 'player' && !u.usePlayerStats && !['lucien', 'aurelion'].includes(u.pilot))) {
      // enemy line sets / portraits
      const fac = MECHS[mech].armor === 'BIO' ? 'beast' : MECHS[mech].armor === 'VOID' ? 'vael' : MECHS[mech].faction==='free_states'||['zephyr', 'tyrant'].includes(mech) ? 'grunt_f' : 'grunt_c';
      u.portrait = o.pilot && PORTRAITS[o.pilot] ? o.pilot : (OUROBOR_FACE[mech] || fac); u.lineSet = o.lineSet || (o.pilot && EPILOTS[o.pilot] ? o.pilot : fac);
      u.pname = o.pilot && NAMES[o.pilot] ? NAMES[o.pilot] : (fac === 'beast' ? 'Ourobor' : fac === 'vael' ? 'Vael Choir' : fac === 'grunt_f' ? 'Free States Pilot' : 'Concord Pilot');
      if (u.pilot && !PILOTS[u.pilot]) { u.pilot = null; }
    }
    if (o.name) u.nameOverride = o.name;
    if (team !== 'player' && o.p && PILOTS[o.p]) { u.pilot = o.p; u.usePlayerStats = true; u.lvl = o.lvl || Math.max(10, avgLevel()); }
    if (u.boss && team === 'enemy') u.eskills = ['prevail', 'nerves'];
    if(typeof ENEMIES!=='undefined')ENEMIES.init(u,o);
    const ms = CB.mstats(u); u.hp = ms.hp; u.en = ms.en;
    const sk = CB.skills(u); u.will = 100 + (sk.has('nerves') && team === 'player' ? 5 : 0) + (sk.has('overdrive') ? 10 : 0) + ((CB.partFx(u).will) || 0);
    u.sp = CB.pstats(u).SP;
    // keep units off walls
    if (st.tile(u.x, u.y) === 'x') st.rows[u.y][u.x] = st.space ? 's' : '.';
    return u;
  }
  function avgLevel() { const ls = SAVE.roster.map(p => SAVE.pilots[p].lvl); return Math.round(ls.reduce((a, b) => a + b, 0) / Math.max(1, ls.length)); }
  function placeSecrets() {
    const r = rng(st.ch.map.seed * 7 + 3); const kinds = ['cache', 'shard', 'repair', 'node', 'part'];
    const chIdx = Object.keys(CHAPTERS).indexOf(SAVE.chapter); if (chIdx >= 2) kinds.push('ambush');
    const n = 3 + Math.floor(r() * 2);
    for (let i = 0; i < n * 10 && st.secrets.length < n; i++) {
      const x = 5 + Math.floor(r() * (st.w - 9)), y = Math.floor(r() * st.h); const tl = st.tile(x, y);
      if (tl === 'x' || st.unitAt(x, y) || st.secrets.some(s => Math.abs(s.x - x) + Math.abs(s.y - y) < 3)) continue;
      const k = kinds[Math.floor(r() * kinds.length)]; if (k === 'part' && st.secrets.some(s => s.k === 'part')) continue; if (k === 'ambush' && st.secrets.some(s => s.k === 'ambush')) continue;
      st.secrets.push({ x, y, k, found: false });
    }
  }
  async function start(ch) {
    st = create(ch); G.map = st;
    for (const d of ch.deploy) if (SAVE.roster.includes(d.p)) st.units.push(makeUnit(d, 'player'));
    // Auxiliary pilots remain selectable throughout the authored campaign.
    const aux = (SAVE.auxiliary || EXPANSION.crew.filter(p => SAVE.roster.includes(p)).slice(0, 4)).filter(p => SAVE.roster.includes(p)).slice(0, 4);
    for (const [i, p] of aux.entries()) if (!st.units.some(u => u.pilot === p)) {
      const slot = freeNear(1, 9 - i * 2); st.units.push(makeUnit({p,...slot}, 'player'));
    }
    for (const e of ch.enemies) st.units.push(makeUnit(e, 'enemy'));
    const allies = typeof ch.allies === 'function' ? ch.allies(SAVE) : (ch.allies || []);
    for (const a of allies) st.units.push(makeUnit(a, 'ally'));
    placeSecrets();
    document.getElementById('mapScreen').hidden = false;
    initCanvas(); resize();
    if(typeof TOUCH!=='undefined')TOUCH.resetMap();
    UI.mapHUD(st);
    SFX.music(ch.mood || 'battle');
    loop();
    await UI.objectiveCard(ch);
    await phaseStart('player');
  }
  function stop() { cancelAnimationFrame(raf); document.getElementById('mapScreen').hidden = true; G.map = null; st = null; }

  // ---------- canvas ----------
  function initCanvas() {
    if (cv) return;
    cv = document.getElementById('mapCanvas'); ctx = cv.getContext('2d');
    if(typeof TOUCH!=='undefined')TOUCH.attachMap(cv,{state:()=>st,ui:()=>ui,geom:()=>({T,ox,oy}),toTile,click:onClick,preview:t=>{hover=t;if(t)onHover();else ui.path=null;},inspect:t=>{hover=t;onHover();}});
    window.addEventListener('resize', () => { if (st) { resize(); } });
    cv.addEventListener('pointermove', e => { const t = toTile(e); if (!hover || !t || hover.x !== t.x || hover.y !== t.y) { hover = t; onHover(); } });
    cv.addEventListener('pointerleave', () => { hover = null; });
    cv.addEventListener('click', e => { const t = toTile(e); if (t) onClick(t.x, t.y); });
    cv.addEventListener('contextmenu', e => { e.preventDefault(); cancel(); });
    window.addEventListener('keydown', e => { if (!st || document.getElementById('mapScreen').hidden) return; if (e.key === 'Escape') cancel(); if (e.key === 't' || e.key === 'T') toggleThreat(); });
  }
  function resize() {
    if(!st)return;
    const wrap = document.getElementById('mapWrap'); const W = wrap.clientWidth, H = wrap.clientHeight;
    const dpr = typeof QUALITY!=='undefined'?QUALITY.dpr:Math.min(2, window.devicePixelRatio || 1);
    T = Math.max(20, Math.floor(Math.min(W / st.w, H / st.h)));
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ox = Math.floor((W - T * st.w) / 2); oy = Math.floor((H - T * st.h) / 2);
    buildTerrain();
  }
  function toTile(e) { const r=cv.getBoundingClientRect(),p=typeof TOUCH!=='undefined'?TOUCH.localPoint(e,cv):{x:e.clientX-r.left,y:e.clientY-r.top};const x=Math.floor((p.x-ox)/T),y=Math.floor((p.y-oy)/T);return st&&(x>=0&&y>=0&&x<st.w&&y<st.h)?{x,y}:null; }
  function terrColor(tl) {
    const th = st.theme;
    if (tl === '.') return th === 'ice' ? '#b9c7d6' : th === 'hive' ? '#3a2630' : th === 'lab' ? '#3e3a26' : '#33452d';
    return TERRAIN[tl].col;
  }
  function buildTerrain() {
    const dpr = typeof QUALITY!=='undefined'?QUALITY.dpr:Math.min(2, window.devicePixelRatio || 1);
    terrCv = document.createElement('canvas'); terrCv.width = T * st.w * dpr; terrCv.height = T * st.h * dpr;
    const c = terrCv.getContext('2d'); c.scale(dpr, dpr);
    const r = rng(st.ch.map.seed + 99);
    const tiled = !!ASSETS.tileFor(st.theme, st.tile(0, 0), 0, 0);
    let baked = null; if (!tiled && R3D.ok && !(typeof QUALITY!=='undefined'&&QUALITY.low)) { try { baked = R3D.bakeTerrain(st, T, dpr, terrColor); } catch (e) { console.warn('3D terrain failed', e); } }
    if (tiled) { for (let y = 0; y < st.h; y++) for (let x = 0; x < st.w; x++) { const im = ASSETS.tileFor(st.theme, st.tile(x, y), x, y); if (im) c.drawImage(im, x * T, y * T, T, T); } }
    else if (baked) c.drawImage(baked, 0, 0, T * st.w, T * st.h);
    else for (let y = 0; y < st.h; y++) for (let x = 0; x < st.w; x++) {
      const tl = st.tile(x, y), px = x * T, py = y * T, base = terrColor(tl);
      const g = c.createLinearGradient(px, py, px + T, py + T); g.addColorStop(0, ART.shade(base, 0.08 + r() * 0.05)); g.addColorStop(1, ART.shade(base, -0.15)); c.fillStyle = g; c.fillRect(px, py, T, T);
      // noise specks
      for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(255,255,255,${r() * 0.04})`; c.fillRect(px + r() * T, py + r() * T, 2, 2); }
      switch (tl) {
        case 'f': for (let i = 0; i < 4; i++) { const cx = px + T * (0.25 + (i % 2) * 0.5) + (r() - 0.5) * 6, cy = py + T * (0.3 + Math.floor(i / 2) * 0.42); c.fillStyle = '#16301a'; c.beginPath(); c.arc(cx, cy + 2, T * 0.2, 0, 7); c.fill(); c.fillStyle = st.theme === 'ice' ? '#2f5a46' : '#2c6a35'; c.beginPath(); c.arc(cx, cy, T * 0.18, 0, 7); c.fill(); c.fillStyle = 'rgba(180,255,160,0.18)'; c.beginPath(); c.arc(cx - 3, cy - 3, T * 0.07, 0, 7); c.fill(); } break;
        case 'm': c.fillStyle = '#5a5248'; c.beginPath(); c.moveTo(px + T * 0.08, py + T * 0.9); c.lineTo(px + T * 0.42, py + T * 0.15); c.lineTo(px + T * 0.76, py + T * 0.9); c.fill(); c.fillStyle = '#6e665a'; c.beginPath(); c.moveTo(px + T * 0.4, py + T * 0.9); c.lineTo(px + T * 0.68, py + T * 0.35); c.lineTo(px + T * 0.95, py + T * 0.9); c.fill(); c.fillStyle = '#e8eef4'; c.beginPath(); c.moveTo(px + T * 0.33, py + T * 0.3); c.lineTo(px + T * 0.42, py + T * 0.15); c.lineTo(px + T * 0.51, py + T * 0.3); c.fill(); break;
        case 'c': for (let i = 0; i < 3; i++) { const bw = T * 0.24, bh = T * (0.3 + r() * 0.45), bx = px + T * 0.08 + i * T * 0.3; c.fillStyle = '#1b2030'; c.fillRect(bx, py + T * 0.92 - bh, bw, bh); c.fillStyle = '#3a4560'; c.fillRect(bx, py + T * 0.92 - bh, bw, 2); for (let k = 0; k < 4; k++) if (r() > 0.4) { c.fillStyle = 'rgba(255,214,120,0.75)'; c.fillRect(bx + 2 + (k % 2) * bw * 0.5, py + T * 0.92 - bh + 5 + Math.floor(k / 2) * 6, 2, 2); } } break;
        case 'r': for (let i = 0; i < 5; i++) { c.fillStyle = r() > 0.5 ? '#4a423c' : '#5a5048'; c.save(); c.translate(px + r() * T, py + r() * T); c.rotate(r() * 3); c.fillRect(-T * 0.1, -T * 0.05, T * 0.2, T * 0.1); c.restore(); } break;
        case 'w': c.strokeStyle = 'rgba(140,200,255,0.25)'; c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(px + 4, py + T * (0.25 + i * 0.25)); c.quadraticCurveTo(px + T / 2, py + T * (0.18 + i * 0.25), px + T - 4, py + T * (0.25 + i * 0.25)); c.stroke(); } break;
        case 'b': c.strokeStyle = 'rgba(98,243,255,0.45)'; c.lineWidth = 1.5; c.beginPath(); for (let s = 0; s < 6; s++) { const a = s * Math.PI / 3 + 0.5; c.lineTo(px + T / 2 + Math.cos(a) * T * 0.38, py + T / 2 + Math.sin(a) * T * 0.38); } c.closePath(); c.stroke(); c.fillStyle = 'rgba(255,200,80,0.8)'; c.fillRect(px + 3, py + 3, 3, 3); c.fillRect(px + T - 6, py + T - 6, 3, 3); break;
        case 's': for (let i = 0; i < 3; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`; c.fillRect(px + r() * T, py + r() * T, 1.2, 1.2); } break;
        case 'a': for (let i = 0; i < 3; i++) { c.fillStyle = r() > 0.5 ? '#3a3f4c' : '#2a2e38'; c.beginPath(); const cx = px + r() * T, cy = py + r() * T, rr = T * (0.08 + r() * 0.12); for (let k = 0; k < 6; k++) { const a = k / 6 * 7; c.lineTo(cx + Math.cos(a) * rr * (0.7 + r() * 0.5), cy + Math.sin(a) * rr * (0.7 + r() * 0.5)); } c.fill(); } break;
        case 'h': c.strokeStyle = 'rgba(200,60,110,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(px, py + r() * T); c.bezierCurveTo(px + T * 0.3, py + r() * T, px + T * 0.7, py + r() * T, px + T, py + r() * T); c.stroke(); c.fillStyle = 'rgba(198,255,74,0.35)'; c.beginPath(); c.arc(px + r() * T, py + r() * T, 2.5, 0, 7); c.fill(); break;
        case 'x': c.fillStyle = '#100a0e'; c.fillRect(px, py, T, T); c.strokeStyle = 'rgba(140,40,80,0.4)'; c.strokeRect(px + 2, py + 2, T - 4, T - 4); break;
        case 'v': c.strokeStyle = 'rgba(212,139,255,0.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(px, py + T / 2); c.lineTo(px + T / 2, py); c.lineTo(px + T, py + T / 2); c.lineTo(px + T / 2, py + T); c.closePath(); c.stroke(); break;
      }
    }
    // grid
    c.strokeStyle = 'rgba(140,200,255,0.08)'; c.lineWidth = 1;
    for (let x = 0; x <= st.w; x++) { c.beginPath(); c.moveTo(x * T + 0.5, 0); c.lineTo(x * T + 0.5, st.h * T); c.stroke(); }
    for (let y = 0; y <= st.h; y++) { c.beginPath(); c.moveTo(0, y * T + 0.5); c.lineTo(st.w * T, y * T + 0.5); c.stroke(); }
  }

  // ---------- pathfinding ----------
  function moveCost(u, x, y) {
    const tl = st.tile(x, y); if (tl === 'x') return 99;
    if (CB.mstats(u).fly) return 1;
    if (tl === 'w' && MECHS[u.mech].amphibious) return 1;
    return typeof ENEMIES!=='undefined'?ENEMIES.moveCost(u,tl,TERRAIN[tl].cost):TERRAIN[tl].cost;
  }
  function foeOf(a, b) { return (a.team === 'enemy') !== (b.team === 'enemy'); }
  function reach(u, mv) {
    mv = mv != null ? mv : CB.mstats(u).move + (u.buf.accel ? 3 : 0);
    const dist = { [u.x + ',' + u.y]: 0 }, prev = {}; const q = [[u.x, u.y, 0]];
    while (q.length) {
      q.sort((a, b) => a[2] - b[2]); const [x, y, d] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= st.w || ny >= st.h) continue;
        const o = st.unitAt(nx, ny); if (o && foeOf(o, u)) continue;
        const nd = d + moveCost(u, nx, ny); if (nd > mv) continue;
        const k = nx + ',' + ny; if (dist[k] == null || nd < dist[k]) { dist[k] = nd; prev[k] = x + ',' + y; q.push([nx, ny, nd]); }
      }
    }
    const tiles = Object.keys(dist).filter(k => { const [x, y] = k.split(',').map(Number); const o = st.unitAt(x, y); return !o || o === u; });
    return { tiles: new Set(tiles), prev, dist };
  }
  function pathTo(r, u, x, y) { const out = []; let k = x + ',' + y; while (k && k !== u.x + ',' + u.y) { out.unshift(k.split(',').map(Number)); k = r.prev[k]; } return out; }
  function rangeTiles(cx, cy, rmin, rmax) { const s = new Set(); for (let y = 0; y < st.h; y++) for (let x = 0; x < st.w; x++) { const d = Math.abs(x - cx) + Math.abs(y - cy); if (d >= rmin && d <= rmax) s.add(x + ',' + y); } return s; }
  function maxRange(u, moved) { let r = 0; for (const w of CB.weapons(u)) { if (moved && !w.post) continue; if (CB.usable(u, w, null, moved) && CB.usable(u, w, null, moved) !== 'range') continue; r = Math.max(r, w.rmax); } return r; }
  function computeThreat() {
    const s = new Set();
    for (const e of st.units) { if (e.hp <= 0 || e.team !== 'enemy') continue; const rr = (e.hold && st.turn <= e.hold) ? { tiles: new Set([e.x + ',' + e.y]) } : reach(e); const mr = Math.max(...CB.weapons(e).map(w => w.rmax)); rr.tiles.forEach(k => { const [x, y] = k.split(',').map(Number); rangeTiles(x, y, 1, mr).forEach(t => s.add(t)); }); }
    return s;
  }
  function toggleThreat() { threatOn = !threatOn; threatSet = threatOn ? computeThreat() : null; UI.setThreatBtn(threatOn); SFX.play('select'); }

  // ---------- render ----------
  let lastMapFrame=0;
  function loop() {
    const stamp=performance.now();if(lastMapFrame&&stamp-lastMapFrame<200&&typeof QUALITY!=='undefined')QUALITY.observe(stamp-lastMapFrame,'map');lastMapFrame=stamp;
    raf = requestAnimationFrame(loop);
    const t = performance.now() / 1000; draw(t);
  }
  function draw(t) {
    const W = cv.clientWidth, H = cv.clientHeight;
    ctx.fillStyle = '#05080f'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(ox, oy);
    ctx.drawImage(terrCv, 0, 0, T * st.w, T * st.h);
    // water shimmer
    ctx.fillStyle = 'rgba(120,190,255,0.06)'; for (let y = 0; y < st.h; y++) for (let x = 0; x < st.w; x++) if (st.tile(x, y) === 'w' && (Math.sin(t * 2 + x + y) > 0.6)) ctx.fillRect(x * T, y * T, T, T);
    // overlays
    if (threatOn && threatSet) { ctx.fillStyle = 'rgba(255,60,80,0.16)'; threatSet.forEach(k => { const [x, y] = k.split(',').map(Number); ctx.fillRect(x * T, y * T, T, T); }); }
    const pulse = 0.5 + Math.sin(t * 4) * 0.15;
    if (ui.range) { ui.range.tiles.forEach(k => { const [x, y] = k.split(',').map(Number); ctx.fillStyle = `rgba(60,170,255,${0.25 * pulse + 0.1})`; ctx.fillRect(x * T + 1, y * T + 1, T - 2, T - 2); ctx.strokeStyle = 'rgba(120,210,255,0.5)'; ctx.strokeRect(x * T + 1.5, y * T + 1.5, T - 3, T - 3); }); }
    if (ui.atkRange) { ui.atkRange.forEach(k => { const [x, y] = k.split(',').map(Number); ctx.fillStyle = `rgba(255,70,90,${0.22 * pulse + 0.08})`; ctx.fillRect(x * T + 1, y * T + 1, T - 2, T - 2); }); }
    if (ui.path && ui.path.length) { ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ui.sel.x * T + T / 2, ui.sel.y * T + T / 2); ui.path.forEach(([x, y]) => ctx.lineTo(x * T + T / 2, y * T + T / 2)); ctx.stroke(); }
    // secrets (sensor sweep shimmer)
    for (const s of st.secrets) {
      if (s.found) continue;
      const near = st.units.some(u => u.hp > 0 && u.team === 'player' && Math.abs(u.x - s.x) + Math.abs(u.y - s.y) <= 2);
      if (!near) continue;
      const a = 0.35 + Math.sin(t * 3 + s.x) * 0.25;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ART.glowDot(ctx, s.x * T + T / 2, s.y * T + T / 2, T * 0.5, '#ffd166', a); ctx.restore();
      ctx.fillStyle = `rgba(255,230,160,${a + 0.3})`; ctx.font = `700 ${Math.floor(T * 0.4)}px "Chakra Petch", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', s.x * T + T / 2, s.y * T + T / 2);
    }
    // units
    const sorted = st.units.filter(u => u.hp > 0).sort((a, b) => a.y - b.y);
    for (const u of sorted) drawUnit(u, t);
    // cursor
    if (hover) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; const s = T * 0.18, x = hover.x * T, y = hover.y * T; ctx.beginPath(); [[x, y, 1, 1], [x + T, y, -1, 1], [x, y + T, 1, -1], [x + T, y + T, -1, -1]].forEach(([cx, cy, sx, sy]) => { ctx.moveTo(cx, cy + sy * s); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx * s, cy); }); ctx.stroke(); }
    if (ui.target) { const x = ui.target.x * T, y = ui.target.y * T; ctx.strokeStyle = `rgba(255,80,100,${0.6 + Math.sin(t * 8) * 0.4})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x + T / 2, y + T / 2, T * 0.48, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + T / 2, y - 4); ctx.lineTo(x + T / 2, y + 8); ctx.moveTo(x + T / 2, y + T + 4); ctx.lineTo(x + T / 2, y + T - 8); ctx.moveTo(x - 4, y + T / 2); ctx.lineTo(x + 8, y + T / 2); ctx.moveTo(x + T + 4, y + T / 2); ctx.lineTo(x + T - 8, y + T / 2); ctx.stroke(); }
    // floaters
    for (let i = floaters.length - 1; i >= 0; i--) { const f = floaters[i]; const k = (performance.now() - f.t) / f.life; if (k >= 1) { floaters.splice(i, 1); continue; } ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; ctx.font = `800 ${f.size}px "Chakra Petch", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; const yy = f.y * T - k * 20; ctx.strokeText(f.s, f.x * T + T / 2, yy); ctx.fillStyle = f.c; ctx.fillText(f.s, f.x * T + T / 2, yy); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  function drawUnit(u, t) {
    let x = u.x, y = u.y;
    if (u.anim) { const k = Math.min(u.anim.path.length - 1e-6, (performance.now() - u.anim.t0) / 110); const i = Math.floor(k), f = k - i; const a = u.anim.path[i], b = u.anim.path[Math.min(i + 1, u.anim.path.length - 1)]; x = a[0] + (b[0] - a[0]) * f; y = a[1] + (b[1] - a[1]) * f; }
    const px = x * T, py = y * T; const done = u.team === 'player' && u.acted;
    if(typeof ENEMIES!=='undefined')ENEMIES.badge(ctx,u,px+T/2,py+T*.6,T);
    const col = u.team === 'player' ? '#3fd6ff' : u.team === 'ally' ? '#7dffb0' : '#ff4d6d';
    // base ring
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = ART.rgba(col, done ? 0.25 : 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px + T / 2, py + T * 0.82, T * 0.38, T * 0.14, 0, 0, 7); ctx.stroke(); ctx.restore();
    if (u.boss) { ctx.fillStyle = '#ffd166'; ctx.font = `${Math.floor(T * 0.28)}px sans-serif`; ctx.textAlign = 'left'; ctx.fillText('♛', px + 1, py + T * 0.28); }
    const spr = ASSETS.mapIcon(u.mech, Math.round(T), u.team === 'enemy', Math.floor(t * 2.5 + u.uid * 0.37) % 2) || (R3D.ok ? R3D.mapSprite : ART.mapSprite)(u.mech, Math.round(T), u.team === 'enemy');
    const bob = Math.sin(t * 2.4 + u.uid) * (CB.mstats(u).fly ? 2.5 : 0.8);
    ctx.globalAlpha = done ? 0.5 : 1;
    if (u.flash && performance.now() - u.flash < 200) ctx.filter = 'brightness(3)';
    ctx.drawImage(spr, px + T / 2 - T, py + T - T * 1.55 + bob, T * 2, T * 2);
    ctx.filter = 'none'; ctx.globalAlpha = 1;
    // hp bar
    const ms = CB.mstats(u), f = Math.max(0, u.hp / ms.hp);
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(px + T * 0.12, py + T - 6, T * 0.76, 4);
    ctx.fillStyle = f < 0.3 ? '#ff4d6d' : f < 0.6 ? '#ffc04d' : col; ctx.fillRect(px + T * 0.12, py + T - 6, T * 0.76 * f, 4);
    // status pips
    const ss = Object.keys(u.status); ss.forEach((k, i) => { ctx.fillStyle = STATUS[k].color; ctx.beginPath(); ctx.arc(px + T * 0.88 - i * 7, py + 6, 3, 0, 7); ctx.fill(); });
    if (Object.keys(u.buf).some(k => u.buf[k])) { ctx.fillStyle = '#7dffb0'; ctx.beginPath(); ctx.arc(px + 6, py + T - 12, 3, 0, 7); ctx.fill(); }
  }
  function floater(x, y, s, c = '#fff', size = 16, life = 1200) { floaters.push({ x, y, s, c, size, life, t: performance.now() }); }
  function animateMove(u, path) {
    if (!path.length) return Promise.resolve();
    u.moveDistance=(u.moveDistance||0)+path.length;
    return new Promise(res => { u.anim = { path: [[u.x, u.y], ...path], t0: performance.now() }; SFX.play('step'); setTimeout(() => { const [lx, ly] = path[path.length - 1]; u.x = lx; u.y = ly; u.anim = null; res(); }, path.length * 110 + 20); });
  }

  // ---------- player input ----------
  function onHover() {
    if (!hover) return;
    const u = st.unitAt(hover.x, hover.y);
    UI.showTileInfo(hover.x, hover.y, st.tile(hover.x, hover.y), u);
    if (ui.mode === 'moving' && ui.range && ui.range.tiles.has(hover.x + ',' + hover.y)) ui.path = pathTo(ui.range, ui.sel, hover.x, hover.y);
    if (ui.mode === 'target' && !ui.target && ui.weapon && u && foeOf(u, ui.sel) && ui.atkRange.has(u.x + ',' + u.y) && !CB.usable(ui.sel, ui.weapon, CB.dist(ui.sel,u), ui.sel.moved, false, u)) UI.forecast(ui.sel, u, ui.weapon);
  }
  async function onClick(x, y) {
    if (busy || st.phase !== 'player') return;
    const u = st.unitAt(x, y);
    switch (ui.mode) {
      case 'idle':
        if (u && u.team === 'player' && !u.acted) { selectUnit(u); }
        else if (u) { showEnemyRange(u); }
        else { clearSel(); UI.mapMenu(); }
        break;
      case 'moving':
        if (u === ui.sel) { ui.range = null; ui.path = null; ui.mode = 'menu'; UI.actionMenu(ui.sel, false); return; }
        if (ui.range.tiles.has(x + ',' + y) && !u) {
          busy = true; const path = pathTo(ui.range, ui.sel, x, y); ui.origin = { x: ui.sel.x, y: ui.sel.y }; ui.range = null; ui.path = null;
          await animateMove(ui.sel, path); ui.sel.moved = true; busy = false;
          await checkSecret(ui.sel);
          if (!st) return;
          ui.mode = 'menu'; UI.actionMenu(ui.sel, true);
        } else if (u && u.team === 'player' && !u.acted && u !== ui.sel) { selectUnit(u); }
        break;
      case 'target':
        if (u && foeOf(u, ui.sel) && ui.atkRange.has(x + ',' + y) && CB.usable(ui.sel,ui.weapon,CB.dist(ui.sel,u),ui.sel.moved,false,u)===null) {
          if (ui.target === u) { await confirmAttack(); } else { ui.target = u; UI.forecast(ui.sel, u, ui.weapon, true); }
        }
        break;
      case 'enemyview': clearSel(); break;
    }
  }
  function selectUnit(u) { SFX.play('select'); ui = { mode: 'moving', sel: u, range: u.moved ? null : reach(u), atkRange: null, path: null, origin: null, weapon: null, target: null }; if (u.moved) { ui.mode = 'menu'; UI.actionMenu(u, true); } UI.showUnit(u); }
  function showEnemyRange(u) { const rr = (u.hold && st.turn <= u.hold && u.team === 'enemy') ? { tiles: new Set([u.x + ',' + u.y]) } : reach(u); const mr = Math.max(...CB.weapons(u).map(w => w.rmax)); const s = new Set(); rr.tiles.forEach(k => { const [x, y] = k.split(',').map(Number); rangeTiles(x, y, 1, mr).forEach(t => s.add(t)); }); ui = { mode: 'enemyview', sel: u, range: rr, atkRange: s }; UI.showUnit(u); SFX.play('select'); }
  function clearSel() { if(typeof TOUCH!=='undefined')TOUCH.cancelMove(); ui = { mode: 'idle', sel: null, range: null, atkRange: null, path: null }; UI.hideMenus(); }
  function cancel() {
    if(typeof TOUCH!=='undefined')TOUCH.cancelMove();
    if (busy) return; SFX.play('cancel');
    if (ui.mode === 'target') { ui.mode = 'menu'; ui.atkRange = null; ui.target = null; ui.weapon = null; UI.hideForecast(); UI.actionMenu(ui.sel, ui.sel.moved); return; }
    if (ui.mode === 'menu' && ui.origin && ui.sel.moved && !ui.sel.acted) { ui.sel.x = ui.origin.x; ui.sel.y = ui.origin.y; ui.sel.moved = false; const u = ui.sel; UI.hideMenus(); selectUnit(u); return; }
    clearSel();
  }
  // called by UI action menu
  function beginAttack(u, w) {
    ui.mode = 'target'; ui.weapon = w; ui.atkRange = rangeTiles(u.x, u.y, w.rmin, w.rmax); ui.target = null;
    const foes = st.units.filter(o => o.hp > 0 && foeOf(o, u) && ui.atkRange.has(o.x + ',' + o.y) && CB.usable(u,w,CB.dist(u,o),u.moved,false,o)===null);
    if (foes.length === 1) { ui.target = foes[0]; UI.forecast(u, foes[0], w, true); }
    else UI.toast('Select a target in red range. Click it twice (or confirm) to attack.');
  }
  function targetsFor(u, moved) {
    const res = [];
    for (const w of CB.weapons(u)) { if (CB.usable(u, w, null, moved) && CB.usable(u, w, null, moved) !== 'range') continue; const ok = st.units.some(o => o.hp > 0 && foeOf(o, u) && CB.usable(u, w, CB.dist(u, o), moved,false,o) === null); res.push({ w, ok }); }
    return res;
  }
  async function confirmAttack() {
    const a = ui.sel, d = ui.target, w = ui.weapon; if (!a || !d || !w || CB.usable(a,w,CB.dist(a,d),a.moved,false,d)) return;
    UI.hideMenus(); UI.hideForecast(); ui.atkRange = null; ui.target = null; busy = true;
    await battle(a, d, w);
    if (!st) return;
    busy = false; await finishUnit(a);
  }
  async function finishUnit(u) {
    if (!st) return;
    if (u.buf.zeal && u.hp > 0) { u.buf.zeal = false; u.moved = false; u.acted = false; floater(u.x, u.y, 'ZEAL!', '#7dffb0'); clearSel(); return; }
    u.acted = true; u.moved = true; clearSel();
    if (threatOn) threatSet = computeThreat();
    await runEvents();
    if (!st) return;
    if (await checkEnd()) return;
    if (st.units.filter(x => x.team === 'player' && x.hp > 0 && !x.acted).length === 0 && SAVE.settings.autoEnd) endPlayerPhase();
  }
  function waitUnit(u) { finishUnit(u); }
  async function useSpirit(u, sid, target) {
    const sp = SPIRITS[sid]; if (u.sp < sp.cost) return;
    u.sp -= sp.cost; SFX.play('spirit');
    const tg = target || u;
    switch (sid) {
      case 'guts': tg.hp = Math.min(CB.mstats(tg).hp, tg.hp + Math.round(CB.mstats(tg).hp * 0.5)); break;
      case 'mend': tg.hp = Math.min(CB.mstats(tg).hp, tg.hp + 3500); break;
      case 'ardor': CB.addWill(tg, 10); break;
      case 'rally': st.units.forEach(o => { if (o.team === u.team && o.hp > 0) CB.addWill(o, 5); }); break;
      case 'resolve': Object.assign(u.buf, { focus: true, strike: true, valor: true, accel: true }); break;
      case 'cleanse': u.status = {}; break;
      default: u.buf[sid] = true;
    }
    floater(tg.x, tg.y, sp.name.toUpperCase(), '#7dffb0', 15);
    if (sid === 'accel' && !u.moved) { ui.range = reach(u); ui.mode = 'moving'; UI.hideMenus(); }
    UI.showUnit(u);
  }
  function transform(u) { u.mode = u.mode === 'fighter' ? 'robot' : 'fighter'; u.transformed = true; SFX.play('confirm'); floater(u.x, u.y, u.mode === 'fighter' ? 'FIGHTER MODE' : 'ROBOT MODE', '#62f3ff', 14); if (!u.moved) { ui.range = reach(u); ui.mode = 'moving'; UI.hideMenus(); } UI.showUnit(u); }

  // ---------- secrets ----------
  async function checkSecret(u) {
    if (u.team !== 'player') return;
    const s = st.secrets.find(s => !s.found && s.x === u.x && s.y === u.y); if (!s) return;
    s.found = true; const def = SECRETS[s.k]; SFX.play('levelup');
    let msg = def.desc;
    switch (s.k) {
      case 'cache': { const c = 2000 + Math.floor(Math.random() * 6) * 500; st.credits += c; msg = `${c} credits recovered.`; break; }
      case 'part': { const keys = Object.keys(PARTS).filter(k => k !== 'apsaras'); const p = keys[Math.floor(Math.random() * keys.length)]; SAVE.inventory[p] = (SAVE.inventory[p] || 0) + 1; msg = `Found: ${PARTS[p].name}.`; break; }
      case 'shard': SAVE.pilots[u.pilot].pp += 2; msg = `${NAMES[u.pilot]} gains +2 skill points.`; break;
      case 'repair': { const ms = CB.mstats(u); u.hp = ms.hp; u.en = ms.en; break; }
      case 'node': CB.addWill(u, 10); u.sp = Math.min(CB.pstats(u).SP, u.sp + 20); break;
      case 'ambush': {
        const pool = st.units.filter(x => x.team === 'enemy' && !x.boss).map(x => x.mech); const mech = pool[0] || 'lancer';
        const lvl = Math.max(1, avgLevel());
        for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) { const nx = u.x + dx, ny = u.y + dy; if (st.tile(nx, ny) !== 'x' && !st.unitAt(nx, ny) && nx >= 0 && ny >= 0 && nx < st.w && ny < st.h) { st.units.push(makeUnit({ m: mech, x: nx, y: ny, lvl }, 'enemy')); if (st.units.filter(x => x.team === 'enemy').length > 40) break; } }
        msg = 'Hostiles were hiding here!'; break;
      }
    }
    floater(u.x, u.y, def.name.toUpperCase(), s.k === 'ambush' ? '#ff4d6d' : '#ffd166', 16, 1800);
    await UI.notice(def.name, msg, s.k === 'ambush' ? 'warn' : 'good', 'sec_' + s.k);
  }

  // ---------- battle ----------
  function aiDefMode(d, a) { // enemy/ally choose response
    const wds = CB.bestWeapon(d, a, false, true);
    if (wds) return 'counter';
    return d.hp < CB.mstats(d).hp * 0.4 ? 'defend' : 'evade';
  }
  async function battle(a, d, w) {
    let mode;
    if (d.team === 'player') mode = SAVE.settings.defAuto ? (CB.bestWeapon(d, a, false, true) ? 'counter' : 'defend') : await UI.defensePrompt(a, d, w);
    else mode = aiDefMode(d, a);
    let intercept=null;
    if(typeof mode==='string'&&mode.startsWith('guard:')){const guard=COMBOS.guards(d).find(u=>u.uid===Number(mode.split(':')[1]));if(guard){intercept={target:d,guard};d=guard;d.supportDefended=true;}mode='defend';}
    const comboPartner=w.combo?COMBOS.partner(a,w):null;
    const counterW = mode === 'counter' ? (d.team === 'player' && d._counterW ? d._counterW : CB.bestWeapon(d, a, false, true)) : null; d._counterW = null;
    const hp0 = { a: a.hp, d: d.hp };
    const events = [];
    const pm = CB.posMods(a, d);
    // attack
    CB.spend(a, w); const r1 = CB.roll(a, d, w, mode); CB.applyResult(a, d, r1); events.push({ by: 'A', w, res: r1, mode, hpAfter: d.hp, comboPartner });
    // support attack
    if (d.hp > 0 && !w.combo) {
      const sup = st.units.find(o => o !== a && o.hp > 0 && o.team === a.team && CB.dist(o, a) === 1 && CB.skills(o).has('support') && CB.bestWeapon(o, d, true, true));
      if (sup) { const sw = Object.assign({}, CB.bestWeapon(sup, d, true, true), { support: true }); CB.spend(sup, sw); const rs = CB.roll(sup, d, sw, mode); CB.applyResult(sup, d, rs); events.push({ by: 'A', w: sw, res: rs, mode, hpAfter: d.hp, support: sup }); }
    }
    // counter
    if (d.hp > 0 && counterW && CB.usable(d, counterW, CB.dist(a, d), false, true) === null) {
      CB.spend(d, counterW); const r2 = CB.roll(d, a, counterW, 'none'); CB.applyResult(d, a, r2); events.push({ by: 'D', w: counterW, res: r2, mode: 'none', hpAfter: a.hp });
    }
    // play animation
    const playerLeft = false;
    const leftU = a.team === 'enemy' ? a : d, rightU = leftU === a ? d : a;
    if (SAVE.settings.anim !== 'off') {
      const sideA = a === leftU ? 'L' : 'R', sideD = sideA === 'L' ? 'R' : 'L';
      leftU.hpStart = leftU === a ? hp0.a : hp0.d; rightU.hpStart = rightU === a ? hp0.a : hp0.d;
      document.getElementById('mapScreen').classList.add('dim');
      await SCENE.play({ left: leftU, right: rightU, bg: st.ch.bg, intercept:intercept?{side:sideD,target:intercept.target,guard:intercept.guard}:null, events: events.map(e => ({ by: e.by === 'A' ? sideA : sideD, w: e.w, res: e.res, mode: e.mode, hpAfter: e.hpAfter, support: e.support, comboPartner:e.comboPartner })) });
      document.getElementById('mapScreen').classList.remove('dim');
    } else {
      for (const e of events) { const tgt = e.by === 'A' ? d : a; floater(tgt.x, tgt.y, e.res.hit ? String(e.res.dmg) : 'MISS', e.res.hit ? (e.res.crit ? '#ffd166' : '#fff') : '#9fd8ff', 18); await sleep(350); }
    }
    if (pm.flank.pincer) floater(d.x, d.y - 0.5, 'PINCER!', '#ffb347', 14); else if (pm.flank.n) floater(d.x, d.y - 0.5, 'FLANK', '#ffb347', 13);
    // knockback
    const pull=r1.hit&&typeof ENEMIES!=='undefined'?ENEMIES.pullTile(st,a,d,w):null;
    if(pull){await animateMove(d,[[pull.x,pull.y]]);floater(d.x,d.y,'PULLED','#ffb347',14);}else if (r1.hit && d.hp > 0 && CB.pushes(w) && !['XL'].includes(MECHS[d.mech].size) && !MECHS[d.mech].ship) await knockback(a, d);
    // rewards & deaths
    for (const [att, def] of [[a, d], [d, a]]) if (att.team === 'player' || att.team === 'ally') rewards(att, def, def.hp <= 0, events);
    for (const u of [a, d]) if (u.hp <= 0) await unitDown(u);
    // support unit kill credit
    events.filter(e => e.support).forEach(e => { if (e.support.team === 'player') gainExp(e.support, 6); });
    UI.refreshHUD(st);
  }
  async function knockback(a, d) {
    let dx = Math.sign(d.x - a.x), dy = Math.sign(d.y - a.y); if (Math.abs(d.x - a.x) >= Math.abs(d.y - a.y)) dy = 0; else dx = 0;
    const nx = d.x + dx, ny = d.y + dy; const blocker = st.unitAt(nx, ny); const tl = st.tile(nx, ny);
    if (!blocker && tl !== 'x' && moveCost(d, nx, ny) < 99) { await animateMove(d, [[nx, ny]]); floater(d.x, d.y, 'KNOCKBACK', '#ffb347', 13); await checkSecretEnemy(d); }
    else {
      const bump = 600; d.hp = Math.max(1, d.hp - bump); d.flash = performance.now(); floater(d.x, d.y, 'COLLISION -' + bump, '#ff7a2e', 14); SFX.play('hit');
      if (blocker) { blocker.hp = Math.max(1, blocker.hp - 400); blocker.flash = performance.now(); floater(blocker.x, blocker.y, '-400', '#ff7a2e', 14); }
      await sleep(500);
    }
  }
  async function checkSecretEnemy() { }
  function rewards(att, def, killed, events) {
    if (att.team !== 'player') return;
    const base = 10 * Math.max(0.3, (def.lvl + 5) / (att.lvl + 5));
    let exp = Math.round(base * (killed ? 3 : 1) * (def.boss ? 2 : 1)*(typeof ENEMIES!=='undefined'?ENEMIES.reward(def):1)); if (att.buf.insight) { exp *= 2; att.buf.insight = false; }
    gainExp(att, exp);
    if (killed) {
      let c = Math.round(Math.round(MECHS[def.mech].hp / 3 / 10) * 10 * (def.boss ? 2 : 1)*(typeof ENEMIES!=='undefined'?ENEMIES.reward(def):1)); if (att.buf.fortune) { c *= 2; att.buf.fortune = false; }
      st.credits += c; st.kills++; SAVE.pilots[att.pilot].kills++; SAVE.pilots[att.pilot].pp += 1;
      floater(att.x, att.y, '+' + c + ' CR', '#ffd166', 13);
    }
  }
  function gainExp(u, n) {
    const p = SAVE.pilots[u.pilot]; if (!p) return;
    p.exp += n; let up = 0;
    while (p.exp >= 100) { p.exp -= 100; p.lvl++; p.pp += 3; up++; }
    if (up) { u.lvl = p.lvl; floater(u.x, u.y - 0.6, 'LEVEL UP!', '#7dffb0', 16, 1600); SFX.play('levelup'); }
  }
  async function unitDown(u) {
    SFX.play('boom'); floater(u.x, u.y, 'DESTROYED', '#ff4d6d', 15);
    if (u.tag) { SAVE.flags['defeated_' + u.tag + '_turn'] = st.turn; st.defeatedTurn[u.tag] = st.turn; }
    if (u.team === 'player') {
      if ((st.ch.vital || []).includes(u.pilot)) { await sleep(400); await lose(`${NAMES[u.pilot]} has been shot down.`); return; }
      UI.toast(`${NAMES[u.pilot]} was shot down and retreats for repairs.`);
    }
  }

  // ---------- phases ----------
  async function phaseStart(phase) {
    if (!st) return;
    st.phase = phase;
    if(typeof SFX.phase==='function')SFX.phase(phase,st.ch);
    if(phase==='enemy')st.units.forEach(u=>u.supportDefended=false);
    await UI.phaseBanner(phase, st.turn);
    for (const u of st.units) {
      if (u.hp <= 0) continue;
      const mine = (phase === 'player' && u.team === 'player') || (phase === 'enemy' && u.team === 'enemy') || (phase === 'ally' && u.team === 'ally');
      if (!mine) continue;
      // buffs that last "until your next phase" expire
      u.buf.focus = false; u.buf.ironwall = false; u.buf.accel = false;
      u.moved = false; u.acted = false; u.transformed = false;
      const ms = CB.mstats(u);
      // status ticks
      if (u.status.BURN) { const dmg = Math.round(ms.hp * 0.08); u.hp = Math.max(1, u.hp - dmg); floater(u.x, u.y, 'BURN -' + dmg, '#ff7a2e', 13); }
      if (u.status.SHOCK) { u.en = Math.max(0, u.en - 25); floater(u.x, u.y, 'SHOCK', '#ffe066', 13); }
      for (const k in u.status) { u.status[k]--; if (u.status[k] <= 0) delete u.status[k]; }
      // regen
      let hpR = ms.regenHP, enR = ms.regenEN + 0.03; const tl = st.tile(u.x, u.y);
      if (tl === 'b' && !ms.fly) { hpR += 0.15; enR += 0.15; }
      if (tl === 'h' && !ms.fly && MECHS[u.mech].armor !== 'BIO') { const dmg = Math.round(ms.hp * 0.05); u.hp = Math.max(1, u.hp - dmg); floater(u.x, u.y, '-' + dmg, '#c6ff4a', 12); }
      if (tl === 'v') u.sp = Math.min(CB.pstats(u).SP, u.sp + 5);
      if (st.units.some(o => o.hp > 0 && o.team === u.team && MECHS[o.mech].ship && o !== u && CB.dist(o, u) === 1)) { hpR += 0.1; enR += 0.1; }
      if (hpR > 0 && u.hp < ms.hp) { const h = Math.round(ms.hp * hpR); u.hp = Math.min(ms.hp, u.hp + h); }
      u.en = Math.min(ms.en, u.en + Math.round(ms.en * enR));
      if (CB.skills(u).has('afflict')) u.sp = Math.min(CB.pstats(u).SP, u.sp + 5);
      if (u.team === 'player') u.sp = Math.min(CB.pstats(u).SP, u.sp + 2);
    }
    if(typeof ENEMIES!=='undefined')ENEMIES.phase(st,phase==='enemy'?'enemy':phase==='ally'?'ally':'player',{maxHP:u=>CB.mstats(u).hp,spawn:(o,team)=>{const born=makeUnit(o,team);st.units.push(born);return born;},effect:e=>floater(e.target.x,e.target.y,e.kind==='heal'?'REPAIR +'+e.amount:e.kind==='spawn'?'BROOD':'CHOIR +10','#c8b0ff',13)});
    UI.refreshHUD(st);
    await runEvents();
    if (!st) return;
    if (await checkEnd()) return;
    if (phase === 'enemy') await aiPhase('enemy');
    else if (phase === 'ally') await aiPhase('ally');
  }
  async function endPlayerPhase() {
    if (busy || st.phase !== 'player') return;
    clearSel(); busy = true;
    if (st.units.some(u => u.team === 'ally' && u.hp > 0)) await phaseStart('ally'); else await phaseStart('enemy');
    busy = false;
  }
  async function aiPhase(team) {
    const list = st.units.filter(u => u.team === team && u.hp > 0);
    for (const e of list) {
      if (!st || e.hp <= 0) continue;
      await aiAct(e);
      if (!st) return;
      await runEvents(); if (!st) return;
      if (await checkEnd()) return;
    }
    if (!st) return;
    if (team === 'ally') { await phaseStart('enemy'); return; }
    st.turn++;
    // turn-limit loss
    if (st.ch.lose && st.ch.lose.turn && st.turn > st.ch.lose.turn) { await lose(st.ch.lose.text); return; }
    await phaseStart('player');
  }
  async function aiAct(e) {
    const holding = e.hold && (e.hold >= 99 || st.turn <= e.hold);
    const foes = st.units.filter(o => o.hp > 0 && foeOf(o, e));
    if (!foes.length) return;
    const rr = holding ? { tiles: new Set([e.x + ',' + e.y]), prev: {} } : reach(e);
    let best = null;
    const ox0 = e.x, oy0 = e.y;
    rr.tiles.forEach(k => {
      const [x, y] = k.split(',').map(Number); const moved = !(x === ox0 && y === oy0);
      e.x = x; e.y = y;
      for (const f of foes) {
        const w = CB.bestWeapon(e, f, moved, false); if (!w) continue;
        const fc = CB.forecast(e, f, w, 'counter');
        let score = fc.dmg * fc.hit / 100 + (fc.dmg >= f.hp ? 4000 : 0) + (MECHS[f.mech].ship ? 300 : 0) + (f.pilot === 'rei' ? 200 : 0) - (moved ? 0 : -50);
        const tl = st.tile(x, y); score += (TERRAIN[tl].def + TERRAIN[tl].eva) * 5;
        if(typeof ENEMIES!=='undefined')score+=ENEMIES.supportScore(e,x,y,st);
        if (!best || score > best.score) best = { x, y, f, w, score, moved };
      }
    });
    e.x = ox0; e.y = oy0;
    if (best) {
      if (best.moved) await animateMove(e, pathTo(rr, e, best.x, best.y)); e.moved = best.moved;
      await sleep(150);
      await battle(e, best.f, best.w);
      return;
    }
    if (holding) return;
    // advance toward nearest foe
    let tgt = null, td = 1e9; for (const f of foes) { const d = CB.dist(e, f); if (d < td) { td = d; tgt = f; } }
    let bt = null, bd = 1e9; rr.tiles.forEach(k => { const [x, y] = k.split(',').map(Number); const d = Math.abs(x - tgt.x) + Math.abs(y - tgt.y); if (d < bd) { bd = d; bt = [x, y]; } });
    if (bt && (bt[0] !== e.x || bt[1] !== e.y)) await animateMove(e, pathTo(rr, e, bt[0], bt[1]));
  }

  // ---------- events ----------
  async function runEvents() {
    if (!st) return;
    const evs = st.ch.events || [];
    for (let i = 0; i < evs.length; i++) {
      if (!st) return;
      const ev = evs[i]; const key = 'e' + i;
      if (st.fired[key] && !ev.repeat) continue;
      if (ev.repeat && st.fired[key] && st.turn < st.fired[key] + ev.repeat) continue;
      if (ev.cond && !ev.cond(SAVE)) continue;
      const at = ev.at; let ok = false;
      if (at.turn != null) ok = st.turn >= at.turn && (!at.phase || at.phase === st.phase) && (ev.repeat ? true : true);
      if (at.enemies != null) ok = st.units.filter(u => u.team === 'enemy' && u.hp > 0).length <= at.enemies;
      if (at.defeated) ok = st.defeatedTurn[at.defeated] != null;
      if (at.hp) { const u = st.find(at.hp.tag); ok ||= !!u && u.hp <= CB.mstats(u).hp * at.hp.below; }
      if (!ok) continue;
      st.fired[key] = st.turn;
      if (ev.script) { const r = await UI.runScript(ev.script, { overlay: true }); if (r === 'endmap:true') { await win(true); return; } }
      if (!st) return;
      (ev.add || []).forEach(o => { const p = freeNear(o.x, o.y); st.units.push(makeUnit(Object.assign({}, o, p), 'enemy')); });
      (ev.ally || []).forEach(o => { const p = freeNear(o.x, o.y); st.units.push(makeUnit(Object.assign({ lvl: avgLevel() + 2 }, o, p), 'ally')); });
      (ev.join || []).forEach(o => { addRoster(o.p); const p = freeNear(o.x, o.y); const u = makeUnit(Object.assign({}, o, p), 'player'); st.units.push(u); floater(u.x, u.y, 'JOINED', '#3fd6ff', 15); });
      if (ev.retreat) { const u = st.find(ev.retreat); if (u) { floater(u.x, u.y, 'RETREAT', '#ffd166', 15); u.hp = 0; u.retreated = true; st.defeatedTurn[u.tag] = st.turn; } }
      if (ev.unprotect) { const u = st.find(ev.unprotect); if (u) u.protect = false; }
      if (ev.defect) { const u = st.find(ev.defect); if (u) { u.protect = false; addRoster(u.pilot); u.team = 'player'; u.usePlayerStats = false; u.lvl = SAVE.pilots[u.pilot].lvl; const ms = CB.mstats(u); u.hp = Math.min(ms.hp, Math.max(u.hp, Math.round(ms.hp * 0.6))); u.portrait = null; u.lineSet = null; u.pname = null; u.boss = false; u.hpMul = null; u.acted = st.phase === 'player'; floater(u.x, u.y, 'JOINED', '#3fd6ff', 15); } }
      if (ev.upgrade) { const u = st.find('rei'); SAVE.flags.zero = true; if (u) { u.mech = heroMech(); const ms = CB.mstats(u); u.hp = ms.hp; u.en = ms.en; CB.addWill(u, 20); u.acted = false; u.moved = false; floater(u.x, u.y, 'ALTEON ZERO', '#9dfcff', 18, 2000); } }
      UI.refreshHUD(st);
      if (threatOn) threatSet = computeThreat();
    }
  }
  function freeNear(x, y) { if (!st.unitAt(x, y) && st.tile(x, y) !== 'x') return { x, y }; for (let r = 1; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= st.w || ny >= st.h) continue; if (!st.unitAt(nx, ny) && st.tile(nx, ny) !== 'x') return { x: nx, y: ny }; } return { x, y }; }
  function addRoster(pid) { if (!pid || !PILOTS[pid]) return; if (!SAVE.roster.includes(pid)) { SAVE.roster.push(pid); if (!SAVE.pilots[pid]) SAVE.pilots[pid] = newPilotSave(pid); if (EXPANSION.crew.includes(pid)) { SAVE.auxiliary ||= []; if(SAVE.auxiliary.length<4) SAVE.auxiliary.push(pid); } } }
  async function checkEnd() {
    if (!st) return true;
    if (st.ch.requiredEvents?.some(index => !st.fired['e' + index])) return false;
    const win_ = st.ch.win;
    const enemiesLeft = st.units.filter(u => u.team === 'enemy' && u.hp > 0).length;
    let won = false;
    if (win_ === 'rout') {
      // ensure no pending "enemies:0" events unfired
      const pending = (st.ch.events || []).some((ev, i) => ev.at.enemies != null && !st.fired['e' + i] && (!ev.cond || ev.cond(SAVE)));
      won = enemiesLeft === 0 && !pending;
    } else if (win_.boss) won = st.defeatedTurn[win_.boss] != null && !st.find(win_.boss) && !st.units.find(u => u.tag === win_.boss && u.retreated);
    else if (win_.bosses) won = win_.bosses.every(b => st.defeatedTurn[b] != null);
    if (won) { await win(); return true; }
    return false;
  }
  async function win(viaEvent) {
    const ch = st.ch;
    // story continuity: allies scheduled to arrive later still join if the mission ended early
    (ch.events || []).forEach((ev, i) => { if (!st.fired['e' + i] && ev.join && (!ev.cond || ev.cond(SAVE))) ev.join.forEach(o => addRoster(o.p)); }); const s = { turn: st.turn, flags: SAVE.flags };
    const bonus = ch.bonus && ch.bonus.check(s);
    const credits = st.credits + (ch.reward.credits || 0);
    const parts = (ch.reward.parts || []).slice(); if (bonus && ch.bonus.part) parts.push(ch.bonus.part);
    SAVE.credits += credits; parts.forEach(p => SAVE.inventory[p] = (SAVE.inventory[p] || 0) + 1);
    if (bonus) { SAVE.roster.forEach(p => SAVE.pilots[p].pp += 2); }
    const kills = st.kills; const found = st.secrets.filter(x => x.found).length, total = st.secrets.length;
    const data = { title: ch.title, turn: st.turn, credits, parts, bonus: ch.bonus ? { text: ch.bonus.text, ok: bonus } : null, kills, secrets: `${found}/${total}` };
    stop();
    await UI.victory(data);
    GAME.afterMap(viaEvent);
  }
  async function lose(text) { stop(); await UI.defeat(text); GAME.retryMap(); }

  return { get geom() { return { T, ox, oy }; }, resize,start, stop, beginAttack, targetsFor, waitUnit, useSpirit, transform, endPlayerPhase, toggleThreat, cancel, confirmAttack, reach, get state() { return st; }, get ui() { return ui; }, floater, pilotMech, heroMech, addRoster, avgLevel };
})();
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
