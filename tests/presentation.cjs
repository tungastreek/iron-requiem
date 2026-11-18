const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function fakeElement(tag='div'){
  const e={tagName:tag.toUpperCase(),style:{},dataset:{},attributes:{},children:[],events:{},hidden:false,clientWidth:800,clientHeight:400,textContent:'',className:'',append(...nodes){nodes.forEach(n=>{this.children.push(n);n.parentElement=this;});},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){(this.events[k]||=[]).push(fn)},getBoundingClientRect(){const m=(this.style.transform||'').match(/translate\(([-\d.]+)px,([-\d.]+)px\) scale\(([-\d.]+)\)/),s=m?Number(m[3]):1;return {left:(m?Number(m[1]):0)-(s-1)*this.clientWidth/2,top:(m?Number(m[2]):0)-(s-1)*this.clientHeight/2,width:this.clientWidth*s,height:this.clientHeight*s};},setPointerCapture(){}};
  const classes=new Set();e.classList={toggle(k,on){on=on==null?!classes.has(k):on;if(on)classes.add(k);else classes.delete(k);return on},contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)};return e;
}
function documentMock(){const elements={};return {elements,documentElement:fakeElement('html'),body:fakeElement('body'),createElement:tag=>fakeElement(tag),getElementById:id=>elements[id]||null};}
function qualityTests(){
  const document=documentMock(),c=vm.createContext({document,window:{devicePixelRatio:3},SAVE:{settings:{graphics:'auto'}},GAME:{persist(){}},location:{search:'?debug'},URLSearchParams,console});
  vm.runInContext(read('js/render/quality.js'),c);vm.runInContext('QUALITY.init()',c);
  const Q=vm.runInContext('QUALITY',c);assert.equal(Q.mode,'high');assert.equal(Q.dpr,2);
  Q.detect({RENDERER:1,getExtension:()=>({UNMASKED_RENDERER_WEBGL:2}),getParameter:()=> 'ANGLE SwiftShader Device'});assert.equal(Q.mode,'low');assert.equal(Q.dpr,1);assert.equal([0,1,2,3,4,5].filter(Q.keepParticle).length,3);
  Q.set('high');assert.equal(Q.mode,'high');Q.observe(80,'battle');assert.equal(Q.mode,'high');assert.equal(Q.set('invalid'),false);
  const fresh=vm.createContext({document:documentMock(),window:{devicePixelRatio:2},SAVE:{settings:{graphics:'auto'}},console});vm.runInContext(read('js/render/quality.js'),fresh);const A=vm.runInContext('QUALITY',fresh);for(let i=0;i<45;i++)A.observe(34,'map');assert.equal(A.mode,'low');assert.match(A.summary().reason,/sustained/);
  let shadow=true,pixel=0;A.configureRenderer({shadowMap:{set enabled(v){shadow=v}},getContext:()=>null,setPixelRatio:v=>pixel=v});assert.equal(shadow,false);assert.equal(pixel,1);
  return {softwareFallback:true,slowFrameFallback:true,manualHigh:true,dpr:true,particleHalving:true};
}
function audioTests(){
  let clock=0,contexts=0,id=0;const timers=new Map(),delayed=[],nodes=[],attempts=[];
  class Param{constructor(v=0){this.value=v}setValueAtTime(v,t){assert.ok(Number.isFinite(v)&&Number.isFinite(t));this.value=v}linearRampToValueAtTime(v,t){this.setValueAtTime(v,t)}exponentialRampToValueAtTime(v,t){assert.ok(v>0);this.setValueAtTime(v,t)}cancelScheduledValues(){}setTargetAtTime(v,t){this.setValueAtTime(v,t)}}
  class Node{constructor(){this.gain=new Param(1);this.frequency=new Param(440);this.detune=new Param();this.Q=new Param();nodes.push(this)}connect(n){return n}disconnect(){}start(t=clock){assert.ok(Number.isFinite(t))}stop(t=clock){assert.ok(Number.isFinite(t))}}
  class AC{constructor(){contexts++;this.sampleRate=1000;this.state='running';this.destination=new Node()}get currentTime(){return clock}createGain(){return new Node()}createOscillator(){return new Node()}createBiquadFilter(){return new Node()}createBufferSource(){return new Node()}createBuffer(n,len){return {getChannelData:()=>new Float32Array(len)}}resume(){this.state='running';return Promise.resolve()}createMediaElementSource(){return new Node()}}
  class OptionalAudio{constructor(){this.src=''}load(){attempts.push(this.src);if(this.src&&this.onerror)this.onerror()}pause(){}removeAttribute(){this.src=''}play(){return Promise.reject(Error('unavailable test file'))}}
  const SAVE={settings:{music:.4,sfx:.7}},c=vm.createContext({console,window:{AudioContext:AC},Audio:OptionalAudio,SAVE,MECHS:{crawler:{armor:'BIO'},knight:{armor:'VOID'},lancer:{armor:'LIGHT'},zephyr:{armor:'COAT'},hollow:{armor:'VOID'}},setInterval:fn=>{timers.set(++id,fn);return id},clearInterval:i=>timers.delete(i),setTimeout:fn=>{delayed.push(fn);return delayed.length}});
  vm.runInContext(read('js/render/audio.js'),c);const S=vm.runInContext('SFX',c);
  S.music('title');assert.equal(contexts,0);assert.equal(S.pendingMusic,'title');S.ensure();assert.equal(contexts,1);assert.equal(S.musicKey,'title');assert.equal(S.pendingMusic,null);
  assert.equal(Object.keys(S.themeInfo()).length,12);assert.equal(S.faction({mech:'crawler'}),'ourobor');assert.equal(S.faction({mech:'knight'}),'vael');assert.equal(S.faction({mech:'zephyr'}),'free_states');assert.equal(S.faction({mech:'hollow'}),'final_boss');
  const start=nodes.length;for(let i=0;i<32;i++){clock+=.2;for(const fn of [...timers.values()])fn();}assert.ok(nodes.length-start>50,'Score must schedule lead, bass, harmony and percussion');
  for(const key of Object.keys(S.themeInfo())){S.music(key,{num:'04'});clock+=.2;for(const fn of [...timers.values()])fn();}
  assert.equal(S.musicKey,'final_boss');
  assert.deepEqual(attempts, [], 'Synthesized themes must make no file requests');
  vm.runInContext('const IRON_MUSIC_TRACKS = { calm: ["calm.mp3"], tense: ["tense.ogg", "tense.mp3"] };', c);
  S.music('calm');
  S.music('tense');
  assert.deepEqual(attempts, ['assets/music/calm.mp3', 'assets/music/tense.ogg', 'assets/music/tense.mp3']);
  S.phase('player',{num:'02'});assert.equal(S.musicKey,'player');const restore=S.battle({team:'player',mech:'lancer'},{team:'enemy',mech:'crawler'},{num:'02'});assert.equal(S.musicKey,'ourobor');restore();assert.equal(S.musicKey,'player');S.setMusicVol(0);
  ['shot','laser','cannon','boom','bigboom','missile','hit','slash','whoosh','dash','charge','beam','megabeam','rocket','drill','fireball','rail','zap','shriek','choir','barrier','alarm','cutin','select','confirm','cancel','spirit','levelup','step','text','sonar','spores','nullring'].forEach(k=>S.play(k));
  for(const fn of delayed)fn();return {themes:12,userGestureGate:true,sequencer:true,crossfadeLifecycle:true,noUnlistedRecordings:true,optionalFileFallback:true,factionAndPhaseSelection:true,soundCues:33};
}
function touchTests(){
  const document=documentMock(),wrap=fakeElement(),canvas=fakeElement('canvas');wrap.append(canvas);document.elements.mapBody=fakeElement();document.elements.battle=fakeElement();let now=0,id=0;const delayed=new Map(),commands=[],inspections=[];
  const window={matchMedia:()=>({matches:true}),addEventListener(){}},c=vm.createContext({console,document,window,performance:{now:()=>now},setTimeout:fn=>{delayed.set(++id,fn);return id},clearTimeout:i=>delayed.delete(i)});vm.runInContext(read('js/ui/touch.js'),c);const T=vm.runInContext('TOUCH',c);
  const ui={mode:'moving',sel:{uid:7,x:1,y:1},range:{tiles:new Set(['4,5'])}},api={state:()=>({unitAt:()=>null}),ui:()=>ui,geom:()=>({T:20,ox:0,oy:0}),toTile:e=>({x:Math.floor(e.clientX/10),y:Math.floor(e.clientY/10)}),click:(x,y)=>commands.push([x,y]),preview(){},inspect:t=>inspections.push(t)};
  T.init({skipBattle(){},fastBattle(){}});T.attachMap(canvas,api);
  const event=(type,x=40,y=50,pointerId=1)=>({type,clientX:x,clientY:y,pointerId,pointerType:'touch',preventDefault(){},stopImmediatePropagation(){}}),fire=(type,e)=>canvas.events[type].forEach(fn=>fn(e));
  fire('pointerdown',event('pointerdown'));fire('pointerup',event('pointerup'));assert.equal(commands.length,0);assert.equal(T.pendingMove.x,4);
  now+=50;fire('pointerdown',event('pointerdown'));fire('pointerup',event('pointerup'));assert.deepEqual(commands,[[4,5]]);assert.equal(T.pendingMove,null);
  now+=50;fire('pointerdown',event('pointerdown',10,10));for(const fn of [...delayed.values()])fn();assert.equal(inspections.length,1);fire('pointerup',event('pointerup',10,10));assert.equal(commands.length,1,'Long press must not also select');
  fire('pointerdown',event('pointerdown',10,10,1));fire('pointerdown',event('pointerdown',110,10,2));fire('pointermove',event('pointermove',210,10,2));assert.equal(T.scale,2);fire('pointerup',event('pointerup',210,10,2));fire('pointerup',event('pointerup',10,10,1));assert.equal(commands.length,1,'Pinch must not issue a command');
  const p=T.localPoint({clientX:-200,clientY:0},canvas);assert.equal(p.x,100);assert.equal(p.y,100);T.resetMap();assert.equal(T.scale,1);return {tapConfirmation:true,pinchZoom:true,inverseCoordinates:true,longPress:true,noGestureCommands:true};
}
function run(){return {status:'passed',quality:qualityTests(),audio:audioTests(),touch:touchTests(),limits:['Simulated WebAudio and DOM only; no audible playback or browser layout verification.','No measured device frame times or screenshots; end-to-end browser checks remain pending.']};}
module.exports={run};if(require.main===module)console.log(JSON.stringify(run(),null,2));
