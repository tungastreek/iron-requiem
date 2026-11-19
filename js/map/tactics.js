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
  let cv, ctx, terrCv, backdrop, T = 48, ox = 0, oy = 0, raf = 0, hover = null, threatOn = false, threatSet = null, t0 = 0;
  const floaters = [];
  let raised = false, hoverForecast = null, phaseSweep = 0, eventView = null, intent = [];
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
    if (o.escortPath) {
      u.pname = 'Shelter crew';
      u.escortPath = o.escortPath;
      u.escortStep = 0;
    }
    if (team !== 'player' && o.p && PILOTS[o.p]) { u.pilot = o.p; u.usePlayerStats = true; u.lvl = o.lvl || Math.max(10, avgLevel()); }
    if (team === 'enemy') u.lvl = RULES.enemyLevel(u.lvl, st.partyLevel, st.assisted);
    if (u.boss && team === 'enemy') u.eskills = ['prevail', 'nerves'];
    if(typeof ENEMIES!=='undefined')ENEMIES.init(u,o);
    if (team==='enemy' && Number(st.ch.num)>=4 && o.pilot && mech!=='hollow' && (u.boss || u.variant==='commander')) u.aceSpirits={focus:1,alert:1,ironwall:1,valor:1};
    const ms = CB.mstats(u); u.hp = ms.hp; u.en = ms.en;
    const sk = CB.skills(u); u.will = 100 + CB.classFx(u).will + (u.team === 'player' && (SAVE.pilots[u.pilot]?.kills || 0) >= 30 ? 5 : 0) + (sk.has('nerves') && team === 'player' ? 5 : 0) + (sk.has('overdrive') ? 10 : 0) + ((CB.partFx(u).will) || 0);
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
  async function start(ch, assisted = false) {
    st = create(ch); G.map = st; const opening = st;
    st.partyLevel = RULES.median(SAVE); st.assisted = assisted;
    st.losses = 0; st.damageTaken = 0;
    busy = true;
    hover = null; hoverForecast = null; eventView = null; intent = []; threatOn = false; threatSet = null; floaters.length = 0;
    const core = ch.deploy.filter(d=>SAVE.roster.includes(d.p));
    const fixed = new Set([...ch.vital,...(ch.escortSlots || [])]);
    const budget = RULES.deployLimit(ch,SAVE);
    const auxiliary = (SAVE.auxiliary || EXPANSION.crew).filter(p=>SAVE.roster.includes(p) && !core.some(d=>d.p===p));
    const extra = Math.min(4+(SAVE.refits?.wing || 0),budget-core.filter(d=>fixed.has(d.p)).length);
    const wing = auxiliary.slice(0,Math.max(0,extra));
    const picked = new Set([...core.filter(d=>fixed.has(d.p)).map(d=>d.p), ...wing]);
    for (const d of core) if (picked.size<budget) picked.add(d.p);
    for (const d of core) if (picked.has(d.p)) st.units.push(makeUnit(d,'player'));
    for (const [i,p] of wing.entries()) {
      const slot = freeNear(1,Math.min(st.h-1,9-i*2));
      st.units.push(makeUnit({p,...slot},'player'));
    }
    st.fog = !!ch.map.fog;
    for (const e of ch.enemies) st.units.push(makeUnit(e, 'enemy'));
    const allies = typeof ch.allies === 'function' ? ch.allies(SAVE) : (ch.allies || []);
    for (const a of allies) st.units.push(makeUnit(a, 'ally'));
    placeSecrets();
    document.getElementById('mapScreen').hidden = false;
    initCanvas();
    clearSel();
    resize();
    if(typeof TOUCH!=='undefined')TOUCH.resetMap();
    UI.mapHUD(st);
    SFX.music(ch.mood || 'battle');
    loop();
    await UI.objectiveCard(ch);
    if (st !== opening) return;
    await UI.missionStamp?.(ch);
    if (st !== opening) return;
    await phaseStart('player');
    if (st === opening) busy = false;
  }
  function stop() { cancelAnimationFrame(raf); document.getElementById('mapScreen').hidden = true; G.map = null; st = null; }

  // ---------- canvas ----------
  function initCanvas() {
    if (cv) return;
    cv = document.getElementById('mapCanvas'); ctx = cv.getContext('2d');
    if(typeof TOUCH!=='undefined')TOUCH.attachMap(cv,{state:()=>st,ui:()=>ui,geom:()=>({T,ox,oy,point}),toTile,click:onClick,preview:t=>{hover=t;if(t)onHover();else ui.path=null;},inspect:t=>{hover=t;onHover();}});
    window.addEventListener('resize', () => { if (st) resize(); });
    if (typeof QUALITY !== 'undefined') QUALITY.onChange(() => { if (st) resize(); });
    cv.addEventListener('pointermove', e => { const t = toTile(e); if (!hover || !t || hover.x !== t.x || hover.y !== t.y) { hover = t; onHover(); } });
    cv.addEventListener('pointerleave', () => { hover = null; hoverForecast = null; ui.path = null; });
    cv.addEventListener('click', e => { const t = toTile(e); if (t) onClick(t.x, t.y); });
    cv.addEventListener('contextmenu', e => { e.preventDefault(); cancel(); });
    window.addEventListener('keydown', e => { if (!st || document.getElementById('mapScreen').hidden) return; if (e.key === 'Escape') cancel(); if (e.key === 't' || e.key === 'T') toggleThreat(); });
  }
  function resize() {
    if(!st)return;
    const wrap = document.getElementById('mapWrap'); const W = wrap.clientWidth, H = wrap.clientHeight;
    const dpr = typeof QUALITY!=='undefined'?QUALITY.dpr:Math.min(2, window.devicePixelRatio || 1);
    T = Math.max(1, Math.floor(Math.min(W / st.w, H / st.h)));
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ox = Math.floor((W - T * st.w) / 2); oy = Math.floor((H - T * st.h) / 2);
    if (!backdrop) backdrop = document.createElement('canvas');
    const scale = 512 / Math.max(1, W, H);
    backdrop.width = Math.max(1, Math.round(W * scale));
    backdrop.height = Math.max(1, Math.round(H * scale));
    const b = backdrop.getContext('2d');
    if (b) {
      if (!ASSETS.drawHorizon?.(b,backdrop.width,backdrop.height,st.theme)) ASSETS.drawMissionBG(b,backdrop.width,backdrop.height,st.ch.bg);
      const shade = b.createLinearGradient(0, 0, 0, backdrop.height);
      shade.addColorStop(0, '#07101bc9');
      shade.addColorStop(1, '#050910e8');
      b.fillStyle = shade; b.fillRect(0, 0, backdrop.width, backdrop.height);
    }
    buildTerrain();
    raised = typeof BOARD3D !== 'undefined' && typeof QUALITY !== 'undefined' && !QUALITY.low && BOARD3D.build(st,terrCv,W,H);
    cv.dataset.board = raised ? 'diorama' : 'flat';
    if (typeof TOUCH !== 'undefined') TOUCH.refreshMap();
  }
  function point(x,y,tileX,tileY) {
    return raised ? BOARD3D.project(x,y,tileX,tileY) : [ox+x*T,oy+y*T];
  }
  function toTile(e) {
    if (!st) return null;
    const r = cv.getBoundingClientRect();
    const p = typeof TOUCH !== 'undefined' ? TOUCH.localPoint(e,cv) : {x:e.clientX-r.left,y:e.clientY-r.top};
    if (raised) return BOARD3D.pick(p.x,p.y);
    const x = Math.floor((p.x-ox)/T), y = Math.floor((p.y-oy)/T);
    return x>=0 && y>=0 && x<st.w && y<st.h ? {x,y} : null;
  }
  function center(x,y) { return point(x+.5,y+.5,x,y); }
  function polygon(x,y,inset=.045) {
    ctx.beginPath();
    for (const [dx,dy] of [[inset,inset],[1-inset,inset],[1-inset,1-inset],[inset,1-inset]]) {
      ctx.lineTo(...point(x+dx,y+dy,x,y));
    }
    ctx.closePath();
  }
  function gridMark(x,y,fill,stroke,hatch=false) {
    polygon(x,y);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (hatch) {
      ctx.save(); ctx.clip(); ctx.strokeStyle = '#ff9b9255'; ctx.lineWidth = 1;
      const [cx,cy] = center(x,y);
      for (let offset=-T;offset<=T;offset+=8) {
        ctx.beginPath(); ctx.moveTo(cx-T+offset,cy+T); ctx.lineTo(cx+T+offset,cy-T); ctx.stroke();
      }
      ctx.restore();
    }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  function link(a,b,color,dash = []) {
    const [ax,ay] = center(a.x,a.y), [bx,by] = center(b.x,b.y);
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
    ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
    const angle = Math.atan2(by-ay,bx-ax);
    ctx.beginPath(); ctx.moveTo(bx,by);
    ctx.lineTo(bx-9*Math.cos(angle-.5),by-9*Math.sin(angle-.5));
    ctx.lineTo(bx-9*Math.cos(angle+.5),by-9*Math.sin(angle+.5));
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
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
    mv = mv != null ? mv : CB.mstats(u).move + (u.buf.accel ? 3 : 0) + CB.classAura(u,'moveAura',1);
    const zones = st.units.filter(o => o.hp > 0 && foeOf(o,u) && CB.classFx(o).zone);
    const dist = { [u.x + ',' + u.y]: 0 }, prev = {}; const q = [[u.x, u.y, 0]];
    while (q.length) {
      q.sort((a, b) => a[2] - b[2]); const [x, y, d] = q.shift();
      if (d && zones.some(o => Math.abs(x-o.x) + Math.abs(y-o.y) <= CB.classFx(o).zone)) continue;
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
  function revealed(x,y) {
    if (!st.fog) return true;
    return st.units.some(u=>{
      if (u.hp<=0 || u.team==='enemy') return false;
      const cls = CLASSES.classOf(u.mech);
      const vision = (cls==='sniper' || cls==='command' ? 8 : 5)+(st.tile(u.x,u.y)==='m' ? 1 : 0);
      return Math.abs(x-u.x)+Math.abs(y-u.y)<=vision;
    });
  }
  function computeThreat() {
    const reachables = new Set();
    intent = [];
    for (const e of st.units) {
      if (e.hp<=0 || e.team!=='enemy' || !revealed(e.x,e.y)) continue;
      const holding = e.hold && st.turn<=e.hold;
      const destinations = holding ? new Set([e.x+','+e.y]) : reach(e).tiles;
      const max = Math.max(...CB.weapons(e).map(w=>w.rmax));
      for (const key of destinations) {
        const [x,y] = key.split(',').map(Number);
        rangeTiles(x,y,1,max).forEach(tile=>reachables.add(tile));
      }
      const threats = st.units.flatMap(u=>{
        if (u.hp<=0 || !foeOf(e,u)) return [];
        const w = CB.bestWeapon(e,u,false,false);
        if (!w) return [];
        const f = CB.forecast(e,u,w,'counter');
        return [{u,score:f.dmg*f.hit}];
      }).sort((a,b)=>b.score-a.score);
      if (threats.length) intent.push({enemy:e,target:threats[0].u});
    }
    return reachables;
  }
  function focus(unit) {
    if (!unit || !st || (typeof QUALITY!=='undefined' && QUALITY.reducedMotion)) return;
    eventView = {x:unit.x,y:unit.y,started:performance.now(),ending:null};
  }
  function releaseFocus() { if (eventView) eventView.ending=performance.now(); }
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
    ctx.drawImage(backdrop, 0, 0, W, H);
    ctx.save();
    let cameraStrength = 0;
    if (eventView) {
      const time = performance.now();
      cameraStrength = Math.min(1,(time-eventView.started)/660);
      if (eventView.ending!==null) cameraStrength = Math.max(0,1-(time-eventView.ending)/300);
      if (!cameraStrength && eventView.ending!==null) eventView = null;
      if (eventView) {
        const [x,y] = center(eventView.x,eventView.y);
        const ease = cameraStrength*cameraStrength*(3-2*cameraStrength);
        ctx.translate((W*.52-x)*.44*ease,(H*.47-y)*.54*ease);
        ctx.translate(x,y); ctx.scale(1+.24*ease,1+.24*ease); ctx.translate(-x,-y);
      }
    }
    if (raised) ctx.drawImage(BOARD3D.image,0,0,W,H);
    else ctx.drawImage(terrCv,ox,oy,T*st.w,T*st.h);
    const motion = typeof QUALITY === 'undefined' || !QUALITY.reducedMotion;
    const pulse = motion ? .5 + Math.sin(t*4)*.15 : .5;
    if (st.theme === 'ice' || st.space || st.theme === 'hive') {
      ctx.fillStyle = st.theme === 'hive' ? '#ffbad135' : '#b8efff51';
      if (raised) for (let i=0;i<38;i++) {
        const px = ((i*983 + (motion ? t*10 : 0)) % W + W) % W;
        const py = ((i*283 + (motion ? t*(6+i%7) : 0)) % H + H) % H;
        ctx.fillRect(px,py,i%3+1,i%2+1);
      }
    }
    if (threatOn && threatSet) threatSet.forEach(k=>{
      const [x,y] = k.split(',').map(Number); gridMark(x,y,'#fa354726');
    });
    if (st.fog) for (let y=0;y<st.h;y++) for (let x=0;x<st.w;x++) {
      if (!revealed(x,y)) gridMark(x,y,'#090c25a6');
    }
    drawObjectiveMarkers(t);
    if (ui.range) ui.range.tiles.forEach(k=>{
      const [x,y] = k.split(',').map(Number); gridMark(x,y,`rgba(10,207,255,${.08 + pulse*.27})`,'#83efff91');
    });
    if (ui.atkRange) ui.atkRange.forEach(k=>{
      const [x,y] = k.split(',').map(Number); gridMark(x,y,`rgba(255,62,99,${.06 + pulse*.22})`,null,ui.mode==='target');
    });
    if (threatOn && ui.mode==='idle') for (const {enemy,target} of intent) {
      if (enemy.hp>0 && target.hp>0 && revealed(enemy.x,enemy.y)) link(enemy,target,'#ffad899a',[4,6]);
    }
    if (ui.target && ui.sel) link(ui.sel,ui.target,'#ffb4c1',[6,5]);
    if (ui.path?.length && ui.sel) {
      const nodes = [[ui.sel.x,ui.sel.y], ...ui.path];
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); for (const [x,y] of nodes) ctx.lineTo(...center(x,y));
      ctx.strokeStyle = '#071229'; ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = '#a5faff'; ctx.lineWidth = 3; ctx.stroke();
      const [ax,ay] = nodes.at(-2), [bx,by] = nodes.at(-1);
      link({x:ax,y:ay},{x:bx,y:by},'#e8fcff');
      ctx.restore();
    }
    // secrets (sensor sweep shimmer)
    for (const s of st.secrets) {
      if (s.found) continue;
      const near = st.units.some(u => u.hp > 0 && u.team === 'player' && Math.abs(u.x - s.x) + Math.abs(u.y - s.y) <= 2);
      if (!near) continue;
      const a = motion ? .35 + Math.sin(t*3+s.x)*.25 : .35;
      const [px,py] = center(s.x,s.y);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ART.glowDot(ctx, px, py, T * 0.5, '#ffd166', a); ctx.restore();
      ctx.fillStyle = `rgba(255,230,160,${a + 0.3})`; ctx.font = `700 ${Math.floor(T * 0.4)}px "Chakra Petch", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', px, py);
    }
    // units
    const sorted = st.units.filter(u=>u.hp>0 && (u.team!=='enemy' || revealed(u.x,u.y))).sort((a, b) => a.y - b.y);
    for (const u of sorted) drawUnit(u, t);
    if (hover) gridMark(hover.x,hover.y,'#ffffff0d','#ffffff');
    if (ui.target) gridMark(ui.target.x,ui.target.y,null,motion ? `rgba(255,100,124,${.72+.27*Math.sin(t*8)})` : '#ff849a');
    if (hoverForecast && ui.mode === 'target') {
      const [px,py] = center(hoverForecast.x,hoverForecast.y);
      const y = Math.max(18,py - T*.85);
      const label = `${hoverForecast.dmg} HP  ·  ${hoverForecast.hit}% HIT${hoverForecast.lethal ? '  ·  LETHAL ON HIT' : ''}`;
      ctx.font = '700 12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(label).width + 20, x = Math.max(w/2,Math.min(W-w/2,px));
      ctx.fillStyle = '#081326f4'; ctx.fillRect(x-w/2,y-11,w,22);
      ctx.fillStyle = '#ffd4c6'; ctx.fillText(label,x,y);
    }
    for (let i=floaters.length-1;i>=0;i--) {
      const f = floaters[i], k = (performance.now()-f.t)/f.life;
      if (k>=1) { floaters.splice(i,1); continue; }
      const [px,py] = center(f.x,f.y), y = py - T*.5 - (motion ? 20*k : 0);
      ctx.globalAlpha = k>.7 ? (1-k)/.3 : 1; ctx.font = `800 ${f.size}px system-ui`;
      ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText(f.s,px,y);
      ctx.fillStyle = f.c; ctx.fillText(f.s,px,y); ctx.globalAlpha = 1;
    }
    if (motion && performance.now()-phaseSweep<780) {
      const x = W*((performance.now()-phaseSweep)/780)*1.5-W*.25;
      const sweep = ctx.createLinearGradient(x-95,0,x+95,0);
      sweep.addColorStop(0,'#83f9ff00'); sweep.addColorStop(.5,st.phase==='enemy'?'#ff80754d':'#83f9ff40');
      sweep.addColorStop(1,'#83f9ff00'); ctx.fillStyle = sweep; ctx.fillRect(x-95,0,190,H);
    }
    ctx.restore();
    if (cameraStrength>0) {
      ctx.fillStyle='#02060e';
      ctx.fillRect(0,0,W,H*.055*cameraStrength); ctx.fillRect(0,H*(1-.055*cameraStrength),W,H);
    }
  }
  function drawObjectiveMarkers(t) {
    if (st.ch.win.escort) {
      const carrier = st.units.find(u => u.escortPath && !u.escorted && u.hp > 0);
      if (carrier) {
        ctx.save();
        ctx.fillStyle = '#6dfcf7';
        ctx.globalAlpha = .6;
        for (const [x, y] of carrier.escortPath.slice(carrier.escortStep + 1)) {
          ctx.beginPath(); ctx.arc(...point(x+.5,y+.18,x,y), T * .07, 0, Math.PI * 2); ctx.fill();
        }
        const [x, y] = carrier.escortPath.at(-1);
        ctx.strokeStyle = '#6dfcf7'; ctx.lineWidth = 2;
        gridMark(x,y,null,'#6dfcf7');
        ctx.restore();
      }
    }
    const events = st.ch.events || [];
    for (const [i, event] of events.entries()) {
      if (!event.telegraph || st.fired['e' + i] || event.at.turn - st.turn !== 1) continue;
      ctx.save();
      ctx.strokeStyle = '#ffc060'; ctx.fillStyle = '#ffc060'; ctx.lineWidth = 2;
      ctx.globalAlpha = .8 + Math.sin(t * 6) * .2;
      ctx.font = `bold ${Math.max(10, Math.floor(T * .35))}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const { x, y } of event.add || []) {
        gridMark(x,y,'#ffab3b30','#ffb450',true);
        ctx.fillText('!', ...center(x,y));
      }
      ctx.restore();
    }
  }
  function drawUnit(u, t) {
    let x = u.x, y = u.y;
    if (u.anim) { const k = Math.min(u.anim.path.length - 1e-6, (performance.now() - u.anim.t0) / 110); const i = Math.floor(k), f = k - i; const a = u.anim.path[i], b = u.anim.path[Math.min(i + 1, u.anim.path.length - 1)]; x = a[0] + (b[0] - a[0]) * f; y = a[1] + (b[1] - a[1]) * f; }
    const [cx,cy] = center(x,y), px = cx-T/2, py = raised ? cy-T*.82 : cy-T/2; const done = u.team === 'player' && u.acted;
    if(typeof ENEMIES!=='undefined')ENEMIES.badge(ctx,u,px+T/2,py+T*.6,T);
    const col = u.team === 'player' ? '#3fd6ff' : u.team === 'ally' ? '#7dffb0' : '#ff4d6d';
    if (raised) {
      ctx.fillStyle = '#01030c70';
      ctx.beginPath(); ctx.ellipse(cx+2,cy+3,T*.38,T*.16,0,0,7); ctx.fill();
    }
    // base ring
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = ART.rgba(col, done ? 0.25 : 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px + T / 2, py + T * 0.82, T * 0.38, T * 0.14, 0, 0, 7); ctx.stroke(); ctx.restore();
    if (u.boss) { ctx.fillStyle = '#ffd166'; ctx.font = `${Math.floor(T * 0.28)}px sans-serif`; ctx.textAlign = 'left'; ctx.fillText('♛', px + 1, py + T * 0.28); }
    const spr = ASSETS.mapIcon(u.mech, Math.round(T), u.team === 'enemy', Math.floor(t * 2.5 + u.uid * 0.37) % 2) || (R3D.ok ? R3D.mapSprite : ART.mapSprite)(u.mech, Math.round(T), u.team === 'enemy');
    const bob = (typeof QUALITY !== 'undefined' && QUALITY.reducedMotion ? 0 : Math.sin(t * 2.4 + u.uid)) * (CB.mstats(u).fly ? 2.5 : 0.8);
    ctx.globalAlpha = done ? 0.5 : 1;
    if (u.flash && performance.now() - u.flash < 200) ctx.filter = 'brightness(3)';
    ctx.drawImage(spr, px + T / 2 - T, py + T - T * 1.55 + bob, T * 2, T * 2);
    ctx.filter = 'none'; ctx.globalAlpha = 1;
    // hp bar
    const ms = CB.mstats(u), f = Math.max(0, u.hp / ms.hp);
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(px + T * 0.12, py + T - 6, T * 0.76, 4);
    ctx.fillStyle = f < 0.3 ? '#ff4d6d' : f < 0.6 ? '#ffc04d' : col; ctx.fillRect(px + T * 0.12, py + T - 6, T * 0.76 * f, 4);
    if (u.escortPath) {
      const size = Math.max(13, Math.floor(T * .26)), x = px + 2, y = py + 2;
      ctx.fillStyle = '#091c15'; ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.strokeRect(x, y, size, size);
      ctx.fillStyle = col; ctx.font = `700 ${Math.round(size * .7)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(st.ch.win.escort.indexOf(u.tag) + 1), x + size / 2, y + size / 2);
      ctx.textBaseline = 'alphabetic';
    }
    // status pips
    const ss = Object.keys(u.status); ss.forEach((k, i) => { ctx.fillStyle = STATUS[k].color; ctx.beginPath(); ctx.arc(px + T * 0.88 - i * 7, py + 6, 3, 0, 7); ctx.fill(); });
    if (Object.keys(u.buf).some(k => u.buf[k])) { ctx.fillStyle = '#7dffb0'; ctx.beginPath(); ctx.arc(px + 6, py + T - 12, 3, 0, 7); ctx.fill(); }
  }
  function floater(x, y, s, c = '#fff', size = 16, life = 1200) { floaters.push({ x, y, s, c, size, life, t: performance.now() }); }
  function record(unit, key, amount = 1) {
    const pilot = unit.team === 'player' && SAVE.pilots[unit.pilot];
    if (!pilot) return;
    pilot.deeds ||= {};
    pilot.deeds[key] = (pilot.deeds[key] || 0) + amount;
  }
  function animateMove(u, path, forced = false) {
    if (!path.length) return Promise.resolve();
    if (!forced) {
      u.moveDistance = (u.moveDistance || 0) + path.length;
      if (CB.classFx(u).willStride) {
        const enemies = st.units.filter(v => v.hp > 0 && foeOf(u,v));
        if (enemies.length) {
          let prev = Math.min(...enemies.map(v => CB.dist(u,v)));
          for (const [x,y] of path) {
            const dist = Math.min(...enemies.map(v => Math.abs(x-v.x) + Math.abs(y-v.y)));
            if (dist < prev) CB.addWill(u, CB.classFx(u).willStride);
            prev = dist;
          }
        }
      }
    }
    return new Promise(res => { u.anim = { path: [[u.x, u.y], ...path], t0: performance.now() }; SFX.play('step'); setTimeout(() => { const [lx, ly] = path[path.length - 1]; u.x = lx; u.y = ly; u.anim = null; res(); }, path.length * 110 + 20); });
  }

  // ---------- player input ----------
  function onHover() {
    hoverForecast = null;
    if (!hover) { ui.path = null; return; }
    const u = revealed(hover.x,hover.y) ? st.unitAt(hover.x,hover.y) : null;
    UI.showTileInfo(hover.x, hover.y, st.tile(hover.x, hover.y), u);
    if (['moving','redeploy'].includes(ui.mode)) {
      ui.path = ui.range?.tiles.has(hover.x+','+hover.y) ? pathTo(ui.range,ui.sel,hover.x,hover.y) : null;
    }
    if (ui.mode === 'target' && ui.weapon && u && foeOf(ui.sel,u) && !CB.usable(ui.sel,ui.weapon,CB.dist(ui.sel,u),ui.sel.moved,false,u)) {
      const f = CB.forecast(ui.sel,u,ui.weapon,'counter',st);
      hoverForecast = {x:u.x,y:u.y,hit:f.hit,dmg:f.dmg,lethal:f.dmg>=u.hp};
    }
  }
  async function onClick(x, y) {
    if (busy || st.phase !== 'player') return;
    const u = st.unitAt(x, y);
    if (u?.team==='enemy' && !revealed(x,y)) { UI.toast('Outside sensor range.'); return; }
    switch (ui.mode) {
      case 'idle':
        if (u && u.team === 'player' && !u.acted) { selectUnit(u); }
        else if (u) { showEnemyRange(u); }
        else { clearSel(); UI.mapMenu(); }
        break;
      case 'moving':
        if (u === ui.sel) { ui.range = null; ui.path = null; ui.mode = 'menu'; UI.actionMenu(ui.sel, false); return; }
        if (ui.range.tiles.has(x + ',' + y) && !u) {
          busy = true; const path = pathTo(ui.range, ui.sel, x, y); ui.origin = { x: ui.sel.x, y: ui.sel.y, will:ui.sel.will, distance:ui.sel.moveDistance || 0 }; ui.range = null; ui.path = null;
          await animateMove(ui.sel, path); ui.sel.moved = true; busy = false;
          await checkSecret(ui.sel);
          if (!st) return;
          ui.mode = 'menu'; UI.actionMenu(ui.sel, true);
        } else if (u && u.team === 'player' && !u.acted && u !== ui.sel) { selectUnit(u); }
        break;
      case 'redeploy':
        if (u === ui.sel) { await finishUnit(ui.sel); return; }
        if (u || !ui.range.tiles.has(x + ',' + y)) return;
        busy = true;
        await animateMove(ui.sel, pathTo(ui.range,ui.sel,x,y));
        record(ui.sel,'moves',ui.sel.moveDistance || 0);
        ui.sel.moveDistance = 0;
        busy = false;
        await checkSecret(ui.sel);
        if (st) await finishUnit(ui.sel);
        break;
      case 'target':
        if (u && foeOf(u, ui.sel) && ui.atkRange.has(x + ',' + y) && CB.usable(ui.sel,ui.weapon,CB.dist(ui.sel,u),ui.sel.moved,false,u)===null) {
          if (ui.target === u) { await confirmAttack(); } else { ui.target = u; UI.forecast(ui.sel, u, ui.weapon); }
        }
        break;
      case 'enemyview': clearSel(); break;
    }
  }
  function selectUnit(u) { SFX.play('select'); ui = { mode: 'moving', sel: u, range: u.moved ? null : reach(u), atkRange: null, path: null, origin: null, weapon: null, target: null }; if (u.moved) { ui.mode = 'menu'; UI.actionMenu(u, true); } UI.showUnit(u); }
  function showEnemyRange(u) { const rr = (u.hold && st.turn <= u.hold && u.team === 'enemy') ? { tiles: new Set([u.x + ',' + u.y]) } : reach(u); const mr = Math.max(...CB.weapons(u).map(w => w.rmax)); const s = new Set(); rr.tiles.forEach(k => { const [x, y] = k.split(',').map(Number); rangeTiles(x, y, 1, mr).forEach(t => s.add(t)); }); ui = { mode: 'enemyview', sel: u, range: rr, atkRange: s }; UI.showUnit(u); SFX.play('select'); }
  function clearSel() { hoverForecast = null; if(typeof TOUCH!=='undefined')TOUCH.cancelMove(); ui = { mode: 'idle', sel: null, range: null, atkRange: null, path: null }; UI.hideMenus(); }
  function cancel() {
    if(typeof TOUCH!=='undefined')TOUCH.cancelMove();
    if (busy) return; SFX.play('cancel');
    if (ui.mode === 'redeploy') { finishUnit(ui.sel); return; }
    if (ui.mode === 'target') {
      if (ui.target) { ui.target = null; UI.hideForecast(); return; }
      ui.mode = 'menu'; ui.atkRange = null; ui.weapon = null;
      UI.actionMenu(ui.sel, ui.sel.moved);
      return;
    }
    if (ui.mode === 'menu' && ui.origin && ui.sel.moved && !ui.sel.acted) { ui.sel.x = ui.origin.x; ui.sel.y = ui.origin.y; ui.sel.will = ui.origin.will; ui.sel.moveDistance = ui.origin.distance; ui.sel.moved = false; const u = ui.sel; UI.hideMenus(); selectUnit(u); return; }
    clearSel();
  }
  // called by UI action menu
  function beginAttack(u, w) {
    ui.mode = 'target'; ui.weapon = w; ui.atkRange = rangeTiles(u.x, u.y, w.rmin, w.rmax); ui.target = null;
    if (typeof TOUCH !== 'undefined') TOUCH.refreshMap();
    UI.toast('Select a target in red range.');
  }
  function targetsFor(u, moved) {
    const res = [];
    for (const w of CB.weapons(u)) { if (CB.usable(u, w, null, moved) && CB.usable(u, w, null, moved) !== 'range') continue; const ok = st.units.some(o => o.hp > 0 && foeOf(o, u) && revealed(o.x,o.y) && CB.usable(u, w, CB.dist(u, o), moved,false,o) === null); res.push({ w, ok }); }
    return res;
  }
  async function confirmAttack() {
    const a = ui.sel, d = ui.target, w = ui.weapon; if (!a || !d || !w || CB.usable(a,w,CB.dist(a,d),a.moved,false,d)) return;
    UI.hideMenus(); UI.hideForecast(); ui.atkRange = null; ui.target = null; busy = true;
    await battle(a, d, w);
    if (!st) return;
    await runEvents();
    if (!st) return;
    busy = false;
    const range = CB.classFx(a).hitrun && !a.redeployed && a.hp > 0 && !a.buf.zeal && !w.combo && (a.moveDistance || 0) <= 3;
    if (range && !(await checkEnd()) && st) {
      a.redeployed = true; a.acted = true;
      ui = { mode:'redeploy', sel:a, range: reach(a, 3 + CB.classFx(a).reposition) };
      UI.toast('Hit-and-run · move to a highlighted tile or select your frame to finish.');
      return;
    }
    await finishUnit(a);
  }
  async function finishUnit(u) {
    if (!st) return;
    if (u.buf.zeal && u.hp > 0) { u.buf.zeal = false; u.moved = false; u.acted = false; floater(u.x, u.y, 'ZEAL!', '#7dffb0'); clearSel(); return; }
    if (!u.movementRecorded && u.moveDistance) { record(u,'moves',u.moveDistance); u.movementRecorded = true; }
    u.acted = true; u.moved = true; clearSel();
    if (threatOn) threatSet = computeThreat();
    await runEvents();
    if (!st) return;
    if (await checkEnd()) return;
    if (st.units.filter(x => x.team === 'player' && x.hp > 0 && !x.acted).length === 0 && SAVE.settings.autoEnd) endPlayerPhase();
  }
  function waitUnit(u) { finishUnit(u); }
  function serviceTargets(u) {
    const fx = CB.classFx(u);
    return st.units.filter(p => p !== u && p.team === u.team && p.hp > 0 && CB.dist(u,p) <= 1 + fx.serviceRange);
  }
  async function service(u,target,restore) {
    if (u.acted || !CB.classFx(u).fieldService || !serviceTargets(u).includes(target)) return;
    const fx = CB.classFx(u), stats = CB.mstats(target);
    if (restore) {
      target.en = Math.min(stats.en, target.en + Math.round(stats.en * (.4 + fx.resupply)));
      for (const w of CB.weapons(target)) if (w.ammo && target.ammo[w.idx] != null) target.ammo[w.idx] = Math.min(w.ammo,target.ammo[w.idx] + Math.ceil(w.ammo * .5));
    } else target.hp = Math.min(stats.hp,target.hp + Math.round(stats.hp * (.33 + fx.repair)));
    record(u,'repairs'); COMBOS.bond(u,target,'field');
    floater(target.x,target.y,restore ? 'RESUPPLIED' : 'REPAIRED','#74ffd7',16);
    SFX.play('spirit');
    await finishUnit(u);
  }
  function order(u, target) {
    if (u.orderUsed || !target || CB.dist(u,target)>3 || !CB.classFx(u).fieldOrders) return;
    u.orderUsed = true;
    CB.addWill(target,6+CB.classFx(u).orderPower); target.buf.focus = true;
    floater(target.x,target.y,'COMMAND ORDER','#ffcf83',16); SFX.play('spirit');
  }
  function taunt(u, target) {
    if (u.tauntUsed || !target || CB.dist(u,target)>3 || !CB.classFx(u).taunt) return;
    u.tauntUsed = true; target.taunted = u;
    floater(target.x,target.y,'DRAWN FIRE','#ffcf83',16);
  }
  async function useSpirit(u, sid, target) {
    const cost = CLASSES.spiritCost(u,sid,SAVE);
    if (u.sp < cost) return;
    u.sp -= cost; SFX.play('spirit'); record(u,'spirits');
    const fx = CB.classFx(u), tg = target || u;
    const close = st.units.filter(o => o !== u && o.team === u.team && o.hp > 0 && CB.dist(o,u) === 1);
    const grant = p => {
      switch (sid) {
        case 'guts': p.hp = Math.min(CB.mstats(p).hp, p.hp + Math.round(CB.mstats(p).hp * .5)); break;
        case 'mend': p.hp = Math.min(CB.mstats(p).hp,p.hp + 3500); break;
        case 'ardor': CB.addWill(p,10); break;
        case 'resolve': Object.assign(p.buf,{focus:true,strike:true,valor:true,accel:true}); break;
        case 'cleanse': p.status = {}; break;
        default: p.buf[sid] = true;
      }
    };
    if (sid === 'rally') st.units.forEach(o => { if (o.team === u.team && o.hp > 0) CB.addWill(o,5); });
    else {
      grant(tg);
      const echo = close.find(o => o !== tg);
      if (fx.echo && echo) grant(echo);
    }
    if (fx.cascade) close.forEach(o => CB.addWill(o,fx.cascade));
    floater(tg.x,tg.y,SPIRITS[sid].name.toUpperCase(),'#7dffb0',15);
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
      case 'shard': SAVE.merits = (SAVE.merits || 0) + 1; msg = 'The Halcyon earns one refit Merit.'; break;
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
    const map = st;
    let mode;
    if (d.team === 'player') mode = SAVE.settings.defAuto ? (CB.bestWeapon(d,a,false,true) ? 'counter' : 'defend') : await UI.defensePrompt(a,d,w);
    else mode = d.escortPath ? 'defend' : aiDefMode(d,a);
    let intercept = null;
    const guard = typeof mode === 'string' && mode.startsWith('guard:')
      ? COMBOS.guards(d).find(u => u.uid === Number(mode.split(':')[1]))
      : d.team === 'enemy' && CB.forecast(a,d,w,'counter').dmg >= d.hp * .7
        ? COMBOS.guards(d).find(u => CB.forecast(a,u,w,'defend').dmg < u.hp * .65) : null;
    if (guard) {
      intercept = { target:d, guard }; d = guard;
      guard.guardUsed = (guard.guardUsed || 0) + 1;
      record(guard,'guards'); COMBOS.bond(guard,intercept.target,'guard');
      const morale = CB.classFx(guard).guardWill;
      if (morale) st.units.forEach(u => { if (u.hp > 0 && u.team === guard.team) CB.addWill(u,morale); });
      mode = 'defend'; w = {...w, intercepted:true};
    }
    const comboPartner = w.combo ? COMBOS.partner(a,w) : null;
    let counterW = mode === 'counter' ? d._counterW || CB.bestWeapon(d,a,false,true) : null;
    const defendCounter = mode === 'defend' && CB.classFx(d).defendCounter;
    if (defendCounter) {
      const returnFire = CB.bestWeapon(d,a,false,true);
      if (returnFire) counterW = {...returnFire,counterScale:defendCounter};
    }
    d._counterW = null;
    const hp0 = { a:a.hp, d:d.hp };
    const events = [];
    const pm = CB.posMods(a,d);
    function strike(actor,target,gun,response,by,extra={}) {
      const before = target.hp;
      CB.spend(actor,gun);
      const res = CB.roll(actor,target,gun,response);
      CB.applyResult(actor,target,res);
      if (res.hit) record(actor,'hits');
      if (gun.counter) record(actor,'counters');
      if (res.capped && typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug')) console.info('Enemy damage capped', actor.mech, target.mech, res.dmg);
      if (target.team === 'player') st.damageTaken += Math.max(0,before-target.hp);
      events.push({ actor, target, by, w:gun, res, mode:response, hpAfter:target.hp, ...extra });
      return res;
    }
    if (!st || st!==map) return;
    const r1 = strike(a,d,w,mode,'A',{comboPartner});
    const assist = COMBOS.support(a,d,w);
    if (assist) {
      assist.unit.supportUsed = (assist.unit.supportUsed || 0) + 1;
      COMBOS.bond(a,assist.unit,'support');
      strike(assist.unit,d,assist.weapon,mode,'A',{support:assist.unit});
    }
    if (d.hp > 0 && counterW && !d.escortPath && CB.usable(d,counterW,CB.dist(a,d),false,true,a) === null) strike(d,a,{...counterW,counter:true},'none','D');
    if (d.escortPath && d.hp < hp0.d) d.escortDamaged = true;
    // play animation
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
    const af = CB.classFx(a);
    const movable = r1.hit && d.hp > 0 && !d.escortPath && !CB.classFx(d).steady && MECHS[d.mech].size !== 'XL' && !MECHS[d.mech].ship;
    const grav = w.type === 'GRAV';
    const pull = movable && typeof ENEMIES !== 'undefined' ? ENEMIES.pullTile(st,a,d,grav && af.gravityPull && !af.gravityPush ? {...w,pull:true} : w) : null;
    if (pull) { await animateMove(d,[[pull.x,pull.y]],true); floater(d.x,d.y,'PULLED','#ffb347',14); }
    else if (movable && (CB.pushes(w) || (grav && af.gravityPush) || (w.cat === 'M' && af.meleePush))) await knockback(a,d,1+af.pushDistance);
    // rewards & deaths
    for (const e of events) rewards(e.actor,e.target,e.hpAfter <= 0,e.w.support);
    for (const unit of [a,d]) {
      if (st !== map) break;
      if (unit.hp <= 0) await unitDown(unit);
    }
    UI.refreshHUD(st);
  }
  async function knockback(a, d, distance = 1) {
    let dx = Math.sign(d.x - a.x), dy = Math.sign(d.y - a.y); if (Math.abs(d.x - a.x) >= Math.abs(d.y - a.y)) dy = 0; else dx = 0;
    const nx = d.x + dx, ny = d.y + dy; const blocker = st.unitAt(nx, ny); const tl = st.tile(nx, ny);
    if (!blocker && tl !== 'x' && moveCost(d, nx, ny) < 99) { const path = [[nx,ny]];
      for (let i = 2; i <= distance; i++) {
        const x = d.x + dx*i, y = d.y + dy*i;
        if (st.unitAt(x,y) || st.tile(x,y) === 'x' || moveCost(d,x,y) >= 99) break;
        path.push([x,y]);
      }
      await animateMove(d,path,true); floater(d.x, d.y, 'KNOCKBACK', '#ffb347', 13); await checkSecretEnemy(d); }
    else {
      const bump = 600; d.hp = Math.max(1, d.hp - bump); d.flash = performance.now(); floater(d.x, d.y, 'COLLISION -' + bump, '#ff7a2e', 14); SFX.play('hit');
      if (blocker) { blocker.hp = Math.max(1, blocker.hp - 400); blocker.flash = performance.now(); floater(blocker.x, blocker.y, '-400', '#ff7a2e', 14); }
      await sleep(500);
    }
  }
  async function checkSecretEnemy() { }
  function rewards(att, def, killed, support = false) {
    if (att.team !== 'player') return;
    const base = 13 * Math.max(.4, (def.lvl + 5) / (att.lvl + 5));
    let exp = Math.round(base * (killed ? 3 : 1) * (def.boss ? 2 : 1)*(typeof ENEMIES!=='undefined'?ENEMIES.reward(def):1)); if (!support && att.buf.insight) { exp *= 2; att.buf.insight = false; }
    gainExp(att, support ? Math.round(exp * .5) : exp);
    if (killed) {
      let c = Math.round(Math.round(MECHS[def.mech].hp / 3 / 10) * 10 * (def.boss ? 2 : 1)*(typeof ENEMIES!=='undefined'?ENEMIES.reward(def):1)); if (att.buf.fortune) { c *= 2; att.buf.fortune = false; }
      st.credits += c; st.kills++; SAVE.pilots[att.pilot].kills++;
      if (CB.dist(att,def) >= 5) record(att,'ranged');
      floater(att.x, att.y, '+' + c + ' CR', '#ffd166', 13);
    }
  }
  function gainExp(u, n) {
    const p = SAVE.pilots[u.pilot]; if (!p) return;
    p.exp += Math.round(n * RULES.catchUp(p.lvl,st.partyLevel));
    let up = 0;
    while (p.exp >= RULES.expCap(p.lvl)) { p.exp -= RULES.expCap(p.lvl); p.lvl++; p.pp += RULES.levelPP(p.lvl); up++; }
    if (up) { u.lvl = p.lvl; floater(u.x, u.y - 0.6, 'LEVEL UP!', '#7dffb0', 16, 1600); SFX.play('levelup'); }
  }
  async function unitDown(u) {
    SFX.play('boom'); floater(u.x, u.y, 'DESTROYED', '#ff4d6d', 15);
    if (u.tag) { SAVE.flags['defeated_' + u.tag + '_turn'] = st.turn; st.defeatedTurn[u.tag] = st.turn; }
    if (u.team === 'player') {
      st.losses++;
      if ((st.ch.vital || []).includes(u.pilot)) { await sleep(400); await lose(`${NAMES[u.pilot]} has been shot down.`); return; }
      UI.toast(`${NAMES[u.pilot]} was shot down and retreats for repairs.`);
    }
  }

  // ---------- phases ----------
  async function phaseStart(phase) {
    phaseSweep = performance.now();
    if (!st) return;
    st.phase = phase;
    if(typeof SFX.phase==='function')SFX.phase(phase,st.ch);
    for (const u of st.units) {
      u.counterUsed = false; u.openingUsed = false; u.veilUsed = false;
      if ((phase === 'enemy') !== (u.team === 'enemy')) u.guardUsed = 0;
    }
    await UI.phaseBanner(phase, st.turn);
    for (const u of st.units) {
      if (u.hp <= 0) continue;
      const mine = (phase === 'player' && u.team === 'player') || (phase === 'enemy' && u.team === 'enemy') || (phase === 'ally' && u.team === 'ally');
      if (!mine) continue;
      // buffs that last "until your next phase" expire
      u.buf.focus = false; u.buf.ironwall = false; u.buf.accel = false;
      u.moved = false; u.acted = false; u.transformed = false;
      u.moveDistance = 0; u.supportUsed = 0; u.redeployed = false; u.movementRecorded = false;
      u.overwatchUsed = 0; u.orderUsed = false; u.tauntUsed = false;
      if (CB.classFx(u).selfCleanse) u.status = {};
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
      if (u.team === 'player') {
        u.sp = Math.min(CB.pstats(u).SP,u.sp + 2 + CB.classFx(u).regenSP);
        if (SAVE.refits?.bay) u.hp = Math.min(ms.hp,u.hp + Math.round(ms.hp * .03 * SAVE.refits.bay));
        if (phase === 'player') for (const other of st.units) if (other.uid > u.uid && other.hp > 0 && CB.dist(u,other) === 1) COMBOS.bond(u,other,'formation');
      }
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
    if (e.escortPath) { await advanceEscort(e); return; }
    const holding = e.hold && (e.hold >= 99 || st.turn <= e.hold);
    const drawn = e.taunted;
    e.taunted = null;
    const foes = st.units.filter(o => o.hp > 0 && foeOf(o,e));
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
        if (typeof ENEMIES !== 'undefined') score += ENEMIES.supportScore(e,x,y,st);
        if (f === drawn) score += 20000;
        if (CB.classFx(f).bait) score += 1000;
        if (!best || score > best.score) best = { x, y, f, w, score, moved };
      }
    });
    e.x = ox0; e.y = oy0;
    if (best) {
      if (e.aceSpirits) {
        const threshold = e.hp / CB.mstats(e).hp;
        const order = threshold<.34 ? 'ironwall' : threshold<.54 ? 'alert' : e.will>=120 ? 'valor' : st.turn>1 ? 'focus' : null;
        if (order && e.aceSpirits[order] && e.sp>=SPIRITS[order].cost) {
          e.aceSpirits[order]--; e.sp-=SPIRITS[order].cost; e.buf[order]=true;
          if (revealed(e.x,e.y)) {
            floater(e.x,e.y,SPIRITS[order].name.toUpperCase(),'#ffc784',16);
            SFX.play('spirit'); await sleep(280);
          }
        }
      }
      if (best.moved) {
        const path = pathTo(rr,e,best.x,best.y);
        if (await advanceUnderWatch(e,path)) return;
      }
      e.moved = best.moved;
      await sleep(150);
      await battle(e, best.f, best.w);
      return;
    }
    if (holding) return;
    // advance toward nearest foe
    let tgt = null, td = 1e9; for (const f of foes) { const d = CB.dist(e, f); if (d < td) { td = d; tgt = f; } }
    let bt = null, bd = 1e9; rr.tiles.forEach(k => { const [x, y] = k.split(',').map(Number); const d = Math.abs(x - tgt.x) + Math.abs(y - tgt.y); if (d < bd) { bd = d; bt = [x, y]; } });
    if (bt && (bt[0] !== e.x || bt[1] !== e.y)) await advanceUnderWatch(e,pathTo(rr,e,bt[0],bt[1]));
  }
  async function advanceUnderWatch(unit,path) {
    if (unit.team !== 'enemy') { await animateMove(unit,path); return false; }
    const watchers = st.units.filter(o => o.hp > 0 && !o.moveDistance && CB.classFx(o).overwatch > (o.overwatchUsed || 0));
    if (!watchers.length) { await animateMove(unit,path); return false; }
    let previous = { x:unit.x, y:unit.y };
    for (const point of path) {
      await animateMove(unit,[point]);
      for (const guard of watchers) {
        if ((guard.overwatchUsed || 0) >= CB.classFx(guard).overwatch) continue;
        const gun = CB.bestWeapon(guard,unit,false,true);
        if (!gun || (CB.dist(guard,previous) >= gun.rmin && CB.dist(guard,previous) <= gun.rmax)) continue;
        guard.overwatchUsed = (guard.overwatchUsed || 0) + 1;
        CB.spend(guard,gun);
        const res = CB.roll(guard,unit,gun,'none');
        CB.applyResult(guard,unit,res);
        record(guard,'counters');
        if (res.hit) record(guard,'hits');
        floater(unit.x,unit.y,res.hit ? 'OVERWATCH −'+res.dmg : 'OVERWATCH MISS','#88ffc9',15);
        SFX.play('rail'); rewards(guard,unit,unit.hp <= 0);
        if (unit.hp <= 0) { await unitDown(unit); return true; }
      }
      previous = {x:unit.x,y:unit.y};
    }
    return false;
  }
  async function advanceEscort(unit) {
    const next = unit.escortPath[unit.escortStep + 1];
    if (st.unitAt(...next)) {
      floater(unit.x, unit.y, 'ROAD BLOCKED', '#ffd166', 13);
      return;
    }
    await animateMove(unit, [next]);
    unit.escortStep++;
    if (unit.escortStep === unit.escortPath.length - 1) {
      unit.escorted = true;
      unit.hp = 0;
      floater(unit.x, unit.y, 'EVACUATED', '#76ffd9', 16);
      UI.refreshHUD(st);
    }
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
      if (at.escorted) ok ||= st.units.some(u => u.tag === at.escorted && u.escorted);
      if (!ok) continue;
      st.fired[key] = st.turn;
      if (ev.script) {
        const contact = ev.at.hp?.tag && st.find(ev.at.hp.tag);
        const speaker = ev.script.find(c=>c.s && st.find(c.s));
        focus(contact || (speaker && st.find(speaker.s)));
        let result;
        try { result = await UI.runScript(ev.script,{overlay:true}); }
        finally { releaseFocus(); }
        if (result==='endmap:true') { await win(true); return; }
      }
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
  function addRoster(pid) { if (!pid || !PILOTS[pid]) return; if (!SAVE.roster.includes(pid)) { SAVE.roster.push(pid); if (!SAVE.pilots[pid]) SAVE.pilots[pid] = newPilotSave(pid); if (EXPANSION.crew.includes(pid)) { SAVE.auxiliary ||= []; if(SAVE.auxiliary.length<4+(SAVE.refits?.wing||0)) SAVE.auxiliary.push(pid); } } }
  async function checkEnd() {
    if (!st) return true;
    if (st.ch.requiredEvents?.some(index => !st.fired['e' + index])) return false;
    const win_ = st.ch.win;
    const enemiesLeft = st.units.filter(u => u.team === 'enemy' && u.hp > 0).length;
    let won = false;
    if (win_.escort) {
      const carriers = st.units.filter(u => win_.escort.includes(u.tag));
      if (carriers.some(u => !u.escorted && u.hp <= 0)) {
        await lose('A shelter carrier was destroyed before reaching the gate.');
        return true;
      }
      won = carriers.length === win_.escort.length && carriers.every(u => u.escorted);
    } else if (win_ === 'rout') {
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
    (ch.events || []).forEach((ev, i) => { if (!st.fired['e' + i] && ev.join && (!ev.cond || ev.cond(SAVE))) ev.join.forEach(o => addRoster(o.p)); }); const s = { turn: st.turn, flags: SAVE.flags, units: st.units };
    const bonus = ch.bonus && ch.bonus.check(s);
    const credits = st.credits + (ch.reward.credits || 0);
    const parts = (ch.reward.parts || []).slice(); if (bonus && ch.bonus.part) parts.push(ch.bonus.part);
    SAVE.credits += credits; parts.forEach(p => SAVE.inventory[p] = (SAVE.inventory[p] || 0) + 1);
    const merits = bonus ? 2 : 0;
    SAVE.merits = (SAVE.merits || 0) + merits;
    const rank = st.losses >= 2 ? 'C' : st.losses ? 'B' : st.turn <= 10 && bonus && st.damageTaken < 22000 ? 'S' : 'A';
    SAVE.ranks ||= {};
    if (!SAVE.ranks[SAVE.chapter] || 'SABC'.indexOf(rank) < 'SABC'.indexOf(SAVE.ranks[SAVE.chapter])) SAVE.ranks[SAVE.chapter] = rank;
    if (SAVE.defeats) delete SAVE.defeats[SAVE.chapter];
    const kills = st.kills; const found = st.secrets.filter(x => x.found).length, total = st.secrets.length;
    const data = { title: ch.title, turn: st.turn, credits, parts, merits, rank, damage:st.damageTaken, losses:st.losses, bonus: ch.bonus ? { text: ch.bonus.text, ok: bonus } : null, kills, secrets: `${found}/${total}` };
    stop();
    await UI.victory(data);
    GAME.afterMap(viaEvent);
  }
  async function lose(text) {
    const mode = RULES.mode(SAVE), chapter = SAVE.chapter;
    SAVE.defeats ||= {};
    SAVE.defeats[chapter] = (SAVE.defeats[chapter] || 0) + 1;
    if (!mode.retries) SAVE.failedChapter = chapter;
    GAME.persist();
    stop();
    const outcome = await UI.defeat(text,{retry:mode.retries, assist:mode.assist && SAVE.defeats[chapter] >= 2});
    if (mode.retries) GAME.retryMap(outcome === 'assist');
    else GAME.toTitle();
  }

  return { get geom() { return { T, ox, oy, point }; }, revealed, point, toTile, resize,start, stop, beginAttack, targetsFor, waitUnit, useSpirit, serviceTargets, service, order, taunt, transform, endPlayerPhase, toggleThreat, cancel, confirmAttack, reach, get state() { return st; }, get ui() { return ui; }, floater, pilotMech, heroMech, addRoster, avgLevel };
})();
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
