// ===== Game controller, save/load, title & setup =====
'use strict';
const SAVE_KEY = 'iron-requiem-save-v1';
function newPilotSave(pid, lvl) {
  let L = lvl;
  if (L == null) { const ls = (SAVE && SAVE.roster ? SAVE.roster : []).filter(p => SAVE.pilots && SAVE.pilots[p]).map(p => SAVE.pilots[p].lvl); L = ls.length ? Math.round(ls.reduce((a, b) => a + b, 0) / ls.length) : 1; }
  if (pid === 'lucien' || pid === 'sera') L += 2;
  return { lvl: L, exp: 0, pp: 2 + Math.floor(L / 2), nodes: {}, kills: 0 };
}
function defaultSave() {
  return { v: 1, chapter: 'c1', hero: { name: 'Rei Kasuga', gender: 'm', path: 'real' }, flags: { res: 0 }, credits: 5000, roster: ['rei', 'mira'], pilots: { rei: { lvl: 1, exp: 0, pp: 2, nodes: {}, kills: 0 }, mira: { lvl: 1, exp: 0, pp: 2, nodes: {}, kills: 0 } }, mechs: {}, inventory: { plating: 1 }, codex: [], settings: { anim: 'full', defAuto: false, autoEnd: false, sfx: 0.7, music: 0.4 }, endings: [] };
}
let SAVE = defaultSave();
const BASE_NAMES_REI = NAMES.rei;
function applyHero() {
  NAMES.rei = SAVE.hero.name || 'Rei Kasuga';
  PORTRAITS.rei = SAVE.hero.gender === 'f' ? PORTRAITS.rina : PORTRAITS.rei_m;
  ART.clearPortraits();
}

