// ===== UI: story player, map HUD, menus, intermission =====
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const h = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const k in attrs) { if (k === 'class') e.className = attrs[k]; else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]); else if (k === 'html') e.innerHTML = attrs[k]; else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]); } kids.flat().forEach(c => { if (c == null || c === false) return; e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c); }); return e; };
const fmt = s => String(s).replace(/\{P\}/g, (NAMES.rei || 'Rei').split(' ')[0]);

const UI = (() => {
  // ================= STORY PLAYER =================
  const ENEMY_SIDE = ['kroll', 'draike', 'vasse', 'ixion', 'aurelion', 'hollow', 'beast', 'mother', 'grunt_c', 'grunt_f', 'vael'];
  let story = { bgKey: 'black', t0: 0, raf: 0, L: null, R: null, active: null, log: [], auto: false, skip: false };
  function speakerSide(sp) {
    if (ENEMY_SIDE.includes(sp)) return 'R';
    if (['lucien', 'sera', 'yuna'].includes(sp) && !SAVE.roster.includes(sp)) return 'R';
    return 'L';
  }
  function storyLoop() {
    const c = $('#storyBg'); const ctx = c.getContext('2d');
    const W = c.clientWidth, H = c.clientHeight; if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const tt = (performance.now() - story.t0) / 1000;
    if (!(story.cg && ASSETS.drawEvent(ctx, W, H, story.cg)) && !ASSETS.drawStoryBG(ctx, W, H, story.bgKey, tt)) ART.drawBG(ctx, W, H, story.bgKey, tt, tt * 33);
    story.raf = requestAnimationFrame(storyLoop);
  }
  function setPortrait(side, sp, expr) {
    const slot = $('#port' + side);
    if (!sp || sp === 'narr') { slot.innerHTML = ''; slot.dataset.sp = ''; return; }
    if (slot.dataset.sp !== sp + expr) {
      slot.innerHTML = ''; const cv = ART.portrait(sp, expr, 360, 450); const img = h('canvas', { width: 360, height: 450, class: 'portrait' }); img.getContext('2d').drawImage(cv, 0, 0); slot.appendChild(img);
      slot.dataset.sp = sp + expr; slot.classList.remove('enter'); void slot.offsetWidth; slot.classList.add('enter');
    }
  }
  function clickWait() {
    return new Promise(res => {
      const el = $('#story'); let done = false;
      const fin = () => { if (done) return; done = true; story.wake = null; el.removeEventListener('click', onc); window.removeEventListener('keydown', onk); clearTimeout(tm); res(); };
      const onc = e => { if (e.target.closest('.storyCtl') || e.target.closest('.choices') || e.target.closest('#logPanel')) return; fin(); };
      const onk = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); fin(); } };
      el.addEventListener('click', onc); window.addEventListener('keydown', onk);
      const tm = story.skip ? setTimeout(fin, 40) : story.auto ? setTimeout(fin, 2400) : null;
      story.wake = fin;
    });
  }
  async function typeText(el, source, speaker) {
    const lines = DIALOGUE.segments(source);
    const storyEl = $('#story'), dlg = $('#story .dlg');
    el.replaceChildren();
    dlg.classList.toggle('radio',lines.some(line=>line.tags.includes('comm')));
    dlg.classList.toggle('shouted',lines.some(line=>line.tags.includes('shout')));
    let stop = false, blip = 0;
    const skipTyping = e=>{ if (!e.target.closest('.storyCtl')) stop = true; };
    const skipKey = e=>{ if (e.key===' ' || e.key==='Enter') { e.preventDefault(); stop=true; } };
    storyEl.addEventListener('click',skipTyping);
    window.addEventListener('keydown',skipKey);
    try {
      for (const line of lines) {
        if (line.pause && !story.skip && !stop) { await sleep(line.pause); continue; }
        const span = h('span',{class:line.tags.map(key=>'cue-'+key).join(' ')});
        el.appendChild(span);
        if (!story.skip && !stop) {
          const characters = Array.from(line.text);
          const step = line.tags.includes('whisper') ? 29 : speaker==='mira' ? 12 : speaker==='beast' ? 22 : 16;
          for (let i=2;i<=characters.length+1 && !stop && !story.skip;i+=2) {
            span.textContent = characters.slice(0,i).join('');
            if (++blip%3===0) SFX.play('text');
            await sleep(step);
          }
        }
        span.textContent = line.text;
      }
    } finally {
      storyEl.removeEventListener('click',skipTyping);
      window.removeEventListener('keydown',skipKey);
    }
  }
  function showChoices(opts) {
    return new Promise(res => {
      const box = $('#story .choices'); box.innerHTML = ''; box.hidden = false;
      opts.forEach((o, i) => box.appendChild(h('button', { class: 'choice', onclick: e => { e.stopPropagation(); SFX.play('confirm'); box.hidden = true; box.innerHTML = ''; res(o); } }, h('span', { class: 'cidx' }, String(i + 1)), fmt(o.t))));
    });
  }
  async function titleCard(t, sub) {
    const tc = $('#titleCard'); tc.innerHTML = ''; tc.appendChild(h('div', { class: 'tc-main' }, t)); if (sub) tc.appendChild(h('div', { class: 'tc-sub' }, sub));
    tc.hidden = false; tc.classList.remove('show'); void tc.offsetWidth; tc.classList.add('show');
    await sleep(story.skip ? 200 : 2600); tc.hidden = true;
  }
  async function runScript(script, opts = {}) {
    const el = $('#story'); el.hidden = false; el.classList.toggle('overlay', !!opts.overlay);
    if (!opts.overlay) { story.t0 = performance.now(); cancelAnimationFrame(story.raf); storyLoop(); }
    story.skip = false; $('#btnSkip').classList.remove('on');
    setPortrait('L', null); setPortrait('R', null); $('#story .dlg').hidden = true;
    const labels = {}; script.forEach((c, i) => { if (c.label) labels[c.label] = i; });
    let result = null;
    for (let i = 0; i < script.length; i++) {
      const c = script[i];
      if (c.label) continue;
      if (c.if) { if (c.if(SAVE) && labels[c.go] != null) i = labels[c.go]; continue; }
      if (c.go) { if (labels[c.go] != null) { i = labels[c.go]; continue; } }
      if (c.bg) { story.bgKey = c.bg; story.cg = null; }
      if (c.cg && ASSETS.drawEvent(document.createElement('canvas').getContext('2d'), 1, 1, c.cg)) { story.cg = c.cg; if (opts.overlay && !el.classList.contains('cgshow')) { el.classList.add('cgshow'); story.t0 = performance.now(); cancelAnimationFrame(story.raf); storyLoop(); } }
      if (c.cgEnd) { story.cg = null; if (opts.overlay) { el.classList.remove('cgshow'); cancelAnimationFrame(story.raf); } }
      if (c.m) SFX.music(c.m);
      if (c.codex) { if (!SAVE.codex.includes(c.codex)) { SAVE.codex.push(c.codex); toast('Codex updated: ' + CODEX[c.codex].t); } }
      if (c.set) Object.assign(SAVE.flags, c.set);
      if (c.res) SAVE.flags.res = (SAVE.flags.res || 0) + c.res;
      if (c.join) { MAP.addRoster(c.join); toast(NAMES[c.join] + ' joined the Halcyon!'); }
      if (c.remove && G.map) { const u = G.map.find(c.remove); if (u) { u.hp = 0; u.retreated = true; G.map.defeatedTurn[u.tag] = G.map.turn; } }
      if (c.fx && !QUALITY.reducedMotion) { if (c.fx === 'shake') { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); SFX.play('boom'); } else { const f = $('#storyFlash'); f.className = c.fx === 'white' ? 'white' : 'flash'; void f.offsetWidth; f.classList.add('go'); SFX.play(c.fx === 'white' ? 'choir' : 'zap'); await sleep(c.fx === 'white' ? 900 : 250); } }
      if (c.title) { $('#story .dlg').hidden = true; await titleCard(c.title, c.sub); }
      if (c.endmap) { result = 'endmap:' + c.endmap; break; }
      if (c.end) { result = 'end:' + c.end; break; }
      if (c.n != null || c.s) {
        const dlg = $('#story .dlg'); dlg.hidden = false;
        const isN = c.n != null; const text = fmt(isN ? c.n : c.t);
        dlg.classList.toggle('narr', isN);
        if (!isN) {
          const side = speakerSide(c.s); setPortrait(side, c.s, c.e || 'normal');
          $('#portL').classList.toggle('dim', side !== 'L'); $('#portR').classList.toggle('dim', side !== 'R');
          $('#story .name').textContent = fmt(NAMES[c.s] || c.s); $('#story .name').style.setProperty('--nc', (PORTRAITS[c.s] || {}).eye || '#62f3ff');
        } else { $('#story .name').textContent = ''; $('#portL').classList.add('dim'); $('#portR').classList.add('dim'); }
        story.log.push({ n: isN ? '' : fmt(NAMES[c.s] || ''), t: DIALOGUE.plain(text) }); if (story.log.length > 200) story.log.shift();
        await typeText($('#story .text'), text,c.s);
        await clickWait();
      }
      if (c.choice) {
        story.skip = false; $('#btnSkip').classList.remove('on');
        const opts2 = c.choice; const o = await showChoices(opts2);
        story.log.push({ n: '▶', t: fmt(o.t) });
        if (o.set) Object.assign(SAVE.flags, o.set);
        if (o.res) SAVE.flags.res = (SAVE.flags.res || 0) + o.res;
        if (o.go && labels[o.go] != null) i = labels[o.go];
      }
    }
    if (el.classList.contains('cgshow')) { el.classList.remove('cgshow'); cancelAnimationFrame(story.raf); } story.cg = null;
    el.hidden = true; el.classList.remove('overlay');
    if (!opts.overlay) cancelAnimationFrame(story.raf);
    moveToastToMap();
    return result;
  }
  function initStoryCtl() {
    $('#btnAuto').onclick = e => { e.stopPropagation(); story.auto = !story.auto; e.currentTarget.classList.toggle('on', story.auto); if (story.auto && story.wake) setTimeout(() => story.wake && story.wake(), 1200); };
    $('#btnSkip').onclick = e => { e.stopPropagation(); story.skip = !story.skip; e.currentTarget.classList.toggle('on', story.skip); if (story.skip && story.wake) story.wake(); };
    $('#btnLog').onclick = e => { e.stopPropagation(); const p = $('#logPanel'); p.hidden = !p.hidden; if (!p.hidden) { p.innerHTML = ''; p.appendChild(h('div', { class: 'logHead' }, 'Dialogue log', h('button', { class: 'btn sm', onclick: ev => { ev.stopPropagation(); p.hidden = true; } }, 'Close'))); story.log.slice(-80).forEach(l => p.appendChild(h('div', { class: 'logLine' }, l.n ? h('b', {}, l.n + ' ') : null, l.t))); p.scrollTop = 1e9; } };
  }

  // ================= TOAST / NOTICE =================
  let toastT = 0;
  function toast(msg) {
    const onMap = !$('#mapScreen').hidden && $('#story').hidden;
    const t = $(onMap ? '#mapNotice' : '#toast');
    $(onMap ? '#toast' : '#mapNotice').classList.remove('show');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.classList.remove('show'); t.textContent = ''; }, 2600);
  }
  function moveToastToMap() {
    const current = $('#toast');
    if (!$('#mapScreen').hidden && current.classList.contains('show')) toast(current.textContent);
  }
  function modal(content, cls = '') {
    return new Promise(res => {
      const m = $('#modal'); m.innerHTML = ''; m.className = 'modal ' + cls; m.hidden = false;
      const close = v => { m.hidden = true; m.innerHTML = ''; res(v); };
      m.appendChild(content(close));
      const first = m.querySelector('button'); if (first) setTimeout(() => first.focus(), 50);
    });
  }
  function notice(title, msg, kind, iconName) { return modal(close => h('div', { class: 'card notice ' + (kind || '') }, iconName ? ASSETS.iconEl(iconName, 64) : null, h('div', { class: 'eyebrow' }, kind === 'warn' ? 'Sensor alert' : 'Secret found'), h('h3', {}, title), h('p', {}, msg), h('button', { class: 'btn primary', onclick: () => close() }, 'Continue'))); }

  // ================= MAP HUD =================
  function mapHUD(st) {
    const ch = st.ch;
    $('#mapTitle').textContent = `${ch.num} · ${ch.title}`;
    $('#mapSize').textContent = `${st.w} × ${st.h}`;
    $('#mapNotice').classList.remove('show');
    moveToastToMap();
    $('#btnEnd').onclick = () => { SFX.play('confirm'); MAP.endPlayerPhase(); };
    $('#btnThreat').onclick = () => MAP.toggleThreat();
    $('#btnObj').onclick = () => objectiveCard(ch);
    $('#btnMapMenu').onclick = () => mapMenu();
    setThreatBtn(false); refreshHUD(st); $('#sidePanel').innerHTML = '<div class="hint">Hover a tile or unit for details. Click your unit to move. Right-click / Esc to cancel. T toggles enemy threat.</div>';
  }
  function setThreatBtn(on) { $('#btnThreat').classList.toggle('on', on); }
  function refreshHUD(st) {
    if (!st) return;
    const goal = objectiveText(st.ch, st);
    $('#mapGoal').textContent = goal;
    $('#mapGoal').title = goal;
    $('#mapTurn').textContent = `TURN ${st.turn}`;
    $('#mapPhase').textContent = st.phase === 'player' ? 'PLAYER PHASE' : st.phase === 'ally' ? 'ALLY PHASE' : 'ENEMY PHASE';
    $('#mapPhase').className = 'phase ' + st.phase;
    $('#mapCredits').textContent = `${(SAVE.credits + st.credits).toLocaleString()} CR`;
    const left = st.units.filter(u=>u.team==='enemy' && u.hp>0 && (!st.fog || MAP.revealed(u.x,u.y))).length;
    $('#mapEnemies').textContent = `${left} ${st.fog?'contacts':'hostile'}`;
  }
  function chip(type) { return h('span', { class: 'chip', style: `--c:${ATK[type].color}` }, ASSETS.iconEl(type, 14), ATK[type].short); }
  function skin(u) {
    if (u.team !== 'enemy') return 'skin-halcyon';
    const m = MECHS[u.mech];
    if (m.armor === 'BIO') return 'skin-ourobor';
    if (m.armor === 'VOID') return 'skin-vael';
    return m.faction === 'free_states' || ['zephyr','tyrant','carmine_e'].includes(u.mech) ? 'skin-freestates' : 'skin-concord';
  }
  function classBadge(u) {
    const frame = CLASSES.get(u.mech);
    return h('span',{class:'classBadge',style:'--class-ink:'+frame.color,title:frame.intro},ASSETS.iconEl('class_'+frame.id,16),frame.name);
  }
  function bar(value, max, kind) {
    const percent = Math.max(0, Math.min(100, value / max * 100));
    return h('div', { class: 'meter ' + kind },
      h('div', { class: 'meterReadout' }, h('b', {}, kind.toUpperCase()), h('span', {}, `${Math.max(0, Math.round(value)).toLocaleString()} / ${max.toLocaleString()}`)),
      h('div', { class: 'bar', 'aria-hidden': 'true' }, h('i', { style: `width:${percent}%` })));
  }
  function showTileInfo(x, y, tl, u) {
    if (u) { showUnit(u); return; }
    const t = TERRAIN[tl]; const p = $('#sidePanel'); p.innerHTML = '';
    p.appendChild(h('div', { class: 'tileInfo' }, h('h4', {}, t.name), h('div', { class: 'kv' }, h('span', {}, 'DEF'), h('b', {}, (t.def >= 0 ? '+' : '') + t.def + '%'), h('span', {}, 'EVA'), h('b', {}, (t.eva >= 0 ? '+' : '') + t.eva + '%'), h('span', {}, 'Move cost'), h('b', {}, t.cost >= 99 ? '—' : t.cost)), h('p', { class: 'muted' }, TERRAIN_NOTE[tl] || ''), h('p', { class: 'muted small' }, 'Flying units ignore terrain cost and bonuses.')));
  }
  function showUnit(u) {
    const p = $('#sidePanel'); p.innerHTML = '';
    const m = MECHS[u.mech], ms = CB.mstats(u), ps = CB.pstats(u);
    const pid = u.portrait || u.pilot || 'grunt_c';
    const pc = ART.portrait(pid, 'normal', 96, 120); const pimg = h('canvas', { width: 96, height: 120, class: 'pmini' }); pimg.getContext('2d').drawImage(pc, 0, 0);
    const name = u.nameOverride || m.name;
    const ter = CB.ter(u.mech);
    const pm = CB.formation(u);
    p.appendChild(h('div', { class: 'uhead ' + u.team }, pimg, h('div', {}, h('div', { class: 'uname' }, name), h('div', { class: 'upilot' }, (u.pname || NAMES[u.pilot] || '') + ` · Lv ${u.lvl}`), h('div', { class: 'ucls' }, m.cls), h('div', { class: 'armorTag', style: `--c:${ARMOR[ms.armor].color}` }, ARMOR[ms.armor].name + ' · ' + m.size))));
    const variant=typeof ENEMIES!=='undefined'?ENEMIES.label(u):null;if(variant)p.appendChild(h('p',{class:'muted small'},variant.description));
    if (u.team === 'player') p.appendChild(classBadge(u));
    const assist = COMBOS.remaining(u,'attack'), guard = COMBOS.remaining(u,'guard');
    p.appendChild(h('div',{class:'tags'},assist?h('span',{class:'tag green'},'Assist '+assist):null,guard?h('span',{class:'tag'},'Guard '+guard):null,
      CB.classFx(u).resonance?h('span',{class:'tag'},'Core '+(u.resonance || 0)+'%'):null));
    p.appendChild(bar(u.hp, ms.hp, 'hp')); p.appendChild(bar(u.en, ms.en, 'en'));
    if (u.escortPath) {
      p.appendChild(h('p', { class: 'hint' }, 'Follows the marked road during the ally phase. Keep its next tile clear.'));
      return;
    }
    p.appendChild(h('div', { class: 'kv four' }, h('span', {}, 'Will'), h('b', { class: 'gold' }, u.will), h('span', {}, 'SP'), h('b', { class: 'green' }, `${u.sp}`), h('span', {}, 'Move'), h('b', {}, ms.move), h('span', {}, 'Mob'), h('b', {}, ms.mob), h('span', {}, 'Armor'), h('b', {}, ms.arm), h('span', {}, 'Terrain'), h('b', { title: 'Air / Land / Sea / Space' }, `${ter.air}${ter.lnd}${ter.sea}${ter.spc}`)));
    if (pm) p.appendChild(h('div', { class: 'tag green' }, `Formation: +${pm} evasion from adjacent allies`));
    const sts = Object.keys(u.status); if (sts.length) p.appendChild(h('div', { class: 'tags' }, sts.map(k => h('span', { class: 'tag', style: `--c:${STATUS[k].color}`, title: STATUS[k].desc }, `${STATUS[k].name} ${u.status[k]}`))));
    const bufs = Object.keys(u.buf).filter(k => u.buf[k]); if (bufs.length) p.appendChild(h('div', { class: 'tags' }, bufs.map(k => h('span', { class: 'tag green' }, SPIRITS[k] ? SPIRITS[k].name : k))));
    // weaknesses
    const weak = Object.keys(ATK).filter(k => CHART[k][ms.armor] > 1), res = Object.keys(ATK).filter(k => CHART[k][ms.armor] < 1);
    p.appendChild(h('div', { class: 'wr' }, h('span', { class: 'muted' }, 'Weak to '), weak.map(chip), h('br'), h('span', { class: 'muted' }, 'Resists '), res.map(chip)));
    if (ms.barrier) p.appendChild(h('div', { class: 'tag', style: '--c:#c9a6ff' }, `${ms.barrier.name}: −${ms.barrier.val} dmg` + (ms.barrier.bypass.length ? ` (pierced by ${ms.barrier.bypass.map(b => ATK[b].name).join(', ')})` : '')));
    const wl = h('div', { class: 'wlist' });
    CB.weapons(u).forEach(w => wl.appendChild(h('div', { class: 'wrow' + (w.finisher ? ' fin' : '') }, chip(w.type), h('span', { class: 'wn' }, w.name), h('span', { class: 'wp' }, w.pow), h('span', { class: 'wr2' }, `${w.rmin}-${w.rmax}`), h('span', { class: 'we' }, w.en ? `${w.en}EN` : w.ammo ? `${u.ammo[w.idx] != null ? u.ammo[w.idx] : w.ammo}/${w.ammo}` : '—'))));
    p.appendChild(wl);
  }
  function hideMenus() { $('#actMenu').hidden = true; $('#wpnPanel').hidden = true; hideForecast(); }
  function actionMenu(u, moved) {
    if(typeof TOUCH!=='undefined')TOUCH.revealUnit(u,MAP.geom);
    const menu = $('#actMenu'); menu.innerHTML = ''; menu.hidden = false; $('#wpnPanel').hidden = true;
    const tg = MAP.targetsFor(u, moved); const canAtk = tg.some(t => t.ok);
    const add = (label, fn, dis, hint) => menu.appendChild(h('button', { class: 'act', disabled: dis ? 'disabled' : null, title: hint || '', onclick: () => { SFX.play('select'); fn(); } }, label));
    add('Attack', () => weaponPanel(u, moved), !canAtk, canAtk ? '' : 'No target in range');
    add('Spirit', () => spiritPanel(u));
    const fx = CB.classFx(u);
    if (fx.fieldService) {
      const allies = MAP.serviceTargets(u);
      for (const [label,restore] of [['Repair',false],['Resupply',true]]) add(label,async () => {
        const target = await pickAlly(allies,label+' which ally?');
        if (target) await MAP.service(u,target,restore);
      },!allies.length,'Needs an ally within service range');
    }
    if (fx.fieldOrders) {
      const allies = G.map.units.filter(o => o !== u && o.team === u.team && o.hp > 0 && CB.dist(u,o) <= 3);
      add('Command order',async () => {
        const target = await pickAlly(allies,'Issue an order to whom?');
        if (target) { MAP.order(u,target); actionMenu(u,moved); }
      },u.orderUsed || !allies.length,'Once per phase · Focus and Will');
    }
    if (fx.taunt) {
      const foes = G.map.units.filter(o => o.team === 'enemy' && o.hp > 0 && CB.dist(u,o) <= 3);
      add('Taunt',async () => {
        const target = await pickAlly(foes,'Draw whose fire?');
        if (target) { MAP.taunt(u,target); actionMenu(u,moved); }
      },u.tauntUsed || !foes.length);
    }
    if (u.mech === 'sylph' && !u.transformed) add(u.mode === 'fighter' ? 'Robot Mode' : 'Fighter Mode', () => MAP.transform(u));
    if (!moved) add('Move', () => { hideMenus(); MAP.ui.mode = 'moving'; MAP.ui.range = MAP.reach(u); });
    add('Wait', () => { hideMenus(); MAP.waitUnit(u); });
    add('Cancel', () => MAP.cancel());
    showUnit(u);
  }
  function weaponPanel(u, moved) {
    const pnl = $('#wpnPanel'); pnl.innerHTML = ''; pnl.hidden = false;
    pnl.appendChild(h('div', { class: 'phead' }, 'Select weapon', h('span', { class: 'muted small' }, moved ? ' · moved: post-move (P) weapons only' : '')));
    for (const w of CB.weapons(u)) {
      const why = CB.usable(u, w, null, moved);
      const hasT = G.map.units.some(o => o.hp > 0 && (o.team === 'enemy') !== (u.team === 'enemy') && CB.usable(u, w, CB.dist(u, o), moved, false, o) === null);
      const reason = why && why !== 'range' ? { move: 'Not post-move', en: 'Low EN', ammo: 'No ammo', will: `Will ${w.will}` }[why] : (!hasT ? 'No target' : '');
      pnl.appendChild(h('button', { class: 'wbtn' + (w.finisher ? ' fin' : ''), disabled: reason ? 'disabled' : null, onclick: () => { SFX.play('select'); pnl.hidden = true; $('#actMenu').hidden = true; MAP.beginAttack(u, w); } },
        chip(w.type), h('span', { class: 'wn' }, w.name + (w.combo?' · COMBO':'') + (w.post ? ' ᴾ' : '')), h('span', { class: 'wp' }, w.pow), h('span', { class: 'wr2' }, `${w.rmin}-${w.rmax}`), h('span', { class: 'we' }, w.en ? `${w.en} EN${w.combo?' each':''}` : w.ammo ? `${u.ammo[w.idx] != null ? u.ammo[w.idx] : w.ammo} rds` : '—'),
        w.status ? h('span', { class: 'stchip', style: `--c:${STATUS[w.status.id].color}` }, `${STATUS[w.status.id].name} ${w.status.ch}%`) : null,
        reason ? h('span', { class: 'why' }, reason) : null));
    }
    pnl.appendChild(h('button', { class: 'btn sm', onclick: () => { pnl.hidden = true; actionMenu(u, moved); } }, 'Back'));
  }
  function spiritPanel(u) {
    const pnl = $('#wpnPanel'); pnl.innerHTML = ''; pnl.hidden = false;
    pnl.appendChild(h('div', { class: 'phead' }, `Spirit commands · SP ${u.sp}`));
    for (const sid of pilotSpirits(u.pilot)) {
      const sp = SPIRITS[sid], cost = CLASSES.spiritCost(u,sid,SAVE), active = u.buf[sid];
      pnl.appendChild(h('button', { class: 'wbtn spirit', disabled: (u.sp < cost || active) ? 'disabled' : null, title: sp.desc, onclick: async () => {
        if (sid === 'mend') { const allies = G.map.units.filter(o => o.team === 'player' && o.hp > 0); const t = await pickAlly(allies); if (!t) return; MAP.useSpirit(u, sid, t); } else MAP.useSpirit(u, sid);
        spiritPanel(u);
      } }, ASSETS.iconEl(sid, 22), h('span', { class: 'wn' }, sp.name), h('span', { class: 'we' }, cost + ' SP'), h('span', { class: 'desc' }, sp.desc)));
    }
    pnl.appendChild(h('button', { class: 'btn sm', onclick: () => { pnl.hidden = true; actionMenu(u, u.moved); } }, 'Back'));
  }
  function pickAlly(list,title='Mend which ally?') { return modal(close => h('div', { class: 'card' }, h('h3', {}, title), h('div', { class: 'list' }, list.map(a => h('button', { class: 'btn', onclick: () => close(a) }, `${NAMES[a.pilot] || a.nameOverride || MECHS[a.mech].name} · ${a.hp}/${CB.mstats(a).hp}`))), h('button', { class: 'btn sm', onclick: () => close(null) }, 'Cancel'))); }
  function forecast(a, d, w) {
    const f = $('#forecast'), opening = f.hidden;
    f.innerHTML = '';
    const fa = CB.forecast(a, d, w, 'counter'); const cw = CB.bestWeapon(d, a, false, true); const fd = cw ? CB.forecast(d, a, {...cw,counter:true}, 'none') : null;
    const eff = effLabel(fa.mult); const pm = CB.posMods(a, d);
    const side = (u, wp, fc, isAtk) => h('div', { class: 'fside ' + u.team + ' ' + skin(u) }, h('div', { class: 'frole' }, isAtk ? 'Attack' : 'Response'), h('div', { class: 'fname' }, u.nameOverride || MECHS[u.mech].name), h('div', { class: 'fhp' }, bar(u.hp, CB.mstats(u).hp, 'hp')),
      wp ? h('div', { class: 'fw' }, chip(wp.type), ' ', wp.name) : h('div', { class: 'fw muted' }, 'No counter'),
      fc ? h('div', { class: 'fstats' }, h('div', {}, h('span', {}, 'DMG'), h('b', {}, fc.dmg)), h('div', {}, h('span', {}, 'HIT'), h('b', {}, fc.hit + '%')), h('div', {}, h('span', {}, 'CRIT'), h('b', {}, fc.crit + '%'))) : null,
      fc && isAtk ? h('div', { class: 'eff', style: `--c:${eff.c}` }, eff.t + (fa.mult !== 1 ? ` ×${fa.mult.toFixed(2)}` : '')) : null);
    f.appendChild(h('h2', { class: 'forecastTitle' }, 'Combat forecast'));
    const body = h('div', { class: 'forecastScroll', tabindex: '0', role: 'region', 'aria-label': 'Damage and counterattack details' },
      h('div', { class: 'fgrid' }, side(a, w, fa, true), side(d, cw, fd, false)));
    f.appendChild(body);
    const mods = [];
    const assist = COMBOS.support(a,d,w);
    if (assist && fa.dmg < d.hp) mods.push('Support · '+(NAMES[assist.unit.pilot] || MECHS[assist.unit.mech].name)+' ('+COMBOS.remaining(assist.unit,'attack')+')');
    if (d.team === 'enemy' && COMBOS.guards(d).length) mods.push('Enemy guard in range');
    for(const unit of [a,d]){const v=typeof ENEMIES!=='undefined'?ENEMIES.label(unit):null;if(v)mods.push(v.name+' · '+v.description);}
    if(w.combo){const p=COMBOS.partner(a,w);mods.push('COMBO · '+NAMES[p?.pilot]+' · both actions and '+w.en+' EN each');}
    if (pm.flank.pincer) mods.push('PINCER +25% dmg'); else if (pm.flank.n) mods.push('FLANK +10% dmg, +10 hit');
    if (pm.high) mods.push('HIGH GROUND +10 hit');
    if (pm.eva) mods.push(`Target formation −${pm.eva} hit`);
    if (w.status) mods.push(`${STATUS[w.status.id].name} ${w.status.ch}%`);
    if (CB.pushes(w) && !['XL'].includes(MECHS[d.mech].size)) mods.push('KNOCKBACK');
    if (mods.length) body.appendChild(h('div', { class: 'fmods' }, mods.map(m => h('span', { class: 'tag' }, m))));
    f.appendChild(h('div', { class: 'frow' },
      h('button', { class: 'btn primary', onclick: () => MAP.confirmAttack() }, 'Attack'),
      h('button', { class: 'btn', onclick: () => MAP.cancel() }, 'Clear target')));
    if (opening) {
      f.hidden = false;
      $('#mapBody').classList.add('forecasting');
      MAP.resize();
    }
  }
  function hideForecast() {
    const f = $('#forecast');
    if (f.hidden) return;
    f.hidden = true;
    $('#mapBody').classList.remove('forecasting');
    MAP.resize();
  }
  function defensePrompt(a, d, w) {
    return new Promise(res => {
      const weps = CB.weapons(d).filter(x => CB.usable(d, x, CB.dist(a, d), false, true) === null);
      let cw = CB.bestWeapon(d, a, false, true);
      const render = close => {
        const fa = CB.forecast(a, d, w, 'counter'), fe = CB.forecast(a, d, w, 'evade'), fdf = CB.forecast(a, d, w, 'defend');
        const fc = cw ? CB.forecast(d, a, {...cw,counter:true}, 'none') : null;
        const box = h('div', { class: 'card defp' },
          h('div', { class: 'eyebrow red' }, 'Enemy attack'),
          h('h3', {}, `${a.nameOverride || MECHS[a.mech].name} → ${MECHS[d.mech].name}`),
          h('div', { class: 'muted' }, chip(w.type), ' ', w.name, ` · ${effLabel(fa.mult).t}`),
          h('div', { class: 'defopts' },
            h('button', { class: 'dopt', disabled: cw ? null : 'disabled', onclick: () => { d._counterW = cw; close('counter'); } }, h('b', {}, 'Counter'), h('span', {}, `Take ${fa.dmg} (${fa.hit}%)`), cw ? h('span', { class: 'gold' }, `Hit back ${fc.dmg} (${fc.hit}%)`) : h('span', {}, 'No weapon in range')),
            h('button', { class: 'dopt', onclick: () => close('evade') }, h('b', {}, 'Evade'), h('span', {}, `Hit chance halved: ${fe.hit}%`), h('span', {}, `Damage ${fe.dmg}`)),
            h('button', { class: 'dopt', onclick: () => close('defend') }, h('b', {}, 'Defend'), h('span', {}, `Damage halved: ${fdf.dmg}`), h('span', {}, `Hit ${fdf.hit}%`))),
          weps.length > 1 ? h('div', { class: 'cwsel' }, h('span', { class: 'muted small' }, 'Counter with: '), weps.map(x => h('button', { class: 'btn sm' + (cw && x.idx === cw.idx ? ' on' : ''), onclick: () => { cw = x; const m = $('#modal'); m.innerHTML = ''; m.appendChild(render(close)); } }, x.name))) : null);
        for(const guard of COMBOS.guards(d)){const f=CB.forecast(a,guard,{...w,intercepted:true},'defend');box.appendChild(h('button',{class:'btn supportDefend',onclick:()=>close('guard:'+guard.uid)},ASSETS.iconEl('guard',22),'Support Defend by '+NAMES[guard.pilot]+' ('+COMBOS.remaining(guard,'guard')+') · '+f.dmg+' damage / '+f.hit+'%'));}
        return box;
      };
      modal(render, 'defense').then(res);
    });
  }
  async function phaseBanner(phase, turn) {
    const b = $('#phaseBanner'); b.innerHTML = ''; b.className = 'pb ' + phase;
    b.appendChild(h('div', { class: 'pbt' }, phase === 'player' ? 'PLAYER PHASE' : phase === 'ally' ? 'ALLY PHASE' : 'ENEMY PHASE')); b.appendChild(h('div', { class: 'pbs' }, 'TURN ' + turn));
    b.hidden = false; void b.offsetWidth; b.classList.add('go'); SFX.play('cutin');
    await sleep(1100); b.hidden = true; b.classList.remove('go');
  }
  function objectiveText(ch, state) {
    if (ch.win === 'rout') return 'Defeat all enemies.';
    if (ch.win.escort) {
      const count = state?.units.filter(u => ch.win.escort.includes(u.tag) && u.escorted).length ?? 0;
      return `Escort to the eastern gate · ${count}/${ch.win.escort.length} clear`;
    }
    if (ch.win.boss) {
      const boss = ch.enemies.find(e => e.tag === ch.win.boss);
      return `Defeat ${boss?.name || MECHS[boss?.m || 'aurelion'].name}.`;
    }
    return 'Destroy both cruisers.';
  }
  async function missionStamp(ch) {
    const card = $('#phaseBanner');
    card.replaceChildren(h('div',{class:'pbt'},ch.title),
      h('div',{class:'pbs'},'MISSION '+ch.num+' · CONCORD YEAR 0089'));
    card.className='pb player missionStamp';
    card.hidden=false; void card.offsetWidth; card.classList.add('go');
    SFX.play('cutin'); await sleep(QUALITY.reducedMotion?300:1100);
    card.hidden=true;
  }
  function objectiveCard(ch) {
    const win = objectiveText(ch, G.map);
    const lose = (G.map?.assisted ? 'Assisted retry · +10% damage, enemy levels −1. ' : '') + (ch.map.fog ? 'Sensor interference · Scout to reveal contacts. ' : '') + 'Lose if ' + ch.vital.map(v => NAMES[v]).join(' or ') + ' is shot down.' + (ch.win.escort ? ' Keep both carriers alive.' : '') + (ch.lose && ch.lose.turn ? ` Lose after turn ${ch.lose.turn}.` : '');
    return modal(close => h('div', { class: 'card obj' }, h('div', { class: 'eyebrow' }, `Mission ${ch.num}` + (ch.route ? ' · ' + ch.route : '')), h('h3', {}, ch.title), h('p', {}, ch.brief),
      h('div', { class: 'kv two' }, h('span', {}, 'Victory'), h('b', {}, win), h('span', {}, 'Defeat'), h('b', {}, lose), ch.bonus ? h('span', {}, 'Bonus') : null, ch.bonus ? h('b', { class: 'gold' }, ch.bonus.text + (ch.bonus.part ? ` → ${PARTS[ch.bonus.part].name}, +2 Merits` : '')) : null),
      h('p', { class: 'muted small' }, 'Tactics: allies next to your target give FLANK bonuses (an ally directly opposite you is a PINCER). Adjacent allies boost evasion. Heavy blows knock enemies back into obstacles. Gold "?" shimmers mark buried secrets. Press T for threat range.'),
      h('button', { class: 'btn primary', onclick: () => close() }, 'Begin')));
  }
  function mapMenu() {
    return modal(close => h('div', { class: 'card' }, h('h3', {}, 'Tactical menu'),
      h('div', { class: 'list' },
        h('button', { class: 'btn', onclick: () => { close(); objectiveCard(G.map.ch); } }, 'Objectives'),
        h('button', { class: 'btn', onclick: () => { close(); MAP.toggleThreat(); } }, 'Toggle threat range (T)'),
        h('button', { class: 'btn', onclick: () => { close(); settingsModal(); } }, 'Settings'),
        h('button', { class: 'btn', onclick: () => { close(); MAP.endPlayerPhase(); } }, 'End player phase'),
        h('button', { class: 'btn danger', onclick: () => { close(); MAP.stop(); GAME.toIntermission(); } }, 'Abandon mission (return to intermission)')),
      h('button', { class: 'btn sm', onclick: () => close() }, 'Close')));
  }
  function settingsModal() {
    const s = SAVE.settings;
    const adjustable = ['easy','normal'].includes(SAVE.difficulty || 'normal');
    return modal(close => h('div', { class: 'card' }, h('h3', {}, 'Settings'),
      h('label',{class:'set'},'Campaign difficulty',h('select',{disabled:adjustable ? null : 'disabled',onchange:e=>{SAVE.difficulty=e.target.value;GAME.persist();}},
        Object.entries(RULES.modes).filter(([key])=>adjustable ? ['easy','normal'].includes(key) : key === SAVE.difficulty)
          .map(([key,m])=>h('option',{value:key,selected:key === SAVE.difficulty ? 'selected' : null},m.name)))),
      h('label',{class:'set'},'Reduce motion',h('select',{onchange:e=>{s.reduceMotion=e.target.value === 'auto' ? null : e.target.value === 'on'; QUALITY.syncMotion(); GAME.persist();}},
        [['auto','System default'],['on','On'],['off','Off']].map(([key,label])=>h('option',{value:key,selected:(s.reduceMotion == null ? 'auto' : s.reduceMotion ? 'on' : 'off') === key ? 'selected' : null},label)))),
      h('label', { class: 'set' }, 'Battle animations', h('select', { id: 'setAnim', onchange: e => { s.anim = e.target.value; GAME.persist(); } }, ['full', 'fast', 'off'].map(v => { const o = h('option', { value: v }, v === 'full' ? 'Full' : v === 'fast' ? 'Fast (2×)' : 'Off'); if (s.anim === v) o.selected = true; return o; }))),
      h('label',{class:'set'},'Graphics',h('select',{onchange:e=>{QUALITY.set(e.target.value);}},['auto','high','low'].map(v=>h('option',{value:v,selected:(s.graphics||'auto')===v?'selected':null},v[0].toUpperCase()+v.slice(1))))),
      h('p',{class:'muted small'},'Active graphics: '+QUALITY.mode+'. Auto lowers effects on software rendering or sustained slow frames.'),
      h('label', { class: 'set' }, 'Auto-counter when attacked', h('input', { id: 'setDef', type: 'checkbox', checked: s.defAuto ? 'checked' : null, onchange: e => { s.defAuto = e.target.checked; GAME.persist(); } })),
      h('label', { class: 'set' }, 'Auto end turn when all units acted', h('input', { id: 'setEnd', type: 'checkbox', checked: s.autoEnd ? 'checked' : null, onchange: e => { s.autoEnd = e.target.checked; GAME.persist(); } })),
      h('label', { class: 'set' }, 'Sound effects', h('input', { id: 'setSfx', type: 'range', min: 0, max: 1, step: 0.1, value: s.sfx, oninput: e => { s.sfx = +e.target.value; GAME.persist(); } })),
      h('label', { class: 'set' }, 'Music', h('input', { id: 'setMus', type: 'range', min: 0, max: 1, step: 0.1, value: s.music, oninput: e => { s.music = +e.target.value; SFX.setMusicVol(s.music); GAME.persist(); } })),
      h('button', { class: 'btn primary', onclick: () => close() }, 'Done')));
  }
  function victory(d) {
    SFX.music('hope'); SFX.play('levelup');
    return modal(close => h('div', { class: 'card result win' }, h('div', { class: 'eyebrow' }, 'Mission complete'), h('h2', {}, d.title),
      d.rank ? h('div',{class:'rankStamp','aria-label':'Rank '+d.rank},d.rank) : null,
      h('div', { class: 'kv two' }, h('span', {}, 'Turns'), h('b', {}, d.turn), h('span', {}, 'Kills'), h('b', {}, d.kills), h('span', {}, 'Credits earned'), h('b', { class: 'gold' }, d.credits.toLocaleString()), h('span', {}, 'Secrets found'), h('b', {}, d.secrets), h('span',{},'Squad damage'),h('b',{},(d.damage || 0).toLocaleString()),h('span',{},'Frames lost'),h('b',{},d.losses || 0),h('span',{},'Merits earned'),h('b',{class:'gold'},d.merits || 0),
        d.bonus ? h('span', {}, 'Bonus objective') : null, d.bonus ? h('b', { class: d.bonus.ok ? 'green' : 'muted' }, (d.bonus.ok ? '✔ ' : '✘ ') + d.bonus.text) : null,
        d.parts.length ? h('span', {}, 'Parts') : null, d.parts.length ? h('b', {}, d.parts.map(p => PARTS[p].name).join(', ')) : null),
      h('button', { class: 'btn primary', onclick: () => close() }, 'Continue')));
  }
  function defeat(text, {retry=true, assist=false} = {}) {
    SFX.music('sad');
    return modal(close => h('div',{class:'card result lose'},h('div',{class:'eyebrow red'},'Mission failed'),h('h2',{},'Defeat'),h('p',{},text),
      assist ? h('p',{class:'muted'},'Assisted retry grants +10% damage and lowers enemy levels by one for this attempt.') : null,
      h('div',{class:'row'},h('button',{class:'btn primary',onclick:()=>close('retry')},retry ? 'Retry mission' : 'Return to title'),
        assist ? h('button',{class:'btn',onclick:()=>close('assist')},'Retry with assistance') : null)));
  }

  // ================= INTERMISSION =================
  let interTab = 'hub', interSel = { pilot: 'rei', mech: null };
  function intermission() {
    const el = $('#inter'); el.hidden = false; SFX.music('calm');
    renderInter();
  }
  function renderInter() {
    const el = $('#inter'); el.innerHTML = '';
    const ch = CHAPTERS[SAVE.chapter];
    const tabs = [['hub','Bridge'], ['sortie', 'Sortie'], ['pilots', 'Pilots & Skills'], ['mechs', 'Mechs & Parts'], ['refit','Refit Bay'], ['chart', 'Type Chart'], ['codex', 'Codex'], ['system', 'System']];
    el.appendChild(h('header', { class: 'ihead' }, h('div', { class: 'ilogo' }, 'IRON REQUIEM', h('span', {}, 'Intermission · Halcyon')), h('nav', { class: 'itabs' }, tabs.map(([k, l]) => h('button', { class: 'itab' + (interTab === k ? ' on' : ''), onclick: () => { interTab = k; SFX.play('select'); renderInter(); } }, l))), h('div', { class: 'icred' }, `${SAVE.credits.toLocaleString()} CR`)));
    const body = h('main', { class: 'ibody' }); el.appendChild(body);
    ({ hub: tabHub, sortie: tabSortie, pilots: tabPilots, mechs: tabMechs, refit: tabRefit, chart: tabChart, codex: tabCodex, system: tabSystem })[interTab](body, ch);
  }
  function tabHub(body,ch) {
    const image = h('canvas',{class:'bridgeArt',width:1280,height:640,'aria-hidden':'true'});
    const context = image.getContext('2d');
    if (!ASSETS.drawHub(context,1280,640)) ART.drawBG(context,1280,640,'space',0,0);
    const stations = [
      ['sortie','NAV','Briefing',ch?.title || 'Campaign complete'],
      ['pilots','CREW','Pilot quarters','Skills and Spirit commands'],
      ['mechs','HGR','Hangar','Frames, upgrades and parts'],
      ['refit','ENG','Engineering','Fleet refits and Merits'],
      ['codex','ARC','Archive','Field reports and mission ranks'],
      ['system','SYS','Systems','Save files and settings'],
    ];
    body.appendChild(h('section',{class:'bridge'},image,
      h('header',{class:'bridgeTitle'},h('span',{class:'eyebrow'},'Command deck'),h('h2',{},'Halcyon'),
        h('p',{},RULES.mode(SAVE).name+' · '+SAVE.roster.length+' pilots aboard')),
      h('div',{class:'bridgeStations'},stations.map(([id,code,heading,detail])=>
        h('button',{class:'bridgeStation',onclick:()=>{interTab=id;SFX.play('confirm');renderInter();}},
          h('span',{class:'stationCode'},code),h('span',{},h('b',{},heading),h('small',{},detail)))))));
  }
  function tabSortie(b, ch) {
    if (!ch) { b.appendChild(h('div', { class: 'card' }, h('h2', {}, 'Campaign complete'), h('p', {}, 'Thank you for playing.'))); return; }
    const slots = RULES.deployLimit(ch,SAVE);
    const wing = Math.min(4+(SAVE.refits.wing || 0),slots-new Set([...ch.vital,...(ch.escortSlots || [])].filter(p=>ch.deploy.some(d=>d.p===p) && SAVE.roster.includes(p))).size);
    const bgc = h('canvas', { class: 'sortieBg', width: 1100, height: 340, 'aria-hidden': 'true' });
    const ctx = bgc.getContext('2d');
    if (ctx && !ASSETS.drawMissionBG(ctx, bgc.width, bgc.height, ch.bg)) ART.drawBG(ctx, bgc.width, bgc.height, ch.bg, 1, 0);
    const roster = h('div', { class: 'rosterRow' }, SAVE.roster.map(p => { const c = h('canvas', { width: 72, height: 90 }); c.getContext('2d').drawImage(ART.portrait(p, 'normal', 72, 90), 0, 0); return h('div', { class: 'rmini' }, c, h('span', {}, `${NAMES[p].split(' ').pop()} ${SAVE.pilots[p].lvl}`)); }));
    b.appendChild(h('section', { class: 'sortie' }, h('div', { class: 'sortieHero' }, bgc, h('div', { class: 'sortieTxt' }, h('div', { class: 'eyebrow' }, `Next mission ${ch.num}` + (ch.route ? ' · ' + ch.route : '')), h('h2', {}, ch.title), h('p', {}, ch.brief), ch.bonus ? h('p', { class: 'gold small' }, 'Bonus: ' + ch.bonus.text) : null,
      h('button', { class: 'btn primary big', onclick: () => { SFX.play('confirm'); $('#inter').hidden = true; GAME.startChapter(); } }, 'Sortie ▸'))),
      h('h4', { class: 'sec' }, 'Squadron · '+slots+' deployment slots'), roster,
      h('h4', { class: 'sec' }, 'Auxiliary wing · deploy up to '+wing),
      h('div', { class: 'auxiliaryPicks' }, EXPANSION.crew.filter(p => SAVE.roster.includes(p)).map(p => {
        const active = (SAVE.auxiliary || EXPANSION.crew.filter(q => SAVE.roster.includes(q)).slice(0,wing)).includes(p);
        return h('button', {class:'btn'+(active?' primary':''),onclick:()=>{SAVE.auxiliary ||= EXPANSION.crew.filter(q=>SAVE.roster.includes(q)).slice(0,wing);if(active)SAVE.auxiliary=SAVE.auxiliary.filter(q=>q!==p);else if(SAVE.auxiliary.length<wing)SAVE.auxiliary.push(p);else{toast('The auxiliary hangar is full.');return;}GAME.persist();renderInter();}}, (active?'✓ ':'')+MECHS[PILOTS[p].mech].name+' · '+NAMES[p]);
      })),
      h('p', {class:'muted small'}, 'Selected auxiliary frames take available deployment slots ahead of reserve story pilots. Pilots required by a mission keep their slots.'),
      h('p', { class: 'muted small' }, `Unspent skill points: ${SAVE.roster.reduce((a, p) => a + SAVE.pilots[p].pp, 0)} · Parts in storage: ${Object.values(SAVE.inventory).reduce((a, b) => a + b, 0)} · Resonance: ${SAVE.flags.res || 0}`)));
  }
  function tabPilots(b) {
    if (!SAVE.roster.includes(interSel.pilot)) interSel.pilot = SAVE.roster[0];
    const pid = interSel.pilot, ps = SAVE.pilots[pid], P = PILOTS[pid];
    const list = h('div', { class: 'plist' }, SAVE.roster.map(p => { const c = h('canvas', { width: 48, height: 60 }); c.getContext('2d').drawImage(ART.portrait(p, 'normal', 48, 60), 0, 0); return h('button', { class: 'pitem' + (p === pid ? ' on' : ''), onclick: () => { interSel.pilot = p; renderInter(); } }, c, h('div', {}, h('b', {}, NAMES[p]), h('span', {}, `Lv ${SAVE.pilots[p].lvl} · ${SAVE.pilots[p].pp} PP`))); }));
    const u = { team: 'player', pilot: pid, mech: MAP.pilotMech(pid), lvl: ps.lvl, buf: {}, status: {} };
    const st = CB.pstats(u);
    const big = h('canvas', { width: 200, height: 250, class: 'pbig' }); big.getContext('2d').drawImage(ART.portrait(pid, 'normal', 200, 250), 0, 0);
    const stats = h('div', { class: 'kv four' }, ['MEL', 'RNG', 'DEF', 'HIT', 'EVA', 'SKL', 'SP'].flatMap(k => [h('span', {}, k), h('b', {}, st[k])]), h('span', {}, 'Kills'), h('b', {}, ps.kills));
    const frame = CLASSES.get(u.mech), tree = [...frame.branches,CLASSES.personal[pid]];
    const spirits = h('div',{class:'tags'},pilotSpirits(pid).map(id=>h('span',{class:'tag green',title:SPIRITS[id].desc},SPIRITS[id].name+' '+CLASSES.spiritCost(u,id,SAVE))),
      lockedSpirits(pid).map(([id,lvl])=>h('span',{class:'tag muted',title:SPIRITS[id].desc},SPIRITS[id].name+' (Lv '+lvl+')')));
    const invested = CLASSES.spent(ps);
    const treeEl = h('div',{class:'classTree'},tree.map(branch => {
      const tiers = branch.tiers.map((options,tier) => {
        const cards = options.map(node => {
          const owned = !!ps.nodes[node.id], available = CLASSES.canBuy(ps,branch,tier,node);
          const value = node.deed && Math.min(CLASSES.deed(ps,node.deed.key),node.deed.target);
          return h('button',{class:'node'+(owned?' owned':available?' can':' locked'),disabled:available?null:'disabled',title:node.desc,
            onclick:()=>{ if (CLASSES.learn(ps,branch,tier,node)) { SFX.play('levelup'); GAME.persist(); renderInter(); } }},
            h('span',{class:'nname'},node.name),h('span',{class:'ndesc'},node.desc),
            node.deed ? h('span',{class:'deedTrack'},h('progress',{max:node.deed.target,value}),h('small',{},value+'/'+node.deed.target+' '+CLASSES.deedLabels[node.deed.key])) : null,
            h('span',{class:'ncost'},owned?'Learned':node.cost+' PP'));
        });
        return h('div',{class:'nodeTier'},h('div',{class:'tierLabel'},'Tier '+(tier+1)+(options.length>1?' · Choose one':'')),h('div',{class:'nodeOptions'},cards));
      });
      return h('section',{class:'branch',style:'--bc:'+branch.color},h('h3',{class:'bhead'},branch.name),tiers);
    }));
    const pairs = COMBOS.pairs.filter(c=>c.pilots.includes(pid)).map(c=>{
      const other=c.pilots.find(id=>id!==pid), value=SAVE.bonds[COMBOS.bondKey(pid,other)] || 0;
      return h('span',{class:'tag',title:'Bond 2 at 7 points unlocks the combo'},NAMES[other]+' · Bond '+COMBOS.bondLevel(pid,other)+' · '+value+' pts');
    });
    b.appendChild(h('section',{class:'pilots'},list,h('div',{class:'pdetail'},
      h('div',{class:'ptop'},big,h('div',{class:'pinfo'},h('h2',{},NAMES[pid]),classBadge(u),
        h('p',{class:'muted'},frame.intro),h('div',{class:'muted'},'Level '+ps.lvl+' · EXP '+ps.exp+'/'+RULES.expCap(ps.lvl)+' · '+MECHS[u.mech].name),
        h('div',{class:'pp'},h('b',{},ps.pp),' available PP · '+invested+' spent'),stats,
        h('h4',{class:'sec'},'Spirit commands'),spirits,pairs.length?h('div',{class:'tags'},pairs):null)),
      h('div',{class:'treeToolbar'},h('h3',{},'Machine proficiency'),h('button',{class:'btn sm',disabled:invested?null:'disabled',onclick:()=>retrain(pid)},'Retrain')),
      treeEl)));
  }
  function retrain(pid) {
    const pilot = SAVE.pilots[pid], refund = CLASSES.spent(pilot);
    const free = ['c1','i1'].includes(SAVE.chapter);
    const voucher = !free && (SAVE.refits.token || 0) > 0;
    const cost = free || voucher ? 0 : 1800 + (pilot.respecs || 0) * 900;
    return modal(close=>h('div',{class:'card'},h('h3',{},'Retrain '+NAMES[pid]),h('p',{},'Refund '+refund+' PP. '+(voucher?'Uses one voucher.':cost?'Costs '+cost.toLocaleString()+' CR.':'Free during the opening missions.')),
      h('div',{class:'row'},h('button',{class:'btn',onclick:()=>close()},'Cancel'),
        h('button',{class:'btn primary',disabled:SAVE.credits<cost? 'disabled':null,onclick:()=>{
          pilot.pp += refund; pilot.nodes = {};
          SAVE.credits -= cost;
          if (cost) pilot.respecs = (pilot.respecs || 0) + 1;
          if (voucher) SAVE.refits.token--;
          GAME.persist(); close(); renderInter();
        }},'Retrain'))));
  }
  function tabRefit(body) {
    const cards = Object.entries(REFITS).map(([id,refit]) => {
      const rank = SAVE.refits[id] || 0;
      return h('article',{class:'refitCard'},h('h3',{},refit.name),h('p',{class:'muted'},refit.desc),
        h('div',{class:'refitBuy'},h('span',{},id==='token'?rank+' on hand':'Rank '+rank+'/'+refit.max),
          h('button',{class:'btn',disabled:rank>=refit.max || SAVE.merits<refit.cost?'disabled':null,onclick:()=>{
            SAVE.merits -= refit.cost; SAVE.refits[id] = rank+1;
            GAME.persist(); SFX.play('levelup'); renderInter();
          }},rank>=refit.max?'Max rank':refit.cost+' Merits')));
    });
    body.appendChild(h('section',{class:'refitBay'},h('h2',{},'Halcyon Refit Bay'),h('p',{class:'gold'},SAVE.merits+' Merits available'),h('div',{class:'refitGrid'},cards),
      h('h3',{},'Mission record'),
      Object.keys(SAVE.ranks).length ? h('div',{class:'tags'},Object.entries(SAVE.ranks).map(([id,grade])=>h('span',{class:'tag'},grade+' · '+CHAPTERS[id]?.title))) : h('p',{class:'muted'},'Clear a mission to record its rank.')));
  }
  function tabMechs(b) {
    const mechs = SAVE.roster.map(p => MAP.pilotMech(p));
    if (!mechs.includes(interSel.mech)) interSel.mech = mechs[0];
    const mid = interSel.mech, M = MECHS[mid], md = SAVE.mechs[mid] || (SAVE.mechs[mid] = { up: {}, parts: [null, null] });
    const pid = SAVE.roster.find(p => MAP.pilotMech(p) === mid);
    const u = { team: 'player', pilot: pid, mech: mid, lvl: SAVE.pilots[pid].lvl, buf: {}, status: {}, ammo: {} };
    const ms = CB.mstats(u);
    const list = h('div', { class: 'plist' }, mechs.map(m => { const c = h('canvas', { width: 60, height: 60 }); c.getContext('2d').drawImage(ASSETS.mapIcon(m, 30, false) || (R3D.ok ? R3D.mapSprite : ART.mapSprite)(m, 30, false), 0, 0, 60, 60); return h('button', { class: 'pitem' + (m === mid ? ' on' : ''), onclick: () => { interSel.mech = m; renderInter(); } }, c, h('div', {}, h('b', {}, MECHS[m].name), h('span', {}, ARMOR[MECHS[m].armor].name))); }));
    const art = h('canvas', { width: 320, height: 300, class: 'mechArt' }); { const c = art.getContext('2d'); if (!ASSETS.drawStoryBG(c, 320, 300, 'hangar', 0)) ART.drawBG(c, 320, 300, 'hangar', 0, 0); const su = ASSETS.unit(mid); if (su) { const f = su.frames[0], s = Math.min(290 / f.width, 270 / (f.height * su.ground)); c.drawImage(f, 160 - f.width * s / 2, 285 - f.height * su.ground * s, f.width * s, f.height * s); } else if (R3D.ok) { c.drawImage(R3D.snapshot(mid, 640, 600, { pad: 1.05 }), 0, 0, 320, 300); } else { c.save(); c.translate(160, 270); const s = ['colossus', 'hollow', 'ship'].includes(M.vis.body) ? 1.0 : M.vis.body === 'dragon' ? 1.3 : 1.85; c.scale(s, s); ART.drawMech(c, M.vis, { t: 0.4 }); c.restore(); } }
    const upRows = Object.keys(UPG).map(k => { const lv = md.up[k] || 0; const cost = Math.round(upgCost(lv) * (1 - .08 * (SAVE.refits.discount || 0))); return h('div', { class: 'uprow' }, h('span', { class: 'upn' }, UPG[k].name), h('div', { class: 'pips' }, Array.from({ length: UPG_MAX }, (_, i) => h('i', { class: i < lv ? 'on' : '' }))), h('span', { class: 'upv' }, k === 'wpn' ? `+${lv * UPG.wpn.per}` : k === 'hp' ? ms.hp : k === 'en' ? ms.en : k === 'arm' ? ms.arm : ms.mob), h('button', { class: 'btn sm', disabled: (lv >= UPG_MAX || SAVE.credits < cost) ? 'disabled' : null, onclick: () => { SAVE.credits -= cost; md.up[k] = lv + 1; SFX.play('confirm'); GAME.persist(); renderInter(); } }, lv >= UPG_MAX ? 'MAX' : `+ ${cost.toLocaleString()}`)); });
    const slots = Array.from({length:2+(SAVE.refits.parts || 0)},(_,i)=>i).map(i => { const cur = md.parts[i]; const sel = h('select', { id: 'part' + i, onchange: e => { const v = e.target.value || null; if (cur) SAVE.inventory[cur] = (SAVE.inventory[cur] || 0) + 1; if (v) SAVE.inventory[v]--; md.parts[i] = v; GAME.persist(); renderInter(); } }, h('option', { value: '' }, '— empty —'), Object.keys(PARTS).filter(p => p === cur || (SAVE.inventory[p] || 0) > 0).map(p => { const o = h('option', { value: p }, `${PARTS[p].name} (${p === cur ? 'equipped' : SAVE.inventory[p] + ' left'})`); if (p === cur) o.selected = true; return o; })); return h('div', { class: 'slot' }, h('span', { class: 'muted small' }, `Slot ${i + 1}`), sel, cur ? h('div', { class: 'small muted' }, ASSETS.iconEl(cur, 28), PARTS[cur].desc) : null); });
    const ter = CB.ter(mid);
    const columns = ['Type', 'Weapon', 'Power', 'Range', 'Cost', 'Will', 'Effect'];
    const wt = h('div', { class: 'armamentScroll', tabindex: '0', role: 'region', 'aria-label': 'Weapon specifications' },
      h('table', { class: 'armamentTable' },
        h('thead', {}, h('tr', {}, columns.map(label => h('th', { scope: 'col' }, label)))),
        h('tbody', {}, CB.weapons(u).map(w => h('tr', { class: w.finisher ? 'fin' : '' },
          h('td', {}, chip(w.type)),
          h('th', { scope: 'row', class: 'wn' }, w.name, w.post ? h('sup', { title: 'Can fire after moving', 'aria-label': 'Can fire after moving' }, ' P') : null),
          h('td', { class: 'wp' }, w.pow),
          h('td', { class: 'wr2' }, `${w.rmin}–${w.rmax}`),
          h('td', { class: 'we' }, w.en ? `${w.en} EN` : w.ammo ? `${w.ammo} rds` : '—'),
          h('td', { class: 'we' }, w.will || '—'),
          h('td', {}, w.status ? h('span', { class: 'stchip', style: `--c:${STATUS[w.status.id].color}` }, `${STATUS[w.status.id].name} ${w.status.ch}%`) : '—'))))));
    const weak = Object.keys(ATK).filter(k => CHART[k][M.armor] > 1), res = Object.keys(ATK).filter(k => CHART[k][M.armor] < 1);
    b.appendChild(h('section', { class: 'pilots' }, list, h('div', { class: 'pdetail' },
      h('div', { class: 'ptop' }, art, h('div', { class: 'pinfo' }, h('h2', {}, M.name), h('div', { class: 'muted' }, M.cls + ' · pilot ' + NAMES[pid]), h('p', { class: 'small' }, M.desc),
        h('div', { class: 'kv four' }, h('span', {}, 'Armor class'), h('b', { style: `color:${ARMOR[M.armor].color}` }, ARMOR[M.armor].name), h('span', {}, 'Size'), h('b', {}, M.size), h('span', {}, 'Move'), h('b', {}, ms.move), h('span', {}, 'Flight'), h('b', {}, ms.fly ? 'Yes' : 'No'), h('span', {}, 'Terrain A/L/S/Sp'), h('b', {}, `${ter.air} ${ter.lnd} ${ter.sea} ${ter.spc}`)),
        h('div', { class: 'wr' }, h('span', { class: 'muted' }, 'Weak to '), weak.map(chip), h('span', { class: 'muted' }, '  Resists '), res.map(chip)),
        ms.barrier ? h('div', { class: 'tag', style: '--c:#c9a6ff' }, `${ms.barrier.name}: −${ms.barrier.val} damage`) : null)),
      h('div', { class: 'cols2' }, h('div', {}, h('h4', { class: 'sec' }, 'Upgrades (carry over)'), upRows), h('div', {}, h('h4', { class: 'sec' }, 'Parts'), slots)),
      h('h4', { class: 'sec' }, 'Weapons'), wt)));
  }
  function tabChart(b) {
    const t = h('table', { class: 'chart' }, h('thead', {}, h('tr', {}, h('th', {}, 'Attack ↓ / Armor →'), Object.keys(ARMOR).map(a => h('th', { style: `color:${ARMOR[a].color}` }, ARMOR[a].name)))),
      h('tbody', {}, Object.keys(ATK).map(k => h('tr', {}, h('th', {}, chip(k), ' ', ATK[k].name), Object.keys(ARMOR).map(a => { const m = CHART[k][a]; const e = effLabel(m); return h('td', { style: `--c:${e.c}`, class: m > 1 ? 'up' : m < 1 ? 'down' : '' }, '×' + m.toFixed(2)); })))));
    b.appendChild(h('section', { class: 'chartWrap' }, h('h2', {}, 'Damage type chart'), h('p', { class: 'muted' }, 'Every weapon has an attack type and every unit an armor class. Matching a strong attack against a weak armor class multiplies damage. Effectiveness ranges from ×0.60 to ×1.75. Bonuses from positioning, class skills and equipment share the attack and defense caps.'), h('div', { class: 'tblscroll' }, t),
      h('h4', { class: 'sec' }, 'Status effects'), h('div', { class: 'stlist' }, Object.keys(STATUS).map(k => h('div', { class: 'stitem', style: `--c:${STATUS[k].color}` }, h('b', {}, STATUS[k].name), h('span', {}, STATUS[k].desc + ` Lasts ${STATUS[k].turns} phases.`)))),
      h('h4', { class: 'sec' }, 'Attack types'), h('div', { class: 'stlist' }, Object.keys(ATK).map(k => h('div', { class: 'stitem', style: `--c:${ATK[k].color}` }, h('b', {}, ATK[k].name), h('span', {}, ATK[k].desc)))),
      h('h4', { class: 'sec' }, 'Positioning'), h('div', { class: 'stlist' }, [['Flank', 'An ally adjacent to your target: +10 hit, +10% damage.'], ['Pincer', 'An ally directly opposite you across the target: +25% damage.'], ['Formation', 'Each adjacent ally: +4 evasion (max +12).'], ['High ground', 'Attacking from a mountain: +10 hit, +5% damage.'], ['Knockback', 'Punches, drills and heavy weapons push the target one tile. Hitting a wall or unit deals collision damage to both.'], ['Support attack', 'Adjacent pilots with Support Attack may follow up once per phase at rank I and twice at rank II.']].map(([a, c]) => h('div', { class: 'stitem', style: '--c:#ffb347' }, h('b', {}, a), h('span', {}, c))))));
  }
  function tabCodex(b) {
    const keys = Object.keys(CODEX);
    b.appendChild(h('section', { class: 'codex' }, h('h2', {}, 'Codex'), h('div', { class: 'cgrid' }, keys.map(k => SAVE.codex.includes(k) ? h('article', { class: 'centry' }, h('h4', {}, CODEX[k].t), h('p', {}, CODEX[k].b)) : h('article', { class: 'centry locked' }, h('h4', {}, '— Classified —'), h('p', {}, 'Continue the story to unlock this entry.'))))));
  }
  function tabSystem(b) {
    b.appendChild(h('section', { class: 'system' }, h('h2', {}, 'System'),
      h('div', { class: 'list' },
        h('button', { class: 'btn primary', onclick: () => { GAME.persist(true); toast('Game saved.'); } }, 'Save game'),
        h('button',{class:'btn',onclick:()=>SAVES.openSave()},'Save to slot'),
        h('button',{class:'btn',onclick:()=>SAVES.openLoad()},'Load game'),
        h('button',{class:'btn',onclick:()=>SAVES.openExport()},'Export save'),
        h('button',{class:'btn',onclick:()=>SAVES.openImport()},'Import save'),
        h('button', { class: 'btn', onclick: () => settingsModal() }, 'Settings'),
        h('button', { class: 'btn danger', onclick: () => { GAME.toTitle(); } }, 'Return to title'),
        SAVE.endings.length ? h('button',{class:'btn',onclick:()=>{
          modal(close=>h('div',{class:'card'},h('h3',{},'New Game+'),h('p',{},'Restart with skill points, Merits and refits. Story decisions restart.'),
            h('div',{class:'row'},h('button',{class:'btn',onclick:()=>close()},'Cancel'),h('button',{class:'btn primary',onclick:()=>{close();GAME.newGamePlus();}},'Begin New Game+'))));
        }},'New Game+') : null),
      h('p', { class: 'muted small' }, 'Progress autosaves at intermission. Export a backup to take it to another browser or folder.')));
  }
  function pilotSpirits(pid) {
    const p = PILOTS[pid]; if (!p) return [];
    const lvl = SAVE.pilots[pid] ? SAVE.pilots[pid].lvl : 99;
    const out = p.spirits.filter(([s, l]) => lvl >= l).map(([s]) => s);
    if (SAVE.pilots[pid]) CLASSES.owned({team:'player',pilot:pid,mech:MAP.pilotMech(pid)},SAVE,n=>{ if (n.fx.spirit && !out.includes(n.fx.spirit)) out.push(n.fx.spirit); });
    return out;
  }
  function lockedSpirits(pid) { const lvl = SAVE.pilots[pid].lvl; return PILOTS[pid].spirits.filter(([s, l]) => lvl < l); }

  return { runScript, initStoryCtl, toast, modal, notice, mapHUD, refreshHUD, setThreatBtn, showTileInfo, showUnit, hideMenus, actionMenu, forecast, hideForecast, defensePrompt, phaseBanner, missionStamp, objectiveCard, mapMenu, settingsModal, victory, defeat, intermission, renderInter, pilotSpirits };
})();
