/* Playable objectives and set pieces after Rail Yard. */
(() => {
  const text = (en, zh) => [en, zh];
  const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const near = (a, b, r, height = .85) => distance(a, b) <= r && Math.abs(a.y - b.y) <= height;
  const clamp = x => Math.min(1, Math.max(0, x));
  const tugIds = ['tug-drydock', 'tug-south-lock', 'tug-outer-roads'];
  const recordIds = ['crack-report', 'transfer-order', 'search-cancelled', 'transport-intercept'];
  const routes = ['watch', 'cable', 'service'];
  const rescueBatches = { a: 5, b: 6, c: 6 };

  function drydock(m) {
    const { points, objects, switches } = m.layout;
    const offsets = [0, 1.85, 3.43];
    const signal = id => Math.cos((m.age + offsets[tugIds.indexOf(id)]) * (2 * Math.PI / 6.1));
    const surface = () => Math.min(2.54, -.05 + m.phaseAge * .09);
    const rescued = () => Boolean(m.state.worker);

    function findRecording(id) {
      if (!m.evidence.collect(id)) return;
      const aligned = tugIds.every(tug => m.evidence.collected.includes(tug));
      if (aligned && m.evidence.verify(tugIds)) {
        m.advance('flood', id);
        m.speak('Three recordings, one tug. Water is coming up the slip. Take the marked stairs.', '三段录音都是同一艘拖轮。船台开始进水。走有标记的楼梯。');
        m.effect({ sound: 'rail_touchdown', shake: .21, pos: points.stair });
      } else {
        m.advance('recordings', id);
        m.clue(id, text('The engine trace holds.', '引擎波形已对齐。'));
      }
    }
    return {
      phases: ['recordings', 'flood', 'landing'],
      objective() {
        if (m.phase === 'recordings') {
          const done = m.evidence.collected.length;
          return text(`Align the tug recordings (${done}/3)`, `对齐拖轮录音（${done}/3）`);
        }
        if (m.phase === 'flood') return text('Climb above the rising water. A worker is stranded by the stairs.',
          '爬到水位以上。楼梯旁还有一名被困工人。');
        return text('Reach the marked upper landing', '前往有标记的上层出口');
      },
      actions() {
        if (m.phase === 'recordings') {
          return tugIds.filter(id => !m.evidence.collected.includes(id)).map(id => {
            const stable = signal(id) > .66;
            const clue = m.evidence.clues.find(entry => entry.id === id);
            return m.action(id, stable ?
              text(`Align ${clue.title[0]} · signal locked`, `对齐${clue.title[1]} · 信号锁定`) :
              text(`${clue.title[0]} · wait for signal lock`, `${clue.title[1]} · 等待信号锁定`),
            () => findRecording(id), { hold: .55, allowed: stable });
          });
        }
        if (m.phase === 'flood' && !rescued()) return [m.action('flood-worker',
          text('Help the worker up', '扶工人上楼'), () => {
            m.advance('flood', m.state.resume, { worker: true });
            m.speak('I can manage from here. Get up to the landing.', '我自己能走了。快上到平台。');
          }, { hold: .92, height: .79 })];
        return m.phase === 'landing' ? [m.action('exit', text('Take the tug route chart', '接过拖轮航线图'), m.complete)] : [];
      },
      markers() {
        if (m.phase === 'recordings') return tugIds.filter(id => !m.evidence.collected.includes(id))
          .map(id => m.marker(id, 'ABC'[tugIds.indexOf(id)]));
        if (m.phase === 'flood') return [
          m.marker('landing', 'UP'),
          ...(!rescued() ? [m.marker('flood-worker', 'SOS')] : []),
        ];
        return [m.marker('exit', 'EX', 'extract')];
      },
      tick(dt, player) {
        if (m.phase !== 'flood') return;
        if (near(player.pos, points.landing, 2.5, .33)) {
          m.advance('landing', 'landing');
          const message = rescued() ? text('We are both clear of the water.', '我们都上来了。') :
            text('High ground. The tug’s departure is marked on the chart.', '到高处了。图上标了拖轮离港的路线。');
          m.speak(...message);
          return;
        }
        const depth = surface() - player.pos.y;
        if (depth > .24 && player.vel) {
          player.vel.x *= 1 - Math.min(.13, depth * dt * 2.5);
          player.vel.z *= 1 - Math.min(.13, depth * dt * 2.5);
        }
        if (depth > .63) m.hazard(dt, 1.1, () => player.damage?.(19, points.stair));
      },
      draw() {
        const flooding = m.phase === 'flood' || m.phase === 'landing' || m.phase === 'complete';
        objects.flood.visible = flooding;
        objects.flood.position.y = m.phase === 'flood' ? surface() : 2.54;
        objects['flood-worker'].visible = m.phase !== 'recordings' && (rescued() || m.phase === 'flood');
        if (rescued()) objects['flood-worker'].position.set(points.landing.x + .73, points.landing.y, points.landing.z + 1.14);
        else objects['flood-worker'].position.copy(points['flood-worker']);
        for (const id of tugIds) switches[id].glow(m.evidence.collected.includes(id) || signal(id) > .66 ? 'teal' : 'warm');
      },
    };
  }

  function tidegate(m) {
    const { points, objects, switches } = m.layout;
    const gust = () => .5 + .5 * Math.cos(m.age * (2 * Math.PI / 8.2));
    const latchWindow = () => gust() < .44;
    return {
      phases: ['gate', 'wind', 'barge', 'detour', 'reunion', 'departure'],
      objective() {
        return {
          gate: text('Release the South Tide Gate shutter', '打开南防潮闸的检修卷帘门'),
          wind: text('Use the lee shelter and open the latch between gusts', '沿背风棚前进，趁风弱时解开门闩'),
          barge: text('Keep moving along the lock road', '沿闸顶道路继续前进'),
          detour: text('Reach the east lock through the floodway service bridge', '经泄洪道检修桥前往东侧闸室'),
          reunion: text('Meet Mara at the east lock', '与玛拉在东侧闸室会合'),
          departure: text('Follow Mara to the boarding point', '随玛拉前往登船点'),
        }[m.phase];
      },
      actions() {
        if (m.phase === 'gate') return [m.action('lock-control', text('Raise the lock shutter', '升起检修卷帘门'),
          () => m.advance('wind', 'lock-control'))];
        if (m.phase === 'wind') return [m.action('gust-latch', latchWindow() ?
          text('Release the latch · sheltered interval', '解开门闩 · 风力转弱') :
          text('Hold position · gust on deck', '留在背风处 · 阵风来袭'), () => {
          m.advance('barge', 'gust-latch');
          m.speak('The gate is clear. Stay on the marked road.', '闸门开了。沿标记车道前进。');
        }, { allowed: latchWindow(), hold: .68 })];
        if (m.phase === 'detour' && !m.state.bypass) return [m.action('bypass-control',
          text('Raise the floodway access door', '打开泄洪道检修门'), () => {
            m.advance('detour', 'bypass-control', { bypass: true });
            m.speak('The floodway is open. Cross the raised service bridge.', '泄洪道门已开。走上面的检修桥。');
          })];
        if (m.phase === 'reunion') return [m.action('mara-tidegate', text('Talk to Mara', '和玛拉交谈'), () => {
          m.advance('departure', 'mara-tidegate');
          m.speak('Mara here. I have the side-channel bearing. The platform is outside the gate.', '我是玛拉。我拿到了支航道方位。平台就在闸外。');
        }, { hold: 1.45 })];
        if (m.phase === 'departure') return [m.action('exit', text('Board with Mara', '和玛拉登船'), m.complete)];
        return [];
      },
      markers() {
        if (m.phase === 'gate') return [m.marker('lock-control', 'PWR')];
        if (m.phase === 'wind') return [m.marker('gust-latch', 'LEE')];
        if (m.phase === 'barge') return [m.marker('bargeImpact', 'TIDE')];
        if (m.phase === 'detour') return m.state.bypass ? [m.marker('detour', 'UP'), m.marker('farBank', 'EAST')] :
          [m.marker('bypass-control', 'ALT')];
        if (m.phase === 'reunion') return [m.marker('mara-tidegate', 'MARA')];
        return [m.marker('exit', 'EX', 'extract')];
      },
      tick(dt, player) {
        if ((m.phase === 'wind' || m.phase === 'barge') && player.pos.x > -72.54 && player.pos.x < -63.9 &&
            player.pos.z > 1.4 && player.pos.z < 15 && gust() > .67 && !player.crouching && player.vel) {
          player.vel.z += (gust() - .51) * 13 * dt;
          player.vel.x -= (gust() - .51) * 4 * dt;
        }
        if (m.phase === 'barge' && near(player.pos, points.bargeImpact, 3.7, 1.6)) {
          m.advance('detour', 'bargeImpact', { impacted: true });
          m.speak('Barge across the road. Turn back to the floodway controls on the south side.', '驳船堵住车道了。折回南侧，找泄洪道控制台。');
          m.effect({ sound: 'rail_touchdown', shake: .32, pos: points.bargeImpact });
        }
        if (m.phase === 'detour' && m.state.bypass && near(player.pos, points.farBank, 3.7, .55)) {
          m.advance('reunion', 'farBank');
          m.speak('I can see you. Keep coming to the relief shed.', '我看到你了。到救援棚来。');
        }
      },
      draw() {
        m.gate('tide-shutter', m.phase !== 'gate');
        m.gate('wind-latch', !['gate', 'wind'].includes(m.phase));
        m.gate('barge-wreck', !m.state.impacted);
        m.gate('floodway-door', m.state.bypass);
        switches['gust-latch'].glow(latchWindow() ? 'teal' : 'red');
        for (const x of [-76, -69, -59]) {
          const flag = objects['flag-' + x];
          flag.rotation.y = -.85 * gust();
          flag.position.z = flag.userData.restZ - gust() * .43;
        }
        const barge = objects['loose-barge'];
        const travel = m.state.impacted ? (m.phase === 'detour' && !m.state.bypass ? clamp(1 - Math.exp(-m.phaseAge * 2.7)) : 1) : 0;
        barge.position.z = 20.6 - 12.7 * travel;
        barge.rotation.y = Math.PI / 2 + .26 * travel;
        barge.rotation.x = .056 * Math.sin(m.age * 2) * (1 - travel);
      },
    };
  }

  function anchorage(m) {
    const { points, objects, switches } = m.layout;
    const groups = Object.keys(rescueBatches);
    const rescued = () => Number(m.state.rescued) || 0;
    const last = () => m.phase.slice(-1);

    function evacuate(group) {
      const total = rescued() + rescueBatches[group];
      const phase = group === 'a' ? 'muster-b' : group === 'b' ? 'crane' : 'departure';
      m.advance(phase, 'muster-' + group, { rescued: total });
      if (group === 'b') {
        m.speak('Eleven aboard. The crane is coming down. Leave the ladder and use the port catwalk.',
          '十一人上船了。吊机要倒了。别走梯子，改走左舷栈道。');
        m.effect({ sound: 'rail_touchdown', shake: .38, pos: points['muster-b'] });
      } else {
        m.speak(`${total} of seventeen aboard.`, `已经上船 ${total} 人，共十七人。`);
      }
    }
    return {
      phases: ['radio', 'platform', 'muster-a', 'muster-b', 'crane', 'muster-c', 'departure'],
      objective() {
        if (m.phase === 'radio') return text('Call the pilot boat from the shed', '从引航棚呼叫接应艇');
        if (m.phase === 'platform') return text('Cross the tilted platform and bring the pilot boat alongside', '穿过倾斜平台，让接应艇靠拢');
        if (m.phase === 'crane') return text('The crane crushed the ladder. Take the port catwalk', '吊机压坏了梯子。走左舷栈道。');
        if (m.phase === 'departure') return text('Report the final head count and board the cutter', '报告最终人数，然后登艇');
        return text(`Evacuate the workers (${rescued()}/17)`, `撤离工人（${rescued()}/17）`);
      },
      actions() {
        if (m.phase === 'radio') return [m.action('pilot-radio', text('Call the pilot cutter', '呼叫接应艇'), () => {
          m.advance('platform', 'pilot-radio');
          m.speak('The port side is tilting. Walk the center of the gangway and operate the winch.', '左舷在倾斜。沿舷梯中间走，到上面操作绞盘。');
        })];
        if (m.phase === 'platform') return [m.action('approach-boat', text('Winch the cutter alongside', '用绞盘把接应艇拉到旁边'),
          () => m.advance('muster-a', 'approach-boat'), { hold: 2.2 })];
        if (m.phase.startsWith('muster-')) {
          const count = rescueBatches[last()];
          return [m.action(m.phase, text(`Send the next ${count} workers aboard`, `安排接下来 ${count} 名工人登艇`),
            () => evacuate(last()), { hold: 2.4 })];
        }
        return m.phase === 'departure' ? [m.action('departure-radio', text('Confirm seventeen aboard', '确认十七人全部上船'),
          m.complete, { hold: 1.7 })] : [];
      },
      markers() {
        if (m.phase === 'radio') return [m.marker('pilot-radio', 'VHF')];
        if (m.phase === 'platform') return [m.marker('gangway', 'UP'), m.marker('approach-boat', 'WINCH')];
        if (m.phase === 'crane') return [m.marker('craneDetour', 'ALT'), m.marker('aftDeck', 'AFT')];
        if (m.phase === 'departure') return [m.marker('departure-radio', 'EX', 'extract')];
        return [m.marker(m.phase, 'SOS')];
      },
      tick(dt, player) {
        if (m.phase === 'crane' && near(player.pos, points.aftDeck, 5.15, .68)) {
          m.advance('muster-c', 'aftDeck');
        }
      },
      draw() {
        m.gate('pilot-gate', m.phase !== 'radio');
        m.gate('ladder-wreck', rescued() < 11);
        m.gate('crane-route', rescued() >= 11);
        const crane = objects.crane;
        const fall = rescued() < 11 ? 0 : m.phase === 'crane' ? clamp(m.phaseAge / 1.35) ** 2 : 1;
        crane.position.y = 7.87 - 5.65 * fall;
        crane.rotation.z = -.71 * fall;
        const boat = objects['pilot-cutter'];
        const approaching = ['muster-a', 'muster-b', 'crane', 'muster-c', 'departure', 'complete'].includes(m.phase);
        boat.position.z = approaching ? 12.75 : 16 - Math.sin(m.age * 1.5) * .55;
        boat.position.y = 1.15 + Math.sin(m.age * 1.6) * .09;
        let next = 0;
        for (const group of groups) {
          next += rescueBatches[group];
          switches['muster-' + group].glow(rescued() >= next ? 'teal' : 'warm');
          for (let i = 0; i < rescueBatches[group]; i++) {
            objects[`muster-${group}-${i}`].visible = rescued() < next;
          }
        }
      },
    };
  }

  function returnHarbor(m) {
    const { points, objects, routes: paths } = m.layout;
    const segments = ['west', 'pumps', 'cross', 'triage'];
    const controls = ['light-a', 'light-b', 'light-c', 'triage-ledger'];
    const assembled = [0, 5, 11, 17];
    const nurse = objects.nurse;
    const stage = () => segments.indexOf(m.phase);
    return {
      phases: ['meet', ...segments],
      objective() {
        if (m.phase === 'meet') return text('Meet the nurse in the west triage shed', '到西侧分诊棚找到护士');
        const index = stage();
        return text(`Lead the nurse through receiving (${assembled[index]}/17 admitted)`,
          `带护士穿过收货区（已接收 ${assembled[index]}/17 人）`);
      },
      actions() {
        if (m.phase === 'meet') return [m.action('nurse', text('Tell the nurse where the boat docked', '告知护士救援艇的靠岸位置'), () => {
          m.advance('west', 'nurse');
          m.speak('Stay close. I need to see the cleared path before I move.', '别离太远。等我看清路再走。');
        })];
        const index = stage();
        if (index < 0) return [];
        const id = controls[index];
        return [m.action(id, index === 3 ? text('Confirm all seventeen in the arrival ledger', '核对登记簿上的十七人') :
          text('Clear the crossing for the nurse', '为护士打开通道'), () => {
          if (index === 3) m.complete();
          else m.advance(segments[index + 1], id);
        }, { allowed: m.followDone, hold: 1 })];
      },
      markers() {
        if (m.phase === 'meet') return [m.marker('nurse', 'MED')];
        const index = stage();
        if (index < 0) return [];
        return m.followMarkers(controls[index], index === 3 ? 'LOG' : 'MED');
      },
      tick(dt, player) {
        if (m.phase === 'meet') return;
        const route = paths[m.phase];
        if (route) m.follow(nurse, route, player, dt, 2.6);
      },
      draw() {
        const index = stage();
        for (const [at, name] of ['a', 'b', 'c'].entries()) m.gate('work-gate-' + name, index > at || m.phase === 'complete');
        for (const [at, name] of segments.slice(0, 3).entries()) objects['light-' + name].visible = m.phase === 'complete' || index >= at;
        if (m.phase === 'meet') nurse.position.copy(points.nurse);
        else if (!m.hasFollow && index > 0) nurse.position.copy(paths[segments[index - 1]].at(-1));
      },
    };
  }

  function nightRecord(m) {
    const { switches } = m.layout;
    const unfinished = () => recordIds.filter(id => !m.evidence.collected.includes(id));
    return {
      phases: ['approach', 'search', 'order', 'transmit'],
      objective() {
        if (m.phase === 'approach') return text('Enter the tower by the watch, cable, or service access', '从值班门、电缆孔或检修门进入调度塔');
        if (m.phase === 'search') return text(`Find the original calls (${m.evidence.collected.length}/4)`,
          `找齐原始通话（${m.evidence.collected.length}/4）`);
        if (m.phase === 'order') return text(`Select each call from earliest to latest (${m.state.order?.length ?? 0}/4)`,
          `按时间从早到晚选取通话（${m.state.order?.length ?? 0}/4）`);
        return text('Deliver the verified recording to the transmitter', '把核验过的录音送到发报机');
      },
      actions() {
        if (m.phase === 'approach') return routes.map(route => m.action('entry-' + route,
          text('Open tower access', '打开调度塔入口'), () => m.advance('search', 'entry-' + route, { route })));
        if (m.phase === 'search') return unfinished().map(id => {
          const clue = m.evidence.clues.find(item => item.id === id);
          return m.action(id, text(`Recover ${clue.title[0]}`, `取回${clue.title[1]}`), () => {
            m.evidence.collect(id);
            m.advance(unfinished().length ? 'search' : 'order', id);
          });
        });
        if (m.phase === 'order') return m.evidence.clues.filter(clue => !m.state.order?.includes(clue.id)).map(clue =>
          m.action('order-' + clue.id, text(`${clue.time} ${clue.title[0]}`, `${clue.time} ${clue.title[1]}`), () => {
            const order = [...(m.state.order ?? []), clue.id];
            if (order.length === 4 && !m.evidence.verify(order)) {
              m.advance('order', 'console', { order: [] });
              m.speak('Check the timestamps. Start with the inspection report.', '复核时间戳。从巡检报告开始。');
            } else {
              m.advance(order.length === 4 ? 'transmit' : 'order', 'console', { order });
            }
          }, { hold: .32, radius: .96 }));
        return m.phase === 'transmit' ? [m.action('record-upload', text('Send the indexed recordings', '发出带索引的录音'), m.complete)] : [];
      },
      markers() {
        if (m.phase === 'approach') return routes.map((route,index) => m.marker('entry-' + route, ['FIRE','DUCT','KEY'][index]));
        if (m.phase === 'search') return unfinished().map(id => m.marker(id, 'TAPE'));
        if (m.phase === 'order') return [m.marker('console', 'TIME')];
        return [m.marker('record-upload', 'TX', 'extract')];
      },
      draw() {
        for (const route of routes) m.gate(route + '-door', m.state.route === route);
        for (const id of recordIds) switches['order-' + id].glow(m.state.order?.includes(id) ? 'teal' : 'warm');
      },
    };
  }

  function lastPilot(m) {
    const { points, routes: paths, objects } = m.layout;
    const harris = objects.harris;
    return {
      phases: ['meet', 'impact', 'route', 'workers', 'escort'],
      objective() {
        if (m.phase === 'meet') return text('Rendezvous with Harris at the east berth signal', '在东泊位信号点与哈里斯会合');
        if (m.phase === 'impact') return text('Follow the marked quay toward the pilot station', '沿标记岸道前往引航站');
        if (m.phase === 'route') return text('Open the upper bridge or free the workers in the shelter', '开启高架引航桥，或先救出避险棚的工人');
        if (m.phase === 'workers') return text('Open the sheltered service route with the workers', '和工人打开装卸通道');
        return text('Escort Harris to the pilot station', '护送哈里斯到引航站');
      },
      actions() {
        if (m.phase === 'meet') return [m.action('causeway-call', text('Check in with Harris', '与哈里斯会合'), () => m.advance('impact','fork'))];
        if (m.phase === 'route') return [
          m.action('pick-bridge', text('Open the upper bridge', '开启高架引航桥'),
            () => m.advance('escort','fork',{route:'bridge'})),
          m.action('rescue-workers', text('Free the stranded workers', '救出受困的码头工'),
            () => m.advance('workers','rescue-workers',{route:'workers'})),
        ];
        if (m.phase === 'workers') return [m.action('open-worker-route', text('Clear the service lock', '打开装卸通道'),
          () => m.advance('escort','open-worker-route'))];
        if (m.phase === 'escort') return [m.action('harris-handoff', text('Present the evidence with Harris', '和哈里斯移交证物'),
          m.complete, { allowed: m.followDone })];
        return [];
      },
      markers() {
        if (m.phase === 'meet') return [m.marker('causeway-call','VHF')];
        if (m.phase === 'impact') return [m.marker('impact','PIER')];
        if (m.phase === 'route') return [m.marker('pick-bridge','UP'), m.marker('rescue-workers','SOS')];
        if (m.phase === 'workers') return [m.marker('open-worker-route','ALT')];
        return m.followMarkers('harris-handoff','EX');
      },
      tick(dt, player) {
        if (m.phase === 'impact' && near(player.pos, points.fork, 6.5, 1.1)) {
          m.advance('route','fork',{impact:true});
          m.speak('The ship has cut off the causeway. Get Harris clear on another route.', '巨轮切断了岸道。另找一条路把哈里斯带出去。');
          m.effect({ sound:'rail_touchdown', shake:.42, pos:points.impact });
        }
        if (m.phase === 'escort' && harris) m.follow(harris, paths[m.state.route], player, dt, 2.7);
      },
      draw() {
        m.gate('causeway-wreck', !m.state.impact);
        m.gate('upper-bridge-door', m.state.route === 'bridge');
        m.gate('worker-door', m.state.route === 'workers');
        m.gate('service-lock', m.state.route === 'workers' && ['escort','complete'].includes(m.phase));
        const ship = Object.values(objects).find(object => object.name.includes('ship'));
        if (ship) {
          ship.userData.startZ ??= ship.position.z;
          const elapsed = m.state.impact ? (m.phase === 'route' ? clamp(m.phaseAge / 3.2) : 1) : 0;
          ship.position.z = ship.userData.startZ - 8.4 * elapsed;
        }
      },
    };
  }

  function reopen(m) {
    const { points, objects } = m.layout;
    return {
      phases: ['boots','castoff'],
      objective: () => m.phase === 'boots' ? text('Meet Mara and take the work boots', '与玛拉会合，取回工靴') :
        text('Carry the boots to the boat and cast off', '把工靴带上艇，解开缆绳'),
      actions: () => m.phase === 'boots' ? [m.action('boots', text('Pick up the boots', '拿起工靴'), () => {
        m.advance('castoff','boots');
        m.speak('His boots. He will want them when he gets home.', '把他的靴子带上。回家以后用得着。');
      }, { hold: .7 })] : [m.action('cast-off', text('Stow the boots and untie the line', '放好工靴，解开缆绳'),m.complete)],
      markers: () => m.phase === 'boots' ? [m.marker('boots','MARA')] : [m.marker('cast-off','EX','extract')],
      draw() {
        const boots = objects.boots;
        boots.visible = m.phase !== 'castoff';
        if (m.phase === 'complete') boots.position.copy(points.exit).add(m.offset(.73,.25,.68));
      },
    };
  }

  const builders = { drydock, tidegate, anchorage, 'return-harbor': returnHarbor,
    'night-record': nightRecord, 'last-pilot': lastPilot, reopen };

  window.createPortContinuationChapter = (world, layout, { onEvent = () => {} } = {}) => {
    const { points, objects } = layout;
    const { THREE, physics } = world;
    const sight = new THREE.Vector3(), step = new THREE.Vector3();
    const gates = new Map();
    let active = false, state, phase, age, phaseAge, hazardClock, held, holding, changed, radio;
    let follower, waypoint, path, notified;
    const mission = {
      layout,
      get phase() { return phase; },
      get age() { return age; },
      get phaseAge() { return phaseAge; },
      get state() { return state; },
      get evidence() { return state.evidence; },
      get followDone() { return !!path && waypoint >= path.length; },
      get hasFollow() { return !!path; },
      offset(x,y,z) { return new THREE.Vector3(x,y,z); },
      gate(id, open) {
        const door = objects[id];
        if (!door?.userData.bounds) return;
        door.visible = active && !open;
        if (active && !open && !gates.has(id)) {
          const { min, max } = door.userData.bounds;
          gates.set(id, physics.addBox(min, max, { surface:'metal', tag:id }));
        } else if ((!active || open) && gates.has(id)) {
          physics.removeBox(gates.get(id));
          gates.delete(id);
        }
      },
      advance(next, resume, additional={}) {
        Object.assign(state, additional, { resume, stage: state.stage + 1 });
        if (phase !== next) {
          phase = next;
          phaseAge = 0;
          follower = path = null;
          waypoint = 0;
          notified = 0;
        }
        changed = true;
      },
      complete() { phase = 'complete'; changed = true; },
      speak(en,zh) { radio = text(en,zh); },
      clue(id,line) { radio = line; },
      effect: onEvent,
      hazard(dt, interval, apply) {
        hazardClock += dt;
        if (hazardClock >= interval) { hazardClock = 0; apply(); }
      },
      marker(id, short, kind='story') { return { id, short, kind, pos:points[id] }; },
      action(id, label, perform, { allowed=true, hold=.8, radius=2.15, height=1.06 }={}) {
        return { id, label, perform, allowed, hold, radius, height, target:points[id] };
      },
      follow(actor, route, player, dt, rate) {
        if (!route?.length) return;
        if (path !== route) {
          follower = actor;
          path = route;
          waypoint = 0;
        }
        const target = path[waypoint];
        if (!target) { actor.userData.pose?.(age, false); return; }
        const gap = actor.position.distanceTo(player.pos);
        if (gap > 9) {
          actor.userData.pose?.(age, false);
          if (age - notified > 9 && gap > 9) {
            notified = age;
            mission.speak('Slow down. I am waiting at the last corner.', '慢一点。我在上一个拐角等你。');
          }
          return;
        }
        step.subVectors(target, actor.position);
        const length = step.length();
        if (length <= .08) {
          waypoint++;
          changed = true;
        } else {
          const lead = ((player.pos.x - actor.position.x) * step.x +
            (player.pos.y - actor.position.y) * step.y + (player.pos.z - actor.position.z) * step.z) / length;
          const margin = player.pos.distanceTo(target) < 2.4 ? -.07 : .65;
          const travel = Math.min(length, dt * rate, Math.max(0, lead - margin));
          actor.position.addScaledVector(step, travel / length);
          actor.rotation.y = Math.atan2(step.x,step.z);
          actor.userData.pose?.(age, travel > 0);
        }
      },
      followMarkers(end, short) {
        const next = path?.[waypoint];
        return [next ? { id:'follow-next', short, kind:'story', pos:next } : mission.marker(end,short),
          ...(follower ? [{ id:'escort-member', short:'SOS', kind:'story', pos:follower.position }] : [])];
      },
    };
    const rules = builders[layout.id](mission);

    function reset(snapshot) {
      phase = rules.phases.includes(snapshot?.phase) ? snapshot.phase : rules.phases[0];
      state = { ...snapshot, stage:snapshot?.stage ?? 0, resume:snapshot?.resume ?? 'start',
        evidence:window.SaltlineCampaign.createEvidence(layout.id, snapshot?.evidence) };
      delete state.phase;
      waypoint = age = phaseAge = hazardClock = held = notified = 0;
      holding = follower = path = null;
      radio = null;
      changed = false;
      for (const actor of Object.values(objects)) {
        if (actor.userData.pose && points[actor.name]) actor.position.copy(points[actor.name]);
      }
      rules.draw?.();
    }
    reset(null);

    return {
      reset,
      show(value) {
        active = !!value;
        layout.model.visible = active;
        rules.draw?.();
        if (!active) {
          for (const box of gates.values()) physics.removeBox(box);
          gates.clear();
        }
      },
      get phase() { return phase; },
      get objective() { return rules.objective() ?? text('Complete the handoff','完成交接'); },
      get resumePosition() { return state.resume !== 'start' ? points[state.resume] ?? null : null; },
      get checkpoint() {
        return phase !== 'complete' && state.stage > 0 ? { ...state, phase, evidence:state.evidence.snapshot } : null;
      },
      markers() { return rules.markers().filter(marker => marker.pos); },
      update(dt, player, interact) {
        if (!active || !player.alive || !(dt > 0) || phase === 'complete') return null;
        changed = false;
        radio = null;
        age += dt;
        phaseAge += dt;
        const before = state.stage;
        rules.tick?.(dt,player);
        const candidates = rules.actions().filter(action => action.target && near(player.pos,action.target,action.radius,action.height));
        candidates.sort((a,b) => distance(player.pos,a.target) - distance(player.pos,b.target));
        const action = candidates.find(entry => {
          sight.copy(entry.target).y += .7;
          return physics.lineOfSight(player.eye ?? player.pos,sight);
        });
        if (!interact || holding !== action?.id || !action?.allowed) held = 0;
        holding = action?.id;
        if (action?.allowed && interact && (held += dt) >= action.hold) {
          held = 0;
          action.perform();
          rules.draw?.();
          return { changed, checkpointChanged:before !== state.stage, complete:phase === 'complete', radio };
        }
        rules.draw?.();
        return { changed, checkpointChanged:before !== state.stage, complete:phase === 'complete',
          radio, prompt:action?.label, progress:action ? Math.min(1,held/action.hold) : 0 };
      },
    };
  };
})();
