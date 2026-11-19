// Headless rules simulation. Uses the actual map/combat/event functions with
// no-op drawing and automatically answered story prompts. No browser evidence.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
async function simulate(root,id,route='A',trueRoute=true,seed=17,options={}){
  let outcome=null,defeat='',lastState=null;const lines=[],changes=[];
  const cx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:s=>({width:String(s).length*8})},{get:(o,k)=>k in o?o[k]:()=>{}});
  const el=()=>({hidden:false,width:1200,height:800,clientWidth:1200,clientHeight:800,dataset:{},style:{},classList:{add(){},remove(){},toggle(){}},getContext:()=>cx,addEventListener(){},getBoundingClientRect:()=>({left:0,top:0})});const els={};
  const math=Object.create(Math);let random=seed;math.random=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/4294967296};
  let c;const ui=new Proxy({victory:async data=>{outcome='win';changes.push(data)},defeat:async msg=>{outcome='loss';defeat=msg},runScript:async script=>{c.script=script;return vm.runInContext('runInstant(script)',c)},defensePrompt:async(a,d,w)=>{
    if(options.legacy)return 'defend';
    Object.assign(c,{incoming:a,defender:d,gun:w});
    return vm.runInContext(`(async()=>{
      const hit=CB.forecast(incoming,defender,gun,'counter');
      const guards=COMBOS.guards(defender).filter(g=>CB.forecast(incoming,g,gun,'defend').dmg*1.5<g.hp);
      if(hit.dmg*1.5>=defender.hp&&hit.hit>20&&guards.length)return 'guard:'+guards[0].uid;
      const counter=CB.bestWeapon(defender,incoming,false,true);
      if(counter&&(hit.hit===0||hit.dmg*1.5<defender.hp*.58)){defender._counterW=counter;return 'counter';}
      const evade=CB.forecast(incoming,defender,gun,'evade');
      return evade.hit<20?'evade':'defend';
    })()`,c);
  }},{get:(o,k)=>k in o?o[k]:async()=>{}});
  c=vm.createContext({console,Math:math,performance:{now:()=>0},window:{addEventListener(){},devicePixelRatio:1},document:{getElementById:id=>els[id]||(els[id]=el()),createElement:el},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:f=>{queueMicrotask(f);return 1},clearTimeout(){},UI:ui,SFX:new Proxy({},{get:()=>()=>{}}),R3D:{ok:false},ASSETS:new Proxy({},{get:()=>()=>null}),ART:new Proxy({rgba:()=> '#aaccee',shade:x=>x,mapSprite:()=>el()},{get:(o,k)=>k in o?o[k]:()=>{}})});
  const read=p=>fs.readFileSync(path.join(root,p),'utf8');
  for(const f of ['data/types','data/mechs','data/pilots','data/story','data/expansion','data/classes','data/combos','data/enemy-deployments','map/enemy-systems','battle/combat'])if(fs.existsSync(path.join(root,'js',f+'.js')))vm.runInContext(read('js/'+f+'.js'),c,{filename:f});
  let map=read('js/map/tactics.js').replace('return { get geom()', 'return { _qa:{aiAct,battle,finishUnit,runEvents,checkEnd,phaseStart,makeUnit,pathTo,animateMove}, get geom()');vm.runInContext(map,c,{filename:'tactics.js'});
  // main.js owns migration; here only the ordinary default save is needed.
  let main=read('js/main.js');vm.runInContext(main,c,{filename:'main.js'});
  c.caseRoute=route;c.caseTrue=trueRoute;c.targetChapter=id;c.legacy=!!options.legacy;c.levelOverride=options.level||0;c.upgradeOverride=options.upgrades??-1;c.mode=options.mode||'normal';
  vm.runInContext(`function runInstant(script){const labels=Object.fromEntries(script.map((x,i)=>[x.label,i]).filter(x=>x[0]));for(let i=0;i<script.length;i++){const x=script[i];if(x.if){if(x.if(SAVE))i=labels[x.go];continue}if(x.go){i=labels[x.go];continue}if(x.set)Object.assign(SAVE.flags,x.set);if(x.res)SAVE.flags.res=(SAVE.flags.res||0)+x.res;if(x.join)MAP.addRoster(x.join);if(x.codex&&!SAVE.codex.includes(x.codex))SAVE.codex.push(x.codex);if(x.choice){let o=x.choice.find(o=>o.set?.route===caseRoute)||x.choice.find(o=>o.set?.true_route===caseTrue)||x.choice[caseTrue?0:x.choice.length-1];if(o.set)Object.assign(SAVE.flags,o.set);if(o.res)SAVE.flags.res=(SAVE.flags.res||0)+o.res;if(o.go)i=labels[o.go];}if(x.remove&&G.map){const u=G.map.find(x.remove);if(u){u.hp=0;G.map.defeatedTurn[u.tag]=G.map.turn;}}if(x.endmap)return 'endmap:'+x.endmap;if(x.end)return 'end:'+x.end;}}
  SAVE=defaultSave();SAVE.difficulty=mode;SAVE.settings.anim='off';SAVE.settings.defAuto=legacy;SAVE.settings.autoEnd=false;SAVE.flags.route=caseRoute;
  G.map={find:()=>({hp:1}),units:[],defeatedTurn:{}};let cursor='c1',safe=0;while(cursor!==targetChapter&&cursor&&safe++<40){const ch=CHAPTERS[cursor];runInstant(ch.pre);for(const ev of ch.events||[]){if(!ev.cond||ev.cond(SAVE)){for(const j of ev.join||[])MAP.addRoster(j.p);if(ev.defect){const u=(ch.enemies||[]).find(e=>e.tag===ev.defect);if(u?.p)MAP.addRoster(u.p);}if(ev.upgrade)SAVE.flags.zero=true;}}runInstant(ch.post);cursor=typeof ch.next==='function'?ch.next(SAVE):ch.next;}
  G.map=null;
  SAVE.chapter=targetChapter;SAVE.flags.route=caseRoute;SAVE.flags.true_route=targetChapter==='c10';SAVE.flags.res=caseTrue?5:0;runInstant(CHAPTERS[targetChapter].pre);
  const base=Number(CHAPTERS[targetChapter].num),level=levelOverride||Math.max(1,Math.round(base*2.95-1.5)),up=upgradeOverride>=0?upgradeOverride:Math.max(0,Math.floor(base/2.8));
  for(const p of SAVE.roster){
    const ps = SAVE.pilots[p]=newPilotSave(p,level), m=MAP.pilotMech(p);
    if(typeof CLASSES!=='undefined') {
      const frame=CLASSES.get(m);
      for(const tier of [0,1,2]) for(const branch of frame.branches) {
        const node=branch.tiers[tier]?.[0];
        if(node) CLASSES.learn(ps,branch,tier,node);
      }
    } else if(!legacy) {
      const branches = buildTree(p);
      for(const branch of branches) for(const n of branch.nodes.slice(0,Math.min(3,Math.floor((level+4)/7)))) ps.nodes[n.id]=true;
    }
    SAVE.mechs[m]={up:{hp:up,en:up,arm:up,mob:up,wpn:up},parts:base>=8&&p==='ilse'?['plating','repair']:base>=7&&p==='rei'?['repair','plating']:[null,null]};
  }
  GAME.afterMap=async()=>{};GAME.retryMap=()=>{};`,c);
  await vm.runInContext('MAP.start(CHAPTERS[targetChapter])',c);
  if(options.measure)return vm.runInContext(options.measure,c);
  let actions=0,turn=0;const cap=options.turnCap||35;
  while(!outcome&&vm.runInContext('!!G.map',c)&&turn<cap){lastState=vm.runInContext('G.map',c);turn=lastState.turn;
    const pilots=lastState.units.filter(u=>u.hp>0&&u.team==='player'&&!u.acted);
    for(const u of pilots){if(outcome||!vm.runInContext('!!G.map',c))break;c.actor=u;
      await vm.runInContext(`(async()=>{
        if(actor.acted||actor.hp<=0)return;
        const convoy = G.map.units.filter(u => u.escortPath && u.hp > 0);
        if (convoy.some(u => u.escortPath[u.escortStep + 1]?.join() === [actor.x, actor.y].join())) {
          const road = new Set(convoy.flatMap(u => u.escortPath.slice(u.escortStep + 1).map(tile => tile.join())));
          const range = MAP.reach(actor);
          const clear = [...range.tiles].find(tile => !road.has(tile));
          if (clear) {
            await MAP._qa.animateMove(actor, MAP._qa.pathTo(range, actor, ...clear.split(',').map(Number)));
            await MAP._qa.finishUnit(actor);
            return;
          }
        }
        const known=id=>PILOTS[actor.pilot].spirits.some(([s,l])=>s===id&&(legacy||actor.lvl>=l))||(typeof CLASSES!=='undefined'&&(CLASSES.personal[actor.pilot]?.tiers || []).flat().some(n=>n.fx.spirit===id&&SAVE.pilots[actor.pilot].nodes[n.id]));
        const cast=async(id,target)=>{if(known(id)&&actor.sp>=SPIRITS[id].cost&&!actor.buf[id])await MAP.useSpirit(actor,id,target);};
        if(!legacy){
          const patients=G.map.units.filter(u=>u.team==='player'&&u.hp>0&&CB.mstats(u).hp-u.hp>=2600)
            .sort((a,b)=>a.hp/CB.mstats(a).hp-b.hp/CB.mstats(b).hp);
          if(patients.length)await cast('mend',patients[0]);
          if(actor.pilot==='ilse'&&actor.hp<CB.mstats(actor).hp*.7)await cast('mend',actor);
          if(actor.will>=110&&(!['rei','ilse'].includes(actor.pilot)||actor.sp>=SPIRITS.valor.cost+35))await cast('valor');
        }
        if(actor.hp<CB.mstats(actor).hp*.55)await cast('guts');
        const contacts=G.map.units.filter(u=>u.team==='enemy'&&u.hp>0);
        if(legacy||contacts.some(u=>CB.dist(actor,u)<=CB.mstats(actor).move+5)&&(!known('ironwall')||!['rei','ilse'].includes(actor.pilot)||actor.sp>=35))await cast('focus');
        if(actor.will<120)await cast('ardor');
        if(!legacy&&(actor.pilot==='rei'||actor.pilot==='ilse')){
          const danger=contacts.filter(d=>CB.dist(actor,d)<8).length;
          if(danger>=1||(base>=7&&G.map.turn>=2))await cast('ironwall');
          if(danger>=1&&actor.hp<CB.mstats(actor).hp*.72)await cast('alert');
        }
        const reserve=actor.pilot==='ilse'||(actor.pilot==='rei'&&base>=7&&!actor.buf.ironwall);
        if(!legacy&&reserve){
          const shots=contacts.map(d=>({d,w:CB.bestWeapon(actor,d,false,false)})).filter(x=>x.w);
          const score=({d,w})=>{const f=CB.forecast(actor,d,w,'counter');return f.hit/100*(f.dmg+Number(f.dmg>=d.hp)*3000);};
          const shot=shots.sort((a,b)=>score(b)-score(a))[0];
          if(shot&&(actor.hp>CB.mstats(actor).hp*.35||score(shot)>3500))await MAP._qa.battle(actor,shot.d,shot.w);
        }else await MAP._qa.aiAct(actor);
        if(G.map){await MAP._qa.finishUnit(actor);if(G.map)await MAP._qa.runEvents();if(G.map)await MAP._qa.checkEnd();}
      })()`,c);actions++;
    }
    if(!outcome&&vm.runInContext('!!G.map',c))await vm.runInContext('MAP.endPlayerPhase()',c);
  }
  const state=lastState||{},dead=(state.units||[]).filter(u=>u.team==='player'&&u.hp<=0).map(u=>u.pilot),roster=vm.runInContext('SAVE.roster',c),flags=vm.runInContext('({...SAVE.flags})',c);
  return {chapter:id,route,trueRoute,seed,result:outcome||'turn-cap',turns:changes[0]?.turn||lastState?.turn||turn,actions,losses:dead,events:Object.keys(state.fired||{}),roster,flags:{route:flags.route,zero:!!flags.zero,trueRoute:!!flags.true_route,sparedLucien:!!flags.spared_lucien,scarredLucien:!!flags.scarred_lucien},defeat,credits:changes[0]?.credits||0};
}
async function suite(root=path.resolve(__dirname,'..'),options={}){
 const result=[];for(const seed of options.seeds||[17])for(const route of ['A','B']){const ids=['c1','i1','c2','i2','c3','i3','c4','i4',route==='A'?'c5a':'c5b',route==='A'?'c6a':'c6b','i5','c7','i6','c8','i7','i8','c9','c10'];for(const id of ids){const r=await simulate(root,id,route,true,seed,options);result.push(r);if(options.progress)console.log(id,route,r.result,r.turns,r.defeat);}}for(const seed of options.seeds||[17])for(const route of ['A','B'])result.push(await simulate(root,'c9',route,false,seed,options));return result;
}
module.exports={simulate,suite};
if(require.main===module)suite(path.resolve(__dirname,'..'),{progress:true,seeds:[17,29,71]}).then(r=>{fs.writeFileSync(path.join(__dirname,'campaign-results.json'),JSON.stringify(r,null,2)+'\n');const failures=r.filter(x=>x.result!=='win');
const keys=new Set(r.map(x=>x.chapter+'/'+x.route+'/'+x.trueRoute));
for(const x of r.filter(x=>x.result==='win'))keys.delete(x.chapter+'/'+x.route+'/'+x.trueRoute);
console.log(failures.length+' lost simulations; '+keys.size+' chapter/route cases without a victory');
if(keys.size){console.error([...keys].join(', '));process.exitCode=1;}}).catch(e=>{console.error(e);process.exitCode=1});
