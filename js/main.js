// ===== Game controller, save/load, title & setup =====
'use strict';
const SAVE_KEY = 'iron-requiem-save-v1';
const SAVE_VERSION = 2;
const SAVE_SLOTS = [{ id: 'auto', key: SAVE_KEY, label: 'Autosave' }, ...[1, 2, 3].map(n => ({ id: String(n), key: 'iron-requiem-slot-' + n, label: 'Slot ' + n }))];
function newPilotSave(pid, lvl) {
  let L = lvl;
  if (L == null) { const ls = (SAVE && SAVE.roster ? SAVE.roster : []).filter(p => SAVE.pilots && SAVE.pilots[p]).map(p => SAVE.pilots[p].lvl); L = ls.length ? Math.round(ls.reduce((a, b) => a + b, 0) / ls.length) : 1; }
  if (pid === 'lucien' || pid === 'sera') L += 2;
  return { lvl: L, exp: 0, pp: 2 + Math.floor(L / 2), nodes: {}, kills: 0 };
}
function defaultSave() {
  return { v: SAVE_VERSION, chapter: 'c1', hero: { name: 'Rei Kasuga', gender: 'm', path: 'real' }, flags: { res: 0 }, credits: 5000, roster: ['rei', 'mira'], pilots: { rei: { lvl: 1, exp: 0, pp: 2, nodes: {}, kills: 0 }, mira: { lvl: 1, exp: 0, pp: 2, nodes: {}, kills: 0 } }, mechs: {}, inventory: { plating: 1 }, codex: [], settings: { anim: 'full', defAuto: false, autoEnd: false, sfx: 0.7, music: 0.4, graphics: 'auto' }, endings: [], meta: { savedAt: 0, playtime: 0 } };
}
function migrate(raw) {
  const object = x => x && typeof x === 'object' && !Array.isArray(x), number = (x, min = 0) => Number.isFinite(x) && x >= min;
  if (!object(raw)) throw new Error('This is not an Iron Requiem save.');
  const scan = x => { if (!x || typeof x !== 'object') return; for (const k of Object.keys(x)) { if (['__proto__', 'constructor', 'prototype'].includes(k)) throw new Error('This save contains an invalid field.'); scan(x[k]); } };
  scan(raw);
  if (raw.v !== 1 && raw.v !== SAVE_VERSION) throw new Error('Unsupported save version. Keep this file for the game version that created it.');
  if (raw.chapter !== null && (!raw.chapter || !CHAPTERS[raw.chapter])) throw new Error('The saved chapter is not available in this game.');
  if (!Array.isArray(raw.roster) || !raw.roster.length || raw.roster.some(p => typeof p !== 'string' || !PILOTS[p]) || new Set(raw.roster).size !== raw.roster.length) throw new Error('The saved pilot roster is invalid.');
  if (!object(raw.pilots) || !number(raw.credits)) throw new Error('The saved pilot progress or credits are invalid.');
  const s = JSON.parse(JSON.stringify(raw)), d = defaultSave();
  s.hero = Object.assign({}, d.hero, object(s.hero) ? s.hero : {});
  if (typeof s.hero.name !== 'string' || !s.hero.name.trim() || s.hero.name.length > 80 || !['m', 'f'].includes(s.hero.gender) || !['real', 'super'].includes(s.hero.path)) throw new Error('The saved protagonist is invalid.');
  for (const pid of s.roster) {
    const p = s.pilots[pid];
    if (!object(p) || !number(p.lvl, 1) || !Number.isInteger(p.lvl) || !number(p.exp) || !number(p.pp) || !object(p.nodes)) throw new Error('Invalid pilot progress: ' + NAMES[pid]);
    if (Object.values(p.nodes).some(v => typeof v !== 'boolean')) throw new Error('Invalid skill progress: ' + NAMES[pid]);
    if (p.kills == null) p.kills = 0;
    if (!number(p.kills)) throw new Error('Invalid pilot kill count: ' + NAMES[pid]);
  }
  for (const key of ['flags', 'mechs', 'inventory']) { if (s[key] == null) s[key] = d[key]; if (!object(s[key])) throw new Error('Invalid ' + key + ' data.'); }
  for (const [id, m] of Object.entries(s.mechs)) {
    if (!MECHS[id] || !object(m) || (m.up != null && (!object(m.up) || Object.values(m.up).some(v => !number(v) || !Number.isInteger(v))))) throw new Error('Invalid machine upgrades: ' + id);
    if (m.parts != null && (!Array.isArray(m.parts) || m.parts.length > 2 || m.parts.some(p => p !== null && !PARTS[p]))) throw new Error('Invalid machine parts: ' + id);
  }
  for (const [id, count] of Object.entries(s.inventory)) if (!PARTS[id] || !number(count) || !Number.isInteger(count)) throw new Error('Invalid inventory item: ' + id);
  s.codex = s.codex == null ? [] : s.codex; s.endings = s.endings == null ? [] : s.endings;
  if (!Array.isArray(s.codex) || s.codex.some(x => typeof x !== 'string') || !Array.isArray(s.endings) || s.endings.some(x => typeof x !== 'string')) throw new Error('Invalid campaign records.');
  if (s.auxiliary != null && (!Array.isArray(s.auxiliary) || s.auxiliary.length > 4 || s.auxiliary.some(p => !s.roster.includes(p)) || new Set(s.auxiliary).size !== s.auxiliary.length)) throw new Error('Invalid auxiliary wing.');
  s.settings = Object.assign({}, d.settings, object(s.settings) ? s.settings : {});
  if (!['full', 'fast', 'off'].includes(s.settings.anim) || !['auto', 'high', 'low'].includes(s.settings.graphics) || !number(s.settings.sfx) || s.settings.sfx > 1 || !number(s.settings.music) || s.settings.music > 1) throw new Error('Invalid sound or animation settings.');
  s.settings.defAuto = !!s.settings.defAuto; s.settings.autoEnd = !!s.settings.autoEnd;
  s.meta = Object.assign({}, object(s.meta) ? s.meta : {}, { savedAt: number(s.meta?.savedAt) ? s.meta.savedAt : 0, playtime: number(s.meta?.playtime) ? s.meta.playtime : 0 });
  s.v = SAVE_VERSION;
  return s;
}
let SAVE = defaultSave();
const BASE_NAMES_REI = NAMES.rei;
function applyHero() {
  NAMES.rei = SAVE.hero.name || 'Rei Kasuga';
  PORTRAITS.rei = SAVE.hero.gender === 'f' ? PORTRAITS.rina : PORTRAITS.rei_m;
  ART.clearPortraits();
}

