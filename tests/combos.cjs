// Combination-attack and Support Defend state rules, without browser drawing.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function verify(root=path.resolve(__dirname,'..')){
  const checked=[],errors=[],c=vm.createContext({console,document:{createElement:()=>({width:256,height:256,getContext:()=>({createLinearGradient:()=>({addColorStop(){}})})})},
    check:(ok,message)=>{if(!ok)throw Error(message);checked.push(message);}});
  for(const file of ['data/types','data/mechs','data/pilots','data/story','data/expansion','data/classes','data/enemy-deployments','map/enemy-systems','data/combos']){
    const p=path.join(root,'js',file+'.js');if(fs.existsSync(p))vm.runInContext(fs.readFileSync(p,'utf8'),c,{filename:file+'.js'});
  }
  vm.runInContext(`let SAVE={bonds:{},pilots:Object.fromEntries(Object.keys(PILOTS).map(id=>[id,{lvl:1,exp:0,pp:0,nodes:{},kills:0}])),mechs:Object.fromEntries(Object.keys(MECHS).map(id=>[id,{up:{},parts:[]}]))};const G={map:null};let uid=0;
    function makePilot(pid,x,y,will=140){const mech=PILOTS[pid].mech,m=MECHS[mech];return {uid:++uid,pilot:pid,mech,team:'player',x,y,lvl:1,hp:m.hp,en:m.en,will,acted:false,moved:false,status:{},buf:{},ammo:{}};}
    function pair(id,flip=false){const c=COMBOS.pairs.find(c=>c.id===id),u=makePilot(c.pilots[flip?1:0],2,2,c.will),p=makePilot(c.pilots[flip?0:1],2,3,c.will),d={uid:++uid,mech:'lancer',team:'enemy',pilot:null,x:3,y:2,lvl:1,hp:30000,en:100,will:100,acted:false,status:{},buf:{},ammo:{}};SAVE.bonds[COMBOS.bondKey(u.pilot,p.pilot)]=7;G.map={units:[u,p,d],tile:()=>'.',space:false,phase:'player'};const w=COMBOS.weapons(u).find(w=>w.combo===id);return {c,u,p,d,w};}`,c);
  vm.runInContext(fs.readFileSync(path.join(root,'js/battle/combat.js'),'utf8'),c,{filename:'combat.js'});
  const run=(label,body)=>{try{vm.runInContext('(()=>{'+body+'})()',c,{filename:label});}catch(e){errors.push(label+': '+e.message);}};
  run('defined combinations',`const expected={falcon_gale:['rei','mira',6800,120],gaia_spiral:['brann','jin',7600,120],crimson_deadline:['lucien','odessa',6900,120],starlit_requiem:['yuna','sera',8200,130]};check(COMBOS.pairs.length===4,'four defined combinations');for(const [id,[a,b,pow,will]] of Object.entries(expected)){const c=COMBOS.pairs.find(c=>c.id===id);check(c&&c.pilots[0]===a&&c.pilots[1]===b&&c.pow===pow&&c.will===will,'pair data '+id);}`);
  const ids=vm.runInContext('COMBOS.pairs.map(c=>c.id)',c);
  for(const id of ids){
    for(const flip of [false,true])run('eligibility '+id+' '+flip,`let {c,u,p,d,w}=pair('${id}',${flip});check(!!w&&w.partnerUID===p.uid,'${id} available from ${flip?'second':'first'} pilot');check(COMBOS.canTarget(u,w,d),'${id} both target distances legal');check(CB.usable(u,w,CB.dist(u,d),false,false,d)===null,'${id} legal combo usable');check(CB.usable(u,w,CB.dist(u,d),false,true,d)==='partner','${id} combo excluded from counterfire');u.moved=true;check(COMBOS.weapons(u).some(w=>w.combo==='${id}'),'${id} available after movement');`);
    for(const [label,mutation] of [
      ['initiator Will','u.will=c.will-1'],['partner Will','p.will=c.will-1'],['initiator EN','u.en=c.en-1'],['partner EN','p.en=c.en-1'],
      ['initiator acted','u.acted=true'],['partner acted','p.acted=true'],['initiator disabled','u.hp=0'],['partner disabled','p.hp=0'],
      ['partner enemy','p.team="enemy"'],['initiator enemy','u.team="enemy"'],['not adjacent','p.y=4'],['diagonal is not adjacent','p.x=3;p.y=3'],
      ['partner absent','G.map.units=G.map.units.filter(x=>x!==p)'],
    ])run(id+' excludes '+label,`const {c,u,p,d,w}=pair('${id}');${mutation};check(!COMBOS.weapons(u).some(w=>w.combo==='${id}'),'${id} excludes ${label}');check(!COMBOS.canTarget(u,w,d),'${id} stale selection rechecks ${label}');`);
    run('target geometry '+id,`const {u,p,d,w}=pair('${id}');d.x=4;d.y=2;check(!COMBOS.canTarget(u,w,d),'${id} rejects target beyond partner reach');check(CB.usable(u,w,2,false,false,d)==='partner','${id} combat validator rechecks partner reach');d.x=2;d.y=4;check(COMBOS.canTarget(u,w,d),'${id} accepts shared reach at initiator range two');d.y=5;check(!COMBOS.canTarget(u,w,d),'${id} rejects target beyond initiator reach');`);
    run('EN and partner action '+id,`const {c,u,p,d,w}=pair('${id}'),a=u.en,b=p.en;CB.spend(u,w);check(u.en===a-c.en&&p.en===b-c.en,'${id} pays EN from both machines');check(p.acted&&p.moved,'${id} consumes partner action');check(!COMBOS.weapons(u).some(w=>w.combo==='${id}'),'${id} cannot repeat with spent partner');check(!COMBOS.canTarget(u,w,d),'${id} spent partner invalidates captured weapon');`);
    for(const cat of ['R','M'])run('averaged '+cat+' stat '+id,`const {u,p,d,w}=pair('${id}');w.cat='${cat}';const stat=w.cat==='M'?'MEL':'RNG',index=w.cat==='M'?0:1,a=PILOTS[u.pilot],b=PILOTS[p.pilot],oldA={...a.base},oldB={...b.base},grA=[...a.gr],grB=[...b.gr];try{a.base[stat]=300;b.base[stat]=120;a.gr[index]=b.gr[index]=0;const combo=CB.damage(u,d,w,'counter',false,1).dmg,plain={...w};delete plain.combo;a.base[stat]=210;const expected=CB.damage(u,d,plain,'counter',false,1).dmg;check(combo===expected,'${id} uses average ${cat} stat');a.base[stat]=340;b.base[stat]=80;check(CB.damage(u,d,w,'counter',false,1).dmg===combo,'${id} preserves damage when ${cat} stat shifts retain the mean');a.base[stat]=300;check(CB.damage(u,d,plain,'counter',false,1).dmg!==combo,'${id} average differs from initiator-only ${cat} damage');}finally{a.base=oldA;b.base=oldB;a.gr=grA;b.gr=grB;}`);
  }
  run('protagonist forms',`for(const mech of ['alteon','alteon_s','alteonz','alteonz_s']){const {u,p,d}=pair('falcon_gale');u.mech=mech;u.hp=MECHS[mech].hp;u.en=MECHS[mech].en;const w=COMBOS.weapons(u).find(w=>w.combo==='falcon_gale');check(!!w&&COMBOS.canTarget(u,w,d),'Falcon Gale supports '+mech);}`);
  run('bond threshold',`const {c,u,p,d,w}=pair('falcon_gale');const key=COMBOS.bondKey(u.pilot,p.pilot);SAVE.bonds[key]=6;check(!COMBOS.weapons(u).length,'bond one locks the combination');SAVE.bonds[key]=7;G.map.comboUsed={falcon_gale:1};check(!COMBOS.weapons(u).length,'bond two grants one charge per mission');SAVE.bonds[key]=12;check(COMBOS.weapons(u).length===1,'bond three grants a second charge');`);
  run('Support Defend charges',`const d=makePilot('rei',5,5),g=makePilot('gunnar',5,6);g.mech='aegis';
    const branch=CLASSES.get('aegis').branches.find(b=>b.name==='Guardian');
    const first=branch.tiers[0][0], second=branch.tiers[3][0];
    SAVE.pilots.gunnar.nodes={[first.id]:true};G.map={units:[d,g],tile:()=>'.'};
    check(COMBOS.guards(d).includes(g),'adjacent Guard I is offered');
    g.acted=true;check(COMBOS.guards(d).includes(g),'guarding does not spend the unit action');
    g.guardUsed=1;check(!COMBOS.guards(d).includes(g),'rank I is exhausted');
    SAVE.pilots.gunnar.nodes={[first.id]:true,[second.id]:true};check(COMBOS.guards(d).includes(g),'rank II grants a second guard');
    g.guardUsed=2;check(!COMBOS.guards(d).includes(g),'rank II is exhausted');
    g.guardUsed=0;g.x=6;check(!COMBOS.guards(d).includes(g),'diagonal is outside default range');
    g.x=5;g.team='enemy';check(!COMBOS.guards(d).includes(g),'opposing team cannot guard');`);
  run('Support Attack charges',`const {u,p,d}=pair('falcon_gale');p.mech='sylph';d.x=3;d.y=3;p.will=140;
    const learn=CLASSES.get(p.mech).branches.flatMap(b=>b.tiers.flat()).filter(n=>n.fx.support);
    SAVE.pilots[p.pilot].nodes={[learn[0].id]:true};
    const gun=CB.weapons(u)[0], assist=COMBOS.support(u,d,gun);
    check(assist?.weapon.supportPower===.5,'rank I supports for 50% damage');
    check(CB.forecast(p,d,assist.weapon,'counter').crit===0,'ordinary support cannot crit');
    p.supportUsed=1;check(!COMBOS.support(u,d,gun),'rank I charge is exhausted');
    SAVE.pilots[p.pilot].nodes=Object.fromEntries(learn.map(n=>[n.id,true]));
    check(COMBOS.support(u,d,gun)?.weapon.supportPower===.65,'rank II supports for 65% damage');
    G.map.phase='enemy';check(!COMBOS.support(u,d,gun),'no player support during enemy phase');`);
  return {status:errors.length?'failed':'passed',checks:checked.length,errors,coverage:checked,limits:['Exercises state and combat formulas directly; no browser UI, split-screen cut-in, or interception animation screenshots.','Charge exhaustion and phase eligibility are covered here. Campaign simulation exercises phase resets.','Initiator action completion remains MAP.confirmAttack / finishUnit orchestration; CB.spend test checks both EN costs and the partner action.']};
}
module.exports={verify};
if(require.main===module){const result=verify();console.log(JSON.stringify(result,null,2));if(result.errors.length)process.exitCode=1;}
