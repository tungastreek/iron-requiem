// ===== Combat rules: stats, hit/damage formulas, terrain ratings, parts =====
'use strict';
const PARTS = {
  thruster:  { name: 'Thruster Pack',      desc: 'Movement +1, Mobility +5.', fx: { move: 1, mob: 5 } },
  plating:   { name: 'Ceramic Plating',    desc: 'Armor +200, HP +500.', fx: { arm: 200, hp: 500 } },
  targeting: { name: 'Targeting Array',    desc: 'Accuracy +15, Critical +10.', fx: { acc: 15, crit: 10 } },
  reactor:   { name: 'Reactor Cell',       desc: 'EN +50; regenerate 10% EN per phase.', fx: { en: 50, regenEN: 0.1 } },
  repair:    { name: 'Nanite Repair Unit', desc: 'Regenerate 10% HP per phase.', fx: { regenHP: 0.1 } },
  resonator: { name: 'Resonance Lens',     desc: 'SP +20 and start missions at Will +5.', fx: { sp: 20, will: 5 } },
  nanocoat:  { name: 'Purity Nanocoat',    desc: 'Status effects only land half as often against this unit.', fx: { sres: 0.5 } },
  apsaras:   { name: 'Apsaras Engine',     desc: 'Movement +2, Mobility +15, enables flight.', fx: { move: 2, mob: 15, fly: true } },
};
const UPG = { hp: { per: 350, name: 'HP' }, en: { per: 15, name: 'EN' }, arm: { per: 90, name: 'Armor' }, mob: { per: 4, name: 'Mobility' }, wpn: { per: 120, name: 'Weapons' } };
const UPG_MAX = 10;
function upgCost(lvl) { return 1500 + lvl * 1500; }
const TER_MULT = { S: 1.1, A: 1.0, B: 0.8, C: 0.6, D: 0.4, '-': 0.6 };
const TER_HIT = { S: 10, A: 0, B: -10, C: -20, D: -30, '-': -20 };

