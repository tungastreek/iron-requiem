// Central graphics policy. Renderers report work time rather than guessing from device names.
'use strict';
const QUALITY=(()=>{
  const choices=['auto','high','low'],samples={map:[],battle:[]};
  let automatic='high',reason='hardware rendering',rendererName='',notified=false,debugEl=null;
  const listeners=new Set();
  function requested(){try{return choices.includes(SAVE.settings.graphics)?SAVE.settings.graphics:'auto';}catch{return 'auto';}}
  function active(){return requested()==='auto'?automatic:requested();}
  function emit(){document.documentElement?.dataset&&(document.documentElement.dataset.quality=active());listeners.forEach(fn=>fn(active()));updateDebug();}
  function set(value){if(!choices.includes(value))return false;try{SAVE.settings.graphics=value;if(typeof GAME!=='undefined')GAME.persist();}catch{}emit();return true;}
  function detect(gl){
    if(!gl)return;try{const ext=gl.getExtension('WEBGL_debug_renderer_info');rendererName=String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)||'');if(/SwiftShader|llvmpipe|Software|softpipe|Microsoft Basic Render/i.test(rendererName)){automatic='low';reason='software renderer';emit();}}catch{}
  }
  function init(){
    try{const c=document.createElement('canvas'),gl=c.getContext('webgl2',{powerPreference:'low-power'})||c.getContext('webgl',{powerPreference:'low-power'});detect(gl);gl?.getExtension('WEBGL_lose_context')?.loseContext();}catch{}
    if(typeof location!=='undefined'&&new URLSearchParams(location.search).has('debug')){debugEl=document.createElement('div');debugEl.id='graphicsDebug';debugEl.setAttribute('aria-live','off');document.body.append(debugEl);}
    emit();
  }
  function observe(ms,surface='battle'){
    if(!Number.isFinite(ms)||ms<=0||ms>1000)return;const s=samples[surface]||(samples[surface]=[]);s.push(ms);if(s.length>120)s.shift();
    if(requested()==='auto'&&automatic!=='low'&&s.length===1&&ms>100){automatic='low';reason='slow first '+surface+' frame';emit();}
    // A smaller occasional loading spike is harmless; react to sustained slow frames.
    if(requested()==='auto'&&automatic!=='low'&&s.length>=45){const sorted=s.slice().sort((a,b)=>a-b),median=sorted[sorted.length>>1];if(median>30){automatic='low';reason='sustained slow '+surface+' frames';emit();}}
    if(debugEl&&s.length%15===0)updateDebug();
  }
  function summary(){const frameTimes={};for(const [key,s]of Object.entries(samples)){const mean=s.length?s.reduce((a,b)=>a+b,0)/s.length:0;frameTimes[key]={samples:s.length,meanMS:Number(mean.toFixed(2)),fps:mean?Math.round(1000/mean):null};}return {requested:requested(),active:active(),reason:requested()==='auto'?reason:'player setting',renderer:rendererName,frameTimes};}
  function updateDebug(){if(!debugEl)return;const s=summary(),f=s.frameTimes;debugEl.textContent=`GRAPHICS ${s.active.toUpperCase()} (${s.requested}) · MAP ${f.map.fps||'—'} FPS / ${f.map.meanMS} ms · BATTLE ${f.battle.fps||'—'} FPS / ${f.battle.meanMS} ms`;}
  function configureRenderer(renderer){if(!renderer)return;try{detect(renderer.getContext());if(renderer.shadowMap)renderer.shadowMap.enabled=!low();renderer.setPixelRatio?.(dpr());}catch{}}
  const low=()=>active()==='low',dpr=()=>Math.min(low()?1:2,window.devicePixelRatio||1);
  function keepParticle(index){return !low()||index%2===0;}
  function notice(){if(low()&&!notified&&requested()==='auto'){notified=true;if(typeof UI!=='undefined')UI.toast('Graphics set to Low for smoother play. Change it in Settings.');}}
  return {init,set,detect,observe,summary,configureRenderer,keepParticle,notice,onChange:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},get low(){return low()},get mode(){return active()},get setting(){return requested()},get dpr(){return dpr()},get particleScale(){return low()?.5:1}};
})();
