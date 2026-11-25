/* Drivable Saltline SAR 4x4 Tactical Patrol Vehicle.
 * Full player driving physics (accelerate, reverse, speed-sensitive steering, handbrake drift,
 * turbo boost, high-beam headlights, mountain slope suspension, ramming combat,
 * 1st-person cockpit view, and Mara Chen companion passenger banter). */
(() => {
  function injectStyles() {
    if (document.getElementById('saltline-vehicle-style')) return;
    const style = document.createElement('style');
    style.id = 'saltline-vehicle-style';
    style.textContent = `
      .sl-veh-hud{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:20;background:rgba(8,12,16,.58);border-bottom:2px solid rgba(255,255,255,.35);padding:5px 14px;color:#eef4f6;font:600 12px/1.3 system-ui,-apple-system,sans-serif;display:flex;align-items:center;gap:12px;pointer-events:none;letter-spacing:.04em}
      .sl-veh-hud[hidden]{display:none}
      .sl-veh-spd{font:700 18px/1 ui-monospace,monospace;color:#ffffff;min-width:70px;text-align:right}
      .sl-veh-keys{font-size:11px;color:rgba(230,238,242,.78)}
      .sl-veh-prompt{position:fixed;bottom:96px;left:50%;transform:translateX(-50%);z-index:19;background:rgba(8,12,16,.72);border-left:2px solid rgba(255,255,255,.78);padding:5px 12px;color:#f3f6f8;font:600 12.5px/1.3 system-ui,sans-serif;pointer-events:none}
      .sl-veh-prompt[hidden]{display:none}
    `;
    document.head.appendChild(style);
  }

  window.createPortDrivableVehicle = (world, { startPos, startYaw = 0, bevelBox, multiplayer = false, canDrive = () => true } = {}) => {
    const { THREE, scene, physics, fx, audio } = world;
    const { Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry,
      MeshStandardMaterial, MeshBasicMaterial, SpotLight, PointLight, Vector3 } = THREE;

    injectStyles();
    const root = new Group();
    root.name = 'saltline-drivable-4x4';
    scene.add(root);

    const chassis = new Group();
    root.add(chassis);

    // Armored SAR 4x4 Utility Truck Geometry
    const bodyMat = new MeshStandardMaterial({ color: 0x2c3c42, roughness: .42, metalness: .52 });
    bodyMat.bumpMap = world.mats?.get?.('steel_worn')?.bumpMap ?? null;
    bodyMat.bumpScale = .008;
    const trimMat = new MeshStandardMaterial({ color: 0x1c2124, roughness: .58, metalness: .55 });
    const stripeMat = new MeshStandardMaterial({ color: 0xd95626, roughness: .45, metalness: .22 });
    const tireMat = new MeshStandardMaterial({ color: 0x181a1b, roughness: .92, metalness: .06 });
    const rimMat = new MeshStandardMaterial({ color: 0x515a59, roughness: .52, metalness: .78 });
    const glassMat = new MeshStandardMaterial({ color: 0x6ea4bc, roughness: .12, metalness: .4, transparent: true, opacity: .25, depthWrite: false });
    const headGlow = new MeshBasicMaterial({ color: 0xfff3d1 });
    const tailGlow = new MeshBasicMaterial({ color: 0xff3b28 });
    const blueBar = new MeshBasicMaterial({ color: 0x38a8ff });
    const amberBar = new MeshBasicMaterial({ color: 0xffa828 });

    const boxGeo = new BoxGeometry(1, 1, 1);
    const cylGeo = new CylinderGeometry(1, 1, 1, 18);
    const add = (p, g, m, sx, sy, sz, x, y, z) => {
      const stamped = bevelBox && g === boxGeo && Math.min(sx, sy, sz) >= .07;
      const mesh = new Mesh(stamped ? bevelBox(sx,sy,sz,.035) : g, m);
      mesh.position.set(x, y, z);
      if (!stamped) mesh.scale.set(sx, sy, sz);
      mesh.castShadow = m !== glassMat;
      mesh.receiveShadow = true;
      p.add(mesh);
      return mesh;
    };

    // Rebuilt Benchmark SAR 4x4 Tactical Patrol Truck (true open wheel-arch cutouts — ZERO tire/hull overlap!)
    add(chassis, boxGeo, trimMat, 1.38, .22, 4.52, 0, .44, 0); // Narrow recessed ladder frame
    add(chassis, boxGeo, trimMat, 1.75, .11, 2.0, 0, .56, 0);
    for (const z of [-2.14, 2.16]) add(chassis, boxGeo, bodyMat, 2.02, .48, .44, 0, .86, z);
    for (const x of [-.97, .97]) {
      add(chassis, boxGeo, bodyMat, .10, .64, 1.98, x, .86, -.02);
      add(chassis, boxGeo, bodyMat, .13, .14, 4.62, x, 1.14, 0);
    }
    add(chassis, boxGeo, trimMat, 1.85, .10, 1.45, 0, 1.09, 1.56);
    const cushionGeo = new SphereGeometry(1, 24, 16);
    const fabric = new MeshStandardMaterial({ color: 0x424b48, roughness: .96 });
    for (const x of [-.46, .46]) {
      add(chassis, boxGeo, trimMat, .42, .28, .48, x, .78, .12);
      add(chassis, cushionGeo, fabric, .32, .095, .32, x, .94, .11);
      add(chassis, cushionGeo, fabric, .31, .36, .10, x, 1.23, .37).rotation.x = .12;
      add(chassis, cushionGeo, fabric, .16, .12, .09, x, 1.61, .41);
    }
    add(chassis, boxGeo, trimMat, 1.76, .16, .36, 0, 1.26, -.66);
    const wheelRing = new THREE.TorusGeometry(.18, .023, 8, 32);
    const steering = add(chassis, wheelRing, trimMat, 1, 1, 1, -.46, 1.26, -.36);
    steering.rotation.x = -.46;
    add(chassis, boxGeo, trimMat, .31, .045, .055, -.46, 1.25, -.36);
    const instrumentFace = new MeshStandardMaterial({ color:0x172224, roughness:.48 });
    for (const x of [-.555,-.365]) {
      add(chassis,cylGeo,trimMat,.094,.05,.094,x,1.39,-.575).rotation.x=Math.PI/2;
      add(chassis,cylGeo,instrumentFace,.082,.012,.082,x,1.39,-.544).rotation.x=Math.PI/2;
      for(let i=0;i<9;i++) {
        const angle=(i-4)*.54;
        add(chassis,boxGeo,rimMat,.008,.018,.005,x+.067*Math.sin(angle),1.39+.067*Math.cos(angle),-.535).rotation.z=-angle;
      }
      add(chassis,boxGeo,stripeMat,.009,.061,.006,x-.016,1.405,-.529).rotation.z=.77;
    }
    add(chassis,boxGeo,trimMat,.42,.20,.085,.13,1.35,-.57);
    add(chassis,boxGeo,instrumentFace,.32,.13,.014,.13,1.36,-.516);
    for (const x of [-.02,.075,.17,.265]) add(chassis,cylGeo,rimMat,.014,.018,.014,x,1.272,-.516).rotation.x=Math.PI/2;
    const driver = window.createSaltlineHuman(THREE, { role: 'operator', name: 'sar-driver' });
    driver.pose('seated');
    for (const {shoulder,elbow,sign} of driver.limbs) {
      shoulder.rotation.set(-.68,0,-sign*.07);
      elbow.rotation.x=-.88;
    }
    driver.actor.position.set(-.46, .33, .12);
    driver.actor.rotation.y = Math.PI;
    driver.actor.visible = false;
    chassis.add(driver.actor);
    for (const sx of [-1.03, 1.03]) {
      add(chassis, boxGeo, stripeMat, .04, .10, .40, sx, .92, -2.14);
      add(chassis, boxGeo, stripeMat, .04, .10, .82, sx, .92, -.44);
      add(chassis, boxGeo, stripeMat, .04, .10, .78, sx, .92, .44);
      add(chassis, boxGeo, stripeMat, .04, .10, .40, sx, .92, 2.16);
      for (const seamZ of [-.88, -.01, .84]) add(chassis, boxGeo, trimMat, .045, .56, .028, sx, .84, seamZ);
      add(chassis, boxGeo, rimMat, .06, .045, .18, sx * 1.01, 1.04, -.14);
      add(chassis, boxGeo, rimMat, .06, .045, .18, sx * 1.01, 1.04, .64);
      add(chassis, boxGeo, trimMat, .20, .09, 1.88, sx * 1.03, .46, -.02);
      // Continuous rolled wheel lips follow the tire with a 9 cm radial gap.
      for (const fz of [-1.52,1.48]) {
        const lip = new THREE.Shape();
        lip.absarc(0,0,.63,.10,Math.PI-.10,false);
        lip.absarc(0,0,.54,Math.PI-.10,.10,true);
        lip.closePath();
        const flare = new THREE.ExtrudeGeometry(lip,{depth:.14,bevelSize:.018,bevelThickness:.012,bevelSegments:2,curveSegments:20});
        flare.translate(0,0,-.07);
        const edge = new Mesh(flare,trimMat);
        edge.rotation.y = Math.PI/2;
        edge.position.set(sx,.45,fz);
        chassis.add(edge);
      }
      const badge = world.mats?.label?.('SAR  /  04', {color:'white',font:'stencil',distress:.10});
      if (badge) {
        const doorMark = new Mesh(new THREE.PlaneGeometry(.62,.62/badge.aspect),badge.material);
        doorMark.position.set(sx*.996,1.075,-.44);
        doorMark.rotation.y = Math.sign(sx)*Math.PI/2;
        chassis.add(doorMark);
      }
    }
    // A single pressed hood with a low nose, crowned centre and rolled edges.
    const stations = [[-2.32,.86,1.10],[-2.23,.95,1.16],[-1.78,.98,1.22],[-1.0,.94,1.29],[-.88,.90,1.27]];
    const vertices=[], indices=[], uv=[];
    for (const [z,r,y] of stations) {
      for (const [u,drop] of [[-1,.125],[-.98,.055],[-.88,.016],[-.61,0],[.61,0],[.88,.016],[.98,.055],[1,.125]]) {
        vertices.push(u*r,y-drop,z); uv.push((u+1)/2,(z+2.32)/1.44);
      }
    }
    for(let row=0;row<stations.length-1;row++) for(let col=0;col<7;col++){
      const a=row*8+col;
      indices.push(a,a+8,a+1,a+1,a+8,a+9);
    }
    const stamping=new THREE.BufferGeometry();
    stamping.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    stamping.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    stamping.setIndex(indices); stamping.computeVertexNormals();
    chassis.add(new Mesh(stamping,bodyMat));
    add(chassis, boxGeo, trimMat, 1.19,.31,.08,0,.91,-2.366);
    for(let row=0;row<5;row++) add(chassis,boxGeo,rimMat,1.10,.022,.042,0,.80+row*.053,-2.408);
    add(chassis,boxGeo,trimMat,2.06,.18,.22,0,.64,-2.37);
    add(chassis,boxGeo,rimMat,.64,.105,.08,0,.66,-2.48);
    // Armored cab roof, A/B/C pillars, sloped windshield & side mirrors
    add(chassis, boxGeo, bodyMat, 1.88, .12, 1.78, 0, 1.82, -.02);
    add(chassis, boxGeo, bodyMat, 1.90, .68, .14, 0, 1.46, .82); // Rear cab bulkhead
    for (const sx of [-.90, .90]) {
      const aPillar = add(chassis, boxGeo, trimMat, .09, .72, .09, sx, 1.46, -.82);
      aPillar.rotation.x = .22;
      add(chassis, boxGeo, trimMat, .10, .68, .12, sx, 1.46, .02); // B-pillar
      add(chassis, boxGeo, glassMat, .05, .52, 1.48, sx * .98, 1.48, -.02); // Side windows
      add(chassis, boxGeo, trimMat, .21, .035, .04, sx * 1.10, 1.36, -.73);
      add(chassis, boxGeo, trimMat, .17, .14, .09, sx * 1.24, 1.41, -.73);
      add(chassis, boxGeo, rimMat, .13, .105, .012, sx * 1.24, 1.41, -.677); // Side mirrors
    }
    const windshield = add(chassis, boxGeo, glassMat, 1.76, .58, .06, 0, 1.47, -.88);
    windshield.rotation.x = .22;
    for (const x of [-.43,.40]) {
      const blade = add(chassis,boxGeo,trimMat,.53,.016,.016,x,1.29,-.958);
      blade.rotation.z = .07;
    }
    // Roof rack, whip comms antenna & dual-strobe emergency lightbar
    for (const side of [-.73,.73]) add(chassis,boxGeo,trimMat,.045,.055,1.37,side,1.93,.02);
    for (const z of [-.57,.04,.6]) add(chassis,boxGeo,trimMat,1.49,.045,.045,0,1.91,z);
    add(chassis, cylGeo, trimMat, .052, .12, .052, .78, 1.99, .62);
    add(chassis, cylGeo, rimMat, .012, 1.08, .012, .78, 2.58, .62).name = 'roof-whip';
    const leftBar = add(chassis, boxGeo, blueBar, .52, .11, .22, -.42, 1.96, -.22);
    const rightBar = add(chassis, boxGeo, amberBar, .52, .11, .22, .42, 1.96, -.22);
    // Rear cargo bed, tubular rollbar, mounted spare off-road tire & step bumper
    for (const sx of [-.94, .94]) add(chassis, boxGeo, bodyMat, .12, .52, 1.54, sx, 1.32, 1.56);
    add(chassis, boxGeo, bodyMat, 1.98, .50, .12, 0, 1.32, 2.30); // Tailgate
    add(chassis, boxGeo, trimMat, 1.88, .14, .10, 0, 1.82, .96); // Rollbar top
    for (const sx of [-.86, .86]) add(chassis, boxGeo, trimMat, .10, .62, .10, sx, 1.52, .96);
    // Roof Remote Weapon Station (RWS) 12.7mm Heavy Machine Gun Turret (Battlefield-style armed 4x4!)
    const turretMount = new Group();
    turretMount.position.set(0, 1.90, .28);
    add(turretMount, cylGeo, trimMat, .28, .16, .28, 0, .08, 0);
    const turretHead = new Group();
    turretHead.position.set(0, .24, 0);
    add(turretHead, boxGeo, trimMat, .34, .22, .48, 0, 0, 0);
    add(turretHead, boxGeo, stripeMat, .36, .06, .34, 0, .06, .04);
    add(turretHead, cylGeo, rimMat, .042, 1.05, .042, 0, .02, -.72).rotation.x = Math.PI / 2;
    const muzzleFlash = add(turretHead, cushionGeo, amberBar, .11, .11, .18, 0, .02, -1.30);
    muzzleFlash.visible = false;
    turretMount.add(turretHead);
    chassis.add(turretMount);
    const spare = new Mesh(cylGeo, tireMat);
    spare.position.set(0, 1.26, 1.58); spare.rotation.x = .38; spare.scale.set(.38, .26, .38);
    chassis.add(spare);
    add(chassis, boxGeo, trimMat, 2.12, .22, .22, 0, .62, 2.42); // Rear bumper
    // Recessed headlights, fog lamps & taillights
    for (const sx of [-.76, .76]) {
      add(chassis,boxGeo,trimMat,.47,.23,.09,sx,.94,-2.359);
      for (const dx of [-.096,.096]) {
        add(chassis,cylGeo,rimMat,.087,.042,.087,sx+dx,.95,-2.417).rotation.x=Math.PI/2;
        add(chassis,cushionGeo,headGlow,.066,.066,.021,sx+dx,.95,-2.441);
      }
      add(chassis, boxGeo, headGlow, .18, .10, .08, sx * .78, .66, -2.49);
      add(chassis, boxGeo, tailGlow, .30, .18, .08, sx, .96, 2.38);
    }
    // Real high-beam headlight SpotLight (starts OFF when parked to save GPU fragment cost!)
    const headlight = new SpotLight(0xfff1d6, 0, 72, .56, .48, 1.15);
    headlight.position.set(0, 1.08, -2.45);
    const lightTarget = new Group();
    lightTarget.position.set(0, -.5, -18);
    chassis.add(headlight, lightTarget);
    headlight.target = lightTarget;

    // Revolve the tread shoulder and sidewalls around the axle.
    const tireProfile = [[.25,-.115],[.29,-.151],[.38,-.155],[.425,-.13],
      [.45,-.094],[.45,.094],[.425,.13],[.38,.155],[.29,.151],[.25,.115],[.25,-.115]];
    const casing = new THREE.LatheGeometry(tireProfile.map(([r,y]) => new THREE.Vector2(r,y)), 48);
    const lugGeo = new CylinderGeometry(1, 1, 1, 6);
    const wheels = [];
    const wheelPoint = new Vector3();
    for (const [wx, wz, isFront] of [[-1.06, -1.52, true], [1.06, -1.52, true], [-1.06, 1.48, false], [1.06, 1.48, false]]) {
      const side = Math.sign(wx);
      const steerPivot = new Group();
      steerPivot.position.set(wx, .45, wz);
      const spinHub = new Group();
      add(spinHub, casing, tireMat, 1, 1, 1, 0, 0, 0).rotation.z = Math.PI / 2;
      add(spinHub, cylGeo, rimMat, .269, .24, .269, 0, 0, 0).rotation.z = Math.PI / 2;
      add(spinHub, cylGeo, trimMat, .225, .016, .225, side * .122, 0, 0).rotation.z = Math.PI / 2;
      add(spinHub, cylGeo, rimMat, .143, .046, .143, side * .134, 0, 0).rotation.z = Math.PI / 2;
      for (let bolt = 0; bolt < 6; bolt++) {
        const angle = bolt * Math.PI / 3;
        add(spinHub, lugGeo, trimMat, .021, .029, .021, side * .165,
          .099 * Math.cos(angle), .099 * Math.sin(angle)).rotation.z = Math.PI / 2;
      }
      steerPivot.add(spinHub);
      chassis.add(steerPivot);
      wheels.push({ steerPivot, spinHub, isFront });
    }

    // HUD, Enter Prompt & 3D Floating Vehicle Pin (so player can always locate & summon the 4x4!)
    const hud = document.createElement('div');
    hud.className = 'sl-veh-hud';
    hud.hidden = true;
    hud.innerHTML = `
      <div class="sl-veh-spd" data-spd>0 KM/H</div>
      <div class="sl-veh-keys">[左键/J] 车顶机枪 · [F] 下车 · [C] 视角 · [Shift] 涡轮 · [R] 脱困</div>`;
    const promptEl = document.createElement('div');
    promptEl.className = 'sl-veh-prompt';
    promptEl.hidden = true;
    promptEl.textContent = '[F] 驾驶 SAR 四驱车';
    const pinEl = document.createElement('div');
    pinEl.style.cssText = 'position:fixed;z-index:18;transform:translate(-50%,-100%);background:rgba(10,18,24,.82);border:1px solid rgba(92,232,255,.65);border-radius:99px;padding:3px 10px;color:#dff8ff;font:700 11px/1.2 system-ui,sans-serif;pointer-events:none;white-space:nowrap;display:none;box-shadow:0 3px 12px rgba(0,0,0,.45)';
    document.body.append(hud, promptEl, pinEl);
    const spdEl = hud.querySelector('[data-spd]');
    const pinProj = new Vector3();

    // 4-Corner Oriented Bumper Envelope Check (0.62m climb clearance prevents ramp/curb snags)
    const hitsPoint = (px, py, pz, r = .30) => {
      const boxes = physics?.boxes;
      if (!Array.isArray(boxes)) return false;
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        if (!b || b.bulletOnly || b.disabled) continue;
        if (b.max.y <= py + .62 || b.min.y >= py + 2.25) continue;
        if (px + r > b.min.x && px - r < b.max.x && pz + r > b.min.z && pz - r < b.max.z) return true;
      }
      return false;
    };
    const hitsSolidWall = (tx, ty, tz, checkYaw = yaw) => {
      const fx = -Math.sin(checkYaw), fz = -Math.cos(checkYaw);
      const rx = Math.cos(checkYaw), rz = -Math.sin(checkYaw);
      const samples = [
        [0, 0], [fx * 1.98 + rx * .84, fz * 1.98 + rz * .84], [fx * 1.98 - rx * .84, fz * 1.98 - rz * .84],
        [-fx * 1.98 + rx * .84, -fz * 1.98 + rz * .84], [-fx * 1.98 - rx * .84, -fz * 1.98 - rz * .84],
      ];
      for (const [ox, oz] of samples) {
        const sx = tx + ox, sz = tz + oz;
        const localGround = typeof physics?.groundHeight === 'function' ? physics.groundHeight(sx, sz, ty + 1.45) : ty;
        if (hitsPoint(sx, Math.max(ty, localGround), sz, .28)) return true;
      }
      return false;
    };

    // Honor configured startPos first; fall back to clear road only if configured spot is blocked
    const pos = startPos ? startPos.clone() : new Vector3(-26, 0, -20);
    if (hitsSolidWall(pos.x, pos.y, pos.z, startYaw)) pos.set(-26, 0, -36);
    if (hitsSolidWall(pos.x, pos.y, pos.z, startYaw)) pos.set(-48, 0, 5);
    let yaw = startYaw;
    let speed = 0, steerAngle = 0, pitch = 0, roll = 0;
    let driving = false, active = true, lightsOn = true, thirdPerson = true, clock = 0, turretCooldown = 0, flashTimer = 0;
    const camPosSmooth = new Vector3();
    const camLookTarget = new Vector3();
    const muzzleWorld = new Vector3(), aimDir = new Vector3();
    const keys = { w: false, s: false, a: false, d: false, shift: false, space: false, fire: false };
    const visitedZones = new Set();

    root.position.copy(pos);
    root.rotation.y = yaw;

    function toggleDrive(player) {
      if (!player?.alive) return;
      if (driving) {
        keys.fire = false;
        muzzleFlash.visible = false;
        const exits = [-2.4, 2.4].flatMap(side => [0, .95, -.95].map(along => {
          const x = pos.x + Math.cos(yaw) * side + Math.sin(yaw) * along;
          const z = pos.z - Math.sin(yaw) * side + Math.cos(yaw) * along;
          const y = physics?.groundHeight?.(x, z, pos.y + 1.1) ?? pos.y;
          return new Vector3(x, y + .05, z);
        })).filter(p => Math.abs(p.y - pos.y) < 1.35 && !hitsPoint(p.x, p.y, p.z));
        if (!exits.length) return;
        driving = false;
        headlight.intensity = 0;
        speed = 0;
        player.pos.copy(exits[0]);
        player.vel?.set?.(0, 0, 0);
        world.weapon?.setVisible?.(true);
        hud.hidden = true;
        const maraExit = world.berthSlice?.companion;
        if (maraExit?.setSeated) {
          const passengerExit = exits.find(p => p.distanceTo(exits[0]) > .8) ?? exits[0];
          maraExit.setSeated(false, passengerExit, yaw);
        }
      } else if (player.pos.distanceTo(pos) <= 5.2) {
        driving = true;
        headlight.intensity = lightsOn ? 38 : 0;
        world.weapon?.setVisible?.(false);
        hud.hidden = false;
        promptEl.hidden = true;
        const fx0 = -Math.sin(yaw), fz0 = -Math.cos(yaw);
        camPosSmooth.set(pos.x - fx0 * 7.8, pos.y + 3.6, pos.z - fz0 * 7.8);
        world.tactical?.notify?.('🚙 已上车（第三人称追尾视角 · 按 [C] 切换驾驶舱 · [Shift] 涡轮 · [F] 下车）',
          '🚙 Driving SAR 4x4! [C] Toggle 3rd/1st Camera · [Shift] Turbo · [F] Exit', false, 4.8);
      }
    }

    function onKey(e, down) {
      if (!active || !canDrive() || multiplayer !== Boolean(world.mpGadgets?.active)) return;
      if (down && (world.game?.state !== "playing" || world.game?.cinematic?.active || world.game?.arrival)) return;
      if (document.querySelector('.developer-menu[open]') || document.querySelector('.menu.open')) return;
      if (e.code === 'KeyW') keys.w = down;
      else if (e.code === 'KeyS') keys.s = down;
      else if (e.code === 'KeyA') keys.a = down;
      else if (e.code === 'KeyD') keys.d = down;
      else if (e.code === 'KeyJ') keys.fire = down;
      else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = down;
      else if (e.code === 'Space') keys.space = down;
      else if (down && !e.repeat && e.code === 'KeyF' && !e.saltlineVehicleHandled && !world.mpVehicles?.driving) toggleDrive(world.player);
      else if (down && !e.repeat && e.code === 'KeyR' && driving) unstuckVehicle();
      else if (down && !e.repeat && e.code === 'KeyC' && driving) {
        thirdPerson = !thirdPerson;
        world.tactical?.notify?.(thirdPerson ? '🎥 已切换：第三人称追尾驾驶视角' : '🎥 已切换：第一人称驾驶舱视角',
          thirdPerson ? '🎥 Camera: 3rd-Person Chase' : '🎥 Camera: 1st-Person Cockpit', false, 2.0);
      }
      else if (down && !e.repeat && e.code === 'KeyG' && !driving && !multiplayer) {
        if (!summonNear(world.player)) return;
        world.tactical?.notify?.('🚙 已将 SAR 四驱巡逻车召唤至前方空地！按 [F] 登车', '🚙 SAR 4x4 summoned ahead! Press [F] to drive', false, 3.0);
      }
      else if (down && !e.repeat && e.code === 'KeyL' && driving) {
        lightsOn = !lightsOn;
        headlight.intensity = lightsOn ? 38 : 0;
      }
    }
    const kd = e => onKey(e, true);
    const ku = e => onKey(e, false);
    const md = e => {
      if (e.button === 0 && driving && multiplayer === Boolean(world.mpGadgets?.active) && world.game?.state === 'playing' && !document.querySelector('.developer-menu[open]') && !document.querySelector('.menu.open')) keys.fire = true;
    };
    const mu = e => { if (e.button === 0) keys.fire = false; };
    window.addEventListener('keydown', kd, { signal: world.chapterSignal });
    window.addEventListener('keyup', ku, { signal: world.chapterSignal });
    window.addEventListener('mousedown', md, { signal: world.chapterSignal });
    window.addEventListener('mouseup', mu, { signal: world.chapterSignal });

    function unstuckVehicle() {
      const candidates = [
        [pos.x, pos.z],
        [pos.x + 2.4, pos.z], [pos.x - 2.4, pos.z], [pos.x, pos.z + 2.4], [pos.x, pos.z - 2.4],
        [pos.x + 4.5, pos.z], [pos.x - 4.5, pos.z], [pos.x, pos.z + 4.5], [pos.x, pos.z - 4.5],
        [-26, Math.max(-180, Math.min(120, pos.z))],
        [-112, Math.max(-150, Math.min(120, pos.z))],
      ];
      for (const [cx, cz] of candidates) {
        const gy = typeof physics?.groundHeight === 'function' ? physics.groundHeight(cx, cz, pos.y + 1.5) : pos.y;
        if (!hitsSolidWall(cx, gy, cz, yaw)) {
          pos.set(cx, gy, cz); speed = 0; root.position.copy(pos);
          world.tactical?.notify?.('🚙 车辆已脱困至附近畅通路面', '🚙 Vehicle unstuck onto clear road', false, 2.2);
          return;
        }
      }
      pos.set(-26, typeof physics?.groundHeight === 'function' ? physics.groundHeight(-26, -20, 1.5) : 0, -20);
      speed = 0; root.position.copy(pos);
      world.tactical?.notify?.('🚙 车辆已脱困并归位至沿海大道', '🚙 Vehicle recovered to Coastal Blvd', false, 2.4);
    }

    function summonNear(player) {
      if (!active || !player?.pos || driving) return false;
      const pyaw = player.yaw ?? 0;
      const candidates = [
        [player.pos.x - Math.sin(pyaw) * 5.5, player.pos.z - Math.cos(pyaw) * 5.5],
        [player.pos.x + Math.sin(pyaw) * 5.5, player.pos.z + Math.cos(pyaw) * 5.5],
        [player.pos.x + 5.5, player.pos.z], [player.pos.x - 5.5, player.pos.z],
        [player.pos.x, player.pos.z + 5.5], [player.pos.x, player.pos.z - 5.5],
      ];
      for (const c of candidates) {
        const gy = typeof physics?.groundHeight === 'function' ? physics.groundHeight(c[0], c[1], player.pos.y + .9) : player.pos.y;
        if (hitsSolidWall(c[0], gy, c[1], pyaw)) continue;
        pos.set(c[0], gy, c[1]);
        yaw = pyaw;
        speed = 0;
        root.position.copy(pos);
        root.rotation.y = yaw;
        return true;
      }
      return false;
    }

    function update(dt, player) {
      if (!active) return;
      if (!(dt > 0)) return;
      driver.actor.visible = driving && thirdPerson;
      clock += dt;

      // Emergency roof lightbar strobe
      const strobe = Math.sin(clock * 14) > 0;
      leftBar.visible = strobe;
      rightBar.visible = !strobe;

      const menuOpen = Boolean(document.querySelector('.menu.open') || document.querySelector('.developer-menu[open]'));
      if (menuOpen) {
        hud.hidden = true;
        promptEl.hidden = true;
        pinEl.style.display = 'none';
        return;
      }
      if (!driving) {
        hud.hidden = true;
        if (Math.abs(speed) > .05) speed *= Math.exp(-dt * 4); else speed = 0;
        const dist = player?.pos ? player.pos.distanceTo(pos) : 999;
        const near = Boolean(player?.alive && dist <= 5.2);
        promptEl.hidden = !near;
        pinEl.style.display = 'none';
        return;
      }

      hud.hidden = false;
      promptEl.hidden = true;
      pinEl.style.display = 'none';
      const throttle = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
      const steerInput = (keys.a ? 1 : 0) - (keys.d ? 1 : 0);
      const maxSpd = keys.shift ? 54 : 38;
      const isBraking = (throttle > 0 && speed < -1) || (throttle < 0 && speed > 1);
      const accel = isBraking ? 68 : (keys.shift ? 46 : 30);

      if (throttle !== 0) {
        speed += throttle * accel * dt;
      } else {
        speed *= Math.exp(-dt * (keys.space ? 5.8 : 2.8));
      }
      if (keys.space) speed *= Math.exp(-dt * 2.4);
      speed = Math.max(-18, Math.min(maxSpd, speed));

      // Responsive speed-sensitive steering (crisp at low speed, stable at high speed!)
      const highSpeedDamp = 1 / (1 + Math.abs(speed) * .018);
      const targetSteer = steerInput * .62 * highSpeedDamp;
      steerAngle += (targetSteer - steerAngle) * Math.min(1, dt * 13);
      const turnFactor = Math.min(1, Math.abs(speed) / 1.8) * (speed >= 0 ? 1 : -1);
      const driftBoost = keys.space ? 1.55 : 1.0;
      yaw += steerAngle * turnFactor * driftBoost * 2.9 * dt;

      // Forward direction (-sin(yaw), -cos(yaw)) with ramp-aware elevation check & smooth wall sliding
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      let nextX = Math.max(-222, Math.min(23.2, pos.x + fx * speed * dt));
      let nextZ = Math.max(-222, Math.min(144, pos.z + fz * speed * dt));
      const nextY = typeof physics?.groundHeight === 'function' ? physics.groundHeight(nextX, nextZ, pos.y + 1.55) : pos.y;
      const checkY = Math.max(pos.y, nextY);

      if (hitsSolidWall(nextX, checkY, nextZ)) {
        const yX = typeof physics?.groundHeight === 'function' ? physics.groundHeight(nextX, pos.z, pos.y + 1.55) : pos.y;
        const yZ = typeof physics?.groundHeight === 'function' ? physics.groundHeight(pos.x, nextZ, pos.y + 1.55) : pos.y;
        const canX = !hitsSolidWall(nextX, Math.max(pos.y, yX), pos.z);
        const canZ = !hitsSolidWall(pos.x, Math.max(pos.y, yZ), nextZ);
        if (canX) { nextZ = pos.z; speed *= .88; }
        else if (canZ) { nextX = pos.x; speed *= .88; }
        else {
          let freed = false;
          if (throttle !== 0 && hitsSolidWall(pos.x, pos.y, pos.z)) {
            const rx = Math.cos(yaw), rz = -Math.sin(yaw);
            for (const [dx, dz] of [[rx * .55, rz * .55], [-rx * .55, -rz * .55], [-fx * .55, -fz * .55], [fx * .55, fz * .55]]) {
              const cx = pos.x + dx, cz = pos.z + dz;
              const cy = typeof physics?.groundHeight === 'function' ? physics.groundHeight(cx, cz, pos.y + 1.55) : pos.y;
              if (!hitsSolidWall(cx, Math.max(pos.y, cy), cz)) { nextX = cx; nextZ = cz; freed = true; break; }
            }
          }
          if (!freed) { nextX = pos.x; nextZ = pos.z; speed *= -.15; }
        }
      }

      // Smooth ground height sampling for mountain ramp & suspension pitch (4x4 climbs steep slopes smoothly)
      const gNow = typeof physics?.groundHeight === 'function' ? physics.groundHeight(nextX, nextZ, pos.y + 1.55) : pos.y;
      const gFront = typeof physics?.groundHeight === 'function' ? physics.groundHeight(nextX + fx * 1.8, nextZ + fz * 1.8, pos.y + 1.85) : gNow;
      const gRear = typeof physics?.groundHeight === 'function' ? physics.groundHeight(nextX - fx * 1.8, nextZ - fz * 1.8, pos.y + 1.85) : gNow;
      const climbRate = gNow > pos.y ? Math.min(1, dt * 26) : Math.min(1, dt * 18);
      pos.set(nextX, pos.y + (gNow - pos.y) * climbRate, nextZ);
      const targetPitch = Math.atan2(gFront - gRear, 3.6);
      const targetRoll = -steerAngle * Math.min(1, Math.abs(speed) / 18) * .14;
      pitch += (targetPitch - pitch) * Math.min(1, dt * 9);
      roll += (targetRoll - roll) * Math.min(1, dt * 9);

      root.position.copy(pos);
      root.rotation.set(pitch, yaw, roll, 'YXZ');

      // Spin & steer wheels
      for (const w of wheels) {
        wheelPoint.set(w.steerPivot.position.x,.45,w.steerPivot.position.z);
        root.localToWorld(wheelPoint);
        const road = physics?.groundHeight?.(wheelPoint.x,wheelPoint.z,pos.y+.8) ?? pos.y;
        const compression = Math.max(-.05,Math.min(.05,road+.45-wheelPoint.y));
        w.steerPivot.position.y += (.45+compression-w.steerPivot.position.y)*Math.min(1,dt*18);
        w.spinHub.rotation.x -= (speed * dt) / .45;
        if (w.isFront) w.steerPivot.rotation.y = steerAngle;
      }

      // Sync player & smooth 3rd-person chase cam (or 1st-person cockpit via [C])
      if (player?.pos) {
        player.pos.set(pos.x, pos.y + .42, pos.z);
        player.vel?.set?.(0, 0, 0);
        player.yaw = yaw;
        if (world.camera) {
          if (thirdPerson) {
            const chaseDist = 7.4 + Math.min(2.2, Math.abs(speed) * .045);
            const desiredX = pos.x - fx * chaseDist;
            const desiredY = pos.y + 3.45 - Math.sin(pitch) * 1.8;
            const desiredZ = pos.z - fz * chaseDist;
            const lerpA = 1 - Math.exp(-dt * 9.5);
            camPosSmooth.x += (desiredX - camPosSmooth.x) * lerpA;
            camPosSmooth.y += (desiredY - camPosSmooth.y) * lerpA;
            camPosSmooth.z += (desiredZ - camPosSmooth.z) * lerpA;
            world.camera.position.copy(camPosSmooth);
            camLookTarget.set(pos.x + fx * 6.5, pos.y + 1.55 + Math.sin(pitch) * 2.0, pos.z + fz * 6.5);
            world.camera.lookAt(camLookTarget);
          } else {
            world.camera.position.set(-.46,1.62,.21);
            root.localToWorld(world.camera.position);
            world.camera.quaternion.copy(root.quaternion);
            world.camera.rotateX(-.085);
          }
        }
      }

      // Roof RWS 12.7mm Heavy Machine Gun Turret Firing ([Left Click] or [J])
      turretCooldown = Math.max(0, turretCooldown - dt);
      flashTimer = Math.max(0, flashTimer - dt);
      muzzleFlash.visible = flashTimer > 0;
      if (keys.fire && turretCooldown <= 0) {
        turretCooldown = .11;
        flashTimer = .045;
        muzzleFlash.visible = true;
        turretHead.getWorldPosition(muzzleWorld);
        muzzleWorld.y += .18;
        if (world.camera && thirdPerson) world.camera.getWorldDirection(aimDir);
        else aimDir.set(fx, Math.sin(pitch) * .45, fz).normalize();
        world.combat?.playerShot?.(muzzleWorld, aimDir, { damage: 42, range: 185, impulse: 1.4 });
        world.events?.emit?.('vehicle:fire', { origin: muzzleWorld, dir: aimDir });
        fx?.sparks?.(muzzleWorld.clone().addScaledVector(aimDir, 1.3), aimDir, 6);
        audio?.play?.('rail_touchdown', { pos: muzzleWorld, ref: 18, gain: .35, jitter: .14 });
        player?.addShake?.(.06);
      }

      // High-speed ramming combat against enemy Hounds!
      if (Math.abs(speed) > 9) {
        for (const e of world.enemies?.list ?? []) {
          if (!e?.alive || !e.pos) continue;
          if (e.pos.distanceTo(pos) < 2.6) {
            e.damage?.(200, e.pos, new Vector3(fx * 4, 2.2, fz * 4), 'ram');
            fx?.sparks?.(e.pos, new Vector3(0, 1, 0), 22);
            audio?.play?.('rail_touchdown', { pos: e.pos, ref: 14, gain: .75, jitter: .05 });
            player?.addShake?.(.35);
            world.tactical?.notify?.('💥 战术冲撞！已撞毁敌方地面单位！', '💥 Vehicle ram! Hostile unit destroyed!', false, 2.5);
          }
        }
      }

      // Mara companion contextual landmark callouts when entering new biomes
      const mara = world.berthSlice?.companion;
      if (mara) {
        const seatPos = root.localToWorld(new Vector3(.46,.33,.12));
        if (mara.setSeated) mara.setSeated(true, seatPos, yaw + Math.PI);
        else mara.setPosition(seatPos);
        if (pos.z < -42 && !visitedZones.has('city')) {
          visitedZones.add('city');
          mara.speak('玛拉：「冲出港区了！前面是沿海城区主干道——向左进西线大道可爬升 +14m 西岸山地卫星站，往西北直通海岸机场！」',
            'Mara: "Clear of the port! Coastal City Boulevard ahead—head west for the +14m Mountain Comms Ridge, or northwest to the Airfield!"', true);
        } else if (pos.x < -130 && pos.z < -38 && pos.z > -118 && !visitedZones.has('mountain')) {
          visitedZones.add('mountain');
          mara.speak('玛拉：「稳住方向盘，正在爬升西岸盘山公路！+14m 山顶卫星站能俯瞰整片东海并截获沃德频道！」',
            'Mara: "Hold steady up the west ridge! The +14m summit station overlooks the entire East Sea!"', true);
        } else if (pos.z < -150 && !visitedZones.has('airfield')) {
          visitedZones.add('airfield');
          mara.speak('玛拉：「前面就是海岸应急机场跑道和拱形机库——可以把车直接开进机库掩体！」',
            'Mara: "Coastal Airfield runway and arched hangar ahead—you can drive straight inside!"', true);
        }
      }

      spdEl.textContent = `${Math.round(Math.abs(speed) * 3.6)} KM/H`;
    }

    function dispose() {
      window.removeEventListener?.('keydown', kd);
      window.removeEventListener?.('keyup', ku);
      window.removeEventListener?.('mousedown', md);
      window.removeEventListener?.('mouseup', mu);
      if (driving) world.weapon?.setVisible?.(true);
      driving = false;
      root.removeFromParent();
      hud.remove();
      promptEl.remove();
      pinEl.remove();
    }

    function setActive(value) {
      active = Boolean(value);
      root.visible = active;
      if (!active) {
        if (driving) {
          world.weapon?.setVisible?.(true);
          world.berthSlice?.companion?.setSeated?.(false);
        }
        driving = false;
        speed = 0;
        headlight.intensity = 0;
        muzzleFlash.visible = false;
        for (const key of Object.keys(keys)) keys[key] = false;
        hud.hidden = true;
        promptEl.hidden = true;
        pinEl.style.display = 'none';
      }
    }

    function setPosition(newPos) {
      if (!newPos) return;
      pos.copy(newPos);
      speed = 0;
      root.position.copy(pos);
    }

    return {
      update, summonNear, setPosition, setActive, dispose,
      get mesh() { return root; },
      isDriving() { return driving; },
      get driving() { return driving; },
      get pos() { return pos; },
    };
  };
})();