const CB = (() => {
  // terrain ratings per mech (air/land/sea/space)
  function ter(mid) {
    const m = MECHS[mid];
    const r = { air: m.fly ? 'A' : '-', lnd: m.ship ? 'B' : 'A', sea: m.ship ? 'A' : 'B', spc: 'A' };
    if (m.armor === 'BIO') { r.spc = m.fly ? 'C' : 'D'; r.sea = 'A'; }
    if (['kaiser', 'bastion', 'trinity'].includes(mid)) r.spc = 'B';
    if (mid === 'sylph' || mid === 'carmine') r.air = 'S';
    if (mid === 'alteonz' || mid === 'seraphyne' || mid === 'aurelion' || mid === 'hollow') { r.air = 'S'; r.spc = 'S'; }
    if (mid === 'noctis') r.spc = 'S';
    if (mid === 'trinity') r.lnd = 'S';
    if (mid === 'kaiser') r.lnd = 'S';
    return Object.assign(r, m.ratings || {});
  }
  function env(u) {
    const m = mstats(u); const map = G.map;
    if (map && map.space) return 'spc';
    if (m.fly) return 'air';
    if (map && map.tile(u.x, u.y) === 'w') return 'sea';
    return 'lnd';
  }
  function terRank(u) { return ter(u.mech)[env(u)]; }

  function skills(u) {
    const s = new Set();
    if (u.team === 'player' && SAVE.pilots[u.pilot]) {
      const tree = buildTree(u.pilot); const nodes = SAVE.pilots[u.pilot].nodes;
      tree.forEach(b => b.nodes.forEach(n => { if (nodes[n.id] && n.fx.skill) s.add(n.fx.skill); }));
    }
    (u.eskills || []).forEach(x => s.add(x));
    return s;
  }
  function masteries(u) {
    const r = [];
    if (u.team === 'player' && SAVE.pilots[u.pilot]) { const tree = buildTree(u.pilot); const nodes = SAVE.pilots[u.pilot].nodes; tree.forEach(b => b.nodes.forEach(n => { if (nodes[n.id] && n.fx.mastery) r.push(n.fx.mastery); })); }
    return r;
  }
  function pstats(u) {
    const K = ['MEL', 'RNG', 'DEF', 'HIT', 'EVA', 'SKL', 'SP'];
    const o = {};
    if (PILOTS[u.pilot] && (u.team === 'player' || u.usePlayerStats)) {
      const p = PILOTS[u.pilot], lvl = u.lvl || 1;
      K.forEach((k, i) => o[k] = Math.round(p.base[k] + p.gr[i] * (lvl - 1)));
      if (u.team === 'player' && SAVE.pilots[u.pilot]) {
        const tree = buildTree(u.pilot); const nodes = SAVE.pilots[u.pilot].nodes;
        tree.forEach(b => b.nodes.forEach(n => { if (nodes[n.id] && n.fx.stat) for (const k in n.fx.stat) o[k] += n.fx.stat[k]; }));
      }
    } else {
      const lvl = u.lvl || 1, b = u.boss ? 22 : 0;
      K.forEach(k => o[k] = Math.round(108 + lvl * 3 + b));
      o.SP = 999;
    }
    const pm = partFx(u); if (pm.sp) o.SP += pm.sp;
    return typeof ENEMIES!=='undefined'?ENEMIES.pilotStats(u,o):o;
  }
  function partFx(u) {
    const r = {};
    if (u.team !== 'player') return r;
    const md = SAVE.mechs[u.mech]; if (!md) return r;
    (md.parts || []).forEach(pid => { if (!pid || !PARTS[pid]) return; const fx = PARTS[pid].fx; for (const k in fx) r[k] = (typeof fx[k] === 'number') ? (r[k] || 0) + fx[k] : fx[k]; });
    return r;
  }
  function mstats(u) {
    const m = MECHS[u.mech];
    const o = { hp: m.hp, en: m.en, arm: m.arm, mob: m.mob, move: m.move, fly: m.fly, size: m.size, armor: m.armor, regenHP: (m.abil && m.abil.regenHP) || 0, regenEN: (m.abil && m.abil.regenEN) || 0, barrier: m.abil && m.abil.barrier };
    if (u.team === 'player' && SAVE.mechs[u.mech]) {
      const up = SAVE.mechs[u.mech].up || {};
      for (const k of ['hp', 'en', 'arm', 'mob']) o[k] += (up[k] || 0) * UPG[k].per;
      const pf = partFx(u);
      for (const k of ['hp', 'en', 'arm', 'mob', 'move']) if (pf[k]) o[k] += pf[k];
      if (pf.fly) o.fly = true;
      if (pf.regenHP) o.regenHP += pf.regenHP; if (pf.regenEN) o.regenEN += pf.regenEN;
      const sk = skills(u);
      if (sk.has('cap_jin')) { o.hp += 2000; o.regenHP += 0.1; }
      if (sk.has('cap_sera')) o.regenEN += 0.08;
      if (sk.has('cap_mira')) o.move += 1;
    } else if (u.hpMul) { o.hp = Math.round(o.hp * u.hpMul); }
    if (u.status && u.status.SHOCK) o.mob -= 20;
    if (u.status && u.status.BREAK) o.arm = Math.round(o.arm * 0.65);
    if (u.status && u.status.SLOW) o.move = Math.max(1, o.move - 2);
    if (u.mode === 'fighter') { o.move += 2; o.mob += 10; }
    return typeof ENEMIES!=='undefined'?ENEMIES.mechStats(u,o):o;
  }
  function weapons(u) {
    const m = MECHS[u.mech]; let list = m.weapons;
    if (typeof COMBOS !== 'undefined') list=list.concat(COMBOS.weapons(u));
    if (u.mode === 'fighter' && u.mech === 'sylph') list = list.filter(w => w.anim === 'vulcan' || w.name === 'Beam Pistol').concat([W('Strafe Run', 'KIN', 2800, 1, 3, { acc: 15, ammo: 0, en: 15, anim: 'vulcan', crit: 15 })]);
    const up = (u.team === 'player' && SAVE.mechs[u.mech]) ? (SAVE.mechs[u.mech].up.wpn || 0) : Math.floor((u.lvl || 1) / 6);
    const sk = skills(u);
    return list.map((w, i) => {
      const o = Object.assign({}, w, { idx: i, pow: w.pow + up * UPG.wpn.per });
      if (sk.has('cap_odessa') && o.rmax > 1 && o.cat === 'R') o.rmax += 1;
      if (sk.has('cap_rei') && o.finisher) o.will = Math.max(0, o.will - 10);
      if (sk.has('cap_gunnar') && o.ammo) o.ammo = Math.ceil(o.ammo * 1.5);
      return o;
    });
  }
  function dist(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
  function usable(u, w, d, moved, counter, target) {
    if(w.combo&&(counter||!COMBOS.partner(u,w)||(target&&!COMBOS.canTarget(u,w,target))))return 'partner';
    if (d != null && (d < w.rmin || d > w.rmax)) return 'range';
    if (moved && !w.post && !counter) return 'move';
    if (w.en && u.en < w.en) return 'en';
    if (w.ammo && (u.ammo[w.idx] == null ? w.ammo : u.ammo[w.idx]) <= 0) return 'ammo';
    if (w.will && u.will < w.will) return 'will';
    return null;
  }
  function tileBonus(u) {
    if (mstats(u).fly || !G.map) return { def: 0, eva: 0 };
    const t = TERRAIN[G.map.tile(u.x, u.y)] || TERRAIN['.'];
    return { def: t.def || 0, eva: t.eva || 0 };
  }
  function aura(u) { // Ilse fleet command
    if (!G.map) return 0;
    for (const o of G.map.units) if (o !== u && o.team === u.team && o.hp > 0 && skills(o).has('cap_ilse') && dist(o, u) <= 2) return 10;
    return 0;
  }
  // ---- positioning: flank, pincer, formation, high ground ----
  function sideOf(u) { return u.team === 'enemy' ? 'E' : 'P'; }
  function flank(a, d) {
    if (!G.map || !G.map.units) return { n: 0, pincer: false };
    let n = 0, pincer = false;
    for (const o of G.map.units) {
      if (o === a || o.hp <= 0 || sideOf(o) !== sideOf(a)) continue;
      if (dist(o, d) === 1) { n++; if (dist(a, d) === 1 && o.x - d.x === d.x - a.x && o.y - d.y === d.y - a.y) pincer = true; }
    }
    return { n, pincer };
  }
  function formation(u) {
    if (!G.map || !G.map.units) return 0;
    let n = 0; for (const o of G.map.units) if (o !== u && o.hp > 0 && sideOf(o) === sideOf(u) && dist(o, u) === 1) n++;
    return Math.min(3, n) * 4;
  }
  function highGround(u) { return !!(G.map && !mstats(u).fly && ['m'].includes(G.map.tile(u.x, u.y))); }
  function posMods(a, d) { const f = flank(a, d); return { hit: (f.n ? 10 : 0) + (highGround(a) ? 10 : 0), dmg: (f.pincer ? 0.25 : f.n ? 0.1 : 0) + (highGround(a) ? 0.05 : 0), eva: formation(d), flank: f, high: highGround(a) }; }
  function prevailF(u) { const ms = mstats(u); return skills(u).has('prevail') ? Math.max(0, 1 - u.hp / ms.hp) : 0; }

  function hitChance(a, d, w, mode) {
    if (a.buf.strike) return 100;
    if (d.buf.alert) return 0;
    const ap = pstats(a), dp = pstats(d), am = mstats(a), dm = mstats(d);
    const pf = partFx(a);
    const pm = posMods(a, d);
    let h = 100 + pm.hit - pm.eva + ap.HIT / 2 + w.acc + (pf.acc || 0) + TER_HIT[terRank(a)] + SIZE_HIT[dm.size] + aura(a)
      - (dp.EVA / 2 + dm.mob / 3 + tileBonus(d).eva + TER_HIT[terRank(d)] + aura(d));
    if (a.buf.focus) h += 30; if (d.buf.focus) h -= 30;
    if (a.status.JAM) h -= 25;
    h += prevailF(a) * 20;
    if (skills(d).has('cap_mira')) h -= 20;
    if(typeof ENEMIES!=='undefined')h+=ENEMIES.accuracy(a)+ENEMIES.aura(a,G.map)-ENEMIES.aura(d,G.map);
    if (mode === 'evade') h *= 0.5;
    return Math.max(0, Math.min(100, Math.round(h)));
  }
  function critChance(a, d, w) {
    const ap = pstats(a), dp = pstats(d); const pf = partFx(a);
    let c = ap.SKL / 4 + w.crit + (pf.crit || 0) - dp.SKL / 4 + 4;
    if (skills(a).has('cap_odessa')) c += 30;
    return Math.max(0, Math.min(100, Math.round(c)));
  }
  function typeMult(a, d, w) {
    let m = CHART[w.type][mstats(d).armor];
    if (m > 1 && skills(a).has('exploit')) m += 0.25;
    return m;
  }
  function damage(a, d, w, mode, crit, rand = 1) {
    const ap = pstats(a), dp = pstats(d), dm = mstats(d);
    let stat = w.cat === 'M' ? ap.MEL : ap.RNG;
    if(w.combo){const p=COMBOS.partner(a,w);if(p){const ps=pstats(p);stat=(stat+(w.cat==='M'?ps.MEL:ps.RNG))/2;}}
    const atk = w.pow * (stat + a.will) / 200;
    const def = dm.arm * (dp.DEF + d.will) / 200 * (1 + tileBonus(d).def / 100);
    let dmg = Math.max(atk * 0.12, atk - def);
    dmg *= typeMult(a, d, w);
    dmg *= TER_MULT[terRank(a)] / (terRank(d) === 'S' ? 1.05 : 1);
    const sa = skills(a), sd = skills(d);
    if (masteries(a).includes(w.type)) dmg *= 1.15;
    dmg *= 1 + prevailF(a) * 0.3;
    dmg *= 1 + posMods(a, d).dmg;
    if (sa.has('cap_rei') && w.type === 'SPIR') dmg *= 1.2;
    if (sa.has('cap_yuna') && w.type === 'SPIR') dmg *= 1.25;
    if (sa.has('cap_gunnar') && (w.type === 'KIN' || w.type === 'EXPL')) dmg *= 1.25;
    if (sa.has('cap_brann') && a.will >= 140) dmg *= 1.15;
    if (a.fury) dmg *= 1 + 0.1 * a.fury;
    if (w.support) dmg *= 0.6;
    if (crit) dmg *= 1.5;
    if (a.buf.valor) dmg *= 2;
    if (mode === 'defend') dmg *= 0.5;
    if (d.buf.ironwall) dmg *= 0.25;
    if (sd.has('nerves')) dmg *= 0.9;
    if (sd.has('guardian') && d.will >= 130) dmg *= 0.8;
    if (sd.has('cap_sera')) dmg *= 0.85;
    if(typeof ENEMIES!=='undefined')dmg*=ENEMIES.reduction(d,G.map)*ENEMIES.damageMultiplier(a,w);
    dmg *= rand;
    // barrier
    let barrier = null;
    if (dm.barrier && !dm.barrier.bypass.includes(w.type) && !sa.has('cap_yuna') && d.en >= dm.barrier.en) {
      barrier = dm.barrier; dmg -= dm.barrier.val;
    }
    return { dmg: Math.max(10, Math.round(dmg)), barrier };
  }
  function forecast(a, d, w, mode) {
    const r = { hit: hitChance(a, d, w, mode), crit: critChance(a, d, w), dmg: damage(a, d, w, mode, false).dmg, mult: typeMult(a, d, w) };
    return r;
  }
  // Roll an attack (pure; returns result). Apply with applyResult.
  function roll(a, d, w, mode) {
    if(typeof ENEMIES!=='undefined'&&ENEMIES.phantom(d))return {hit:false,crit:false,dmg:0,barrier:null,status:null,mult:typeMult(a,d,w),w,phantom:true};
    const hc = hitChance(a, d, w, mode);
    const hit = Math.random() * 100 < hc;
    const crit = hit && Math.random() * 100 < critChance(a, d, w);
    const { dmg, barrier } = hit ? damage(a, d, w, mode, crit, 0.95 + Math.random() * 0.1) : { dmg: 0, barrier: null };
    let status = null;
    if (hit && w.status) {
      let ch = w.status.ch + (skills(a).has('afflict') ? 25 : 0)+(typeof ENEMIES!=='undefined'?ENEMIES.statusBonus(a):0);
      const pf = partFx(d); if (pf.sres) ch *= (1 - pf.sres);
      if (skills(d).has('guardian') && d.will >= 130) ch = 0;
      if (d.boss) ch *= 0.6;
      if (Math.random() * 100 < ch) status = w.status.id;
    }
    return { hit, crit, dmg, barrier, status, mult: typeMult(a, d, w), w };
  }
  function pushes(w) { return w.anim === 'punch' || w.anim === 'drill' || w.big || w.push; }
  function willCap(u) { return skills(u).has('overdrive') ? 170 : 150; }
  function addWill(u, n) { u.will = Math.min(willCap(u), Math.max(50, u.will + n)); }
  function spend(u, w) {
    if(w.combo){const p=COMBOS.partner(u,w);if(p){p.en=Math.max(0,p.en-w.partnerEN);p.acted=true;p.moved=true;}}
    if (w.en) u.en = Math.max(0, u.en - w.en);
    if (w.ammo) { if (u.ammo[w.idx] == null) u.ammo[w.idx] = w.ammo; u.ammo[w.idx]--; }
  }
  function applyResult(a, d, r) {
    if(typeof ENEMIES!=='undefined')ENEMIES.spent(a);
    const sa = skills(a), sd = skills(d);
    if (r.hit) {
      d.hp = Math.max(d.protect ? 1 : 0, d.hp - r.dmg);
      if (r.barrier) d.en = Math.max(0, d.en - r.barrier.en);
      if (r.status && d.hp > 0) d.status[r.status] = STATUS[r.status].turns;
      addWill(a, 1); addWill(d, 2 + (sd.has('ironwill') ? 2 : 0) + (sd.has('cap_brann') ? 2 : 0));
      if (d.buf.alert) d.buf.alert = false;
    } else {
      addWill(d, 1 + (sd.has('ironwill') ? 2 : 0));
      if (d.buf.alert) d.buf.alert = false;
    }
    if (a.buf.strike) a.buf.strike = false;
    if (a.buf.valor && r.hit) a.buf.valor = false;
    if (d.hp <= 0) { addWill(a, 5); a.kills = (a.kills || 0) + 1; if (sa.has('cap_lucien')) { a.fury = Math.min(3, (a.fury || 0) + 1); addWill(a, 10); } }
  }
  function bestWeapon(a, d, moved, counter) {
    const ds = dist(a, d); let best = null, bv = -1;
    for (const w of weapons(a)) {
      if (usable(a, w, ds, moved, counter, d)) continue;
      const f = forecast(a, d, w, 'counter');
      let v = f.dmg * (f.hit / 100);
      if (f.dmg >= d.hp) v += 5000 * (f.hit / 100);
      if (w.finisher && !counter) v *= 1.05;
      if (v > bv) { bv = v; best = w; }
    }
    return best;
  }
  return { posMods, pushes, flank, formation, highGround, ter, env, terRank, skills, pstats, mstats, partFx, weapons, usable, dist, hitChance, critChance, damage, forecast, roll, applyResult, spend, addWill, willCap, bestWeapon, typeMult };
})();
