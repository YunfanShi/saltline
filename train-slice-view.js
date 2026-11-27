/* Renderer and controls for the isolated train greybox. */
(() => {
  const T = window.THREE, model = window.SaltlineTrainSlice.createState();
  const canvas = document.querySelector('#view'), panel = document.querySelector('#panel');
  const heading = document.querySelector('#heading'), desc = document.querySelector('#desc');
  const objective = document.querySelector('#objective'), resume = document.querySelector('#resume');
  const renderer = new T.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1));
  const scene = new T.Scene(); scene.background = new T.Color(0x82959a); scene.fog = new T.Fog(0x82959a, 65, 260);
  const camera = new T.PerspectiveCamera(70, 1, .1, 500); camera.rotation.order = 'YXZ';
  scene.add(new T.HemisphereLight(0xd4e2e5, 0x394043, 2));
  const sunlight = new T.DirectionalLight(0xffe7bb, 1.1); sunlight.position.set(-8, 20, 10); scene.add(sunlight);
  const mats = Object.fromEntries(Object.entries({ train:0x3c5960, roof:0x77858a, enemy:0x66574b, target:0xe95444, ground:0x565f5a, rail:0x252f31, bridge:0x383e3d, cover:0x344649 }).map(([k,c]) => [k, new T.MeshStandardMaterial({ color:c })]));
  const geometry = new T.BoxGeometry(1,1,1);
  function box(parent, mat, x,y,z,w,h,d) { const m = new T.Mesh(geometry, mat); m.position.set(x,y,z); m.scale.set(w,h,d); parent.add(m); return m; }
  for (const z of [-9,9]) { box(scene,mats.train,0,1.2,z,3,2.4,17.7); box(scene,mats.roof,0,2.45,z,3.2,.1,17.7); }
  // Both cars and target are rendered and raycast in the same local frame.
  const other = new T.Group(); scene.add(other);
  for (const z of [-9,9]) { box(other,mats.enemy,0,1.2,z,3,2.4,17.7); box(other,mats.roof,0,2.45,z,3.2,.1,17.7); }
  const targets = [box(other,mats.target,0,3.25,-3,.8,1.6,.55), box(other,mats.target,0,3.25,7,.8,1.6,.55)];
  const cover = box(other,mats.cover,0,2.8,-5,2,.7,.8);
  const landscape = new T.Group(); scene.add(landscape);
  const chunks = [];
  for (let i=0;i<8;i++) { const g = new T.Group(); landscape.add(g); chunks.push(g); box(g,mats.ground,0,-.5,0,100,1,40); for(const x of [-2,2,4.8,8.8]) box(g,mats.rail,x,.05,0,.12,.15,40); for(const x of [-32,30]) box(g,mats.cover,x,3,-8,8,6,9); }
  const bridge = new T.Group(); scene.add(bridge);
  for (const x of [-8,12]) box(bridge,mats.bridge,x,7,0,.8,14,2);
  box(bridge,mats.bridge,2,14,0,20,.8,2);
  const ray = new T.Raycaster(), keys = new Set(); let running = false, last = 0, shotHeld = false, wantsLock = false;
  function setPanel(title, message, showResume = true) { heading.textContent = title; desc.textContent = message; resume.hidden = !showResume; panel.hidden = false; }
  function pause() { if (!running) return; running=false; model.pause(true); wantsLock=false; keys.clear(); document.exitPointerLock?.(); setPanel('已暂停','可继续、从最近检查点重试，或退出。'); }
  function start() { model.pause(false); running=true; panel.hidden=true; last=performance.now(); wantsLock=true; canvas.requestPointerLock?.(); }
  function shoot() { if (!running) return; scene.updateMatrixWorld(true); ray.setFromCamera({x:0,y:0},camera); const hits=ray.intersectObjects([cover,...targets.filter(t=>t.visible)]); if (hits.length && targets.includes(hits[0].object)) model.hit(targets.indexOf(hits[0].object)); }
  resume.addEventListener('click',start);
  document.querySelector('#retry').addEventListener('click',() => { model.retry(); start(); });
  document.addEventListener('keydown',e => { if (e.code === 'Escape') { if(running) pause(); return; } keys.add(e.code); });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  window.addEventListener('blur',pause);
  document.addEventListener('pointerlockchange', () => { if (running && wantsLock && document.pointerLockElement !== canvas) pause(); });
  document.addEventListener('pointerlockerror', () => { if (running && wantsLock) pause(); });
  document.addEventListener('mousemove', e => { if (running && document.pointerLockElement === canvas) model.look(e.movementX*.002, e.movementY*.002); });
  canvas.addEventListener('mousedown',e=>{if(e.button===0)shoot();});
  function resize() { const w=innerWidth,h=innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
  window.addEventListener('resize',resize); resize();
  function frame(now) {
    const dt=Math.min(.05,Math.max(0,(now-last)/1000)); last=now;
    if (running) {
      const pad = navigator.getGamepads?.()[0];
      const dead = v => Math.abs(v || 0) > .18 ? v : 0;
      const forward = (keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)-dead(pad?.axes?.[1]);
      const side = (keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+dead(pad?.axes?.[0]);
      if (pad) { model.look(dead(pad.axes[2])*dt*2.2, dead(pad.axes[3])*dt*2.2); const down=Boolean(pad.buttons[7]?.pressed); if(down&&!shotHeld)shoot(); shotHeld=down; if(pad.buttons[9]?.pressed)pause(); }
      model.update(dt,{forward,side});
    }
    const s=model.snapshot;
    other.position.set(5.5 + Math.sin(s.distance*.004)*.5,0,Math.sin(s.distance*.009)*3);
    targets.forEach((target,i) => { target.visible=s.phase !== 'approach' && Boolean(s.targetMask & (1 << i)); });
    for(let i=0;i<chunks.length;i++) chunks[i].position.z=((i*40+s.distance)%320)-160;
    bridge.visible=s.phase === 'bridge' || s.phase === 'derail' || s.phase === 'complete'; bridge.position.z = -90 + Math.max(0, s.distance - (s.bridgeStart || s.distance)) * .5;
    camera.position.set(s.x,4.05,s.z); camera.rotation.set(s.pitch,s.yaw,s.phase==='derail'?Math.min(.4,s.derailTime*.13):0);
    objective.textContent=s.phase==='approach'?'列车并行接近：沿车顶前进':s.phase==='contact'?`击中右侧目标（剩余 ${s.targetsRemaining}）`:s.phase==='pursuit'?'沿车顶前进至前方车厢':s.phase==='bridge'?'桥梁出现：向前通过两节车厢':s.phase==='derail'?'受控脱轨：准备撤离':'';
    if(s.phase==='complete' && running) { running=false; wantsLock=false; document.exitPointerLock?.(); setPanel('灰盒完成','列车已停止。可从检查点重试或返回城市入口。',false); }
    renderer.render(scene,camera); requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