const GAME = (() => {
  let titleRaf = 0, titleViewer = null, playing = false, sessionAt = Date.now(), storageWarned = false, sessionVisible = true;
  const memory = new Map();
  function storageError() { if (!storageWarned) { storageWarned = true; if (typeof UI !== 'undefined' && UI.toast) UI.toast('Browser storage is unavailable. Keep playing, but export a backup before closing this page.'); } }
  function read(key) { if (memory.has(key)) return memory.get(key); try { return localStorage.getItem(key); } catch (e) { storageError(); return null; } }
  function write(key, text) { try { localStorage.setItem(key, text); memory.delete(key); return true; } catch (e) { memory.set(key, text); storageError(); return false; } }
  function tick() { const t = Date.now(); if (playing && sessionVisible) SAVE.meta.playtime += Math.max(0, t - sessionAt); sessionAt = t; }
  function stamp() { tick(); SAVE.v = SAVE_VERSION; SAVE.meta.savedAt = Date.now(); }
  function persist(force) { stamp(); const ok = write(SAVE_KEY, JSON.stringify(SAVE)); if (force && !ok && UI.toast) UI.toast('Autosave is kept in this page only. Export a backup to keep it after closing.'); return ok; }
  function slot(id) { const x = SAVE_SLOTS.find(s => s.id === String(id)); if (!x) throw new Error('Invalid save slot.'); return x; }
  function slots() { return SAVE_SLOTS.map(info => { const text = read(info.key); if (!text) return Object.assign({}, info, { save: null, corrupt: false }); try { const raw = JSON.parse(text), save = migrate(raw); if (raw.v !== SAVE_VERSION) write(info.key, JSON.stringify(save)); return Object.assign({}, info, { save, corrupt: false }); } catch (e) { return Object.assign({}, info, { save: null, corrupt: true, error: e.message }); } }); }
  function loadSave() { return slots().filter(s => s.save).sort((a, b) => b.save.meta.savedAt - a.save.meta.savedAt)[0]?.save || null; }
  function saveSlot(id) { const info = slot(id); if (info.id === 'auto') return persist(true); stamp(); return write(info.key, JSON.stringify(SAVE)); }
  function deleteSlot(id) { const info = slot(id); try { localStorage.removeItem(info.key); memory.delete(info.key); return true; } catch (e) { memory.set(info.key, null); storageError(); return false; } }
  function useSave(s) { if (G.map) MAP.stop(); SAVE = migrate(s); applyHero(); playing = true; sessionAt = Date.now(); hideAll(); toIntermission(); }
  function loadSlot(id) { const s = slots().find(s => s.id === String(id)); if (!s?.save) throw new Error(s?.error || 'This slot is empty.'); useSave(s.save); }
  function exportJSON() { tick(); return JSON.stringify(migrate(playing ? SAVE : loadSave() || SAVE), null, 2); }
  function importJSON(text) { if (typeof text !== 'string' || text.length > 2e6) throw new Error('Paste an Iron Requiem save smaller than 2 MB.'); let s; try { s = JSON.parse(text); } catch (e) { throw new Error('The pasted text is not valid JSON.'); } const clean = migrate(s); useSave(clean); return clean; }
  function clearSetup() {
    const box = $('#setupBody');
    if (!box) return;
    for (const canvas of box.querySelectorAll('canvas')) canvas.width = 0;
    box.replaceChildren();
  }
  function hideAll() {
    if (titleViewer) titleViewer.stop();
    cancelAnimationFrame(titleRaf);
    const titleCanvas = $('#titleCanvas');
    if (titleCanvas) titleCanvas.width = 1;
    clearSetup();
    ['#title', '#setup', '#inter', '#story', '#mapScreen', '#battle'].forEach(s => { const e = $(s); if (e) e.hidden = true; });
  }
  function toTitle() {
    tick(); playing = false;
    hideAll(); if (G.map) MAP.stop();
    const el = $('#title'); el.hidden = false;
    $('#btnContinue').disabled = !loadSave();
    const keyArt = ASSETS.title();
    if (R3D.ok && ASSETS.loaded && !titleViewer && !keyArt) { try { titleViewer = R3D.viewer($('#title3d'), 'alteonz'); } catch (e) { titleViewer = null; } }
    $('#title3d').hidden = !titleViewer || !!keyArt; if (titleViewer && !keyArt) titleViewer.start();
    titleLoop();
    SFX.music('title');
  }
  function titleLoop() {
    const c = $('#titleCanvas'), scale = Math.min(1, 1920 / c.clientWidth, 1080 / c.clientHeight);
    const W = Math.max(1, Math.round(c.clientWidth * scale)), H = Math.max(1, Math.round(c.clientHeight * scale));
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const t = performance.now() / 1000;
    const ka = ASSETS.title();
    if (ka) { const s0 = Math.max(W / ka.width, H / ka.height) * 1.03; ctx.drawImage(ka, (W - ka.width * s0) / 2 + Math.sin(t * 0.1) * 8, (H - ka.height * s0) / 2, ka.width * s0, ka.height * s0); }
    else ART.drawBG(ctx, W, H, 'space', t, t * 20);
    if (!titleViewer && !ka) { const s = Math.min(W, H) / 230; ctx.save(); ctx.translate(W * 0.68, H * 0.95 + Math.sin(t) * 6); ctx.scale(-s, s); ART.drawMech(ctx, MECHS.alteonz.vis, { t, pose: ART.POSES.idle, wingScale: 1.4 }); ctx.restore(); }
    const g = ctx.createLinearGradient(0, 0, W * 0.7, 0); g.addColorStop(0, 'rgba(4,7,14,0.95)'); g.addColorStop(1, 'rgba(4,7,14,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (!$('#title').hidden) titleRaf = requestAnimationFrame(titleLoop);
  }
  function setup() {
    hideAll(); $('#setup').hidden = false;
    const st = { gender: 'm', path: 'real', name: 'Rei Kasuga' };
    let step = 1;
    const box = $('#setupBody');
    const selectCard = id => {
      for (const card of box.querySelectorAll('.pick')) {
        const active = card.id === id;
        card.classList.toggle('on', active);
        card.setAttribute('aria-pressed', String(active));
      }
    };
    const render = (focusId) => {
      clearSetup();
      const pilotCard = (gender, label) => {
        const art = ASSETS.portrait(gender === 'f' ? 'rina' : 'rei', 'normal', 560, 620);
        const canvas = art || h('canvas', { width: 560, height: 620 });
        canvas.setAttribute('aria-hidden', 'true');
        if (!art) {
          const ctx = canvas.getContext('2d');
          if (ctx) ART.drawPortrait(ctx, gender === 'f' ? PORTRAITS.rina : PORTRAITS.rei_m, 560, 620, 'normal');
        }
        return h('button', { id: 'pilot-' + gender, type: 'button', class: 'pick' + (st.gender === gender ? ' on' : ''), 'aria-pressed': String(st.gender === gender), onclick: () => {
          const defaults = ['Rei Kasuga', 'Rina Kasuga'];
          if (defaults.includes(st.name)) { st.name = label; $('#heroName').value = label; }
          st.gender = gender;
          selectCard('pilot-' + gender);
          SFX.play('select');
        } }, canvas, h('strong', {}, label));
      };
      const frameCard = (path, id, role, description) => {
        const width = 760, height = 520, mech = MECHS[id];
        const canvas = h('canvas', { width, height, 'aria-hidden': 'true' });
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (!ASSETS.drawStoryBG(ctx, width, height, 'hangar', 0)) ART.drawBG(ctx, width, height, 'hangar', 0, 0);
          const sprite = ASSETS.unit(id);
          if (sprite) {
            const frame = sprite.frames[0], scale = Math.min(width * .94 / frame.width, height * .95 / frame.height);
            ctx.drawImage(frame, (width - frame.width * scale) / 2, height * .96 - frame.height * sprite.ground * scale, frame.width * scale, frame.height * scale);
          } else {
            ctx.save(); ctx.translate(width / 2, height * .96); ctx.scale(3.35, 3.35);
            ART.drawMech(ctx, mech.vis, { t: .5 }); ctx.restore();
          }
        }
        return h('button', { id: 'frame-' + path, type: 'button', class: 'pick' + (st.path === path ? ' on' : ''), 'aria-pressed': String(st.path === path), onclick: () => {
          st.path = path; selectCard('frame-' + path); SFX.play('select');
        } }, canvas, h('span', { class: 'pickDetails' }, h('span', { class: 'eyebrow' }, role), h('strong', {}, mech.name),
          h('span', {}, description), h('span', { class: 'muted' }, `${ARMOR[mech.armor].name} · HP ${mech.hp.toLocaleString()} · Move ${mech.move}`)));
      };
      $('#setupStep').textContent = step === 1 ? 'New game · 1 of 2' : 'New game · 2 of 2';
      $('#setupTitle').textContent = step === 1 ? 'Choose your pilot' : 'Choose your robot';
      box.replaceChildren(
        h('div', { class: 'setupOptions' + (step === 2 ? ' frameOptions' : '') }, step === 1
          ? [pilotCard('m', 'Rei Kasuga'), pilotCard('f', 'Rina Kasuga')]
          : [frameCard('real', 'alteon', 'Real Robot', 'Mobile beam fighter with a ranged arsenal.'), frameCard('super', 'alteon_s', 'Super Robot', 'Heavy armor and powerful close-range attacks.')]),
        h('div', { class: 'setupFooter' },
          step === 1 ? h('label', { class: 'set' }, 'Pilot name', h('input', { id: 'heroName', type: 'text', maxlength: 20, value: st.name, oninput: e => { st.name = e.target.value; } }))
            : h('p', { class: 'setupPilot' }, 'Pilot · ' + (st.name.trim() || (st.gender === 'f' ? 'Rina Kasuga' : 'Rei Kasuga'))),
          h('div', { class: 'row' },
            h('button', { class: 'btn', onclick: () => { if (step === 1) toTitle(); else { step = 1; render('pilot-' + st.gender); } } }, 'Back'),
            h('button', { class: 'btn primary big', onclick: () => { if (step === 2) newGame(st); else { step = 2; render('frame-' + st.path); } } }, step === 1 ? 'Choose robot' : 'Begin the story'))));
      if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
    };
    render();
  }
  function newGame(st) {
    SAVE = defaultSave(); SAVE.hero = { name: (st.name || '').trim() || (st.gender === 'f' ? 'Rina Kasuga' : 'Rei Kasuga'), gender: st.gender, path: st.path };
    playing = true; sessionAt = Date.now();
    applyHero(); persist(); hideAll(); startChapter();
  }
  function cont() { const s = loadSave(); if (s) useSave(s); }
  async function startChapter() {
    hideAll(); const ch = CHAPTERS[SAVE.chapter]; if (!ch) { toIntermission(); return; }
    SFX.music(ch.mood);
    if (!SAVE.flags['pre_' + SAVE.chapter]) { await UI.runScript(ch.pre); SAVE.flags['pre_' + SAVE.chapter] = true; persist(); }
    await MAP.start(ch);
  }
  async function afterMap() {
    const ch = CHAPTERS[SAVE.chapter];
    if (SAVE.flags.zero) for (const [a, z] of [['alteon', 'alteonz'], ['alteon_s', 'alteonz_s']]) if (SAVE.mechs[a] && !SAVE.mechs[z]) SAVE.mechs[z] = JSON.parse(JSON.stringify(SAVE.mechs[a]));
    const r = await UI.runScript(ch.post);
    if (r && r.startsWith('end:')) { await ending(r.slice(4)); return; }
    const next = typeof ch.next === 'function' ? ch.next(SAVE) : ch.next;
    if (!next) { await ending('true'); return; }
    SAVE.chapter = next; persist(); toIntermission();
  }
  async function ending(kind) {
    SAVE.endings = Array.from(new Set([...(SAVE.endings || []), kind])); SAVE.chapter = kind === 'true' ? null : SAVE.chapter; persist();
    hideAll();
    await UI.modal(close => h('div', { class: 'card result ending' }, h('div', { class: 'eyebrow' }, kind === 'true' ? 'True ending' : 'Ending'), h('h2', {}, kind === 'true' ? 'Fourth Dawn' : 'The Song Continues'),
      h('p', {}, kind === 'true' ? 'Humanity, the Vael and the Ourobor stood together and the dark kept its distance.' : 'Earth endured, but the Silence is listening. Three or more compassionate choices open another path at the climax. Try replaying Mission 09 with your resonance raised.'),
      h('p', { class: 'muted small' }, `Resonance gathered: ${SAVE.flags.res || 0} · Route: ${SAVE.flags.route === 'B' ? 'Space' : 'Earth'}`),
      kind !== 'true' ? h('button', { class: 'btn', onclick: () => { close(); SAVE.chapter = 'c9'; SAVE.flags['pre_c9'] = false; persist(); toIntermission(); } }, 'Replay Mission 09') : null,
      h('button', { class: 'btn primary', onclick: () => close() }, 'Return to title')));
    toTitle();
  }
  function retryMap() { const ch = CHAPTERS[SAVE.chapter]; MAP.start(ch); }
  function toIntermission() { hideAll(); persist(); UI.intermission(); }

  function boot() {
    if (typeof QUALITY !== 'undefined') QUALITY.init();
    UI.initStoryCtl();
    if(typeof TOUCH!=='undefined')TOUCH.init({skipBattle:()=>SCENE.skip(),fastBattle:()=>SCENE.fastForward()});
    $('#btnNew').onclick = () => { SFX.ensure(); SFX.play('confirm'); setup(); };
    $('#btnContinue').onclick = () => { SFX.ensure(); SFX.play('confirm'); cont(); };
    $('#btnTitleSettings').onclick = () => { SFX.ensure(); UI.settingsModal(); };
    $('#btnArchive').onclick = () => { SFX.ensure(); ARCHIVE.open(); };
    if ($('#btnLoad')) $('#btnLoad').onclick = () => { SFX.ensure(); SAVES.openLoad(); };
    document.addEventListener('pointerdown', () => SFX.ensure(), { once: true });
    sessionVisible = !document.hidden;
    document.addEventListener('visibilitychange', () => { tick(); sessionVisible = !document.hidden; });
    const tag = $('.tagline'), tagText = tag.textContent;
    toTitle();
    tag.textContent = 'Loading art…';
    $('#btnNew').disabled = $('#btnContinue').disabled = $('#btnArchive').disabled = $('#btnLoad').disabled = true;
    return ASSETS.load((d, n) => { tag.textContent = `Loading art… ${d}/${n}`; }).then(n => {
      tag.textContent = tagText + (n ? ` · ${n} art files loaded` : '');
      $('#btnNew').disabled = $('#btnArchive').disabled = $('#btnLoad').disabled = $('#btnTitleSettings').disabled = false;
      if (n && ASSETS.tainted) UI.toast('Some offline art needs rebuilding. See the asset guide.');
      if (!$('#title').hidden) toTitle();
    });
  }
  return { boot, persist, toTitle, startChapter, afterMap, retryMap, toIntermission, newGame, migrate, slots, saveSlot, loadSlot, deleteSlot, exportJSON, importJSON, continue: cont };
})();
