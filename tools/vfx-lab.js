'use strict';
const el = id=>document.getElementById(id);
const canvas = el('preview'), ctx = canvas.getContext('2d');
const config = el('config'), scrub = el('scrub');
let active, started = null, frame = 0;
const images = new Map(), requests = new Set();

function image(path) {
  if (!images.has(path)) {
    const art = new Image();
    art.onload = draw;
    art.src = path;
    images.set(path,art);
  }
  return images.get(path);
}
function drawFrame(id,x,dir,phase) {
  const art = ASSETS.unit(id);
  if (!art) {
    if (!requests.has(id)) {
      requests.add(id);
      ASSETS.loadPreviewUnit(id,'../').then(draw).catch(error=>{el('notice').value=error.message;});
    }
    return;
  }
  const pose = art.frames[phase], scale = Math.min(250 / art.w,200 / (art.h*art.ground));
  const w = pose.width*scale, h = pose.height*scale;
  ctx.save();
  ctx.fillStyle='#01092180'; ctx.beginPath(); ctx.ellipse(x,452,w*.34,10,0,0,7); ctx.fill();
  ctx.translate(x,450); ctx.scale(art.meta?.facesLeft ? -dir : dir,1);
  ctx.drawImage(pose,-w/2,-h*art.ground,w,h); ctx.restore();
}
function draw() {
  if (!active) return;
  const time = Number(scrub.value), bg = image('../assets/battle/'+el('backdrop').value+'.png');
  ctx.fillStyle='#0a1425'; ctx.fillRect(0,0,1000,540);
  if (bg.complete && bg.naturalWidth) ctx.drawImage(bg,0,0,1000,540);
  ctx.fillStyle='#08122430'; ctx.fillRect(0,0,1000,540);
  drawFrame(el('actor').value,255,1,time>active.charge ? 2 : 0);
  drawFrame(el('target').value,770,-1,time>active.charge+active.travel ? 3 : 0);
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const opts={low:el('low').checked};
  if (time<active.charge) {
    SPECTACLE.paint(ctx,active,'charge',time/active.charge,316,340,720,340,opts);
  } else if (time<active.charge+active.travel) {
    SPECTACLE.paint(ctx,active,'travel',(time-active.charge)/active.travel,316,340,760,340,opts);
  } else {
    SPECTACLE.paint(ctx,active,'impact',(time-active.charge-active.travel)/active.impact,760,340,316,340,opts);
  }
  ctx.restore();
  el('clock').value=time+' ms';
}
function update() {
  try {
    const value=JSON.parse(config.value);
    if (!SPECTACLE.valid(value)) throw Error('Invalid effect family, timing, count or power.');
    active=value;
    scrub.max=active.charge+active.travel+active.impact;
    el('notice').value='';
    draw();
  } catch (error) { el('notice').value=error.message; }
}
function profile() {
  config.value=JSON.stringify(SPECTACLE.profile(el('animation').value,{pow:Number(el('tier').value)}),null,2);
  update();
}
function stop() {
  cancelAnimationFrame(frame); started=null; el('play').textContent='Play';
}
function tick(now) {
  started ??= now-Number(scrub.value);
  const length=Number(scrub.max), next=now-started;
  scrub.value=Math.min(length,Math.round(next)); draw();
  if (next>=length) {
    if (!el('loop').checked) { stop(); return; }
    started=now;
  }
  frame=requestAnimationFrame(tick);
}
for (const kind of SPECTACLE.kinds) el('animation').append(new Option(kind,kind));
el('animation').value='gravity';
el('animation').onchange=el('tier').onchange=profile;
for (const id of ['actor','target','backdrop','low']) el(id).onchange=draw;
for (const select of [el('actor'),el('target')]) {
  for (const option of select.options) {
    const id = option.value;
    option.value = id;
    option.textContent = MECHS[id]?.name || id;
  }
}
scrub.oninput=()=>{stop();draw();};
config.oninput=update;
el('play').onclick=()=>{
  if (started!==null) { stop(); return; }
  if (scrub.value===scrub.max) scrub.value=0;
  el('play').textContent='Pause'; started=performance.now()-Number(scrub.value);
  frame=requestAnimationFrame(tick);
};
el('export').onclick=()=>{
  let value;
  try { value=JSON.parse(config.value); } catch { return; }
  if (!SPECTACLE.valid(value)) return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));
  const file=document.createElement('a'); file.href=url; file.download=el('animation').value+'.json'; file.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
profile();