const GAME = (() => {
  let titleRaf = 0, titleViewer = null;
  function persist(force) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { if (force) UI.toast('Could not save: browser storage is unavailable.'); } }
  function loadSave() { try { const s = localStorage.getItem(SAVE_KEY); if (!s) return null; return JSON.parse(s); } catch (e) { return null; } }
  function hideAll() { if (titleViewer) titleViewer.stop(); ['#title', '#setup', '#inter', '#story', '#mapScreen', '#battle'].forEach(s => { const e = $(s); if (e) e.hidden = true; }); }
  function toTitle() {
    hideAll(); if (G.map) MAP.stop();
    const el = $('#title'); el.hidden = false;
    $('#btnContinue').disabled = !loadSave();
    const keyArt = ASSETS.title();
    if (R3D.ok && !titleViewer && !keyArt) { try { titleViewer = R3D.viewer($('#title3d'), 'alteonz'); } catch (e) { titleViewer = null; } }
    $('#title3d').hidden = !titleViewer || !!keyArt; if (titleViewer && !keyArt) titleViewer.start();
    cancelAnimationFrame(titleRaf); titleLoop();
    SFX.music('title');
  }
  function titleLoop() {
    const c = $('#titleCanvas'); const ctx = c.getContext('2d'); const W = c.clientWidth, H = c.clientHeight; if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
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
    const render = () => {
      const box = $('#setupBody'); box.innerHTML = '';
      const pcard = (g, label) => { const p = g === 'f' ? PORTRAITS.rina : PORTRAITS.rei_m; const c = h('canvas', { width: 180, height: 225 }); const pa = ASSETS.portrait(g === 'f' ? 'rina' : 'rei', 'normal', 180, 225); if (pa) c.getContext('2d').drawImage(pa, 0, 0); else ART.drawPortrait(c.getContext('2d'), p, 180, 225, 'normal'); return h('button', { class: 'pick' + (st.gender === g ? ' on' : ''), onclick: () => { st.gender = g; if (st.name === 'Rei Kasuga' || st.name === 'Rina Kasuga') st.name = g === 'f' ? 'Rina Kasuga' : 'Rei Kasuga'; render(); } }, c, h('span', {}, label)); };
      const mcard = (path, mid, label, blurb) => { const c = h('canvas', { width: 220, height: 220 }); const x = c.getContext('2d'); if (!ASSETS.drawStoryBG(x, 220, 220, 'hangar', 0)) ART.drawBG(x, 220, 220, 'hangar', 0, 0); const su = ASSETS.unit(mid); if (su) { const f = su.frames[0], s = Math.min(200 / f.width, 190 / (f.height * su.ground)); x.drawImage(f, 110 - f.width * s / 2, 208 - f.height * su.ground * s, f.width * s, f.height * s); } else if (R3D.ok) x.drawImage(R3D.snapshot(mid, 440, 440, { pad: 1.05 }), 0, 0, 220, 220); else { x.save(); x.translate(110, 205); x.scale(1.3, 1.3); ART.drawMech(x, MECHS[mid].vis, { t: 0.5 }); x.restore(); } const M = MECHS[mid]; return h('button', { class: 'pick wide' + (st.path === path ? ' on' : ''), onclick: () => { st.path = path; render(); } }, c, h('b', {}, label), h('span', { class: 'small' }, blurb), h('span', { class: 'small muted' }, `${ARMOR[M.armor].name} · HP ${M.hp} · Mob ${M.mob} · Move ${M.move}`)); };
      box.appendChild(h('div', { class: 'setupGrid' },
        h('div', {}, h('h4', { class: 'sec' }, '1 · Pilot'), h('div', { class: 'picks' }, pcard('m', 'Rei'), pcard('f', 'Rina')),
          h('label', { class: 'set' }, 'Name', h('input', { id: 'heroName', type: 'text', maxlength: 20, value: st.name, oninput: e => st.name = e.target.value }))),
        h('div', {}, h('h4', { class: 'sec' }, '2 · Path'), h('div', { class: 'picks' }, mcard('real', 'alteon', 'Real Robot — ALTEON', 'Fast, evasive, beam-coated. Dodges hits instead of taking them.'), mcard('super', 'alteon_s', 'Super Robot — ALTEON GIGAS', 'Heavy plate and huge fists. Takes the hit and hits back harder.')))));
      box.appendChild(h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => toTitle() }, 'Back'), h('button', { class: 'btn primary big', onclick: () => newGame(st) }, 'Begin the story ▸')));
    };
    render();
  }
  function newGame(st) {
    SAVE = defaultSave(); SAVE.hero = { name: (st.name || '').trim() || (st.gender === 'f' ? 'Rina Kasuga' : 'Rei Kasuga'), gender: st.gender, path: st.path };
    applyHero(); persist(); hideAll(); startChapter();
  }
  function cont() { const s = loadSave(); if (!s) return; SAVE = Object.assign(defaultSave(), s); SAVE.settings = Object.assign(defaultSave().settings, s.settings || {}); applyHero(); hideAll(); toIntermission(); }
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
    UI.initStoryCtl();
    $('#btnNew').onclick = () => { SFX.ensure(); SFX.play('confirm'); setup(); };
    $('#btnContinue').onclick = () => { SFX.ensure(); SFX.play('confirm'); cont(); };
    $('#btnTitleSettings').onclick = () => { SFX.ensure(); UI.settingsModal(); };
    $('#btnArchive').onclick = () => { SFX.ensure(); ARCHIVE.open(); };
    document.addEventListener('pointerdown', () => SFX.ensure(), { once: true });
    const tag = $('.tagline'), tagText = tag.textContent;
    toTitle();
    tag.textContent = 'Loading art…';
    $('#btnNew').disabled = $('#btnContinue').disabled = $('#btnArchive').disabled = true;
    ASSETS.load((d, n) => { tag.textContent = `Loading art… ${d}/${n}`; }).then(n => {
      tag.textContent = tagText + (n ? ` · ${n} art files loaded` : '');
      $('#btnNew').disabled = $('#btnArchive').disabled = false;
      if (n && ASSETS.tainted) UI.toast('Some offline art needs rebuilding. See the asset guide.');
      if (!$('#title').hidden) toTitle();
    });
  }
  return { boot, persist, toTitle, startChapter, afterMap, retryMap, toIntermission, newGame };
})();
window.addEventListener('load', () => GAME.boot());
