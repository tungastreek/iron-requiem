// Readable frame catalogue and save-independent weapon animation previews.
'use strict';
const ARCHIVE=(()=>{
  let filter='new',selected=null,weaponIndex=0,background='city';
  const playerMechs=new Set(Object.values(PILOTS).map(p=>p.mech).concat(['alteon_s','alteonz','alteonz_s']));
  function open(){return UI.modal(close=>{
    const root=h('div',{class:'card archive'});
    const render=()=>{
      const scroll = root.querySelector('.archiveList')?.scrollTop || 0;
      root.replaceChildren();
      const ids=Object.keys(MECHS).filter(id=>id!=='carmine_e'&&(filter==='all'||filter==='new'&&(EXPANSION.units.includes(id)||ENEMY_ROSTER.ids.includes(id))||filter==='allies'&&playerMechs.has(id)||filter==='enemies'&&!playerMechs.has(id)));
      if(!ids.includes(selected))selected=ids[0];const m=MECHS[selected],su=ASSETS.unit(selected);
      root.append(h('div',{class:'archiveHead'},h('div',{},h('div',{class:'eyebrow'},'HALCYON FIELD ARCHIVE'),h('h2',{},'Machines with a purpose')),h('button',{class:'btn',onclick:()=>close()},'Close')));
      root.append(h('div',{class:'row archiveFilters'},[['new','New machines'],['allies','Allied frames'],['enemies','Enemy frames'],['all','All frames']].map(([id,label])=>h('button',{class:'btn'+(filter===id?' primary':''),'aria-pressed':String(filter===id),onclick:()=>{filter=id;selected=null;weaponIndex=0;root.querySelector('.archiveList').scrollTop=0;render();}},label))));
      const list=h('div',{class:'archiveList'},ids.map(id=>{const c=h('canvas',{width:100,height:100});const icon=ASSETS.mapIcon(id,50,false);if(icon)c.getContext('2d').drawImage(icon,0,0);return h('button',{class:'archiveItem'+(id===selected?' on':''),'aria-pressed':String(id===selected),onclick:()=>{selected=id;weaponIndex=0;render();}},c,h('span',{},MECHS[id].name));}));
      const stage=h('canvas',{width:720,height:420,class:'archiveStage'}),ctx=stage.getContext('2d');
      if(!ASSETS.drawBattleBG(ctx,720,420,background,0))ART.drawBG(ctx,720,420,background,0,0);
      if(su){const f=su.frames[0],scale=Math.min(610/f.width,345/f.height);ctx.drawImage(f,360-f.width*scale/2,395-f.height*scale,f.width*scale,f.height*scale);}
      const weapon=m.weapons[Math.min(weaponIndex,m.weapons.length-1)];
      const detail=h('div',{class:'archiveDetail'},stage,h('div',{class:'eyebrow'},m.cls),h('h3',{},m.name),h('p',{},m.desc||'A fielded frame. Read its armor, range and ammunition before engaging.'),h('p',{class:'muted small'},`${ARMOR[m.armor].name} · ${m.hp.toLocaleString()} HP · ${m.en} EN · Move ${m.move} · ${m.fly?'Flight':'Ground'}`),
        h('label',{class:'set'},'Weapon',h('select',{onchange:e=>{weaponIndex=Number(e.target.value);render();}},m.weapons.map((w,i)=>h('option',{value:i,selected:i===weaponIndex?'selected':null},`${w.name} · ${ATK[w.type].name} · ${w.pow} · ${w.rmin}–${w.rmax}`)))),
        h('label',{class:'set'},'Battlefield',h('select',{onchange:e=>{background=e.target.value;render();}},['city','fire','ruins','sky','space','hive','ice','void'].map(bg=>h('option',{value:bg,selected:bg===background?'selected':null},bg[0].toUpperCase()+bg.slice(1))))),
        h('button',{class:'btn primary big',onclick:async()=>{close();await demo(selected,weapon,background);open();}},'Play attack preview'),h('p',{class:'muted small'},'Animation previews use a demonstration exchange. Campaign progress is unchanged. Click or Space accelerates; Esc skips.'));
      root.append(h('div',{class:'archiveBody'},list,detail));
      list.scrollTop=scroll;
    };render();return root;
  });}
  async function demo(mid,w,bg){
    const enemy=playerMechs.has(mid)?'mantle':'aegis';
    const make=(id,side)=>{const m=MECHS[id],pilot=Object.keys(PILOTS).find(p=>PILOTS[p].mech===id)||null;return {mech:id,team:side,pilot,lvl:12,hp:m.hp,hpStart:m.hp,en:m.en,will:140,status:{},buf:{},ammo:{},x:side==='player'?2:4,y:4,portrait:OUROBOR_FACE[id],lineSet:m.armor==='BIO'?'beast':m.armor==='VOID'?'vael':'grunt_c'};};
    const left=make(mid,'player'),right=make(enemy,'enemy'),dmg=Math.min(right.hp-1,Math.round(w.pow*.6));
    const result={hit:true,crit:false,dmg,mult:1,barrier:null,status:null};
    $('#title').hidden=true;SFX.music('battle');
    await SCENE.play({left,right,events:[{by:'L',w,res:result,mode:'counter',hpAfter:right.hp-dmg}],bg});
    GAME.toTitle();
  }
  return{open};
})();
