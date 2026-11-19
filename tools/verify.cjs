// Dependency-free regression checks. Run: node tools/verify.cjs
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib'),crypto=require('node:crypto');
function decodePNG(buf){
  const w=buf.readUInt32BE(16),h=buf.readUInt32BE(20),depth=buf[24],type=buf[25];
  if(depth!==8||![2,6].includes(type))throw Error('Unsupported PNG type '+type);
  let p=8,chunks=[];while(p<buf.length){const n=buf.readUInt32BE(p);if(buf.toString('ascii',p+4,p+8)==='IDAT')chunks.push(buf.subarray(p+8,p+8+n));p+=12+n;}
  const raw=zlib.inflateSync(Buffer.concat(chunks)),channels=type===6?4:3,stride=w*channels,data=new Uint8ClampedArray(w*h*4);let previous=new Uint8Array(stride);
  for(let y=0;y<h;y++){const at=y*(stride+1),filter=raw[at],row=Uint8Array.from(raw.subarray(at+1,at+1+stride));
    for(let x=0;x<stride;x++){const a=x>=channels?row[x-channels]:0,b=previous[x],c=x>=channels?previous[x-channels]:0;let v=0;
      if(filter===1)v=a;else if(filter===2)v=b;else if(filter===3)v=(a+b)>>1;else if(filter===4){const q=a+b-c,pa=Math.abs(q-a),pb=Math.abs(q-b),pc=Math.abs(q-c);v=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}row[x]=(row[x]+v)&255;}
    for(let x=0;x<w;x++){const a=(y*w+x)*4,b=x*channels;data[a]=row[b];data[a+1]=row[b+1];data[a+2]=row[b+2];data[a+3]=channels===4?row[b+3]:255;}previous=row;
  }return {width:w,height:h,data};
}
class PixelCanvas{
  constructor(){this._w=0;this._h=0;this.data=new Uint8ClampedArray();this.style={};this.className='';}
  get width(){return this._w}set width(w){this._w=Math.max(0,Math.round(w));this.data=new Uint8ClampedArray(this._w*this._h*4)}
  get height(){return this._h}set height(h){this._h=Math.max(0,Math.round(h));this.data=new Uint8ClampedArray(this._w*this._h*4)}
  getContext(){
    const c = this;
    return {
      drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh) {
        if (arguments.length !== 9) throw Error('Expected source and destination rectangles');
        for (let y = 0; y < dh; y++) {
          const srcRow = (sy + Math.floor(y * sh / dh)) * src.width + sx;
          const dstRow = (dy + y) * c.width + dx;
          if (dw === sw) {
            c.data.set(src.data.subarray(srcRow * 4, (srcRow + sw) * 4), dstRow * 4);
            continue;
          }
          for (let x = 0; x < dw; x++) {
            const p = (srcRow + Math.floor(x * sw / dw)) * 4;
            c.data.set(src.data.subarray(p, p + 4), (dstRow + x) * 4);
          }
        }
      },
      getImageData(){return {data:Uint8ClampedArray.from(c.data)}},
      putImageData(d){c.data.set(d.data)}
    };
  }
}
async function verify(root=path.resolve(__dirname,'..')){
  const errors=[],assert=(ok,msg)=>{if(!ok)errors.push(msg)},read=p=>fs.readFileSync(path.join(root,p),'utf8');
  const c=vm.createContext({console,window:{addEventListener(){}},document:{getElementById(){throw Error('MAP_CONSTRUCTED')},createElement(){return new PixelCanvas()}},requestAnimationFrame(){return 1},cancelAnimationFrame(){},UI:{},SFX:{}});
  const modules=['data/types','data/mechs','data/pilots','data/story','data/expansion','data/combos','data/enemy-deployments','map/enemy-systems','battle/combat','map/tactics','main'];
  for(const file of modules)vm.runInContext(read('js/'+file+'.js'),c,{filename:file+'.js'});
  for(const dir of ['data','render','battle','map','ui'])for(const file of fs.readdirSync(path.join(root,'js',dir)))if(file.endsWith('.js'))new vm.Script(read('js/'+dir+'/'+file),{filename:dir+'/'+file});
  const check=vm.runInContext(`(()=>{const errors=[],routes={};for(const route of ['A','B'])for(const true_route of [false,true]){let id='c1',seen=[];while(id){if(seen.includes(id)){errors.push('Campaign cycle '+id);break}seen.push(id);const ch=CHAPTERS[id];if(!ch){errors.push('Missing chapter '+id);break}for(const e of ch.enemies)if(!MECHS[e.m])errors.push('Missing enemy '+e.m);id=typeof ch.next==='function'?ch.next({flags:{route,true_route}}):ch.next;}routes[route+(true_route?'-true':'-normal')]=seen;}SAVE=defaultSave();SAVE.roster=Object.keys(PILOTS);SAVE.pilots=Object.fromEntries(SAVE.roster.map(id=>[id,newPilotSave(id,12)]));for(const id of EXPANSION.crew)if(buildTree(id).flatMap(b=>b.nodes).length!==15)errors.push('Skill tree '+id);for(const id of EXPANSION.units){const m=MECHS[id],pid=EXPANSION.crew.find(p=>PILOTS[p].mech===id)||null,u={mech:id,pilot:pid,team:pid?'player':'enemy',lvl:12,hp:m.hp,en:m.en,will:140,buf:{},status:{},ammo:{},x:2,y:2},d={mech:'lancer',team:'enemy',lvl:12,hp:5000,en:150,will:110,buf:{},status:{},ammo:{},x:3,y:2};for(const w of CB.weapons(u))for(const mode of ['counter','evade','defend']){const f=CB.forecast(u,d,w,mode);if(!Number.isFinite(f.dmg)||!Number.isFinite(f.hit)||f.hit<0||f.hit>100)errors.push('Forecast '+id+' '+w.name);}}return {errors,routes,newWeapons:EXPANSION.units.reduce((n,id)=>n+MECHS[id].weapons.length,0),newSkillNodes:EXPANSION.crew.reduce((n,id)=>n+buildTree(id).flatMap(b=>b.nodes).length,0),mechs:Object.keys(MECHS).length,pilots:Object.keys(PILOTS).length}})()`,c);
  errors.push(...check.errors);delete check.errors;
  const deployment=await vm.runInContext(`(async()=>{const errors=[];SAVE.auxiliary=EXPANSION.crew.slice(0,4);for(const id of Object.keys(CHAPTERS)){try{await MAP.start(CHAPTERS[id]);}catch(e){if(e.message!=='MAP_CONSTRUCTED')throw e;}const s=G.map,positions=new Set();for(const u of s.units){const key=u.x+','+u.y;if(positions.has(key))errors.push('Overlap '+id+' '+key);positions.add(key);if(!Number.isFinite(u.hp)||u.hp<=0)errors.push('Invalid HP '+id);if(u.x<0||u.y<0||u.x>=s.w||u.y>=s.h)errors.push('Unit outside map '+id)}}G.map=null;return errors})()`,c);
  errors.push(...deployment);
  vm.runInContext(read('js/render/assets.js').replace('return { load, unit,','return { _process:processUnit, _ingest:ingest, load, unit,'),c,{filename:'assets.js'});
  const manifest=JSON.parse(read('assets/manifest.json')),decoded=new Map(),sprites=[];
  for(const item of manifest){const file=path.join(root,item.path),raw=fs.readFileSync(file);assert(crypto.createHash('sha256').update(raw).digest('hex')===item.sha256,'Hash '+item.path);
    const script=read('assets/offline/'+item.path.slice(7).replace(/\.png$/,'.js'));const capture={window:{}};vm.runInNewContext(script,capture);const data=capture.window.IRON_OFFLINE[item.path.replace(/\.png$/,'')];assert(data&&Buffer.from(data.split(',')[1],'base64').equals(raw),'Offline wrapper '+item.path);}
  const mechs=vm.runInContext('MECHS',c),aliases={carmine_e:'carmine'};
  for(const [id,m] of Object.entries(mechs)){if(aliases[id])continue;const file='assets/units/'+(m.atlas?.sheet||id)+'.png';assert(fs.existsSync(path.join(root,file)),'Missing sprite '+file);if(!decoded.has(file))decoded.set(file,decodePNG(fs.readFileSync(path.join(root,file))));c.testImage=decoded.get(file);c.testLayout=m.atlas||undefined;
    const sprite=vm.runInContext('ASSETS._process(testImage,testLayout)',c);assert(sprite.frames.length===4&&sprite.ground>0,'Sprite frames '+id);
    assert(Math.max(sprite.w, sprite.h) <= 448, 'Sprite fits runtime canvas budget '+id);
    for(const f of sprite.frames){const corners=[0,(f.width-1)*4,(f.width*(f.height-1))*4,(f.width*f.height-1)*4];assert(corners.filter(i=>f.data[i+3]<40).length>=3,'Opaque sprite corner '+id)}
    sprites.push({id,width:sprite.w,height:sprite.h,ground:Number(sprite.ground.toFixed(3))});}
  const maps=vm.runInContext(`(()=>{const errors=[],sizes=new Set();for(const [id,ch] of Object.entries(CHAPTERS)){
    const {w,h,theme,seed}=ch.map;sizes.add(w+'×'+h);const rows=ch.map.rows||genMap(theme,w,h,seed);
    if(rows.length!==h||rows.some(r=>r.length!==w||[...r].some(t=>!TERRAIN[t])))errors.push('Invalid terrain '+id);
    const check=(spawn)=>{if(spawn.x<0||spawn.x>=w||spawn.y<0||spawn.y>=h)errors.push('Off map '+id+' '+JSON.stringify(spawn));};
    [...ch.enemies,...ch.deploy,...(ch.events||[]).flatMap(ev=>[...(ev.add||[]),...(ev.ally||[]),...(ev.join||[])])].forEach(check);
    if(typeof ch.allies==='function')ch.allies({flags:{ourobor_peace:true,nursery_channel:true,archive_public:true}}).forEach(check);
    if(ch.win.escort)for(const shelter_route of ['checkpoint','pumps']){
      const convoy=ch.allies({flags:{shelter_route}});
      for(const tag of ch.win.escort){
        const unit=convoy.find(u=>u.tag===tag),route=unit?.escortPath;
        if(!route||route.length<2||route[0].join()!==[unit.x,unit.y].join()){errors.push('Missing escort path '+id+' '+tag);continue;}
        route.forEach(([x,y],i)=>{
          check({x,y});
          if(rows[y]?.[x]==='x'||(i&&Math.abs(x-route[i-1][0])+Math.abs(y-route[i-1][1])!==1))errors.push('Blocked escort route '+id+' '+shelter_route);
        });
      }
    }
  }if(sizes.size<8)errors.push('Too few sizes');const types=CHAPTERS.i1.enemies.map(e=>MECHS[e.m].armor);if(!types.includes('BIO')||types.every(a=>a==='BIO'))errors.push('Early mixed enemies');return {sizes:[...sizes],errors};})()`,c);
  errors.push(...maps.errors);
  const portraitMapping=vm.runInContext('OUROBOR_PORTRAITS',c);
  for(const [id,p] of Object.entries(portraitMapping)){
    const file='assets/portraits/'+p.sheet+'.png';
    assert(fs.existsSync(path.join(root,file)), 'Portrait sheet '+id);
    if(!decoded.has(file))decoded.set(file,decodePNG(fs.readFileSync(path.join(root,file))));
    assert(p.row>=0&&p.row<4&&decoded.get(file).width>=1000,'Portrait atlas layout '+id);
  }
  const scene=read('js/battle/scene.js'),animations=new Set([...scene.matchAll(/case '([^']+)'/g)].map(x=>x[1]));
  for(const [id,m] of Object.entries(mechs))for(const w of m.weapons){if(w.anim==='finisher')for(const seq of w.seq||[])assert(animations.has(seq),'Unknown finisher animation '+id+' '+seq);else assert(animations.has(w.anim),'Unknown animation '+id+' '+w.anim)}
  for(const [id,m] of Object.entries(mechs))if(m.atlas){const sprite=decoded.get('assets/units/'+m.atlas.sheet+'.png');assert(m.atlas.row>=0&&m.atlas.row<4&&sprite.width>=1024,'Atlas layout '+id)}
  return {status:errors.length?'failed':'passed',errors,...check,chapterDefinitions:vm.runInContext('Object.keys(CHAPTERS).length',c),mapSizes:maps.sizes,ouroborPortraits:Object.keys(portraitMapping).length,pngAssets:manifest.length,spriteDesignsChecked:sprites.length,sprites,limits:['No browser playback check: native computer permission was unavailable and local-file preview was blocked.','No Windows execution check.','These checks do not certify visual polish or full campaign balance.']};
}
module.exports={verify,decodePNG};
if(require.main===module)verify().then(r=>{console.log(JSON.stringify(r,null,2));if(r.errors.length)process.exitCode=1}).catch(e=>{console.error(e);process.exitCode=1});
