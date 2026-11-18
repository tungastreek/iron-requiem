'use strict';
const COMBOS=(()=>{
  const pairs=[
    {id:'falcon_gale',pilots:['rei','mira'],name:'Falcon Gale',type:'SPIR',pow:6800,will:120,en:40,seq:['rifle','multislash','spirit'],cut:'Two wings. One open sky!'},
    {id:'gaia_spiral',pilots:['brann','jin'],name:'Gaia Spiral Crusher',type:'PLAS',pow:7600,will:120,en:50,seq:['punch','drill','megabeam'],cut:'Three hearts and a burning soul — break through!'},
    {id:'crimson_deadline',pilots:['lucien','odessa'],name:'Crimson Deadline',type:'KIN',pow:6900,will:120,en:45,seq:['multislash','railgun'],cut:'The opening is yours. Do not waste it.'},
    {id:'starlit_requiem',pilots:['yuna','sera'],name:'Starlit Requiem',type:'SPIR',pow:8200,will:130,en:60,seq:['funnel','gravity','spirit'],cut:'No voice is alone among the stars.'},
  ];
  const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
  function partner(u,w){return G.map?.units.find(p=>p.uid===w.partnerUID&&p.hp>0&&p.team===u.team)||null;}
  function eligible(u,p,c){return u.team==='player'&&u.hp>0&&p&&p!==u&&p.team===u.team&&p.hp>0&&!p.acted&&!u.acted&&dist(u,p)===1&&u.will>=c.will&&p.will>=c.will&&u.en>=c.en&&p.en>=c.en;}
  function weapons(u){if(!G.map||u.team!=='player')return [];return pairs.filter(c=>c.pilots.includes(u.pilot)).flatMap(c=>{const other=c.pilots.find(p=>p!==u.pilot),p=G.map.units.find(p=>p.pilot===other&&eligible(u,p,c));return p?[W(c.name,c.type,c.pow,1,2,{en:c.en,will:c.will,post:true,finisher:true,anim:'finisher',seq:c.seq,cut:c.cut,crit:20,acc:20,combo:c.id,partnerUID:p.uid,partnerEN:c.en})]:[];});}
  function canTarget(u,w,d){if(!w.combo)return true;const p=partner(u,w),c=pairs.find(c=>c.id===w.combo);return !!(c&&eligible(u,p,c)&&dist(u,d)<=2&&dist(p,d)<=2);}
  function guards(d){return d.team==='player'?(G.map?.units.filter(u=>u!==d&&u.team==='player'&&u.hp>0&&!u.supportDefended&&dist(u,d)===1&&CB.skills(u).has('guard'))||[]):[];}
  return{pairs,partner,weapons,canTarget,guards};
})();
