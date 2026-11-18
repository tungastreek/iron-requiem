// ===== Procedural effects and adaptive score; optional local music files =====
'use strict';
const SFX = (() => {
  let ac = null, master = null, noiseBuf = null, musicGain = null, musicKey = null, currentTrack=null;
  const tracks=new Set();let pendingMusic=null;
  const lastPlay = {};
  function ensure() {
    if (ac) { if(ac.state==='suspended')ac.resume().catch(()=>{});return true; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
      musicGain = ac.createGain(); musicGain.gain.value = musicVolume()*.42; musicGain.connect(master);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      if(ac.state==='suspended')ac.resume().catch(()=>{});
      if(pendingMusic){const wanted=pendingMusic;pendingMusic=null;startMusic(wanted.key,wanted.chapter);}return true;
    } catch (e) { return false; }
  }
  function vol() { return (SAVE && SAVE.settings && SAVE.settings.sfx != null) ? SAVE.settings.sfx : 0.7; }
  function env(g, t, a, d, peak) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function osc(type, f0, f1, dur, peak, t) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    env(g, t, 0.005, dur, peak); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, peak, t, ftype = 'lowpass', f0 = 2000, f1 = 200, q = 1) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; const f = ac.createBiquadFilter(); f.type = ftype; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = ac.createGain(); env(g, t, 0.005, dur, peak); s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  function play(name, v = 1) {
    if (!ensure() || vol() <= 0) return;
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime; const V = vol() * v;
    if (lastPlay[name] && t - lastPlay[name] < 0.03) return; lastPlay[name] = t;
    switch (name) {
      case 'shot': noise(0.08, 0.4 * V, t, 'bandpass', 3000, 800, 2); osc('square', 400, 80, 0.06, 0.1 * V, t); break;
      case 'laser': osc('sawtooth', 1800, 200, 0.18, 0.15 * V, t); osc('sine', 2400, 400, 0.15, 0.1 * V, t); break;
      case 'cannon': noise(0.4, 0.7 * V, t, 'lowpass', 1500, 60); osc('sine', 120, 30, 0.35, 0.5 * V, t); break;
      case 'boom': noise(0.6, 0.6 * V, t, 'lowpass', 1200, 50); osc('sine', 90, 25, 0.5, 0.5 * V, t); break;
      case 'bigboom': noise(1.4, 0.9 * V, t, 'lowpass', 2000, 30); osc('sine', 70, 18, 1.2, 0.8 * V, t); break;
      case 'missile': noise(0.35, 0.25 * V, t, 'bandpass', 1500, 4000, 3); break;
      case 'hit': noise(0.12, 0.5 * V, t, 'highpass', 4000, 1500); osc('square', 220, 60, 0.1, 0.15 * V, t); break;
      case 'slash': noise(0.22, 0.5 * V, t, 'bandpass', 6000, 1200, 4); osc('sawtooth', 900, 120, 0.2, 0.08 * V, t); break;
      case 'whoosh': noise(0.3, 0.3 * V, t, 'bandpass', 400, 2500, 2); break;
      case 'dash': noise(0.25, 0.35 * V, t, 'bandpass', 600, 3000, 3); osc('sine', 200, 600, 0.2, 0.1 * V, t); break;
      case 'charge': { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(1400, t + 0.9); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12 * V, t + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0); const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2500; o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 1.05); break; }
      case 'beam': osc('sawtooth', 300, 120, 0.9, 0.2 * V, t); noise(0.9, 0.35 * V, t, 'bandpass', 2000, 600, 1); break;
      case 'megabeam': osc('sawtooth', 160, 60, 1.5, 0.3 * V, t); osc('square', 80, 40, 1.5, 0.15 * V, t); noise(1.5, 0.5 * V, t, 'lowpass', 3000, 300); break;
      case 'rocket': noise(0.5, 0.4 * V, t, 'bandpass', 800, 2500, 2); osc('sawtooth', 100, 300, 0.4, 0.1 * V, t); break;
      case 'drill': for (let i = 0; i < 8; i++) osc('square', 300 + i * 20, 200, 0.07, 0.08 * V, t + i * 0.07); noise(0.6, 0.3 * V, t, 'bandpass', 3000, 3000, 6); break;
      case 'fireball': noise(0.8, 0.4 * V, t, 'lowpass', 800, 200); osc('sine', 200, 60, 0.6, 0.2 * V, t); break;
      case 'rail': osc('square', 3000, 60, 0.3, 0.25 * V, t); noise(0.3, 0.5 * V, t, 'highpass', 6000, 800); break;
      case 'zap': noise(0.15, 0.5 * V, t, 'highpass', 5000, 2000); osc('square', 1200, 300, 0.1, 0.1 * V, t); break;
      case 'shriek': osc('sawtooth', 1400, 2200, 0.5, 0.12 * V, t); osc('sawtooth', 1450, 2100, 0.5, 0.12 * V, t); break;
      case 'choir': [523, 659, 784, 1046].forEach((f, i) => osc('sine', f, f * 1.01, 1.4, 0.07 * V, t + i * 0.06)); break;
      case 'barrier': osc('sine', 900, 1800, 0.25, 0.12 * V, t); osc('triangle', 1200, 600, 0.3, 0.08 * V, t); break;
      case 'alarm': for (let i = 0; i < 3; i++) osc('square', 880, 860, 0.12, 0.08 * V, t + i * 0.18); break;
      case 'cutin': noise(0.4, 0.35 * V, t, 'bandpass', 500, 5000, 2); osc('sawtooth', 220, 880, 0.3, 0.12 * V, t); break;
      case 'select': osc('square', 1200, 1200, 0.04, 0.06 * V, t); break;
      case 'confirm': osc('square', 880, 880, 0.05, 0.07 * V, t); osc('square', 1320, 1320, 0.06, 0.07 * V, t + 0.05); break;
      case 'cancel': osc('square', 500, 300, 0.08, 0.06 * V, t); break;
      case 'spirit': [660, 880, 1320].forEach((f, i) => osc('triangle', f, f, 0.25, 0.1 * V, t + i * 0.07)); break;
      case 'levelup': [523, 659, 784, 1046, 1318].forEach((f, i) => osc('square', f, f, 0.12, 0.07 * V, t + i * 0.08)); break;
      case 'step': osc('sine', 120, 60, 0.05, 0.08 * V, t); break;
      case 'text': osc('square', 1600, 1600, 0.01, 0.015 * V, t); break;
      case 'sonar': [440,660,880].forEach((f,i)=>osc('sine',f,f*.96,.8,.08*V,t+i*.13));break;
      case 'spores': noise(.9,.25*V,t,'bandpass',320,1500,4);osc('triangle',170,90,.8,.12*V,t);break;
      case 'nullring': osc('sine',90,24,1.2,.3*V,t);osc('triangle',740,74,1,.08*V,t);noise(1,.15*V,t,'highpass',6000,800);break;
    }
  }
  // Sixteen steps per bar. Melodies are scale degrees; nulls leave breathing room.
  const THEMES={
    title:{name:'Iron and Light',bpm:92,root:57,major:false,chords:[0,5,3,4],lead:[0,null,2,4,7,null,6,4,2,null,0,2,3,2,0,null],wave:'triangle',pad:true,bass:true,kick:[0,8],snare:[4,12],hat:4},
    calm:{name:'Forty Hands Aboard',bpm:76,root:60,major:true,chords:[0,5,3,4],lead:[0,null,null,2,4,null,2,null,5,null,4,2,1,null,0,null],wave:'sine',pad:true,bass:true,kick:[],snare:[],hat:0},
    tense:{name:'The Redacted Line',bpm:100,root:50,major:false,chords:[0,0,5,4],lead:[0,null,1,null,0,null,4,null,0,null,1,2,1,null,0,null],wave:'triangle',pad:false,bass:true,kick:[0,6,10],snare:[12],hat:4},
    sad:{name:'The Empty Channel',bpm:62,root:57,major:false,chords:[0,3,5,4],lead:[7,null,null,6,4,null,null,2,3,null,2,null,0,null,null,null],wave:'sine',pad:true,bass:false,kick:[],snare:[],hat:0},
    hope:{name:'Fourth Dawn',bpm:104,root:60,major:true,chords:[0,4,5,3],lead:[0,2,4,null,7,6,4,null,5,4,2,1,2,null,0,null],wave:'triangle',pad:true,bass:true,kick:[0,8],snare:[4,12],hat:4},
    player:{name:'Open Corridor',bpm:124,root:57,major:false,chords:[0,5,3,4],lead:[0,2,4,null,7,4,2,null,5,4,2,0,3,2,1,2],wave:'square',pad:false,bass:true,kick:[0,6,8,14],snare:[4,12],hat:2},
    enemy:{name:'Emergency Directive',bpm:116,root:50,major:false,chords:[0,1,0,4],lead:[0,null,0,1,4,null,3,1,0,null,0,1,6,4,3,1],wave:'sawtooth',pad:false,bass:true,kick:[0,3,8,11],snare:[4,12],hat:2},
    concord:{name:'Order Is Mercy',bpm:104,root:50,major:false,chords:[0,4,0,5],lead:[0,0,4,null,0,0,5,4,3,3,2,null,1,1,4,null],wave:'square',pad:false,bass:true,kick:[0,2,8,10],snare:[4,6,12,14],hat:4},
    free_states:{name:'A Free Sky',bpm:140,root:52,major:false,chords:[0,3,5,4],lead:[0,2,4,7,null,4,2,4,5,7,5,4,3,2,0,2],wave:'sawtooth',pad:false,bass:true,kick:[0,6,8,10],snare:[4,12],hat:1},
    ourobor:{name:'Under the Cradle',bpm:72,root:38,major:false,chords:[0,0,1,0],lead:[0,null,null,null,7,null,null,1,0,null,null,null,6,null,1,null],wave:'sine',pad:true,bass:true,kick:[0,7,10],snare:[5,13],hat:0},
    vael:{name:'The Thousand-Year Choir',bpm:84,root:59,major:false,chords:[0,2,5,3],lead:[7,null,6,null,4,null,2,3,5,null,4,null,2,1,0,null],wave:'sine',pad:true,bass:false,kick:[0,10],snare:[],hat:8},
    final_boss:{name:'Answer the Silence',bpm:152,root:45,major:false,chords:[0,1,5,4],lead:[0,7,4,2,1,4,7,6,5,7,5,4,3,2,1,4],wave:'sawtooth',pad:true,bass:true,kick:[0,3,6,8,11,14],snare:[4,12],hat:1},
  };
  function musicVolume(){try{return Math.max(0,Math.min(1,SAVE.settings.music??.4));}catch{return .4;}}
  const midi=n=>440*2**((n-69)/12),normalKey=k=>k==='battle'?'player':k==='intermission'?'calm':k;
  function degree(theme,n){const scale=theme.major?[0,2,4,5,7,9,11]:[0,2,3,5,7,8,10],oct=Math.floor(n/7),i=((n%7)+7)%7;return theme.root+oct*12+scale[i];}
  function voice(track,n,t,dur,type,peak,attack=.012){
    const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=midi(n);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(peak,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+Math.max(attack+.04,dur));o.connect(g);g.connect(track.synth);o.start(t);o.stop(t+dur+.06);track.nodes.add(o);o.onended=()=>{track.nodes.delete(o);o.disconnect();g.disconnect();};
  }
  function percussion(track,kind,t){
    if(kind==='kick'){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(115,t);o.frequency.exponentialRampToValueAtTime(34,t+.17);env(g,t,.004,.22,.24);o.connect(g);g.connect(track.synth);o.start(t);o.stop(t+.25);return;}
    const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noiseBuf;f.type=kind==='hat'?'highpass':'bandpass';f.frequency.value=kind==='hat'?6000:1300;f.Q.value=kind==='hat'?.5:1.4;env(g,t,.003,kind==='hat'?.045:.14,kind==='hat'?.028:.09);s.connect(f);f.connect(g);g.connect(track.synth);s.start(t,0);s.stop(t+(kind==='hat'?.06:.18));
  }
  function scheduleStep(track){
    const th=track.theme,k=track.step%16,bar=Math.floor(track.step/16),ch=th.chords[bar%th.chords.length],t=track.next,step=60/th.bpm/4;
    if(th.pad&&k===0)for(const n of [ch,ch+2,ch+4])voice(track,degree(th,n)-12,t,step*17,'sine',.045,.18);
    if(th.bass&&k%2===0)voice(track,degree(th,ch)-24,t,step*1.65,'triangle',track.key==='ourobor'?.16:.12);
    const note=th.lead[(k+(bar%2?4:0))%th.lead.length];if(note!=null)voice(track,degree(th,note)+(bar%4===3?12:0),t,step*.8,th.wave,th.wave==='sine'?.09:.045);
    if(th.kick.includes(k))percussion(track,'kick',t);if(th.snare.includes(k))percussion(track,'snare',t);if(th.hat&&k%th.hat===0)percussion(track,'hat',t);
    track.step++;track.next+=step;
  }
  function stopTrack(track,fade=.8){if(!track||track.stopping)return;track.stopping=true;clearInterval(track.timer);const t=ac.currentTime;track.gain.gain.cancelScheduledValues(t);track.gain.gain.setValueAtTime(track.gain.gain.value,t);track.gain.gain.linearRampToValueAtTime(0,t+fade);setTimeout(()=>{track.nodes.forEach(n=>{try{n.stop();}catch{}});if(track.audio){track.audio.pause();track.audio.removeAttribute('src');track.audio.load();}track.gain.disconnect();tracks.delete(track);},fade*1000+80);}
  function optionalFile(track, key) {
    const recordings = typeof IRON_MUSIC_TRACKS === 'undefined' ? null : IRON_MUSIC_TRACKS[key];
    if (!recordings?.length || typeof Audio === 'undefined') return;
    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    let index = 0;
    let source;
    let tryingPlayback = false;
    const next = () => {
      if (track.stopping || track.fileActive) return;
      const filename = recordings[index++];
      if (!filename) {
        audio.onerror = audio.oncanplay = null;
        return;
      }
      audio.src = 'assets/music/' + filename;
      audio.load();
    };
    audio.onerror = next;
    audio.oncanplay = async () => {
      if (track.stopping || track.fileActive || tryingPlayback) return;
      tryingPlayback = true;
      try {
        if (!source) {
          source = ac.createMediaElementSource(audio);
          source.connect(track.gain);
        }
        await audio.play();
        if (track.stopping) { audio.pause(); return; }
        track.fileActive = true;
        track.synth.gain.linearRampToValueAtTime(0, ac.currentTime + .4);
        clearInterval(track.timer);
      } catch {
        // A blocked or unsupported recording leaves the procedural score running.
      } finally {
        tryingPlayback = false;
      }
    };
    track.audio = audio;
    next();
  }
  function startMusic(key,chapter){
    key=normalKey(key);if(!key||!THEMES[key]){stopTrack(currentTrack);currentTrack=null;musicKey=null;return;}
    const chapterNum=Number.parseInt(chapter?.num||chapter||0,10)||0,identity=key+':'+chapterNum;if(currentTrack?.identity===identity&&!currentTrack.stopping)return;
    const gain=ac.createGain(),synth=ac.createGain(),theme={...THEMES[key],root:THEMES[key].root+(chapterNum?((chapterNum%3)-1)*2:0)};gain.gain.setValueAtTime(0,ac.currentTime);gain.gain.linearRampToValueAtTime(1,ac.currentTime+.85);gain.connect(musicGain);synth.connect(gain);
    const track={identity,key,theme,gain,synth,nodes:new Set(),step:0,next:ac.currentTime+.04,timer:null,stopping:false,fileActive:false};tracks.add(track);stopTrack(currentTrack);currentTrack=track;musicKey=key;
    const tick=()=>{if(track.stopping||ac.state==='suspended')return;let guard=0;while(track.next<ac.currentTime+.16&&guard++<32)scheduleStep(track);if(track.next<ac.currentTime-.5)track.next=ac.currentTime+.04;};tick();track.timer=setInterval(tick,35);optionalFile(track,key);
  }
  function music(key,chapter){pendingMusic={key,chapter};if(!ac)return;pendingMusic=null;startMusic(key,chapter);}
  function setMusicVol(v){if(!ac||!musicGain)return;const t=ac.currentTime;musicGain.gain.cancelScheduledValues(t);musicGain.gain.setTargetAtTime(Math.max(0,Math.min(1,v))*.42,t,.08);}
  function phase(key,ch){music(key==='player'?'player':key==='enemy'?'enemy':'player',ch);}
  function faction(u){if(!u)return 'concord';const id=u.mech,m=MECHS[id];if(id==='hollow')return 'final_boss';if(m?.armor==='BIO')return 'ourobor';if(m?.armor==='VOID')return 'vael';if(['zephyr','tyrant','carmine_e','marauder','rigger','harpoon','breaker','gale'].includes(id))return 'free_states';return 'concord';}
  function battle(left,right,ch){const previous=musicKey||'player',enemy=[left,right].find(u=>u.team==='enemy')||right;music(faction(enemy),ch);return()=>music(previous,ch);}
  function themeInfo(){return Object.fromEntries(Object.entries(THEMES).map(([key,t])=>[key,{name:t.name,bpm:t.bpm,lead:t.wave,pad:t.pad,percussion:t.kick.length+t.snare.length>0}]));}
  return {play,music,ensure,setMusicVol,phase,battle,faction,themeInfo,get musicKey(){return musicKey},get pendingMusic(){return pendingMusic?.key||null}};
})();
