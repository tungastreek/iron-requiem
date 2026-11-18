// Generic specialist abilities and variant rules; rendering and map hooks call these.
'use strict';
const ENEMIES=(()=>{
  const spec=u=>MECHS[u.mech]||{},ability=u=>spec(u).abil||{},same=(a,b)=>a.team===b.team,alive=u=>u.hp>0,dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
  function variant(u){return u.variant&&VARIANTS[u.variant]||null;}
  function init(u,o={}){
    u.variant=VARIANTS[o.variant]?o.variant:null;
    if(u.variant==='corrupted'&&!['BIO','VOID'].includes(spec(u).armor))u.variant=null;
    u.attacksMade=0;u.moveDistance=0;u.specialPhases=0;u.spawnParent=o.spawnParent||null;
    const v=variant(u);if(v){u.eskills=[...new Set([...(u.eskills||[]),...v.skills])];u.nameOverride=(v.prefix+(o.name||spec(u).name));}
    return u;
  }
  function mechStats(u,o){const v=variant(u);if(!v)return o;return {...o,hp:Math.round(o.hp*v.hp),arm:Math.round(o.arm*v.arm),mob:o.mob+v.mob,regenHP:(o.regenHP||0)+v.regenHP};}
  function pilotStats(u,o){const v=variant(u);if(!v||!v.stats)return o;const r={...o};for(const key in r)r[key]+=v.stats;return r;}
  function accuracy(u){return (variant(u)?.accuracy||0)+(!u.attacksMade?(ability(u).firstStrike||0):0);}
  function aura(u,st){if(!st)return 0;return st.units.some(o=>alive(o)&&o!==u&&same(o,u)&&o.variant==='commander'&&dist(o,u)<=2)?10:0;}
  function reduction(u,st){if(!st)return 1;let reduction=0;for(const o of st.units)if(alive(o)&&o!==u&&same(o,u)&&dist(o,u)===1)reduction=Math.max(reduction,ability(o).guardAura||0);return 1-reduction;}
  function damageMultiplier(a,w){const ch=ability(a).charge;return ch&&w.cat==='M'&&(a.moveDistance||0)>=ch.distance?ch.mult:1;}
  function statusBonus(u){return variant(u)?.status||0;}
  function reward(u){return variant(u)?.reward||1;}
  function phantom(u,random=Math.random){return !!(ability(u).decoy&&random()<ability(u).decoy);}
  function spent(u){u.attacksMade=(u.attacksMade||0)+1;}
  function moveCost(u,tile,normal){return ability(u).burrowing&&['h','r'].includes(tile)?1:normal;}
  function pullTile(st,a,d,w){if(!(w.pull||ability(a).pull)||!alive(d)||spec(d).ship||spec(d).size==='XL'||dist(a,d)<=1)return null;let dx=Math.sign(a.x-d.x),dy=Math.sign(a.y-d.y);if(Math.abs(a.x-d.x)>=Math.abs(a.y-d.y))dy=0;else dx=0;const x=d.x+dx,y=d.y+dy;if(x<0||y<0||x>=st.w||y>=st.h||st.tile(x,y)==='x'||st.unitAt(x,y))return null;return {x,y};}
  function supportScore(u,x,y,st){const a=ability(u);if(!(a.healer||a.guardAura||a.cantor||a.spawner))return 0;const friends=st.units.filter(o=>alive(o)&&o!==u&&same(o,u));if(!friends.length)return 0;let score=0;for(const f of friends){const d=Math.abs(x-f.x)+Math.abs(y-f.y);if(d<=2)score+=160;if(d===1)score+=a.healer||a.guardAura?180:60;}return score;}
  function phase(st,team,hooks={}){
    const changes=[],units=st.units.filter(u=>alive(u)&&u.team===team);
    for(const u of units){u.moveDistance=0;u.specialPhases=(u.specialPhases||0)+1;const a=ability(u);
      if(a.healer){const targets=st.units.filter(o=>alive(o)&&o!==u&&same(o,u)&&dist(o,u)===1&&o.hp<(hooks.maxHP?hooks.maxHP(o):spec(o).hp)).sort((x,y)=>(hooks.maxHP?hooks.maxHP(y):spec(y).hp)-y.hp-((hooks.maxHP?hooks.maxHP(x):spec(x).hp)-x.hp));const target=targets[0];if(target){const max=hooks.maxHP?hooks.maxHP(target):spec(target).hp,amount=Math.min(a.healer,max-target.hp);target.hp+=amount;changes.push({kind:'heal',source:u,target,amount});}}
      if(a.cantor){for(const target of st.units.filter(o=>alive(o)&&same(o,u)&&spec(o).armor==='VOID'&&dist(o,u)<=3)){target.will=Math.min(150,target.will+(a.cantor.will||10));const status=['BREAK','BURN','SHOCK','JAM','SLOW'].find(id=>target.status&&target.status[id]);if(status)delete target.status[status];changes.push({kind:'choir',source:u,target,cleansed:status||null});}}
      if(a.spawner&&u.specialPhases%a.spawner.interval===0&&hooks.spawn){const brood=st.units.filter(o=>alive(o)&&o.spawnParent===u.uid).length;if(brood<a.spawner.maxAlive){const slots=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:u.x+dx,y:u.y+dy}));const slot=slots.find(p=>p.x>=0&&p.y>=0&&p.x<st.w&&p.y<st.h&&st.tile(p.x,p.y)!=='x'&&!st.unitAt(p.x,p.y));if(slot){const born=hooks.spawn({m:a.spawner.mech,...slot,lvl:u.lvl,spawnParent:u.uid},team);if(born){born.spawnParent=u.uid;changes.push({kind:'spawn',source:u,target:born});}}}}
    }
    if(hooks.effect)changes.forEach(hooks.effect);return changes;
  }
  function paint(u){const v=variant(u);return v?{filter:v.filter,color:v.color,glow:u.variant==='commander'?24:10,aura:u.variant==='corrupted'}:null;}
  function badge(ctx,u,x,y,size=24){const v=variant(u);if(!v)return;ctx.save();ctx.strokeStyle=v.color;ctx.lineWidth=2;ctx.globalAlpha=.8;ctx.beginPath();ctx.ellipse(x,y+size*.25,size*.43,size*.17,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=v.color;ctx.shadowColor='#000';ctx.shadowBlur=3;ctx.font=`bold ${Math.max(11,size*.42)}px sans-serif`;ctx.textAlign='center';ctx.fillText(v.badge,x+size*.28,y-size*.3);ctx.restore();}
  function label(u){const v=variant(u);return v?{name:u.nameOverride||v.prefix+spec(u).name,description:v.desc}:null;}
  return {variant,init,mechStats,pilotStats,accuracy,aura,reduction,damageMultiplier,statusBonus,reward,phantom,spent,moveCost,pullTile,supportScore,phase,paint,badge,label,ability};
})();
