// Touch map gestures use the same tactical commands as mouse and keyboard input.
'use strict';
const TOUCH=(()=>{
  const maps=new WeakMap();let current=null;
  const small=()=>window.matchMedia?.('(max-width: 900px)').matches||false;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function localPoint(e,canvas){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*(canvas.clientWidth/r.width),y:(e.clientY-r.top)*(canvas.clientHeight/r.height)};}
  function button(text,fn,cls=''){const b=document.createElement('button');b.type='button';b.className='btn sm '+cls;b.textContent=text;b.addEventListener('click',e=>{e.stopPropagation();fn();});return b;}
  function apply(s){
    const margin=small()?110:0,maxX=s.canvas.clientWidth*(s.scale-1)/2+margin,maxY=s.canvas.clientHeight*(s.scale-1)/2+margin;
    s.panX=clamp(s.panX,-maxX,maxX);s.panY=clamp(s.panY,-maxY,maxY);s.canvas.style.transform=`translate(${s.panX}px,${s.panY}px) scale(${s.scale})`;s.canvas.style.transformOrigin='center';s.label.textContent=Math.round(s.scale*100)+'%';
  }
  function clearPending(s){s.pending=null;s.confirm.hidden=true;}
  function moveNow(s){if(!s.pending)return;const p=s.pending,u=s.api.ui();clearPending(s);if(u.sel?.uid!==p.uid||u.mode!=='moving')return;Promise.resolve(s.api.click(p.x,p.y)).catch(e=>console.error('Touch move failed',e));}
  function tap(s,e){
    const t=s.api.toTile(e);if(!t)return;const ui=s.api.ui(),st=s.api.state();if(!st)return;
    if(ui.mode==='moving'&&ui.sel&&ui.range?.tiles.has(t.x+','+t.y)&&!st.unitAt(t.x,t.y)){
      if(s.pending?.x===t.x&&s.pending?.y===t.y&&s.pending?.uid===ui.sel.uid){moveNow(s);return;}
      s.pending={...t,uid:ui.sel.uid};s.api.preview?.(t);s.confirm.hidden=false;s.moveLabel.textContent=`Move to ${t.x+1}, ${t.y+1}?`;return;
    }
    clearPending(s);Promise.resolve(s.api.click(t.x,t.y)).then(()=>{const selected=s.api.ui().sel;if(selected)revealUnit(selected,s.api.geom());}).catch(e=>console.error('Touch selection failed',e));
  }
  function attachMap(canvas,api){
    if(maps.has(canvas)){maps.get(canvas).api=api;current=maps.get(canvas);return;}
    const wrap=canvas.parentElement,s={canvas,wrap,api,scale:1,panX:0,panY:0,pointers:new Map(),start:null,pinch:null,panning:false,longPressed:false,longTimer:null,suppressClick:0,pending:null};maps.set(canvas,s);current=s;
    const controls=document.createElement('div');controls.className='touchMapTools';s.label=document.createElement('span');s.label.className='touchZoomLabel';s.label.textContent='100%';
    controls.append(button('−',()=>{s.scale=clamp(s.scale-.25,1,3.5);apply(s)},'zoomButton'),s.label,button('+',()=>{s.scale=clamp(s.scale+.25,1,3.5);apply(s)},'zoomButton'),button('Reset',()=>resetMap(),'zoomReset'));wrap.append(controls);
    s.confirm=document.createElement('div');s.confirm.className='touchMoveConfirm';s.confirm.hidden=true;s.moveLabel=document.createElement('span');s.confirm.append(s.moveLabel,button('Confirm move',()=>moveNow(s),'primary'),button('Cancel',()=>{clearPending(s);s.api.preview?.(null)}));wrap.append(s.confirm);
    canvas.style.touchAction='none';
    canvas.addEventListener('click',e=>{if(performance.now()<s.suppressClick){e.stopImmediatePropagation();e.preventDefault();}},true);
    canvas.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse')return;e.preventDefault();canvas.setPointerCapture?.(e.pointerId);s.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});s.suppressClick=performance.now()+800;
      if(s.pointers.size===1){s.start={x:e.clientX,y:e.clientY,panX:s.panX,panY:s.panY};s.panning=false;s.longPressed=false;clearTimeout(s.longTimer);s.longTimer=setTimeout(()=>{if(s.pointers.size!==1||s.panning)return;s.longPressed=true;clearPending(s);const t=s.api.toTile(e);if(t){s.api.inspect?.(t);showInfo(true);}},480);}
      if(s.pointers.size===2){clearTimeout(s.longTimer);const [a,b]=[...s.pointers.values()];s.pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),scale:s.scale};s.panning=true;clearPending(s);}
    },{passive:false});
    canvas.addEventListener('pointermove',e=>{
      if(!s.pointers.has(e.pointerId))return;e.preventDefault();s.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(s.pointers.size>=2&&s.pinch){const [a,b]=[...s.pointers.values()];s.scale=clamp(s.pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(10,s.pinch.distance),1,3.5);apply(s);return;}
      if(s.start&&Math.hypot(e.clientX-s.start.x,e.clientY-s.start.y)>8){clearTimeout(s.longTimer);s.panning=true;clearPending(s);s.panX=s.start.panX+e.clientX-s.start.x;s.panY=s.start.panY+e.clientY-s.start.y;apply(s);}
    },{passive:false});
    const end=e=>{if(!s.pointers.has(e.pointerId))return;e.preventDefault();clearTimeout(s.longTimer);s.pointers.delete(e.pointerId);s.suppressClick=performance.now()+800;if(!s.pointers.size){if(!s.panning&&!s.longPressed&&e.type!=='pointercancel')tap(s,e);s.start=null;s.pinch=null;}else s.panning=true;};
    canvas.addEventListener('pointerup',end,{passive:false});canvas.addEventListener('pointercancel',end,{passive:false});
  }
  function resetMap(){if(!current)return;current.scale=1;current.panX=current.panY=0;clearPending(current);apply(current);showInfo(false);}
  function showInfo(on){document.getElementById('mapBody')?.classList.toggle('touchInfoOpen',!!on);const b=document.getElementById('touchInfoToggle');if(b)b.setAttribute('aria-expanded',String(!!on));}
  function revealUnit(u,geom){
    const s=current;if(!s||!small()||!u||!geom)return;const width=s.canvas.clientWidth,height=s.canvas.clientHeight,x=(geom.ox+(u.x+.5)*geom.T-width/2)*s.scale+width/2+s.panX,y=(geom.oy+(u.y+.5)*geom.T-height/2)*s.scale+height/2+s.panY;
    // Menus sit on the right; keep the selected frame in the open upper-left area.
    if(x>width*.55)s.panX-=x-width*.35;if(y>height*.55)s.panY-=y-height*.35;apply(s);
  }
  function init(actions={}){
    const mapBody=document.getElementById('mapBody');if(mapBody&&!document.getElementById('touchInfoToggle')){const b=button('Unit & terrain',()=>showInfo(!mapBody.classList.contains('touchInfoOpen')),'touchInfoToggle');b.id='touchInfoToggle';b.setAttribute('aria-expanded','false');mapBody.append(b);}
    const battle=document.getElementById('battle');if(battle&&!document.getElementById('battleControls')){const bar=document.createElement('div');bar.id='battleControls';bar.className='battleControls';bar.append(button('Fast-forward',()=>actions.fastBattle?.()),button('Skip animation',()=>actions.skipBattle?.(),'primary'));battle.append(bar);}
    window.addEventListener('resize',()=>{if(current)apply(current);});
  }
  return {init,attachMap,localPoint,resetMap,revealUnit,showInfo,cancelMove:()=>{if(current)clearPending(current)},get scale(){return current?.scale||1},get pendingMove(){return current?.pending||null}};
})();
