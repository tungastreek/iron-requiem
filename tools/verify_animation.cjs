// Executes battle timelines against a no-op drawing surface. This checks that
// each new attack completes; it does not evaluate pixels, appearance or sound.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
async function verifyAnimations(root=path.resolve(__dirname,'..')){
  let rafId=0,clock=0;const scheduled=new Map(),sounds=[];
  const ctx=new Proxy({measureText:s=>({width:String(s).length*9}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}});
  const canvas=()=>({width:900,height:900,hidden:false,style:{},getContext:()=>ctx,addEventListener(){}}),elements={};
  const c=vm.createContext({console,window:{addEventListener(){}},document:{createElement:()=>canvas(),getElementById:id=>elements[id]||(elements[id]=canvas())},requestAnimationFrame:f=>{scheduled.set(++rafId,f);return rafId},cancelAnimationFrame:id=>scheduled.delete(id),SFX:{play:(name)=>sounds.push(name),music(){}},R3D:{ok:false},ART:{POSES:new Proxy({},{get:()=>({})}),rgba:()=> '#aaccff',lerpPose:()=>({}),drawBG(){},drawMech(){},glowDot(){},flame(){},portrait:()=>canvas()},ASSETS:{unit:()=>({w:300,h:300,ground:.96,frames:[canvas(),canvas(),canvas(),canvas()]}),drawBattleBG:()=>true}});
  const read=p=>fs.readFileSync(path.join(root,p),'utf8');
  for(const file of ['data/types','data/mechs','data/pilots','data/story','data/expansion','data/classes','render/spectacle','ui/dialogue'])vm.runInContext(read('js/'+file+'.js'),c);
  vm.runInContext('const G={map:null};let SAVE={roster:[],pilots:{},mechs:{},settings:{anim:"fast"}};',c);
  for(const file of ['battle/combat','battle/scene'])vm.runInContext(read('js/'+file+'.js'),c);
  const attacks=vm.runInContext('Object.keys(MECHS).flatMap(id=>MECHS[id].weapons.map((w,index)=>({id,index,name:w.name})))',c),completed=[],errors=[];
  for(const test of attacks){c.test=test;let done=false,failure=null;
    const task=vm.runInContext(`(()=>{const m=MECHS[test.id],w=m.weapons[test.index];const u={mech:test.id,team:'enemy',lvl:12,hp:m.hp,hpStart:m.hp,en:m.en,will:140,status:{},buf:{},ammo:{},x:2,y:4,lineSet:m.armor==='BIO'?'beast':'grunt_c'},d={mech:'alteon',pilot:'rei',team:'enemy',lvl:12,hp:4200,hpStart:4200,en:160,will:110,status:{},buf:{},ammo:{},x:4,y:4};return SCENE.play({left:u,right:d,bg:'city',events:[{by:'L',w,res:{hit:true,crit:false,dmg:500,mult:1,status:null,barrier:null},mode:'counter',hpAfter:3700}]})})()`,c);
    task.then(()=>done=true,e=>{done=true;failure=e});
    let frames=0;
    while(!done&&frames<5000){for(let i=0;i<10;i++)await Promise.resolve();const jobs=[...scheduled.values()];scheduled.clear();clock+=50;for(const f of jobs)f(clock);frames++;}
    if(failure)errors.push(test.name+': '+failure.message);else if(!done)errors.push(test.name+': timeline did not finish');else completed.push({...test,frames});
    scheduled.clear();
  }
  const missingProfiles=vm.runInContext(`Object.values(MECHS).flatMap(m=>m.weapons.flatMap(w=>w.finisher?(w.seq||['slash']):[w.anim])).filter(kind=>!SPECTACLE.kinds.includes(kind))`,c);
  if(missingProfiles.length) errors.push('Missing profiles: '+[...new Set(missingProfiles)].join(', '));
  return {status:errors.length?'failed':'passed',completed:completed.length,errors,attacks:completed,soundCues:[...new Set(sounds)],limit:'No-op drawing surface: confirms timeline execution only; appearance, browser rendering and audio playback were not checked.'};
}
module.exports={verifyAnimations};
if(require.main===module)verifyAnimations().then(r=>{console.log(JSON.stringify(r,null,2));if(r.errors.length)process.exitCode=1}).catch(e=>{console.error(e);process.exitCode=1});
