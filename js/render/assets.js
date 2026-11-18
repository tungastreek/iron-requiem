// ===== Art importer: loads generated art from assets/ (see ART_PROMPTS.md), slices sheets, keys out backgrounds =====
// Every asset is optional. Missing files fall back to the built-in 3D/2D art.
'use strict';
const ASSETS = (() => {
  const store = { units: {}, portraits: {}, backgrounds: {}, battle: {}, tiles: {}, icons: {}, key: {}, events: {} };
  let tainted = false;
  const EXT = ['png', 'webp'];
  function loadImage(base) {
    const inventory = window.IRON_ART_META?.images;
    const formats = inventory ? inventory[base] : EXT;
    if (!formats?.length) return Promise.resolve(null);
    return new Promise(res => {
      let i = 0, retried = false, source; const img = new Image();
      const next = () => {
        if (i >= formats.length) { res(null); return; }
        retried = false;
        source = base + '.' + formats[i++];
        img.src = source;
      };
      img.onload = () => res(img);
      img.onerror = () => {
        if (inventory && source && /^https?:$/.test(location.protocol) && !retried) {
          retried = true;
          setTimeout(() => { img.src = source + '?retry=' + Date.now(); }, 200);
        } else next();
      };
      // file:// images taint canvases in Safari/Chrome. A local script delivers
      // the same PNG bytes as a data URL, which is safe for both canvas and WebGL.
      if (location.protocol === 'file:' && formats.includes('png')) {
        const script = document.createElement('script');
        script.src = 'assets/offline/' + base.replace(/^assets\//, '') + '.js';
        script.onload = () => { const data = window.IRON_OFFLINE?.[base]; if (data) { delete window.IRON_OFFLINE[base]; img.src = data; } else next(); script.remove(); };
        script.onerror = () => { script.remove(); next(); };
        document.head.appendChild(script);
      } else next();
    });
  }
  function canvasOf(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function fit(w, h, maxSize) {
    const scale = Math.min(1, maxSize / Math.max(w, h));
    return [Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale))];
  }
  // ---- background removal: flood fill from a cell's border with colour tolerance, soft edge ----
  function keyCell(img, sx, sy, sw, sh, tolerance) {
    const c = canvasOf(sw, sh), x = c.getContext('2d'); x.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    let d; try { d = x.getImageData(0, 0, sw, sh); } catch (e) { tainted = true; return { canvas: c, box: [0, 0, sw, sh] }; }
    const px = d.data, N = sw * sh;
    // already transparent? (pre-keyed PNG) — keep as is
    let transparentBorder = 0; for (let i = 0; i < sw; i++) if (px[i * 4 + 3] < 20) transparentBorder++;
    if (transparentBorder > sw * 0.8) return { canvas: c, box: bbox(px, sw, sh) };
    // background colour = median of border samples
    const samp = []; for (let i = 0; i < sw; i += 7) { samp.push(i, i + (sh - 1) * sw); } for (let j = 0; j < sh; j += 7) { samp.push(j * sw, j * sw + sw - 1); }
    const med = k => { const v = samp.map(i => px[i * 4 + k]).sort((a, b) => a - b); return v[v.length >> 1]; };
    const br = med(0), bg = med(1), bb = med(2);
    const dist = i => Math.abs(px[i * 4] - br) + Math.abs(px[i * 4 + 1] - bg) + Math.abs(px[i * 4 + 2] - bb);
    // Generated charcoal is slightly textured. Adapt to the sampled border,
    // then remove only connected matte so dark interior armor stays intact.
    const deviations = samp.map(dist).sort((a, b) => a - b);
    const TOL = Number.isFinite(tolerance)?Math.max(1,tolerance):Math.min(80, Math.max(34, deviations[Math.floor(deviations.length * .95)] + 12)), SOFT = TOL + 24;
    const mark = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0;
    const push = i => { if (!mark[i] && dist(i) <= TOL) { mark[i] = 1; q[qt++] = i; } };
    for (let i = 0; i < sw; i++) { push(i); push(i + (sh - 1) * sw); } for (let j = 0; j < sh; j++) { push(j * sw); push(j * sw + sw - 1); }
    while (qh < qt) { const i = q[qh++], xx = i % sw; if (xx > 0) push(i - 1); if (xx < sw - 1) push(i + 1); if (i >= sw) push(i - sw); if (i < N - sw) push(i + sw); }
    for (let i = 0; i < N; i++) {
      if (mark[i]) { px[i * 4 + 3] = 0; continue; }
      // soften the rim: pixels touching the background that are close to the bg colour fade out
      const xx = i % sw; const nb = (xx > 0 && mark[i - 1]) || (xx < sw - 1 && mark[i + 1]) || (i >= sw && mark[i - sw]) || (i < N - sw && mark[i + sw]);
      if (nb) { const dd = dist(i); if (dd < SOFT) px[i * 4 + 3] = Math.round(255 * Math.max(0.15, (dd - TOL) / (SOFT - TOL))); }
    }
    x.putImageData(d, 0, 0);
    return { canvas: c, box: bbox(px, sw, sh) };
  }
  function bbox(px, w, h) { let x0 = w, y0 = h, x1 = -1, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return x1 < 0 ? [0, 0, w, h] : [x0, y0, x1 - x0 + 1, y1 - y0 + 1]; }
  // ---- unit sheets: 2x2 frames -> 4 aligned transparent frames ----
  function processUnit(img, layout, meta={}) {
    const cw = Math.floor(img.width / (layout ? 4 : 2)), chh = Math.floor(img.height / (layout ? 4 : 2));
    const origins = layout ? [0, 1, 2, 3].map(col => [col * cw, layout.row * chh]) : [[0, 0], [cw, 0], [0, chh], [cw, chh]];
    const cells = [];
    try {
      for (const [sx, sy] of origins) cells.push(keyCell(img, sx, sy, cw, chh, meta.keyTolerance));
      let x0 = cw, y0 = chh, x1 = 0, y1 = 0; cells.forEach(c => { const [bx, by, bw, bh] = c.box; x0 = Math.min(x0, bx); y0 = Math.min(y0, by); x1 = Math.max(x1, bx + bw); y1 = Math.max(y1, by + bh); });
      const pad = 4; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(cw, x1 + pad); y1 = Math.min(chh, y1 + pad);
      const cropW = x1 - x0, cropH = y1 - y0;
      const [w, h] = fit(cropW, cropH, 448);
      const frames = cells.map(({canvas}) => {
        const frame = canvasOf(w, h);
        frame.getContext('2d').drawImage(canvas, x0, y0, cropW, cropH, 0, 0, w, h);
        return frame;
      });
      // the idle frame's own extent drives map icons & anchors
      const ib = cells[0].box; const ground = (ib[1] + ib[3] - y0) / cropH;
      return { frames, w, h, ground:meta.ground??ground, meta, keyed: !tainted };
    } finally {
      // Release the full-resolution keying surfaces before importing the next sheet.
      for (const {canvas} of cells) canvas.width = 0;
    }
  }
  function cellRects(img, cols, rows) {
    const cells = [];
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const left = Math.round(col * img.width / cols), top = Math.round(row * img.height / rows);
      const width = Math.round((col + 1) * img.width / cols) - left;
      const height = Math.round((row + 1) * img.height / rows) - top;
      cells.push({ img, left, top, width, height });
    }
    return cells;
  }
  function grid(img, cols, rows, maxSize) {
    return cellRects(img, cols, rows).map(({ left, top, width, height }) => {
      const [w, h] = fit(width, height, maxSize);
      const cell = canvasOf(w, h);
      cell.getContext('2d').drawImage(img, left, top, width, height, 0, 0, w, h);
      return cell;
    });
  }

  // ---- lists of what to look for ----
  const BG_KEYS = ['base', 'fire', 'hangar', 'bridge', 'sky', 'lab', 'elevator', 'space', 'colony', 'hive', 'vael', 'ice', 'void', 'dawn', 'ruins', 'city'];
  const BATTLE_KEYS = ['city', 'fire', 'ruins', 'sky', 'elevator', 'space', 'colony', 'hive', 'vael', 'ice', 'void'];
  const TILE_SETS = ['earth', 'snow', 'hive', 'space'];
  const ICON_SHEETS = ['skills', 'capstones', 'spirits', 'parts', 'types'];
  const EVENT_KEYS = ['ev_ashfall', 'ev_tower', 'ev_kaiser', 'ev_mural', 'ev_okonkwo', 'ev_zero', 'ev_reach', 'ev_dawn'];
  const UNIT_ALIAS = { carmine_e: 'carmine' };
  const ATLAS_PORTRAITS = { ...EXPANSION.portraits, ...OUROBOR_PORTRAITS };
  let loaded = false, count = 0;
  async function load(onProgress) {
    const units = Object.keys(MECHS).filter(k => MECHS[k] && !UNIT_ALIAS[k]);
    const portraits = Array.from(new Set(Object.keys(PORTRAITS).filter(k => k !== 'rei_m').concat(['rina'])));
    const jobs = [];
    units.filter(id => !MECHS[id].atlas).forEach(id => jobs.push(['units', id, 'assets/units/' + id]));
    const atlases = [...new Set(units.map(id => MECHS[id].atlas?.sheet).filter(Boolean))];
    atlases.forEach(id => jobs.push(['atlases', id, 'assets/units/' + id]));
    portraits.filter(id => !ATLAS_PORTRAITS[id]).forEach(id => jobs.push(['portraits', id, 'assets/portraits/' + id]));
    [...new Set(Object.values(ATLAS_PORTRAITS).map(x => x.sheet))].forEach(id => jobs.push(['portraitAtlases', id, 'assets/portraits/' + id]));
    BG_KEYS.forEach(k => jobs.push(['backgrounds', k, 'assets/backgrounds/' + k]));
    BATTLE_KEYS.forEach(k => jobs.push(['battle', k, 'assets/battle/' + k]));
    TILE_SETS.forEach(k => jobs.push(['tiles', k, 'assets/tiles/tiles_' + k]));
    ICON_SHEETS.forEach(k => jobs.push(['icons', k, 'assets/icons/icons_' + k]));
    jobs.push(['key', 'title', 'assets/key/title']);
    EVENT_KEYS.forEach(k => jobs.push(['events', k, 'assets/events/' + k]));
    let done = 0; const total = jobs.length;
    const worker = async () => { while (jobs.length) { const [kind, id, path] = jobs.shift(); const img = await loadImage(path); if (img) { try { ingest(kind, id, img); count++; } catch (e) { console.warn('Art import failed for', path, e); } } done++; if (onProgress) onProgress(done, total); } };
    await Promise.all([worker(), worker(), worker()]);
    loaded = true;
    if (count && tainted) console.warn('Some art could not be processed. Rebuild the offline asset scripts with tools/build_offline.py.');
    return count;
  }
  function ingest(kind, id, img) {
    switch (kind) {
      case 'units': store.units[id] = processUnit(img,null,window.IRON_ART_META?.units?.[id]||{}); break;
      case 'atlases': Object.keys(MECHS).filter(mid => MECHS[mid].atlas?.sheet === id).forEach(mid => { store.units[mid] = processUnit(img, MECHS[mid].atlas,window.IRON_ART_META?.units?.[mid]||{}); }); break;
      case 'portraits': { const cells = cellRects(img, 2, 2); store.portraits[id] = { normal: cells[0], angry: cells[1], smile: cells[2], shock: cells[3], sad: cells[3] }; break; }
      case 'portraitAtlases': {
        const cells = cellRects(img, 4, 4);
        for (const [pid, mapping] of Object.entries(ATLAS_PORTRAITS)) {
          if (mapping.sheet !== id) continue;
          const [normal, angry, alternate, hurt] = cells.slice(mapping.row * 4, mapping.row * 4 + 4);
          const brood = !!OUROBOR_PORTRAITS[pid];
          store.portraits[pid] = { normal, angry, smile: alternate, shock: brood ? alternate : hurt, sad: brood ? hurt : normal, hurt };
        }
        break;
      }
      case 'tiles': store.tiles[id] = grid(img, 4, 4, 192); break;
      case 'icons': store.icons[id] = grid(img, 4, 4, 96).map(c => {
        try { return keyCell(c, 0, 0, c.width, c.height).canvas; }
        finally { c.width = 0; }
      }); break;
      default: store[kind][id] = img;
    }
  }
  // ---- queries ----
  const unit = id => store.units[UNIT_ALIAS[id] || id] || null;
  function coverDraw(ctx, img, W, H, panX = 0, zoom = 1) {
    const s = Math.max(W / img.width, H / img.height) * zoom; const w = img.width * s, h = img.height * s;
    const maxPan = Math.max(0, (w - W) / 2); const px = Math.max(-maxPan, Math.min(maxPan, panX));
    ctx.drawImage(img, (W - w) / 2 - px, (H - h) / 2, w, h);
  }
  // returns true if drawn
  function drawStoryBG(ctx, W, H, key, t) { const img = store.backgrounds[key]; if (!img) return false; coverDraw(ctx, img, W, H, Math.sin(t * 0.05) * 20, 1.04); return true; }
  function drawBattleBG(ctx, W, H, key, off) {
    const img = store.battle[key]; if (!img) return false;
    // wide pan: wrap-around ping-pong across the image
    const s = Math.max(W / img.width, H / img.height) * 1.12, w = img.width * s, h = img.height * s, span = Math.max(1, w - W);
    const ph = (off * 0.6) % (span * 2); const x = ph < span ? ph : span * 2 - ph;
    ctx.drawImage(img, -x, (H - h) * 0.62, w, h); return true;
  }
  function drawEvent(ctx, W, H, key) { const img = store.events[key]; if (!img) return false; coverDraw(ctx, img, W, H); return true; }
  function title() { return store.key.title || null; }
  function portrait(pid, expr, w, h) {
    const p = store.portraits[pid]; if (!p) return null;
    const src = p[expr] || p.normal; const c = canvasOf(w, h), ctx = c.getContext('2d');
    if (!ctx) return null;
    const face=window.IRON_ART_META?.portraits?.[pid]?.face;
    const s = face ? w * .6 / (src.width * face[2]) : Math.max(w / src.width, h / src.height);
    const dw = src.width * s, dh = src.height * s;
    const x = face ? w * .5 - face[0] * dw : (w - dw) / 2;
    const y = face ? h * .38 - face[1] * dh : Math.min(0, (h - dh) * .2);
    ctx.drawImage(src.img, src.left, src.top, src.width, src.height, x, y, dw, dh);
    return c;
  }
  const iconCache = {};
  function mapIcon(id, size, flip, frame = 0) {
    const u = unit(id); if (!u) return null;
    const key = id + size + flip + frame; if (iconCache[key]) return iconCache[key];
    const S = size * 2, c = canvasOf(S, S), x = c.getContext('2d'), f = u.frames[frame] || u.frames[0];
    if (!x) return null;
    const big = ['XL', 'L'].includes(MECHS[id].size) ? 1 : 0.86; const sc = Math.min(S * 0.94 * big / f.width, S * 0.8 * big / f.height);
    const w = f.width * sc, hh = f.height * sc;
    x.save(); x.translate(S / 2, 0); if (!!flip !== !!u.meta?.facesLeft) x.scale(-1, 1);
    x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = S * 0.03;
    x.drawImage(f, -w / 2, S * 0.77 - hh * u.ground, w, hh); x.restore();
    iconCache[key] = c; return c;
  }
  // terrain tiles
  const TILE_SET_FOR = { urban: 'earth', coast: 'earth', lab: 'earth', elevator: 'earth', ice: 'snow', hive: 'hive', space: 'space', colony: 'space', vael: 'space' };
  const TILE_IDX = {
    earth: { '.': [0, 1], f: [2, 3], m: [4, 5], c: [6, 7], r: [8, 9], w: [10, 11], b: [12, 13], x: [15], h: [8], s: [0], a: [9], v: [12] },
    snow:  { '.': [0, 1], f: [2, 3], m: [4, 5], c: [6], r: [8, 9], w: [10, 11], b: [7], x: [15], h: [9], s: [0], a: [8], v: [13] },
    hive:  { '.': [0, 1], h: [2, 3, 4], r: [8, 9], m: [5, 6], w: [10, 11], b: [12], c: [7], f: [3], x: [15], s: [0], a: [9], v: [13] },
    space: { s: [0, 1], a: [2, 3, 4], b: [7], c: [6], v: [12, 13], x: [15], '.': [0], r: [8], w: [10, 11], m: [5], f: [9], h: [11] },
  };
  function tileFor(theme, ch, x, y) {
    const set = TILE_SET_FOR[theme] || 'earth', t = store.tiles[set]; if (!t) return null;
    const opts = TILE_IDX[set][ch] || TILE_IDX[set]['.'] || [0]; const i = opts[(((x * 73856093) ^ (y * 19349663)) >>> 0) % opts.length];
    return t[i] || null;
  }
  // icons by name -> [sheet, index]
  const ICON = {
    guard: ['skills', 5],
    a1: ['skills', 0], a3: ['skills', 1], a4: ['skills', 2], b1: ['skills', 3], b2: ['skills', 4], b3: ['skills', 5], b5: ['skills', 6], c1: ['skills', 7], c2: ['skills', 8], c4: ['skills', 9], c5: ['skills', 10],
    branch0: ['skills', 11], branch1: ['skills', 12], branch2: ['skills', 13], pp: ['skills', 14], locked: ['skills', 15],
    cap_rei: ['capstones', 0], cap_mira: ['capstones', 1], cap_gunnar: ['capstones', 2], cap_ilse: ['capstones', 3], cap_brann: ['capstones', 4], cap_odessa: ['capstones', 5], cap_jin: ['capstones', 6], cap_yuna: ['capstones', 7], cap_lucien: ['capstones', 8], cap_sera: ['capstones', 9],
    sec_cache: ['capstones', 10], sec_part: ['capstones', 11], sec_shard: ['capstones', 12], sec_repair: ['capstones', 13], sec_node: ['capstones', 14], sec_ambush: ['capstones', 15],
    focus: ['spirits', 0], strike: ['spirits', 1], alert: ['spirits', 2], valor: ['spirits', 3], ironwall: ['spirits', 4], guts: ['spirits', 5], zeal: ['spirits', 6], ardor: ['spirits', 7], accel: ['spirits', 8], mend: ['spirits', 9], rally: ['spirits', 10], fortune: ['spirits', 11], insight: ['spirits', 12], resolve: ['spirits', 13], cleanse: ['spirits', 14], sp: ['spirits', 15],
    thruster: ['parts', 0], plating: ['parts', 1], targeting: ['parts', 2], reactor: ['parts', 3], repair: ['parts', 4], resonator: ['parts', 5], nanocoat: ['parts', 6], apsaras: ['parts', 7],
    BURN: ['parts', 8], SHOCK: ['parts', 9], BREAK: ['parts', 10], SLOW: ['parts', 11], JAM: ['parts', 12], credits: ['parts', 13], bonus: ['parts', 14], secret: ['parts', 15],
    KIN: ['types', 0], BEAM: ['types', 1], PLAS: ['types', 2], BLADE: ['types', 3], EXPL: ['types', 4], GRAV: ['types', 5], SPIR: ['types', 6],
    HEAVY: ['types', 7], LIGHT: ['types', 8], COAT: ['types', 9], BIO: ['types', 10], VOID: ['types', 11], HULL: ['types', 12], HP: ['types', 13], EN: ['types', 14], WILL: ['types', 15],
  };
  function icon(name) { const m = ICON[name]; if (!m) return null; const s = store.icons[m[0]]; return s ? s[m[1]] || null : null; }
  // small <canvas> element for the DOM (or null)
  function iconEl(name, px = 28) { const ic = icon(name); if (!ic) return null; const c = canvasOf(px * 2, px * 2); c.getContext('2d').drawImage(ic, 0, 0, px * 2, px * 2); c.className = 'ico'; c.style.width = c.style.height = px + 'px'; return c; }
  function summary() { const o = {}; for (const k in store) o[k] = Object.keys(store[k]).length; return o; }
  return { load, unit, mapIcon, portrait, drawStoryBG, drawBattleBG, drawEvent, title, tileFor, icon, iconEl, summary, get loaded() { return loaded; }, get count() { return count; }, get tainted() { return tainted; } };
})();
