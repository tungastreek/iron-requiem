// Preserve unique story enemies; diversify no more than one third of each grunt list.
'use strict';
const ENEMY_ROSTER=(()=>{
  if(MECHS.cantor)MECHS.cantor.abil={...(MECHS.cantor.abil||{}),cantor:{will:10}};
  const sheets = {
    'specialist-concord': ['valkyr', 'aegisdrone', 'siegecrawler', 'shade'],
    'specialist-free-states': ['rigger', 'harpoon', 'breaker', 'gale'],
    'specialist-legacy-brood': ['spitter', 'burrower', 'broodmaw', 'skyray'],
    'specialist-vael': ['seraphlancer', 'monolith', 'echo'],
  };
  for (const [sheet, units] of Object.entries(sheets)) {
    units.forEach((id, row) => { MECHS[id].atlas = { sheet, row }; });
  }
  const placements={
    c2:['shade','valkyr'],c3:['spitter','burrower'],c4:['aegisdrone','siegecrawler'],
    c5a:['broodmaw','skyray'],c6a:['burrower','broodmaw'],c5b:['gale','rigger'],c6b:['harpoon','breaker'],
    c7:['spitter','skyray'],c8:['seraphlancer','monolith'],c9:['echo','cantor'],c10:['echo','monolith'],
    i2:['aegisdrone','shade'],i3:['valkyr','siegecrawler'],i4:['rigger','harpoon','gale'],i5:['breaker','cantor'],i6:['spitter','broodmaw','burrower'],i7:['seraphlancer','aegisdrone'],i8:['echo','monolith'],
  };
  const reports=[];
  for(const [id,list]of Object.entries(placements)){
    const ch=CHAPTERS[id];if(!ch)continue;const repeated=ch.enemies.filter(e=>!e.boss&&!e.tag&&!e.pilot);
    // Expansion interludes tag every grunt for reporting, so their generated
    // interlude tags are safe to retain on replacement specialist spawns.
    const candidates=ch.enemies.filter(e=>!e.boss&&!e.pilot&&(!e.tag||String(e.tag).startsWith('interlude_')));
    const max=Math.min(list.length,Math.floor(candidates.length/3));
    for(let i=0;i<max;i++){const e=candidates[i];e.m=list[i];}
    reports.push({chapter:id,replaced:max,total:ch.enemies.length});
  }
  // Ensure every specialist has a second authored encounter where its faction
  // appears. Event additions avoid deleting any protected story enemy.
  const lateAdds={c3:['burrower'],c4:['shade'],c5a:['skyray'],c6a:['broodmaw'],c5b:['gale','rigger'],c6b:['harpoon','breaker'],c8:['seraphlancer','monolith'],c9:['cantor','echo']};
  for(const [id,list]of Object.entries(lateAdds)){const ch=CHAPTERS[id];if(!ch)continue;const used=new Set(ch.enemies.map(e=>e.x+','+e.y));const slots=[[16,1],[16,10],[14,0],[17,6]];const additions=[];
    for(const [i,m]of list.entries()){if(ch.enemies.some(e=>e.m===m))continue;const p=slots.find(([x,y])=>x<ch.map.w&&y<ch.map.h&&!used.has(x+','+y));if(!p)continue;used.add(p[0]+','+p[1]);additions.push(E(m,p[0],p[1],Math.max(...ch.enemies.map(e=>e.lvl||1)),{hold:1}));}
    if(additions.length)ch.enemies.push(...additions);
  }
  // Original chapters 1–2 and their immediate interlude remain variant free.
  const early=new Set(['c1','c2','i1']);
  const order=['c3','i3','c4','i4','c5a','c6a','c5b','c6b','i5','c7','i6','c8','i7','i8','c9','c10'];
  for(const id of order){const ch=CHAPTERS[id];if(!ch||early.has(id))continue;const eligible=ch.enemies.filter(e=>!e.boss&&!e.pilot&&!e.protect);if(!eligible.length)continue;const late=['i5','c7','i6','c8','i7','i8','c9','c10'].includes(id),command=late||['c4','c6a','c6b'].includes(id);let cursor=0;
    if(command)eligible[cursor++].variant='commander';
    const eliteCount=Math.min(eligible.length-cursor,Math.max(1,Math.round(ch.enemies.length*(late?.25:.16))));for(let i=0;i<eliteCount;i++)eligible[cursor++].variant='elite';
    if(late){const corrupt=eligible.slice(cursor).find(e=>['BIO','VOID'].includes(MECHS[e.m].armor));if(corrupt)corrupt.variant='corrupted';}
  }
  const ids=['spitter','burrower','broodmaw','skyray','valkyr','aegisdrone','siegecrawler','shade','rigger','harpoon','breaker','gale','cantor','seraphlancer','monolith','echo'];
  return {ids,placements:reports};
})();
