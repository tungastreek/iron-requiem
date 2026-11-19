const assert = require('node:assert/strict');
const path = require('node:path');
const {simulate} = require('./campaign');

async function verify() {
  const result = await simulate(path.resolve(__dirname,'..'),'c1','A',true,17,{measure:`(()=>{
    const ally=G.map.find('rei'), enemy=G.map.units.find(u=>u.team==='enemy');
    const standard=CB.weapons(enemy)[0], overpower={...standard,pow:200000};
    const cap=Math.floor(CB.mstats(ally).hp*.60);
    const capped=CB.damage(enemy,ally,overpower,'counter',true,1);
    const telegraphed=CB.damage(enemy,ally,{...overpower,telegraphed:true},'counter',true,1);
    const hi={...standard,acc:500}, lo={...standard,acc:-500};
    const high=CB.forecast(enemy,ally,hi,'counter').hit, low=CB.forecast(enemy,ally,lo,'counter').hit;
    enemy.buf.strike=true;
    const strike=CB.forecast(enemy,ally,hi,'counter').hit;
    ally.buf.alert=true;
    const alert=CB.forecast(enemy,ally,hi,'counter').hit;
    ally.buf.alert=false; enemy.buf.strike=false;
    const normal=CB.damage(ally,enemy,CB.weapons(ally)[0],'counter',false,1).dmg;
    G.map.assisted=true;
    const assist=CB.damage(ally,enemy,CB.weapons(ally)[0],'counter',false,1).dmg;
    const wing=RULES.deployLimit(CHAPTERS.c9,SAVE);
    const classes=new Set(Object.keys(MECHS).map(CLASSES.classOf));
    let shape=true, distinct=true, finalLocked=true, finalUnlocked=true;
    for(const id of classes) {
      const mid=Object.keys(MECHS).find(m=>CLASSES.classOf(m)===id);
      const frame=CLASSES.get(mid);
      shape &&= frame.branches.length===3 && frame.branches.every(b=>b.tiers.map(t=>t.length).join()==='1,1,2,1,2');
      for(const b of frame.branches) {
        const saved={pp:100,kills:0,nodes:{},deeds:{}};
        for(let tier=0;tier<4;tier++) CLASSES.learn(saved,b,tier,b.tiers[tier][0]);
        distinct &&= !CLASSES.canBuy(saved,b,2,b.tiers[2][1]);
        const n=b.tiers[4][0]; finalLocked &&= !CLASSES.canBuy(saved,b,4,n);
        if(n.deed.key==='kills') saved.kills=n.deed.target;
        else saved.deeds[n.deed.key]=n.deed.target;
        finalUnlocked &&= CLASSES.learn(saved,b,4,n);
      }
    }
    return {cap,damage:capped.dmg,marked:capped.capped,telegraphed:telegraphed.dmg,high,low,strike,alert,normal,assist,wing,
      min:RULES.enemyLevel(1,12),max:RULES.enemyLevel(30,12),assistedLevel:RULES.enemyLevel(30,12,true),
      classCount:classes.size,shape,distinct,finalLocked,finalUnlocked};
  })()`});
  assert.equal(result.damage,result.cap);
  assert.equal(result.marked,true);
  assert(result.telegraphed>result.cap);
  assert.deepEqual([result.low,result.high,result.strike,result.alert],[5,95,100,0]);
  assert(Math.abs(result.assist-result.normal*1.1)<2);
  assert.deepEqual([result.min,result.max,result.assistedLevel],[9,14,13]);
  assert.equal(result.classCount,11);
  assert.equal(result.wing,9);
  for (const key of ['shape','distinct','finalLocked','finalUnlocked']) assert.equal(result[key],true,key);
  console.log('PASS: damage and accuracy caps, difficulty governor, assisted retry, deployment, class tracks, deeds and exclusive choices');
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
