'use strict';
const COMBOS=(()=>{
  const pairs=[
    {id:'falcon_gale',pilots:['rei','mira'],name:'Falcon Gale',type:'SPIR',pow:6800,will:120,en:40,seq:['rifle','multislash','spirit'],cut:'Two wings. One open sky!'},
    {id:'gaia_spiral',pilots:['brann','jin'],name:'Gaia Spiral Crusher',type:'PLAS',pow:7600,will:120,en:50,seq:['punch','drill','megabeam'],cut:'Three hearts and a burning soul — break through!'},
    {id:'crimson_deadline',pilots:['lucien','odessa'],name:'Crimson Deadline',type:'KIN',pow:6900,will:120,en:45,seq:['multislash','railgun'],cut:'The opening is yours. Do not waste it.'},
    {id:'starlit_requiem',pilots:['yuna','sera'],name:'Starlit Requiem',type:'SPIR',pow:8200,will:130,en:60,seq:['funnel','gravity','spirit'],cut:'No voice is alone among the stars.'},
  ];
  const dist = (a,b) => Math.abs(a.x-b.x) + Math.abs(a.y-b.y);
  const bondKey = (a,b) => [a,b].sort().join('/');
  function bondLevel(a,b) {
    const pts = SAVE.bonds?.[bondKey(a,b)] || 0;
    return pts >= 12 ? 3 : pts >= 7 ? 2 : pts >= 3 ? 1 : 0;
  }
  function bond(a,b,kind) {
    if (!G.map || a.team !== 'player' || b.team !== 'player' || !a.pilot || !b.pilot || a.pilot === b.pilot) return;
    const key = bondKey(a.pilot,b.pilot);
    G.map.bondTicks ||= {};
    const keyKind = key + '/' + kind;
    const max = kind === 'formation' ? 1 : 2;
    if ((G.map.bondTicks[keyKind] || 0) >= max) return;
    G.map.bondTicks[keyKind] = (G.map.bondTicks[keyKind] || 0) + 1;
    SAVE.bonds ||= {};
    SAVE.bonds[key] = Math.min(30, (SAVE.bonds[key] || 0) + 1);
  }
  function partner(u,w){return G.map?.units.find(p=>p.uid===w.partnerUID&&p.hp>0&&p.team===u.team)||null;}
  function eligible(u,p,c) {
    const level = p && bondLevel(u.pilot,p.pilot);
    return level >= 2 && (G.map?.comboUsed?.[c.id] || 0) < level - 1 &&
      u.team === 'player' && u.hp > 0 && p !== u && p.team === u.team && p.hp > 0 && !p.acted && !u.acted &&
      dist(u,p) === 1 && u.will >= c.will && p.will >= c.will && u.en >= c.en && p.en >= c.en;
  }
  function weapons(u){if(!G.map||u.team!=='player')return [];return pairs.filter(c=>c.pilots.includes(u.pilot)).flatMap(c=>{const other=c.pilots.find(p=>p!==u.pilot),p=G.map.units.find(p=>p.pilot===other&&eligible(u,p,c));return p?[W(c.name,c.type,c.pow,1,2,{en:c.en,will:c.will,post:true,finisher:true,anim:'finisher',seq:c.seq,cut:c.cut,crit:20,acc:20,combo:c.id,partnerUID:p.uid,partnerEN:c.en})]:[];});}
  function canTarget(u,w,d){if(!w.combo)return true;const p=partner(u,w),c=pairs.find(c=>c.id===w.combo);return !!(c&&eligible(u,p,c)&&dist(u,d)<=2&&dist(p,d)<=2);}
  function ranks(u) {
    if (u.team === 'enemy' && Number(G.map?.ch?.num || 0) >= 4 && (u.boss || u.variant === 'commander')) return {attack:1, guard:1};
    const fx = CB.classFx(u);
    return {attack:Math.min(2,fx.support),guard:Math.min(2,fx.guard)};
  }
  function remaining(u,kind) {
    const used = kind === 'attack' ? u.supportUsed : u.guardUsed;
    return Math.max(0, ranks(u)[kind] - (used || 0));
  }
  function guards(d) {
    return (G.map?.units || []).filter(u => u !== d && u.team === d.team && u.hp > 0 && !u.escortPath
      && remaining(u,'guard') > 0 && dist(u,d) <= 1 + CB.classFx(u).guardRange);
  }
  function support(a,d,w) {
    if (w.combo || w.support || w.counter || !d || d.hp <= 0) return null;
    const phase = a.team === 'enemy' ? 'enemy' : 'player';
    if (G.map?.phase !== phase) return null;
    let choice = null;
    for (const u of G.map.units) {
      if (u === a || u.hp <= 0 || u.team !== a.team || dist(u,a) !== 1 || !remaining(u,'attack')) continue;
      const gun = CB.bestWeapon(u,d,false,true);
      if (!gun) continue;
      const fx = CB.classFx(u);
      const assist = { ...gun, counter:false, support:true, supportPower:ranks(u).attack === 2 ? .65 : .50, supportCrit:!!fx.supportCrit, hitBoost:fx.supportAim };
      const result = CB.forecast(u,d,assist,'counter');
      const score = result.hit * result.dmg;
      if (!choice || score > choice.score) choice = {unit:u, weapon:assist, score};
    }
    return choice;
  }
  return {pairs,partner,weapons,canTarget,guards,ranks,remaining,support,bond,bondLevel,bondKey};
})();
