// Rebuild the Normal pressure chart. Pass a checkout of the pre-V3 source for comparison.
const fs = require('node:fs');
const path = require('node:path');
const {simulate} = require('../tests/campaign');
const root = path.resolve(__dirname,'..');
const out = path.join(root,'docs','difficulty');
const order = ['c1','i1','c2','i2','c3','i3','c4','i4','c5a','c5b','c6a','c6b','i5','c7','i6','c8','i7','i8','c9','c10'];
const targets = [.55,.61,.67,.73,.79,.85,.87,.90,.92,.92,.97,.97,.90,1,1,1.12,.90,1,1.12,1.12];
const volley = `(()=>{
  const map=G.map;
  const players=map.units.filter(u=>u.team==='player');
  const enemies=map.units.filter(u=>u.team==='enemy');
  // Treat phases as engagements: each frame contributes its average expected
  // fraction of enemy hull removed over all enemy hull/terrain matchups.
  function power(side,other) {
    return side.reduce((total,u)=> total+other.reduce((n,d)=>{
      const range=CB.dist(u,d), step=CB.mstats(u).move;
      const w=CB.weapons(u).filter(w=>!w.combo && !CB.usable(u,w,null,false,false,d));
      const sample=w.map(w=>{
        const f=CB.forecast(u,d,w,'defend');
        const reach=Math.max(.54,1-.034*Math.max(0,range-step-w.rmax));
        return (f.dmg/CB.mstats(d).hp)*f.hit/100*reach;
      });
      return n+Math.max(0,...sample);
    },0)/Math.max(1,other.length),0);
  }
  const enemy=power(enemies,players), squad=power(players,enemies);
  const waves=(map.ch.events || []).reduce((n,e)=>n+(e.add?.length||0),0);
  const objective=map.ch.win.escort?1.24:map.ch.lose?.turn?1.12:1;
  return {title:map.ch.title,players:players.length,enemies:enemies.length,waves,
    enemyLevel:Math.round(enemies.reduce((n,u)=>n+u.lvl,0)/Math.max(1,enemies.length)),
    pressure:(enemy/Math.max(.01,squad))*(1+.35*waves/Math.max(1,enemies.length))*objective};
})()`;
async function measure(source) {
  const results = [];
  for (const id of order) results.push(await simulate(source,id,id.endsWith('b')?'B':'A',true,17,{measure:volley}));
  return results;
}
function chart(current,before) {
  const max = Math.max(1.2,...current.map(r=>r.pressure),...(before||[]).map(r=>r.pressure));
  const xs=i=>76+i*46, ys=n=>328-n*276/max;
  const line=values=>values.map((n,i)=>xs(i)+','+ys(n)).join(' ');
  const targetBand = targets.map((n,i)=>xs(i)+','+ys(n+.08)).concat(targets.map((n,i)=>xs(i)+','+ys(Math.max(0,n-.08))).reverse()).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1020 385" role="img" aria-label="Normal difficulty pressure before and after V3 with target band">
  <rect width="1020" height="385" fill="#0b1627"/>
  <g fill="#d3e6fb" font-family="monospace"><text x="24" y="28" font-size="18">IRON REQUIEM / NORMAL PRESSURE INDEX</text>
  ${[0,.25,.5,.75,1].map(f=>`<text x="18" y="${ys(max*f)+4}" font-size="11">${(max*f).toFixed(2)}</text><path d="M69 ${ys(max*f)}H978" stroke="#304464"/>`).join('')}
  ${order.map((id,i)=>`<text x="${xs(i)}" y="349" text-anchor="middle" font-size="11">${id}</text>`).join('')}
  <text x="76" y="374" fill="#8eefff">V3</text><text x="162" y="374" fill="#ffc68d">${before?'PRE-V3':''}</text><text x="285" y="374" fill="#aab4ed">TARGET ± 0.08</text></g>
  <polygon points="${targetBand}" fill="#575ea866"/>
  ${before?`<polyline points="${line(before.map(r=>r.pressure))}" fill="none" stroke="#ffc68d" stroke-width="2"/>`:''}
  <polyline points="${line(current.map(r=>r.pressure))}" fill="none" stroke="#8eefff" stroke-width="3"/>
</svg>\n`;
}
async function main() {
  const current=await measure(root), reference=process.argv[2], before=reference ? await measure(path.resolve(reference)) : null;
  fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'pressure.svg'),chart(current,before));
  const rows=current.map((r,i)=>`| ${order[i]} | ${r.title} | ${r.players}/${r.enemies} | ${r.waves} | ${r.enemyLevel} | ${before?before[i].pressure.toFixed(2):'—'} | ${r.pressure.toFixed(2)} | ${targets[i].toFixed(2)} |`);
  const outside=current.filter((r,i)=>Math.abs(r.pressure-targets[i])>.08).length;
  fs.writeFileSync(path.join(out,'CURVE.md'),[
    '# Normal difficulty pressure', '',
    'The index estimates enemy hull damage per phase divided by player hull damage per phase. Each unit contributes its strongest available attack across opposing hull and terrain matchups. It uses the actual combat forecast in Defend and discounts approach time by opening distance, speed and weapon reach. Both sides start with the campaign fixture’s canonical pilot levels, equipment, Will and upgrades.',
    'Reinforcements add 35% of their headcount ratio to opening pressure. Escorts multiply pressure by 1.24 and other timed missions by 1.12. The estimate excludes future Spirit use, individual AI decisions and some scripted reinforcements. Use the campaign simulation to check the resulting turns and losses.',
    '', `${outside} of ${order.length} maps currently sit outside the target band. Pre-V3 and V3 use the same fixture levels and upgrades, with the respective skill systems.`,'',
    '![Normal difficulty pressure chart](pressure.svg)','',
    '| Map | Mission | Players/enemies | Scripted waves | Avg. enemy level | Pre-V3 | V3 | Target |',
    '|---|---|---:|---:|---:|---:|---:|---:|',...rows,'',
  ].join('\n'));
  console.log('Pressure report written. '+outside+' maps outside target.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
