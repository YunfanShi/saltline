/* IRONFRONT-ported Multiplayer Tactical Squad AI, Commander Intelligence,
 * J/K Tactical Recommendations, 30s Downed/Bleedout & Medic Rescue, and 8s Regen. */
(() => {
  'use strict';

  const VISUAL_DECAY_S = 24;
  const OBJECTIVE_DECAY_S = 60;
  const COMMANDER_INTERVAL_S = 4;
  const COMMIT_WINDOW_S = 12;
  const RECOMMEND_COOLDOWN_S = 45;
  const BLEEDOUT_S = 30;
  const REGEN_DELAY_S = 8;
  const REGEN_RATE_HP_S = 25;

  const dist2D = (a, b) => Math.hypot((a.x ?? 0) - (b.x ?? 0), (a.z ?? 0) - (b.z ?? 0));

  /** Pure logic Commander + Intelligence ported from IRONFRONT Commander.ts & Intelligence.ts */
  function createPortTacticalCommander(team = 'blue') {
    const reports = [];
    let assignment = null;
    let recommendation = null;
    let lastDecision = -99;
    let decisions = 0;

    function prune(now) {
      for (let i = reports.length - 1; i >= 0; i--) {
        const r = reports[i];
        const ttl = r.kind === 'OBJECTIVE_STATUS' ? OBJECTIVE_DECAY_S : VISUAL_DECAY_S;
        const age = now - r.atTime;
        if (age >= ttl) reports.splice(i, 1);
        else r.confidenceNow = Math.max(0, 1 - age / ttl);
      }
    }

    function reportObjective(now, point) {
      const idx = reports.findIndex(r => r.kind === 'OBJECTIVE_STATUS' && r.subject === point.id);
      const entry = {
        kind: 'OBJECTIVE_STATUS',
        subject: point.id,
        owner: point.owner,
        contested: Boolean(point.contested),
        at: { x: point.pos.x, z: point.pos.z },
        atTime: now,
        confidenceNow: 1,
      };
      if (idx >= 0) reports[idx] = entry;
      else reports.push(entry);
    }

    function reportEnemy(now, pos, id) {
      const idx = reports.findIndex(r => r.kind === 'ENEMY_OBSERVED' && r.subject === id);
      const entry = {
        kind: 'ENEMY_OBSERVED',
        subject: id,
        at: { x: pos.x, z: pos.z },
        atTime: now,
        confidenceNow: 1,
      };
      if (idx >= 0) reports[idx] = entry;
      else reports.push(entry);
    }

    function evaluate(now, points, squadSummary, tickets, opposingTickets) {
      if (now - lastDecision < COMMANDER_INTERVAL_S && assignment) return assignment;
      prune(now);
      lastDecision = now;
      decisions++;

      const previous = assignment;
      let best = null;
      for (const p of points) {
        if (p.locked) continue;
        const known = reports.find(r => r.kind === 'OBJECTIVE_STATUS' && r.subject === p.id && r.confidenceNow > 0.2);
        const pressure = reports
          .filter(r => r.kind === 'ENEMY_OBSERVED' && dist2D(r.at, p.pos) < 30)
          .reduce((sum, r) => sum + r.confidenceNow, 0);
        const own = known?.owner === team;
        let mission = !known ? 'RECON_OBJECTIVE' : own ? (known.contested ? 'REINFORCE_OBJECTIVE' : 'DEFEND_OBJECTIVE') : 'CAPTURE_OBJECTIVE';
        const need = !known ? 3.1 : own ? (known.contested ? 7.0 : -1.5) : 5.0;
        let score = need - dist2D(squadSummary.at, p.pos) * 0.015 + pressure * (own ? 0.6 : -0.12) +
          (tickets < opposingTickets && !own ? 0.6 : 0);
        if (previous?.objective === p.id) score += 1.2;
        if (squadSummary.members < 2 || squadSummary.health < 0.35) {
          mission = 'REGROUP';
          score = own ? 7.0 - dist2D(squadSummary.at, p.pos) * 0.015 : score - 3.0;
        }
        const reasonEn = !known ? 'Intel gap — recon objective'
          : squadSummary.members < 2 ? 'Squad casualties — regroup'
          : own ? (known.contested ? 'Friendly point under pressure — reinforce' : 'Hold perimeter and flank watch')
          : 'Capture point to slow ticket bleed';
        const reasonZh = !known ? '情报不足，侦察据点'
          : squadSummary.members < 2 ? '小队伤亡，重新集结'
          : own ? (known.contested ? '友军据点受压，请增援' : '保持据点与侧翼警戒')
          : '夺取据点以减缓兵力损失';
        if (!best || score > best.score) {
          best = { objective: p.id, short: p.short, mission, score, reasonEn, reasonZh, since: now };
        }
      }
      if (!best) return assignment;

      const urgentContested = previous && reports.some(
        r => r.kind === 'OBJECTIVE_STATUS' && r.subject === previous.objective && r.contested && r.confidenceNow > 0.5
      );
      if (previous && now - previous.since < COMMIT_WINDOW_S && squadSummary.members >= 2 && !urgentContested) {
        const stillValid = points.some(p => p.id === previous.objective && !p.locked);
        if (stillValid) best = previous;
      }
      if (previous?.objective === best.objective && previous.mission === best.mission) {
        best.since = previous.since;
      }
      assignment = best;

      if (!recommendation || now >= recommendation.expires) {
        recommendation = {
          objective: best.objective,
          short: best.short,
          mission: best.mission,
          reasonEn: best.reasonEn,
          reasonZh: best.reasonZh,
          expires: now + RECOMMEND_COOLDOWN_S,
          status: 'offered',
        };
      } else if (recommendation.status === 'accepted' && best.mission !== 'REGROUP') {
        const targetPt = points.find(p => p.id === recommendation.objective && !p.locked);
        if (targetPt) {
          assignment = {
            ...best,
            objective: targetPt.id,
            short: targetPt.short,
            mission: recommendation.mission,
            reasonEn: 'Player-accepted order',
            reasonZh: '玩家接受的任务',
            since: previous?.since ?? now,
          };
        }
      }
      return assignment;
    }

    function respond(accept) {
      if (!recommendation || recommendation.status !== 'offered') return false;
      recommendation.status = accept ? 'accepted' : 'dismissed';
      if (accept && assignment) {
        assignment.objective = recommendation.objective;
        assignment.short = recommendation.short;
        assignment.mission = recommendation.mission;
      }
      return true;
    }

    return {
      reportObjective,
      reportEnemy,
      evaluate,
      respond,
      get assignment() { return assignment; },
      get recommendation() { return recommendation; },
      get decisions() { return decisions; },
    };
  }

  /** Full 3D Allied Tactical Squad + Downed/Bleedout + 8s Regen controller for Saltline Multiplayer */
  function createPortMultiplayerSquad(world, { getConquest, getSpawnPos, onRevive, onBleedout } = {}) {
    const { THREE, scene, physics, fx, audio } = world;
    const { Group, Mesh, CylinderGeometry, MeshBasicMaterial, Vector3 } = THREE;
    const t = (en, zh) => window.SaltlineLocale?.t(en, zh) ?? en;

    const root = new Group();
    root.name = 'port-mp-squad';
    scene.add(root);

    const commander = createPortTacticalCommander('blue');
    const tracerGeo = new CylinderGeometry(0.015, 0.015, 1, 6);
    const tracerMat = new MeshBasicMaterial({ color: 0x72e4ff, transparent: true, opacity: 0.9 });
    const tracers = [];
    const up = new Vector3(0, 1, 0);
    const stepVec = new Vector3();
    const probe = new Vector3();

    // 3 realistic AI squadmates + 1 human player = IRONFRONT 4-member squad
    const SQUAD_SPECS = [
      { id: 'sq-medic', callsign: 'Doc Reyes', role: 'medic', coat: 0x2c5e7a, variation: 0, offset: [2.4, -1.8] },
      { id: 'sq-support', callsign: 'Vance', role: 'support', coat: 0x3b6073, variation: 1, offset: [-2.4, -2.0] },
      { id: 'sq-recon', callsign: 'Kestrel', role: 'recon', coat: 0x35505e, variation: 2, offset: [0.2, -3.4] },
    ];

    const members = SQUAD_SPECS.map((spec, idx) => {
      const container = new Group();
      container.name = spec.id;
      let human = null;
      if (window.createSaltlineHuman) {
        human = window.createSaltlineHuman(THREE, {
          name: spec.id,
          role: spec.role === 'medic' ? 'medic' : spec.role === 'recon' ? 'scout' : 'engineer',
          coat: spec.coat,
          variation: spec.variation,
        });
        container.add(human.actor);
      }
      root.add(container);
      return {
        ...spec,
        index: idx,
        container,
        human,
        pos: new Vector3(),
        yaw: 0,
        hp: 100,
        maxHp: 100,
        alive: false,
        respawnAt: 0,
        stride: 0,
        age: idx * 1.1,
        fireCooldown: 0.4 * idx,
        reviveProgress: 0,
      };
    });

    // Commander Recommendation & Downed Bleedout HUD elements
    const recEl = document.createElement('div');
    recEl.className = 'port-mp-recommend';
    recEl.dataset.noLocalize = '';
    recEl.hidden = true;
    recEl.style.cssText = 'position:fixed;left:50%;top:82px;transform:translateX(-50%);z-index:24;background:rgba(10,16,22,.9);border:1px solid #ffb347;border-left:4px solid #ffb347;color:#eef6f8;padding:8px 14px;font:600 13px/1.35 system-ui,-apple-system,sans-serif;display:flex;align-items:center;gap:12px;box-shadow:0 6px 20px rgba(0,0,0,.45);max-width:min(92vw,540px);pointer-events:auto;';
    const recText = document.createElement('span');
    const recAccept = document.createElement('button');
    recAccept.type = 'button';
    recAccept.style.cssText = 'background:#ffb347;color:#0b0d0f;border:0;padding:4px 10px;font:700 12px system-ui;cursor:pointer;';
    const recDismiss = document.createElement('button');
    recDismiss.type = 'button';
    recDismiss.style.cssText = 'background:transparent;color:#cbd5da;border:1px solid #5a6d76;padding:4px 10px;font:600 12px system-ui;cursor:pointer;';
    recEl.append(recText, recAccept, recDismiss);

    const downedEl = document.createElement('div');
    downedEl.className = 'port-mp-downed';
    downedEl.dataset.noLocalize = '';
    downedEl.hidden = true;
    downedEl.style.cssText = 'position:fixed;left:50%;bottom:18%;transform:translateX(-50%);z-index:28;background:rgba(28,8,8,.92);border:1px solid #ff5a40;border-top:3px solid #ff5a40;color:#ffeae6;padding:12px 18px;font:600 13px/1.4 system-ui,-apple-system,sans-serif;text-align:center;min-width:min(90vw,360px);box-shadow:0 8px 28px rgba(0,0,0,.6);pointer-events:auto;';
    const downedTitle = document.createElement('div');
    downedTitle.style.cssText = 'font:800 17px/1.2 system-ui;letter-spacing:.08em;color:#ff796a;margin-bottom:6px;';
    const downedBarWrap = document.createElement('div');
    downedBarWrap.style.cssText = 'height:6px;background:rgba(255,255,255,.15);margin:6px 0 8px;overflow:hidden;';
    const downedBar = document.createElement('div');
    downedBar.style.cssText = 'height:100%;width:100%;background:#ff5a40;transition:width .1s linear;';
    downedBarWrap.append(downedBar);
    const downedSub = document.createElement('div');
    downedSub.style.cssText = 'font-size:12px;color:#f3d2cc;margin-bottom:8px;';
    const downedActions = document.createElement('div');
    downedActions.style.cssText = 'display:flex;justify-content:center;gap:10px;';
    const btnCallMedic = document.createElement('button');
    btnCallMedic.type = 'button';
    btnCallMedic.style.cssText = 'background:#64d5ff;color:#081016;border:0;padding:5px 12px;font:700 12px system-ui;cursor:pointer;';
    const btnGiveUp = document.createElement('button');
    btnGiveUp.type = 'button';
    btnGiveUp.style.cssText = 'background:#3d1915;color:#ffd0c8;border:1px solid #ff5a40;padding:5px 12px;font:600 12px system-ui;cursor:pointer;';
    downedActions.append(btnCallMedic, btnGiveUp);
    downedEl.append(downedTitle, downedBarWrap, downedSub, downedActions);

    const appEl = document.getElementById('app');
    if (appEl) appEl.append(recEl, downedEl);

    let active = false;
    let downed = false;
    let bleedoutRemaining = 0;
    let medicCalled = false;
    let spaceHeld = false;
    let lastCombatAt = 0;
    let lastHealth = 100;
    let enabledAI = true;

    function spawnMember(member, basePos) {
      const x = basePos.x + member.offset[0];
      const z = basePos.z + member.offset[1];
      const y = typeof physics?.groundHeight === 'function' ? physics.groundHeight(x, z, (basePos.y ?? 0) + 1) : (basePos.y ?? 0);
      member.pos.set(x, y, z);
      member.hp = member.maxHp;
      member.alive = true;
      member.container.visible = true;
      member.container.position.copy(member.pos);
    }

    function start(basePos, { aiEnabled = true } = {}) {
      active = true;
      enabledAI = aiEnabled;
      downed = false;
      bleedoutRemaining = 0;
      medicCalled = false;
      downedEl.hidden = true;
      recEl.hidden = true;
      lastCombatAt = 0;
      lastHealth = world.player?.health ?? 100;
      for (const m of members) {
        if (enabledAI) spawnMember(m, basePos);
        else {
          m.alive = false;
          m.container.visible = false;
        }
      }
    }

    function stop() {
      active = false;
      downed = false;
      downedEl.hidden = true;
      recEl.hidden = true;
      for (const m of members) {
        m.alive = false;
        m.container.visible = false;
      }
    }

    function enterDowned() {
      if (!active || downed) return false;
      downed = true;
      bleedoutRemaining = BLEEDOUT_S;
      medicCalled = false;
      downedEl.hidden = false;
      world.weapon?.setVisible?.(false);
      return true;
    }

    function revivePlayer(byName) {
      if (!downed) return;
      downed = false;
      bleedoutRemaining = 0;
      medicCalled = false;
      downedEl.hidden = true;
      const p = world.player;
      if (p) {
        p.alive = true;
        p.health = Math.max(65, p.health || 0);
        p.enabled = true;
      }
      world.weapon?.setVisible?.(true);
      world.hud?.message?.(
        t(`Revived by ${byName || 'Medic'}`, `已被 ${byName || '医疗兵'} 救起`),
        2.5
      );
      onRevive?.(byName);
    }

    function triggerBleedout() {
      if (!downed) return;
      downed = false;
      bleedoutRemaining = 0;
      downedEl.hidden = true;
      onBleedout?.();
    }

    function callMedic() {
      if (!downed) return;
      medicCalled = true;
      world.hud?.message?.(t('Calling nearby Medic for rescue…', '正在呼叫附近医疗兵前来救援…'), 2.2);
    }

    function handleRecommendation(accept) {
      if (!active) return;
      if (!commander.respond(accept)) return;
      recEl.hidden = true;
      const rec = commander.recommendation;
      if (accept && rec) {
        world.hud?.message?.(
          t(`Order accepted: Squad advancing on ${rec.short}`, `已接受指令：友军小队正推进至 ${rec.short} 点`),
          2.6
        );
      }
    }

    recAccept.addEventListener('click', () => handleRecommendation(true));
    recDismiss.addEventListener('click', () => handleRecommendation(false));
    btnCallMedic.addEventListener('click', callMedic);
    btnGiveUp.addEventListener('click', triggerBleedout);

    const onKeyDown = e => {
      if (!active || e.ctrlKey || e.altKey || e.metaKey ||
        /^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName)) return;
      if (e.code === 'KeyJ' && !e.repeat) {
        if (commander.recommendation?.status === 'offered') {
          e.preventDefault();
          handleRecommendation(true);
        }
      } else if (e.code === 'KeyK' && !e.repeat) {
        if (commander.recommendation?.status === 'offered') {
          e.preventDefault();
          handleRecommendation(false);
        }
      } else if (downed) {
        if (e.code === 'KeyH' && !e.repeat) {
          e.preventDefault();
          callMedic();
        } else if (e.code === 'Space') {
          spaceHeld = true;
        }
      }
    };
    const onKeyUp = e => {
      if (e.code === 'Space') spaceHeld = false;
    };
    window.addEventListener('keydown', onKeyDown, { signal: world.chapterSignal });
    window.addEventListener('keyup', onKeyUp, { signal: world.chapterSignal });

    world.events?.on?.('weapon:fire', () => {
      const c = getConquest?.();
      if (c) lastCombatAt = c.elapsed;
    });

    function spawnTracer(from, to) {
      const dir = to.clone().sub(from);
      const len = Math.max(0.2, dir.length());
      const beam = new Mesh(tracerGeo, tracerMat.clone());
      beam.position.lerpVectors(from, to, 0.5);
      beam.scale.set(1, len, 1);
      beam.quaternion.setFromUnitVectors(up, dir.normalize());
      scene.add(beam);
      tracers.push({ mesh: beam, life: 0.1 });
    }

    function steerToward(member, target, dt, speed) {
      stepVec.subVectors(target, member.pos);
      stepVec.y = 0;
      const d = stepVec.length();
      if (d < 0.35) return false;
      stepVec.divideScalar(d);
      let mx = stepVec.x, mz = stepVec.z;
      if (physics?.nav?.clearLine) {
        probe.set(member.pos.x + mx * 1.1, member.pos.y, member.pos.z + mz * 1.1);
        if (!physics.nav.clearLine(member.pos, probe)) {
          let found = false;
          for (const ang of [0.7, -0.7, 1.3, -1.3]) {
            const cx = mx * Math.cos(ang) - mz * Math.sin(ang);
            const cz = mx * Math.sin(ang) + mz * Math.cos(ang);
            probe.set(member.pos.x + cx * 1.1, member.pos.y, member.pos.z + cz * 1.1);
            if (physics.nav.clearLine(member.pos, probe)) {
              mx = cx; mz = cz; found = true; break;
            }
          }
          if (!found) return false;
        }
      }
      const step = Math.min(d, speed * dt);
      member.pos.x += mx * step;
      member.pos.z += mz * step;
      if (typeof physics?.groundHeight === 'function') {
        member.pos.y = physics.groundHeight(member.pos.x, member.pos.z, member.pos.y + 0.7);
      }
      const aimYaw = Math.atan2(mx, mz);
      const diff = Math.atan2(Math.sin(aimYaw - member.yaw), Math.cos(aimYaw - member.yaw));
      member.yaw += diff * Math.min(1, dt * 8);
      member.stride += step * 5.0;
      return true;
    }

    function update(dt, player, enemies) {
      if (!active || !(dt > 0)) return;
      const conquest = getConquest?.();
      if (!conquest || conquest.winner) {
        recEl.hidden = true;
        downedEl.hidden = true;
        return;
      }

      // Update tracers
      for (let i = tracers.length - 1; i >= 0; i--) {
        tracers[i].life -= dt;
        tracers[i].mesh.material.opacity = Math.max(0, tracers[i].life / 0.1);
        if (tracers[i].life <= 0) {
          scene.remove(tracers[i].mesh);
          tracers[i].mesh.material.dispose();
          tracers.splice(i, 1);
        }
      }

      // 8-second out-of-combat health regeneration (IRONFRONT standard)
      if (!downed && player?.alive) {
        if (player.health < lastHealth) lastCombatAt = conquest.elapsed;
        lastHealth = player.health;
        if (player.health < player.maxHealth && conquest.elapsed - lastCombatAt >= REGEN_DELAY_S) {
          player.heal?.(REGEN_RATE_HP_S * dt);
          lastHealth = player.health;
        }
      }

      // Downed / 30s bleedout handling
      if (downed) {
        const rate = spaceHeld ? 4.5 : 1.0;
        bleedoutRemaining = Math.max(0, bleedoutRemaining - dt * rate);
        const pct = Math.max(0, Math.min(100, (bleedoutRemaining / BLEEDOUT_S) * 100));
        downedTitle.textContent = t(`DOWNED · ${Math.ceil(bleedoutRemaining)}s`, `濒死状态 · 剩余 ${Math.ceil(bleedoutRemaining)} 秒`);
        downedBar.style.width = pct + '%';
        downedSub.textContent = medicCalled
          ? t('Medic en route! Hold [Space] to give up.', '医疗兵正在赶来救援！长按 [空格] 放弃并重新部署。')
          : t('Press [H] to call Medic rescue · Hold [Space] to give up', '按 [H] 呼叫医疗兵救援 · 长按 [空格] 加速放弃');
        btnCallMedic.textContent = t('H Call Medic', 'H 呼叫救援');
        btnGiveUp.textContent = t('Give up now', '立即放弃');
        if (world.camera && player?.pos) {
          world.camera.position.y = Math.min(world.camera.position.y, player.pos.y + 0.55);
        }
        if (bleedoutRemaining <= 0) {
          triggerBleedout();
          return;
        }
      }

      // Feed intelligence reports to Commander
      for (const p of conquest.points) {
        if (!p.locked) commander.reportObjective(conquest.elapsed, p);
      }
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e?.alive && e.pos) commander.reportEnemy(conquest.elapsed, e.pos, 'enemy-' + i);
      }

      const aliveMembers = members.filter(m => m.alive);
      const squadHealth = aliveMembers.length
        ? aliveMembers.reduce((s, m) => s + m.hp / m.maxHp, 0) / members.length
        : (player?.alive ? (player.health / player.maxHealth) : 0);
      const assignment = commander.evaluate(
        conquest.elapsed,
        conquest.points,
        { at: player?.pos ?? { x: 0, z: 0 }, members: aliveMembers.length + (player?.alive ? 1 : 0), health: squadHealth },
        conquest.tickets.blue,
        conquest.tickets.red
      );

      // Update Recommendation Banner
      const rec = commander.recommendation;
      if (rec && rec.status === 'offered' && conquest.elapsed < rec.expires && !downed) {
        recEl.hidden = false;
        const missionZh = {
          CAPTURE_OBJECTIVE: '夺取',
          DEFEND_OBJECTIVE: '防守',
          REINFORCE_OBJECTIVE: '增援',
          RECON_OBJECTIVE: '侦察',
          REGROUP: '集结于',
        }[rec.mission] || '支援';
        const missionEn = {
          CAPTURE_OBJECTIVE: 'Capture',
          DEFEND_OBJECTIVE: 'Defend',
          REINFORCE_OBJECTIVE: 'Reinforce',
          RECON_OBJECTIVE: 'Recon',
          REGROUP: 'Regroup at',
        }[rec.mission] || 'Support';
        recText.textContent = t(
          `Commander: ${missionEn} ${rec.short} (${rec.reasonEn})`,
          `指挥官建议：${missionZh} ${rec.short} 点（${rec.reasonZh}）`
        );
        recAccept.textContent = t('J Accept', 'J 接受');
        recDismiss.textContent = t('K Dismiss', 'K 忽略');
      } else {
        recEl.hidden = true;
      }

      if (!enabledAI) return;

      // Update Allied AI Squadmates
      const targetPoint = conquest.points.find(p => p.id === assignment?.objective) ?? conquest.activePoint ?? conquest.points[0];
      const reinforceBoost = conquest.support.reinforceUntil > conquest.elapsed;

      for (const m of members) {
        m.age += dt;
        if (m.fireCooldown > 0) m.fireCooldown -= dt;

        if (!m.alive) {
          if (conquest.elapsed >= m.respawnAt) {
            const sp = getSpawnPos?.() ?? player?.pos ?? new Vector3(0, 0, 0);
            spawnMember(m, sp);
          }
          continue;
        }

        // Priority 1: Medic rescues downed player
        if (downed && (m.role === 'medic' || medicCalled) && player?.pos) {
          const dPlayer = m.pos.distanceTo(player.pos);
          const moving = steerToward(m, player.pos, dt, 6.2);
          m.container.position.copy(m.pos);
          m.container.rotation.y = m.yaw;
          m.human?.pose(dPlayer < 2.6 ? 'crouch' : 'stand', m.stride, m.age, moving);
          if (dPlayer < 2.8) {
            m.reviveProgress += dt;
            if (m.reviveProgress >= 1.6) {
              m.reviveProgress = 0;
              revivePlayer(m.callsign);
            }
          }
          continue;
        }
        m.reviveProgress = 0;

        // Priority 2: Move toward assigned objective (with per-member flanking offset)
        let goal = null;
        if (targetPoint?.pos) {
          goal = new Vector3(
            targetPoint.pos.x + m.offset[0] * 1.4,
            targetPoint.pos.y,
            targetPoint.pos.z + m.offset[1] * 1.4
          );
        } else if (player?.pos) {
          goal = new Vector3(player.pos.x + m.offset[0], player.pos.y, player.pos.z + m.offset[1]);
        }

        const speed = reinforceBoost ? 5.8 : 4.6;
        const moving = goal && m.pos.distanceTo(goal) > 2.2 ? steerToward(m, goal, dt, speed) : false;

        // Priority 3: Engage nearest visible enemy (respecting smoke screens!)
        let bestEnemy = null;
        let bestDist = m.role === 'recon' ? 42 : 30;
        const eye = m.pos.clone().add(new Vector3(0, 1.45, 0));
        for (const e of enemies) {
          if (!e?.alive || !e.pos) continue;
          const d = e.pos.distanceTo(m.pos);
          if (d >= bestDist) continue;
          if (conquest.smokeBlocks(eye, e.pos)) continue;
          if (physics?.lineOfSight && !physics.lineOfSight(eye, e.pos)) continue;
          bestEnemy = e;
          bestDist = d;
        }

        if (bestEnemy) {
          const aimYaw = Math.atan2(bestEnemy.pos.x - m.pos.x, bestEnemy.pos.z - m.pos.z);
          const diff = Math.atan2(Math.sin(aimYaw - m.yaw), Math.cos(aimYaw - m.yaw));
          m.yaw += diff * Math.min(1, dt * 10);
          if (m.fireCooldown <= 0) {
            m.fireCooldown = m.role === 'recon' ? 1.5 : m.role === 'support' ? 0.75 : 1.05;
            spawnTracer(eye, bestEnemy.pos);
            const dmg = m.role === 'recon' ? 26 : m.role === 'support' ? 15 : 18;
            bestEnemy.damage?.(dmg, bestEnemy.pos, bestEnemy.pos.clone().sub(eye).normalize(), 'ally');
            fx?.sparks?.(bestEnemy.pos, up, 4);
            audio?.play?.('sidearm_shot', { pos: eye, ref: 12, gain: 0.32, jitter: 0.05 });
          }
        }

        // Enemies near squadmates can chip squadmate HP so squad losses feel real
        for (const e of enemies) {
          if (!e?.alive || !e.pos) continue;
          if (e.pos.distanceTo(m.pos) < 12 && Math.random() < dt * 0.25) {
            m.hp -= 12;
            if (m.hp <= 0) {
              m.alive = false;
              m.container.visible = false;
              m.respawnAt = conquest.elapsed + (reinforceBoost ? 4 : 10);
              break;
            }
          }
        }

        m.container.position.copy(m.pos);
        m.container.rotation.y = m.yaw;
        m.human?.pose(bestEnemy && !moving ? 'crouch' : 'stand', m.stride, m.age, moving);
      }
    }

    function dispose() {
      stop();
      for (const tr of tracers) {
        scene.remove(tr.mesh);
        tr.mesh.material.dispose();
      }
      tracers.length = 0;
      root.removeFromParent();
      recEl.remove();
      downedEl.remove();
    }

    return {
      start,
      stop,
      update,
      enterDowned,
      revivePlayer,
      callMedic,
      handleRecommendation,
      dispose,
      get active() { return active; },
      get downed() { return downed; },
      get bleedoutRemaining() { return bleedoutRemaining; },
      get commander() { return commander; },
      get allies() { return members; },
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createPortTacticalCommander, createPortMultiplayerSquad };
  } else {
    globalThis.createPortTacticalCommander = createPortTacticalCommander;
    globalThis.createPortMultiplayerSquad = createPortMultiplayerSquad;
  }
})();
