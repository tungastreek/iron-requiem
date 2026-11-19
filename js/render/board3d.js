// Static Three.js terrain pass. The tactical canvas draws units and input feedback
// over the same camera projection, keeping sprites upright and text legible.
'use strict';
const BOARD3D = (() => {
  const height = {m:.70, h:.26, w:-.12, f:.05, c:.10, b:.12, x:.32};
  const climate = {
    urban:'#f8b789', ice:'#d7efff', hive:'#ff9275', coast:'#9de7ff',
    space:'#a8a5ff', vael:'#be9aff', colony:'#9dafff', elevator:'#ffd09f',
  };
  let renderer, scene, camera, surface, ray, texture, snapshot, state, width, heightPx, failed = false;
  const elevation = (x,y) => height[state.rows[y]?.[x]] || 0;

  function geometry() {
    const xyz = [], uv = [], colors = [], cells = [];
    const top = [0, 2, 1, 0, 3, 2];
    const faces = [[0,1,0,-1],[1,2,1,0],[2,3,0,1],[3,0,-1,0]];
    function triangle(at, points, tint, cell) {
      for (const i of at) {
        const [x, y, z] = points[i];
        xyz.push(x, y, z); uv.push(x / state.w, 1 - z / state.h);
        colors.push(tint, tint, tint);
      }
      cells.push(cell);
    }
    for (let y = 0; y < state.h; y++) for (let x = 0; x < state.w; x++) {
      const z = elevation(x,y), cell = {x,y};
      const points = [[x,z,y],[x+1,z,y],[x+1,z,y+1],[x,z,y+1]];
      triangle(top.slice(0,3), points, 1, cell);
      triangle(top.slice(3), points, 1, cell);
      for (const [a,b,dx,dy] of faces) {
        const boundary = !state.rows[y+dy]?.[x+dx];
        const below = boundary ? -.64 : elevation(x+dx,y+dy);
        if (z <= below) continue;
        const [ax,,az] = points[a], [bx,,bz] = points[b];
        const wall = [points[a], points[b], [bx,below,bz], [ax,below,az]];
        triangle([0,1,2], wall, boundary ? .33 : .62, cell);
        triangle([0,2,3], wall, boundary ? .24 : .49, cell);
      }
    }
    const data = new THREE.BufferGeometry();
    data.setAttribute('position', new THREE.Float32BufferAttribute(xyz, 3));
    data.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    data.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    data.computeVertexNormals();
    return {data,cells};
  }

  function addDetails() {
    const seed = state.ch.map.seed, pick = (x,y)=>((x*91 + y*137 + seed*83) % 997)/997;
    const groups = {
      f:{geometry:new THREE.ConeGeometry(.16,.35,5), colors:['#315c44','#458259','#6c8e5a'], z:.16},
      b:{geometry:new THREE.CylinderGeometry(.065,.10,.28,5),colors:['#ffbd63','#6dd9ff'],z:.14},
      h:{geometry:new THREE.ConeGeometry(.13,.38,5),colors:['#a56e90','#7e3c78','#d7c361'],z:.18},
      v:{geometry:new THREE.OctahedronGeometry(.115),colors:['#bca8fb','#a99eef','#cdebff'],z:.19},
      a:{geometry:new THREE.DodecahedronGeometry(.12,0), colors:['#5b596a','#637087'],z:.1},
    };
    const temp = new THREE.Object3D(), tint = new THREE.Color();
    for (const [tile,g] of Object.entries(groups)) {
      const sites = [];
      for (let y=0;y<state.h;y++) for (let x=0;x<state.w;x++) {
        const k=pick(x,y);
        if (state.tile(x,y)===tile && k<.48) sites.push([x,y,k]);
      }
      if (!sites.length) { g.geometry.dispose(); continue; }
      const mesh = new THREE.InstancedMesh(g.geometry,new THREE.MeshLambertMaterial(),sites.length);
      sites.forEach(([x,y,k],i)=>{
        temp.position.set(x+.18+k*.2,elevation(x,y)+g.z,y+.20);
        temp.rotation.set(0,k*13,0); temp.scale.setScalar(.8+k*.72); temp.updateMatrix();
        mesh.setMatrixAt(i,temp.matrix);
        mesh.setColorAt(i,tint.set(g.colors[i%g.colors.length]));
      });
      scene.add(mesh);
    }
  }

  function build(map, painted, W, H) {
    if (failed || !W || !H) return false;
    try {
      if (!renderer) {
        renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, preserveDrawingBuffer:true, powerPreference:'low-power'});
        ray = new THREE.Raycaster();
        snapshot = document.createElement('canvas');
        renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); failed = true; if (MAP.state) MAP.resize(); });
      }
      state = map; width = W; heightPx = H;
      const resolution = Math.min(QUALITY.dpr, 1600 / Math.max(W, H));
      renderer.setPixelRatio(resolution); renderer.setSize(W,H,false);
      scene?.traverse(object=>{object.geometry?.dispose(); object.material?.dispose(); object.dispose?.();});
      texture?.dispose();
      scene = new THREE.Scene();
      texture = new THREE.CanvasTexture(painted);
      texture.anisotropy = Math.min(8,renderer.capabilities.getMaxAnisotropy());
      const {data,cells} = geometry();
      surface = new THREE.Mesh(data,new THREE.MeshLambertMaterial({map:texture,vertexColors:true,side:THREE.DoubleSide}));
      surface.userData.cells = cells;
      scene.add(surface, new THREE.AmbientLight('#eef6ff',.82));
      addDetails();
      const key = new THREE.DirectionalLight(climate[map.theme] || '#ffcf9d',.47);
      key.position.set(-5,10,-4); scene.add(key);
      camera = new THREE.PerspectiveCamera(27,W/H,.1,10000);
      const target = new THREE.Vector3(map.w/2,.02,map.h/2);
      const angle = 57*Math.PI/180, relative = new THREE.Vector3(0,Math.sin(angle),Math.cos(angle));
      const corners = [[0,0],[map.w,0],[0,map.h],[map.w,map.h]];
      let distance = Math.max(map.h,map.w / camera.aspect) * 2.2;
      for (let i=0;i<3;i++) {
        camera.position.copy(target).addScaledVector(relative,distance); camera.lookAt(target); camera.updateMatrixWorld();
        const edges = corners.flatMap(([x,z])=>[-.64,.7].map(y=>new THREE.Vector3(x,y,z).project(camera)));
        distance *= Math.max(...edges.map(v=>Math.max(Math.abs(v.x)/.94,Math.abs(v.y)/.83)));
      }
      renderer.render(scene,camera);
      snapshot.width = renderer.domElement.width; snapshot.height = renderer.domElement.height;
      snapshot.getContext('2d').drawImage(renderer.domElement,0,0);
      return true;
    } catch (error) {
      failed = true;
      console.warn('Terrain rendering switched to 2D',error);
      return false;
    }
  }

  function project(x,y,tileX = Math.floor(x),tileY = Math.floor(y)) {
    const v = new THREE.Vector3(x,elevation(tileX,tileY)+.012,y).project(camera);
    return [(v.x+1)*width/2,(1-v.y)*heightPx/2];
  }
  function pick(x,y) {
    ray.setFromCamera({x:2*x/width-1,y:1-2*y/heightPx},camera);
    const hit = ray.intersectObject(surface,false)[0];
    return hit ? surface.userData.cells[hit.faceIndex] : null;
  }
  return {build, project, pick, get image(){return snapshot;}};
})();
