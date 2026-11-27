/* Standalone, unsaved test scene using the shipped engine and rail systems. */
(async () => {
  const error = document.getElementById('error');
  window.addEventListener('error', event => { error.textContent = String(event.error?.stack || event.message); });
  try {
    const html = await (await fetch('index.html')).text();
    const begin = html.indexOf('var _M=Object.defineProperty');
    const end = html.indexOf('var gM=', begin);
    if (begin < 0 || end < 0) throw new Error('Could not locate the bundled engine');
    const { THREE, createPhysics, random, createBuilder, createProps } = new Function(
      html.slice(begin, end) + ';return {THREE:lt,createPhysics:d3,random:il,createBuilder:ob,createProps:Yg};',
    )();
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7b8d8c);
    scene.fog = new THREE.Fog(0x7b8d8c, 75, 230);
    scene.add(new THREE.HemisphereLight(0xcbd8d2, 0x384139, 2));
    const sun = new THREE.DirectionalLight(0xfff0d1, 2); sun.position.set(-40,80,30); scene.add(sun);
    const renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); document.body.prepend(renderer.domElement);
    const camera = new THREE.PerspectiveCamera(70,1,.1,400);
    const mats = new Map();
    function material(name) {
      if (!mats.has(name)) {
        let seed=0; for(const ch of String(name)) seed=(seed*31+ch.charCodeAt(0))>>>0;
        const shade=75+seed%48;
        mats.set(name,new THREE.MeshStandardMaterial({color:new THREE.Color(`rgb(${shade},${shade+4},${shade+2})`),roughness:.85}));
      }
      return mats.get(name);
    }
    const world={THREE,scene,rng:random(4207),params:{},mats:{get:material,label:n=>({material:material(n),aspect:2}),decal:n=>({material:material(n),aspect:2}),emissive:material}};
    world.physics=createPhysics(world); world.props=createProps(world);
    const builder=createBuilder(world), vector=(x,y,z)=>new THREE.Vector3(x,y,z);
    window.createRailYardLayout(builder,vector);
    const {pickup}=window.createPortExpansion(builder,vector,{rail:true});
    scene.add(builder.staticRoot,builder.dynRoot);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(280,180),new THREE.MeshStandardMaterial({color:0x59625b,roughness:1}));
    ground.rotation.x=-Math.PI/2;ground.position.set(-75,-.02,0);scene.add(ground);
    world.physics.build();
    const crash=window.createCampaignCrash(world,{retainWreck:true});
    const rescue=window.createRailRescue(world,pickup.rescue);
    let wreckBoxes=[];
    const slice=window.createCrashRescueSlice({crash,rescue,onWreck(show){
      for(const box of wreckBoxes) world.physics.removeBox(box);wreckBoxes=[];
      if(show) wreckBoxes=[pickup.closure,...pickup.debris].map(({min,max,playerOnly})=>world.physics.addBox(min,max,{playerOnly}));
    }});
    const player={alive:true,pos:pickup.rescue.start.clone().add(vector(0,0,3.5)),eye:new THREE.Vector3()};
    let yaw=0,pitch=0,last=performance.now();const keys=new Set(),velocity=new THREE.Vector3();
    const objective=document.getElementById('objective'),prompt=document.getElementById('prompt'),retry=document.getElementById('retry');
    renderer.domElement.addEventListener('click',()=>renderer.domElement.requestPointerLock?.());
    document.addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement){yaw-=e.movementX*.002;pitch=Math.max(-1.3,Math.min(1.3,pitch-e.movementY*.002));}});
    document.addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='KeyK')player.alive=false;});
    document.addEventListener('keyup',e=>keys.delete(e.code));
    window.addEventListener('blur',()=>keys.clear());
    retry.onclick=()=>{const position=slice.resumePosition.clone();player.alive=true;slice.restore();player.pos.copy(position);velocity.set(0,0,0);retry.style.display='none'};
    function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()};addEventListener('resize',resize);resize();
    slice.start();
    function frame(now){
      const dt=Math.min(.05,(now-last)/1000);last=now;
      let x=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0), z=(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0);
      const length=Math.hypot(x,z)||1;x/=length;z/=length;
      velocity.set((x*Math.cos(yaw)+z*Math.sin(yaw))*4,0,(-x*Math.sin(yaw)+z*Math.cos(yaw))*4);
      if(player.alive)world.physics.moveCapsule(player.pos,velocity,dt);
      player.eye.copy(player.pos).add(vector(0,1.65,0));camera.position.copy(player.eye);camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);
      const result=slice.update(dt,player,keys.has('KeyE'));
      objective.textContent=slice.objective?.[1]|| (slice.phase==='complete'?'救援完成 / RESCUE COMPLETE':'');
      const mark=slice.markers[0];if(mark) {
        const dx=mark.pos.x-player.pos.x,dz=mark.pos.z-player.pos.z;
        const direction=Math.abs(dx)>Math.abs(dz) ? (dx>0?'东':'西') : (dz>0?'南':'北');
        objective.textContent+=` · ${direction} ${Math.round(player.pos.distanceTo(mark.pos))}m`;
      }
      prompt.textContent=result?.prompt?`${result.prompt[1]} · 按住 E ${Math.round(result.progress*100)}%`:'';
      if(slice.phase==='failed')retry.style.display='block';
      renderer.render(scene,camera);requestAnimationFrame(frame);
    }
    window.__crashRescueTest={slice,player,crash,rescue,world};
    requestAnimationFrame(frame);
  } catch(e) {error.textContent='加载失败 / Failed to load: '+(e.stack||e);console.error(e);}
})();
