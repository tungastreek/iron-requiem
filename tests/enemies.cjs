'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const gradient=()=>({addColorStop(){}}),ctx=new Proxy({createLinearGradient:gradient,createRadialGradient:gradient,measureText:s=>({width:String(s).length*8})},{get:(o,k)=>k in o?o[k]:()=>{}});
const c=vm.createContext({console,document:{createElement:()=>({width:256,height:256,getContext:()=>ctx})}});
for(const file of ['data/types','data/mechs','data/pilots','data/story','data/expansion','data/classes','data/enemy-deployments','map/enemy-systems'])vm.runInContext(read('js/'+file+'.js'),c,{filename:file});
const result=vm.runInContext(`(()=>{
 const checks=[],ok=(x,m)=>{if(!x)throw Error(m);checks.push(m)};
 const make=(mech,team='enemy',x=2,y=2)=>ENEMIES.init({mech,team,x,y,uid:Math.random(),hp:MECHS[mech].hp,en:MECHS[mech].en,will:100,status:{},lvl:10},{variant:null});
 for(const id of ENEMY_ROSTER.ids)ok(!!MECHS[id]&&MECHS[id].weapons.length>=2,'data '+id);
 for(const key of ['elite','commander','corrupted']){const u=ENEMIES.init(make('crawler'),{variant:key});const s=ENEMIES.mechStats(u,{hp:1000,arm:1000,mob:100,regenHP:0});ok(s.hp===Math.round(1000*VARIANTS[key].hp),'variant HP '+key);ok(s.arm===Math.round(1000*VARIANTS[key].arm)&&s.mob===100+VARIANTS[key].mob,'variant armor and mobility '+key);ok(ENEMIES.reward(u)===VARIANTS[key].reward,'reward '+key);ok(u.nameOverride.startsWith(VARIANTS[key].prefix),'label '+key);}
 const corrupt=ENEMIES.init(make('crawler'),{variant:'corrupted'});ok(ENEMIES.statusBonus(corrupt)===15&&ENEMIES.mechStats(corrupt,{hp:1000,arm:1000,mob:100,regenHP:0}).regenHP===.05,'corruption status and regeneration');
 ok(!ENEMIES.init(make('lancer'),{variant:'corrupted'}).variant,'corruption restricted');
 const leader=ENEMIES.init(make('lancer','enemy',2,2),{variant:'commander'}),u=make('lancer','enemy',3,2),drone=make('aegisdrone','enemy',3,3);const st={w:12,h:12,units:[leader,u,drone],tile:()=>'.'};st.unitAt=(x,y)=>st.units.find(o=>o.hp>0&&o.x===x&&o.y===y);
 ok(ENEMIES.aura(u,st)===10,'commander aura');ok(ENEMIES.reduction(u,st)===.7,'guard aura');
 const shade=make('shade');ok(ENEMIES.accuracy(shade)===30,'first strike ready');ENEMIES.spent(shade);ok(ENEMIES.accuracy(shade)===0,'first strike spent');
 const echo=make('echo');ok(ENEMIES.phantom(echo,()=>.29)&&!ENEMIES.phantom(echo,()=>.3),'decoy probability boundary');
 const charger=make('seraphlancer');charger.moveDistance=4;ok(ENEMIES.damageMultiplier(charger,MECHS.seraphlancer.weapons[0])===1.25,'charge threshold');
 ok(ENEMIES.moveCost(make('burrower'),'h',2)===1&&ENEMIES.moveCost(make('burrower'),'m',3)===3,'burrow terrain');
 const hunter=make('harpoon','enemy',2,2),target=make('alteon','player',6,2);st.units=[hunter,target];ok(ENEMIES.pullTile(st,hunter,target,MECHS.harpoon.weapons[0]).x===5,'pull one tile');
 const healer=make('rigger','enemy',2,2),hurt=make('lancer','enemy',3,2);hurt.hp=100;st.units=[healer,hurt];ENEMIES.phase(st,'enemy');ok(hurt.hp===2600,'repair amount');
 const cantor=make('cantor','enemy',2,2),knight=make('knight','enemy',4,2);knight.status.BURN=2;st.units=[cantor,knight];ENEMIES.phase(st,'enemy');ok(knight.will===110&&!knight.status.BURN,'choir buff and cleanse');
 const mother=make('broodmaw','enemy',5,5);st.units=[mother];const spawn=(o,team)=>{const born=make(o.m,team,o.x,o.y);st.units.push(born);return born};for(let i=0;i<10;i++)ENEMIES.phase(st,'enemy',{spawn});ok(st.units.length===4,'brood max three alive');
 for(const id of ['c1','c2'])ok(CHAPTERS[id].enemies.every(e=>!e.variant),'early variant-free '+id);
 const coverage={};for(const id of ENEMY_ROSTER.ids){coverage[id]=Object.keys(CHAPTERS).filter(ch=>CHAPTERS[ch].enemies.some(e=>e.m===id));ok(coverage[id].length>0,'campaign coverage '+id);}
 return {checks:checks.length,coverage,variants:Object.fromEntries(Object.entries(CHAPTERS).map(([id,ch])=>[id,{total:ch.enemies.length,elite:ch.enemies.filter(e=>e.variant==='elite').length,commander:ch.enemies.filter(e=>e.variant==='commander').length,corrupted:ch.enemies.filter(e=>e.variant==='corrupted').length}]))};
})()`,c);
vm.runInContext(read('vendor/three/three.min.js'),c,{filename:'three.min.js'});vm.runInContext(read('js/render/mechart.js'),c);vm.runInContext(read('js/render/r3d.js'),c);
const rigs=vm.runInContext(`(()=>{const out=[];for(const id of ENEMY_ROSTER.ids){const rig=R3D.buildRig(MECHS[id].vis,id);for(const pose of ['idle','aim','hurt'])rig.apply(ART.POSES[pose],{},.6);rig.outer.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(rig.outer),s=b.getSize(new THREE.Vector3());if(!Number.isFinite(s.x+s.y+s.z)||s.x<=0||s.y<=0||s.z<=0)throw Error('Invalid rig '+id);for(const key of ['elite','commander','corrupted',null]){rig.setVariant(key);rig.setFlash(1);rig.setFlash(0);}let meshes=0;rig.root.traverse(o=>{if(o.isMesh)meshes++});out.push({id,meshes,bounds:[s.x,s.y,s.z].map(n=>Math.round(n))});}return out})()`,c);
const report={status:'passed',...result,rigs,limits:['3D rigs were constructed and animated as geometry without a WebGL renderer.','No screenshots or browser end-to-end run: computer/browser access is blocked.','Full campaign difficulty and visual appearance require a playtest.']};
fs.writeFileSync(path.join(root,'tests/ENEMY_REPORT.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
