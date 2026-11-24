/* Berth 4 AAA Vertical Slice:
 * - Mara Chen active companion with traversal banter & character friction
 * - Opening low-altitude SAR-07 chopper flyover + coastal storm flares
 * - Signature Interactive Set Piece: Anvil Armed Gunship Sweep & Real-Time 3D Gantry Crane Collapse
 * - Extraction Cutter storm approach & South Ladder defense climax */
(() => {
  window.createBerthVerticalSlice = (world, { berth, onRadio = null } = {}) => {
    if (!berth || !window.createCinematicSequencer) return null;
    const { THREE, scene, physics, fx, audio } = world;
    const { Group, Mesh, BoxGeometry, CylinderGeometry, ConeGeometry, SphereGeometry,
      MeshStandardMaterial, MeshBasicMaterial, PointLight, Vector3 } = THREE;

    const sequencer = window.createCinematicSequencer();
    const root = new Group();
    root.name = 'berth-vertical-slice-root';
    scene.add(root);

    // 1. Active Companion AI — Mara Chen joins Lin near West Gate
    const companion = window.createPortCompanionAI?.(world, {
      name: 'Mara Chen',
      role: 'engineer',
      startPos: new Vector3(-28.5, 0, 7.6),
      onSpeak(en, zh) {
        if (onRadio) onRadio([en, zh], 6.5);
        else world.tactical?.notify?.(zh, en, false, 5.5);
      },
    }) ?? null;

    // 2. Towering 18m Central Yard Gantry Crane (collapses in real time during Gunship Ambush!)
    const steelYellow = new MeshStandardMaterial({ color: 0xd69624, roughness: .48, metalness: .42 });
    const steelDark = new MeshStandardMaterial({ color: 0x262d30, roughness: .54, metalness: .65 });
    const hazardRed = new MeshStandardMaterial({ color: 0xc93826, roughness: .46, metalness: .35 });
    const cranePivot = new Group();
    cranePivot.name = 'berth-collapsible-gantry-crane';
    // Placed along the north-east container corridor so it dramatically falls across the central lane
    cranePivot.position.set(14.5, 0, 1.5);
    root.add(cranePivot);

    function addPart(parent, geo, mat, sx, sy, sz, x, y, z) {
      const m = new Mesh(geo, mat);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      m.castShadow = m.receiveShadow = true;
      parent.add(m);
      return m;
    }
    const boxGeo = new BoxGeometry(1, 1, 1);
    const cylGeo = new CylinderGeometry(1, 1, 1, 16);

    // Crane base tower & legs
    for (const lx of [-1.4, 1.4]) for (const lz of [-1.4, 1.4]) {
      addPart(cranePivot, boxGeo, steelYellow, .38, 13.5, .38, lx, 6.75, lz);
    }
    for (let y = 2.2; y <= 12.2; y += 2.5) {
      addPart(cranePivot, boxGeo, steelDark, 3.0, .22, .22, 0, y, -1.4);
      addPart(cranePivot, boxGeo, steelDark, 3.0, .22, .22, 0, y, 1.4);
      addPart(cranePivot, boxGeo, steelDark, .22, .22, 3.0, -1.4, y, 0);
      addPart(cranePivot, boxGeo, steelDark, .22, .22, 3.0, 1.4, y, 0);
    }
    // Operator cab & massive 16m horizontal jib boom
    addPart(cranePivot, boxGeo, steelDark, 2.4, 2.1, 2.2, 0, 13.8, 1.6);
    addPart(cranePivot, boxGeo, steelYellow, 1.6, 1.2, 16.5, 0, 14.8, 3.2);
    addPart(cranePivot, boxGeo, hazardRed, 2.4, 1.5, 2.8, 0, 14.6, -5.8);
    // Suspended container spreader hanging under the jib
    addPart(cranePivot, boxGeo, steelDark, 2.5, 2.4, 5.2, 0, 9.5, 7.2);
    const craneBeacon = new Mesh(new SphereGeometry(.22, 10, 8), new MeshBasicMaterial({ color: 0xff3d24 }));
    craneBeacon.position.set(0, 16.0, 11.0);
    cranePivot.add(craneBeacon);

    // 3. Anvil Armed Interceptor Gunship (3D attack/utility helicopter with crimson searchlight & tracers)
    const gunship = new Group();
    gunship.name = 'anvil-interceptor-gunship';
    gunship.visible = false;
    root.add(gunship);

    const gunHull = new MeshStandardMaterial({ color: 0x1d2326, roughness: .42, metalness: .68 });
    const gunAccent = new MeshStandardMaterial({ color: 0x99241b, roughness: .48, metalness: .42 });
    const gunGlass = new MeshStandardMaterial({ color: 0x0b151c, roughness: .1, metalness: .92 });
    addPart(gunship, boxGeo, gunHull, 2.3, 1.85, 8.2, 0, 0, 0);
    addPart(gunship, boxGeo, gunGlass, 1.9, 1.05, 2.2, 0, .25, 3.8);
    addPart(gunship, boxGeo, gunAccent, 5.4, .28, 1.25, 0, -.15, .6); // Stub weapon wings
    addPart(gunship, cylGeo, steelDark, .35, 1.9, .35, -2.2, -.45, 1.0).rotation.x = Math.PI / 2;
    addPart(gunship, cylGeo, steelDark, .35, 1.9, .35, 2.2, -.45, 1.0).rotation.x = Math.PI / 2;
    addPart(gunship, boxGeo, gunHull, .65, .75, 6.4, 0, .35, -6.2); // Tail boom
    addPart(gunship, boxGeo, gunAccent, .22, 2.3, 1.35, 0, 1.35, -9.2); // Tail fin
    const mainRotor = new Group();
    mainRotor.position.set(0, 1.28, .2);
    addPart(mainRotor, boxGeo, steelDark, 12.2, .06, .34, 0, 0, 0);
    addPart(mainRotor, boxGeo, steelDark, .34, .06, 12.2, 0, 0, 0);
    gunship.add(mainRotor);
    // Crimson targeting spotlight cone
    const coneMat = new MeshBasicMaterial({ color: 0xff2b1f, transparent: true, opacity: .24, depthWrite: false });
    const searchCone = new Mesh(new ConeGeometry(3.8, 22, 18, 1, true), coneMat);
    searchCone.position.set(0, -11.2, 3.2);
    searchCone.rotation.x = .24;
    gunship.add(searchCone);
    const gunLight = new PointLight(0xff3524, 38, 36, 1.4);
    gunLight.position.set(0, -1.6, 3.5);
    gunship.add(gunLight);

    // Active tracers & dynamic wreck colliders
    const gunTracers = [];
    const tracerGeo = new CylinderGeometry(.045, .045, 1, 6);
    const tracerMat = new MeshBasicMaterial({ color: 0xff6e2a });
    const wreckColliders = [];
    const up = new Vector3(0, 1, 0);

    function fireGunshipBurst(targetPos) {
      const origin = gunship.position.clone().add(new Vector3(0, -.9, 2.4));
      for (let i = 0; i < 3; i++) {
        const hit = targetPos.clone().add(new Vector3((Math.random() - .5) * 2.4, (Math.random() - .5) * 1.8, (Math.random() - .5) * 2.4));
        const dir = hit.clone().sub(origin);
        const mesh = new Mesh(tracerGeo, tracerMat.clone());
        mesh.position.lerpVectors(origin, hit, .5);
        mesh.scale.set(1, dir.length(), 1);
        mesh.quaternion.setFromUnitVectors(up, dir.normalize());
        root.add(mesh);
        gunTracers.push({ mesh, life: .18 });
        fx?.sparks?.(hit, up, 16);
      }
      audio?.play?.('rail_touchdown', { pos: targetPos, ref: 26, gain: .82, jitter: .08 });
      world.player?.addShake?.(.28);
    }

    // 4. Signature Interactive Set Piece: Anvil Gunship Sweep & Real-Time Gantry Crane Collapse
    let climaxTriggered = false;
    function triggerClimaxSetPiece() {
      if (climaxTriggered && sequencer.isPlaying('berth-gunship-collapse')) return false;
      climaxTriggered = true;
      cranePivot.rotation.set(0, 0, 0);
      gunship.visible = true;

      const strikePoint = new Vector3(14.5, 9.5, 4.5);
      const crashImpact = new Vector3(14.5, 1.2, 11.5);

      sequencer.play({
        id: 'berth-gunship-collapse',
        duration: 18.5,
        cues: [
          {
            at: .1,
            run: () => {
              world.tactical?.notify?.('🚨 铁砧武装炮艇低空突入四号泊位！注意红色激光扫射区！',
                '🚨 ANVIL ARMED GUNSHIP INBOUND OVER BERTH 4! Watch the red targeting sweep!', true, 5.5);
              companion?.speak('玛拉：「抬头！铁砧的武装炮艇进港封锁了——别待在空地上，找集装箱掩体！」',
                'Mara: "Eyes up! Anvil gunship sweeping Berth 4—stay off the open lane!"', true);
            },
          },
          { at: 4.4, run: () => fireGunshipBurst(strikePoint) },
          { at: 5.2, run: () => fireGunshipBurst(strikePoint.clone().add(new Vector3(0, -2, 1.5))) },
          { at: 6.1, run: () => fireGunshipBurst(strikePoint.clone().add(new Vector3(0, 2, -1))) },
          {
            at: 6.8,
            run: () => {
              companion?.speak('玛拉：「他们打断了龙门吊主钢缆！快闪开——龙门吊要塌了！」',
                'Mara: "They severed the gantry crane cables! Move—it’s coming down!"', true);
              fx?.sparks?.(strikePoint, up, 40);
              audio?.play?.('rail_touchdown', { pos: strikePoint, ref: 32, gain: .95, jitter: 0 });
            },
          },
          {
            at: 10.2,
            run: () => {
              // Massive crane touchdown impact!
              fx?.smoke?.(crashImpact, { size: 5.8, life: 9.0, color: 0x26221e, alpha: .72, rise: 1.1, count: 14 });
              fx?.sparks?.(crashImpact, up, 52);
              fx?.debris?.(crashImpact, { count: 24 });
              audio?.play?.('rail_touchdown', { pos: crashImpact, ref: 38, gain: 1.0, jitter: 0 });
              world.player?.addShake?.(.85);
              // Dynamically reshape yard collision along the collapsed jib
              if (physics?.addBox && !wreckColliders.length) {
                wreckColliders.push(physics.addBox(new Vector3(12.8, 0, 8.2), new Vector3(16.2, 2.4, 15.2), { surface: 'metal' }));
              }
              world.tactical?.notify?.('💥 龙门吊轰然倒塌切断中路！沿右侧残骸冲向南端接应艇！',
                '💥 GANTRY CRANE COLLAPSED! Flank around the burning wreck to the South Ladder!', true, 6.0);
              companion?.moveTo(new Vector3(26.5, 0, 15.5));
            },
          },
          {
            at: 14.0,
            run: () => {
              companion?.speak('玛拉：「接应艇已经冲进南端航道了！我掩护你，全速撤到南梯登船！」',
                'Mara: "The extraction cutter is racing into the south slip! I’ll cover—sprint for the ladder!"', true);
            },
          },
        ],
        tracks: [
          // Gunship dramatic banking pass over the harbor
          {
            start: 0, end: 18.0,
            update(raw, eased, dt) {
              mainRotor.rotation.y += dt * 32;
              const x = -22 + raw * 88;
              const y = 21 - Math.sin(raw * Math.PI) * 7.5;
              const z = -26 + Math.sin(raw * Math.PI * 1.15) * 32;
              gunship.position.set(x, y, z);
              gunship.lookAt(14.5, 4, 4.5);
              gunship.rotation.z = -.24 * Math.sin(raw * Math.PI);
            },
          },
          // Real-time 3D Gantry Crane collapse physics curve (accelerating gravity fall + bounce!)
          {
            start: 6.8, end: 10.6,
            update(raw) {
              const fall = raw < .88 ? Math.pow(raw / .88, 2.3) : 1 - Math.sin(((raw - .88) / .12) * Math.PI) * .04;
              cranePivot.rotation.x = fall * (Math.PI / 2 - .12);
              cranePivot.rotation.z = fall * .08;
            },
          },
        ],
        onComplete: () => {
          gunship.visible = false;
        },
      });
      return true;
    }

    // 5. Contextual Traversal Story Beats (character friction, mystery, stakes)
    const storyBeats = new Set();
    let introClock = 0;
    let lastBerthPhase = null;

    function update(dt, { player, berthPhase } = {}) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      introClock += dt;
      sequencer.update(dt);
      companion?.update(dt, player);

      // Update gunship tracers
      for (let i = gunTracers.length - 1; i >= 0; i--) {
        gunTracers[i].life -= dt;
        if (gunTracers[i].life <= 0) {
          root.remove(gunTracers[i].mesh);
          gunTracers[i].mesh.material.dispose();
          gunTracers.splice(i, 1);
        }
      }

      // Opening atmosphere dialogue with Mara Chen (replaces silent prototype walking)
      if (!storyBeats.has('intro-1') && introClock > 2.2) {
        storyBeats.add('intro-1');
        companion?.speak('玛拉：「林恩？指挥部说十七个夜班工人都离港了——你真信沃德那套说辞？跟我进 1 号货仓，自己看点名表。」',
          'Mara: "Lin? Ward logged all seventeen night-shift workers as departed. You really buy that? Follow me past Warehouse 1."', true);
      }

      if (player?.pos) {
        // Trigger character dialogue when approaching Warehouse 1 or 2F Port Ops Tower
        if (!storyBeats.has('shed-near') && player.pos.z < -11 && player.pos.x > -18 && player.pos.x < 12) {
          storyBeats.add('shed-near');
          companion?.speak('玛拉：「1 号货仓里还留着备用配电总闸。拉掉它就能瘫痪东区探照灯，或者直接打爆货场里的燃料桶清场。」',
            'Mara: "Warehouse 1 still runs the quay breaker. Cut it to kill the searchlights, or shoot those fuel drums."', true);
        }
        if (!storyBeats.has('tower-near') && player.pos.x < -36 && player.pos.z < -12) {
          storyBeats.add('tower-near');
          companion?.speak('玛拉：「左前方是两层联合作战指挥楼——走外侧钢梯上二层可以俯瞰整个货场。」',
            'Mara: "That’s the two-story Port Ops Tower ahead—take the steel stairs to 2F for a full overlook."', true);
        }
      }

      // Phase-driven narrative & automatic climax trigger
      if (berthPhase && berthPhase !== lastBerthPhase) {
        lastBerthPhase = berthPhase;
        if (berthPhase === 'archive' && !storyBeats.has('phase-archive')) {
          storyBeats.add('phase-archive');
          companion?.speak('玛拉：「值班板上的签字时间是 05:34，可系统显示他们 05:31 就离港了！快横穿货场去西调度站拿原件！」',
            'Mara: "Signed at 05:34, yet the registry says departed at 05:31! Move to West Dispatch for the originals!"', true);
        } else if (berthPhase === 'extract' && !climaxTriggered) {
          triggerClimaxSetPiece();
        }
      }
    }

    function dispose() {
      sequencer.stopAll();
      companion?.dispose?.();
      for (const box of wreckColliders.splice(0)) physics?.removeBox?.(box);
      for (const tr of gunTracers.splice(0)) { root.remove(tr.mesh); tr.mesh.material.dispose(); }
      root.removeFromParent();
    }

    return {
      update, dispose, triggerClimaxSetPiece,
      get companion() { return companion; },
    };
  };
})();
