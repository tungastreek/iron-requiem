// High-quality additive particles. One instanced quad batch, with a fixed
// budget, so beam and finisher bursts never allocate a mesh per particle.
'use strict';
const BATTLE_PARTICLES = (() => {
  const budget = 384, W = 1280, H = 720, GROUND = 560;
  let renderer, scene, camera, mesh, attrs, cursor = 0, activeUntil = 0, failed = false;
  function init() {
    if (renderer) return true;
    if (failed || typeof THREE === 'undefined') return false;
    try {
      renderer = new THREE.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
      renderer.setSize(W,H,false);
      renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();failed=true;});
      scene = new THREE.Scene(); camera = new THREE.Camera();
      const quad = new THREE.PlaneGeometry(2,2), batch = new THREE.InstancedBufferGeometry();
      batch.setAttribute('position',quad.attributes.position);
      batch.setIndex(quad.index); batch.instanceCount=budget;
      attrs = {};
      for (const [key,size] of [['pOrigin',4],['pVelocity',4],['pColor',3]]) {
        attrs[key] = new THREE.InstancedBufferAttribute(new Float32Array(budget*size),size);
        attrs[key].setUsage(THREE.DynamicDrawUsage); batch.setAttribute(key,attrs[key]);
      }
      const material = new THREE.ShaderMaterial({
        uniforms:{time:{value:0},view:{value:new THREE.Vector3(0,0,1)}},
        vertexShader:`
          attribute vec4 pOrigin;
          attribute vec4 pVelocity;
          attribute vec3 pColor;
          uniform float time;
          uniform vec3 view;
          varying vec2 uvLocal;
          varying vec3 ink;
          varying float opacity;
          void main() {
            float age=(time-pOrigin.z)/1000.0;
            float end=pOrigin.w;
            uvLocal=position.xy;
            ink=pColor;
            opacity=end>0.0 && age>=0.0 && age<end ? pow(1.0-age/end,1.3) : 0.0;
            vec2 v=pVelocity.xy;
            vec2 center=pOrigin.xy+v*age+vec2(sin(age*14.0+pOrigin.x)*age*9.0, pVelocity.w*age*age);
            if(center.y>${GROUND}.0) center.y=${GROUND}.0-(center.y-${GROUND}.0)*0.26;
            vec2 direction=normalize(v+vec2(0.01,0.0));
            float size=pVelocity.z;
            vec2 corner=direction*position.x*size*2.4+vec2(-direction.y,direction.x)*position.y*size;
            vec2 pixel=(center+corner-vec2(${W/2}.0,${H/2}.0))*view.z+view.xy;
            gl_Position=vec4(pixel.x/${W/2}.0,-pixel.y/${H/2}.0,0.0,1.0);
          }`,
        fragmentShader:`
          varying vec2 uvLocal;
          varying vec3 ink;
          varying float opacity;
          void main() {
            float distance=length(vec2(uvLocal.x*0.86,uvLocal.y));
            float mask=pow(max(0.0,1.0-distance),1.8);
            vec3 core=mix(ink,vec3(1.0),mask*0.7);
            gl_FragColor=vec4(core,opacity*mask*0.9);
          }`,
        transparent:true, blending:THREE.AdditiveBlending, depthTest:false, depthWrite:false,
      });
      mesh = new THREE.Mesh(batch,material); mesh.frustumCulled=false; scene.add(mesh);
      return true;
    } catch (error) { failed=true; console.warn('GPU particle pass unavailable',error); return false; }
  }
  function reset() {
    cursor=0; activeUntil=0;
    if (attrs) { attrs.pOrigin.array.fill(0); attrs.pOrigin.needsUpdate=true; }
  }
  function burst(x,y,dir,profile,color,time) {
    if (failed || !init()) return;
    const count = Math.min(66,Math.round(profile.count*profile.power*2.2));
    const hue = new THREE.Color(color);
    activeUntil = Math.max(activeUntil,time+1400);
    for (let i=0;i<count;i++) {
      const slot = cursor++%budget, angle = i*2.39996;
      const spread = profile.family==='beam' || profile.family==='rail' ? .55 : 1;
      const speed = 55+((i*73)%211)*profile.power, life = .36+(i%7)*.115;
      attrs.pOrigin.setXYZW(slot,x,y,time,life);
      attrs.pVelocity.setXYZW(slot,Math.cos(angle)*speed*dir,Math.sin(angle)*speed*spread,3.0+(i%6)*1.8,36+((i*43)%85));
      attrs.pColor.setXYZ(slot,hue.r,hue.g,hue.b);
    }
    Object.values(attrs).forEach(attribute=>{attribute.needsUpdate=true;});
  }
  function frame(time,x,y,zoom) {
    if (failed || !renderer || time>=activeUntil) return null;
    mesh.material.uniforms.time.value=time;
    mesh.material.uniforms.view.value.set(x,y,zoom);
    renderer.render(scene,camera);
    return renderer.domElement;
  }
  return {burst,frame,reset};
})();
