// ===== Procedural SFX + simple ambient music (WebAudio, no assets) =====
'use strict';
const SFX = (() => {
  let ac = null, master = null, noiseBuf = null, musicGain = null, musicNodes = [], musicKey = null;
  const lastPlay = {};
  function ensure() {
    if (ac) return true;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
      musicGain = ac.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
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
  // ---- ambient music: slow pad chords per mood ----
  const MOODS = {
    title: [[220, 277, 330], [196, 247, 294], [175, 220, 262], [196, 247, 330]],
    calm: [[262, 330, 392], [220, 277, 330], [175, 220, 262], [196, 247, 294]],
    tense: [[147, 175, 220], [139, 165, 208], [147, 185, 220], [131, 156, 196]],
    battle: [[110, 165, 220], [98, 147, 196], [117, 175, 233], [104, 156, 208]],
    sad: [[220, 262, 330], [175, 220, 262], [147, 175, 220], [165, 196, 247]],
    hope: [[262, 330, 392], [294, 370, 440], [330, 415, 494], [349, 440, 523]],
  };
  let musicTimer = null;
  function music(key) {
    if (!ensure()) return;
    if (musicKey === key) return; musicKey = key;
    clearInterval(musicTimer); musicNodes.forEach(n => { try { n.stop(ac.currentTime + 1); } catch (e) {} }); musicNodes = [];
    const mv = (SAVE && SAVE.settings && SAVE.settings.music != null) ? SAVE.settings.music : 0.4;
    musicGain.gain.cancelScheduledValues(ac.currentTime); musicGain.gain.linearRampToValueAtTime(0.12 * mv, ac.currentTime + 1.5);
    if (!key || !MOODS[key]) return;
    let i = 0; const ch = MOODS[key]; const beat = key === 'battle' ? 2.2 : 4;
    const playChord = () => {
      const t = ac.currentTime; const c = ch[i++ % ch.length];
      c.forEach((f, k) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = k === 0 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (k - 1) * 6; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.25, t + beat * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + beat * 1.1); o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + beat * 1.15); musicNodes.push(o); });
      if (key === 'battle') { for (let b = 0; b < 4; b++) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = c[0] / 2; const tt = t + b * beat / 4; g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.18, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.2); o.connect(g); g.connect(musicGain); o.start(tt); o.stop(tt + 0.25); } }
      musicNodes = musicNodes.slice(-30);
    };
    playChord(); musicTimer = setInterval(playChord, beat * 1000);
  }
  function setMusicVol(v) { if (ac && musicGain) musicGain.gain.value = 0.12 * v; }
  return { play, music, ensure, setMusicVol };
})();
