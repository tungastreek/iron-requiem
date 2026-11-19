// The same editable timing and drawing code drives combat and the VFX Lab.
'use strict';
const SPECTACLE = (() => {
  const palettes = {
    kinetic:['#fff6d8','#ffa94f','#fa5b38'], beam:['#ebffff','#60ebff','#6587ff'],
    missile:['#fff2ac','#ff922e','#e14335'], blade:['#ffffff','#a3eeff','#645dff'],
    impact:['#fff9d6','#ffb260','#ff635a'], funnel:['#ffffff','#79ffd5','#57a7ff'],
    plasma:['#ffffdf','#ff8aeb','#6d57ff'], gravity:['#fffef4','#c5a6ff','#794eff'],
    spirit:['#fff9dc','#a9ffe8','#4fa6ff'], bio:['#f7ffb3','#baff3c','#68b437'],
    rail:['#fff6ee','#ffd3ad','#fd6778'], lightning:['#ffffff','#ffee7b','#aa6fff'],
    wave:['#fffdf6','#91ffff','#43b2ff'],
  };
  // Shape, duration of anticipation, duration of impact and afterglow, and number of spokes.
  const specs = {
    rifle:['kinetic',260,640,13], vulcan:['kinetic',180,420,20], beam:['beam',430,820,8],
    megabeam:['beam',660,1060,17], missile:['missile',240,950,24],
    slash:['blade',200,680,12], multislash:['blade',350,850,21],
    punch:['impact',150,690,13], drill:['impact',380,910,23],
    funnel:['funnel',420,960,14], plasma:['plasma',500,880,19],
    gravity:['gravity',560,1100,10], spirit:['spirit',530,1070,16],
    breath:['bio',290,800,23], railgun:['rail',260,670,12],
    lightning:['lightning',360,820,9], wave:['wave',390,940,18],
    cannon:['impact',280,790,17], harpoon:['rail',280,760,16],
    sonar:['wave',440,980,17], shieldburst:['spirit',380,820,15],
    spores:['bio',420,980,26], nullring:['gravity',520,1010,16], default:['beam',270,660,12],
  };
  const families = {
    kinetic:['spokes','traces'], beam:['helix','traces'], missile:['embers','crater'],
    blade:['arc','spokes'], impact:['crater','spokes'], funnel:['helix','orbits'],
    plasma:['orbits','embers'], gravity:['orbits','iris'], spirit:['iris','helix'],
    bio:['embers','spores'], rail:['traces','crater'], lightning:['fork','spokes'],
    wave:['helix','orbits'],
  };
  function profile(kind,weapon={}) {
    const [family,charge,impact,count] = specs[kind] || specs.default;
    const power = weapon.finisher || weapon.combo ? 1.32 : weapon.pow >= 4500 ? 1.23 : weapon.pow >= 3000 ? 1 : .73;
    const travel = ['blade','impact','rail','beam','lightning'].includes(family) ? 170 : family==='missile' ? 350 : 260;
    return {family,charge,travel,impact,count,power};
  }
  function valid(spec) {
    return spec && Object.hasOwn(families,spec.family)
      && Number.isFinite(spec.charge) && spec.charge>=100 && spec.charge<=2000
      && Number.isFinite(spec.travel) && spec.travel>=60 && spec.travel<=1400
      && Number.isFinite(spec.impact) && spec.impact>=100 && spec.impact<=3000
      && Number.isInteger(spec.count) && spec.count>=1 && spec.count<=60
      && Number.isFinite(spec.power) && spec.power>=.3 && spec.power<=2;
  }
  function light(c,x,y,r,col,alpha) {
    if (alpha<=0) return;
    const g = c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,col); g.addColorStop(.25,col+'90'); g.addColorStop(1,col+'00');
    c.globalAlpha = alpha; c.fillStyle = g; c.fillRect(x-r,y-r,r*2,r*2);
  }
  function paint(c,s,stage,k,x,y,dx,dy,opts={}) {
    if (k>=1) return;
    const [white,hot,cold] = opts.color ? [palettes[s.family][0],opts.color,palettes[s.family][2]] : palettes[s.family];
    const angle = Math.atan2(dy-y,dx-x), power = s.power, fade = 1-k;
    const count = Math.ceil(s.count*(opts.low ? .5 : 1)), motion = !opts.still;
    const seed = (i)=> ((i*22307+131)%997)/997;
    const rad = n=>n*power;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    if (stage === 'charge') {
      c.translate(x,y); c.rotate(angle);
      light(c,0,0,rad(75),hot,(motion ? Math.sin(Math.PI*k) : .28)*.67);
      c.globalAlpha = Math.sin(Math.PI*k)*.84;
      for (let i=0;i<count;i++) {
        const a = i/count*Math.PI*2 + (motion ? k*3 : 0), r = rad(14+(1-k)*52+seed(i)*18);
        c.strokeStyle = i%4===0 ? white : hot; c.lineWidth = i%4===0 ? 2.4 : 1;
        c.beginPath(); c.moveTo(Math.cos(a)*r, Math.sin(a)*r*.72);
        c.lineTo(Math.cos(a)*(r-12),Math.sin(a)*(r-12)*.72); c.stroke();
      }
      c.restore(); return;
    }
    if (stage==='travel') {
      const drift = k*k*(3-2*k), span = Math.hypot(dx-x,dy-y);
      c.translate(x,y); c.rotate(angle);
      const tip = span*drift;
      const beam = ['rail','beam','lightning','wave'].includes(s.family);
      const trail = beam ? tip : Math.min(tip,rad(32+42*k));
      const width = (beam ? 7 : 4)*power;
      const g = c.createLinearGradient(Math.max(0,tip-trail),0,Math.max(.01,tip),0);
      g.addColorStop(0,cold+'09'); g.addColorStop(.58,hot); g.addColorStop(1,white);
      c.strokeStyle = g; c.lineWidth = width*2.5; c.globalAlpha = .26;
      c.beginPath(); c.moveTo(tip-trail,0); c.lineTo(tip,0); c.stroke();
      c.lineWidth=width; c.globalAlpha=.92;
      c.beginPath(); c.moveTo(tip-trail,0);
      if (s.family==='lightning') for (let i=1;i<=7;i++) c.lineTo(tip-trail+i*trail/7,(seed(i)-.5)*(i===7?0:29));
      else c.quadraticCurveTo(tip-trail*.55,beam?0:-18,tip,0);
      c.stroke();
      light(c,tip,0,rad(35),hot,.6);
      c.restore(); return;
    }
    c.translate(x,y);
    light(c,0,0,rad(170+100*k),hot,fade*fade*(opts.still ? .19 : .65));
    c.rotate(angle);
    for (const form of families[s.family]) switch (form) {
      case 'helix':
      case 'arc':
      case 'orbits': {
        const n = form==='arc' ? 3 : 5;
        for (let i=0;i<n;i++) {
          const r = rad(25+90*k+i*11);
          c.globalAlpha = fade * (1-i/n)*.9;
          c.strokeStyle = [white,hot,cold][i%3]; c.lineWidth = (i===0 ? 6 : 2.5)*fade;
          c.beginPath();
          const a = i*.8+(motion?k*1.8:0);
          c.ellipse(0,0,r,r*(form==='helix'?.23:form==='orbits'?.55:.66),a,
            form==='arc'?-.85:0,form==='arc'?1.38:Math.PI*2);
          c.stroke();
        }
        break;
      }
      case 'iris':
        c.globalAlpha = fade*.9; c.lineWidth = 2;
        for (let j=0;j<2;j++) {
          c.strokeStyle = j ? cold : hot; c.beginPath();
          const r = rad(56+54*k+j*22);
          for (let i=0;i<=6;i++) {
            const a = i*Math.PI/3+j*Math.PI/6+(motion?k*.8:0);
            c.lineTo(Math.cos(a)*r,Math.sin(a)*r);
          }
          c.stroke();
        }
        break;
      case 'fork':
        c.globalAlpha = fade*.92; c.strokeStyle = white; c.lineWidth = 2;
        for (let i=0;i<7;i++) {
          const a = i*Math.PI/3.5;
          c.beginPath(); c.moveTo(0,0);
          for (let j=1;j<=5;j++) {
            const r = rad(j*(8+k*9)), jitter = (seed(i*5+j)-.5)*.7;
            c.lineTo(r*Math.cos(a+jitter),r*Math.sin(a+jitter));
          }
          c.stroke();
        }
        break;
      case 'crater':
        c.save(); c.rotate(-angle); c.translate(0,rad(45));
        c.globalAlpha = fade*fade*.55; c.strokeStyle = hot; c.lineWidth = 3;
        c.beginPath(); c.ellipse(0,0,rad(30+120*k),rad(10+34*k),0,0,7); c.stroke();
        c.restore(); break;
      default:
        for (let i=0;i<count;i++) {
          const a = (form==='traces' ? (seed(i)-.5)*.66 : i/count*Math.PI*2), r = rad((28+180*k)*(.28+seed(i)));
          const px = Math.cos(a)*r, py = Math.sin(a)*r;
          c.globalAlpha = fade*(.46+seed(i)*.54);
          c.strokeStyle = i%3===0 ? white : hot; c.fillStyle = i%3===0 ? white : hot;
          c.lineWidth = (i%4===0 ? 3 : 1.4)*power;
          c.beginPath();
          if (form==='embers' || form==='spores') {
            c.ellipse(px,py+42*k*k,rad(3+i%3)*(1-k*.6),rad(2+i%2),a,0,7); c.fill();
          } else {
            const back = form==='traces' ? 55 : 12+21*fade;
            c.moveTo(px,py); c.lineTo(px-Math.cos(a)*back,py-Math.sin(a)*back); c.stroke();
          }
        }
    }
    c.restore();
  }
  return {kinds:Object.keys(specs).filter(id=>id!=='default'), profile, valid, paint};
})();
