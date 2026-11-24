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

    const clueLines = {
      'tug-drydock': text('Mara: “That uneven cylinder beat left this basin at 06:41. Prove you aren’t here for Ward.”', '玛拉：「这阵顿挫引擎声 06:41 刚离开船坞。证明你不是替沃德来灭口的。」'),
      'tug-south-lock': text('Mara: “South lock dropped to idle at 06:46. Someone held the gate open for them.”', '玛拉：「06:46 在南闸降至怠速——有人专门替他们留了闸门。」'),
      'tug-outer-roads': text('Mara: “Heading straight for the outer service platform. One tape left.”', '玛拉：「引擎声直奔闸外维修平台。再核对最后一段。」'),
    };
    function findRecording(id) {
      if (!m.evidence.collect(id)) return;
      const aligned = tugIds.every(tug => m.evidence.collected.includes(tug));
      if (aligned && m.evidence.verify(tugIds)) {
        m.advance('flood', id);
        m.speak('Mara: “Three tapes, one tug—and someone just blew the sluice! Water is flooding the slip! Get to the high stairs!”', '玛拉：「三段录音全指向同一艘拖轮！有人炸开了泄水闸——船台进水了，快冲上高处楼梯！」');
        m.effect({ sound: 'rail_touchdown', shake: .35, pos: points.stair });
      } else {
        m.advance('recordings', id);
        m.clue(id, clueLines[id] ?? text('The engine trace holds.', '引擎波形已对齐。'));
      }
    }
    return {
      phases: ['recordings', 'flood', 'landing'],
      objective() {
        if (m.phase === 'recordings') {
          const done = m.evidence.collected.length;
          return text(`Align the tug recordings in the basin & gantry (${done}/3)`, `在坞底与上层吊廊找齐并对齐三段拖轮录音（${done}/3）`);
        }
        if (m.phase === 'flood') return text('Climb above the rising water. Two mechanics are stranded by the stairs!',
          '船坞进水！爬向高处——楼梯旁有两名被困维修工可以回头营救！');
        return text('Meet Mara at the upper landing for the tug chart', '前往上层出口与玛拉会合，拿取拖轮航线图');
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
          text('Pull both stranded mechanics clear of the flood', '回头扶起两名被困维修工'), () => {
            m.advance('flood', m.state.resume, { worker: true });
            m.effect({ sound: 'rail_log_radio', choice: 'drydockWorkersSaved' });
            m.speak('Mechanic: “We’ve got our footing—go! Mara saw you come back for us!”', '维修工：「我们能站稳了，快上平台！玛拉看到你回头救我们了！」');
          }, { hold: .92, height: .79 })];
        return m.phase === 'landing' ? [m.action('exit', text('Take Mara’s tug route chart', '接过玛拉的拖轮航线图'), m.complete)] : [];
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
        if (m.phase === 'recordings' && !m.state.introSaid && m.age > 1.2) {
          m.state.introSaid = true;
          m.speak('Mara: “Stay back—Command already wrote off seventeen men. Pull all three tug tapes if you want my chart.”', '玛拉：「别靠太近——指挥部已经把十七个人写成了已离港。想拿航线图，先把三段拖轮录音找齐。」');
        }
        if (m.phase !== 'flood') return;
        if (near(player.pos, points.landing, 2.5, .33)) {
          m.advance('landing', 'landing');
          const message = rescued()
            ? text('Mara: “You actually went back for both mechanics. Maybe you aren’t like Ward after all. Here’s the chart.”', '玛拉：「你真回头把两个维修工都拉上来了……看来你跟沃德不一样。拿好航线图。」')
            : text('Mara: “High ground. The tug’s departure is marked on the chart—we’ll see if you earn my trust at the tide gate.”', '玛拉：「到高处了。图上标了拖轮离港航线，防潮闸见分晓。」');
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
        const showWorkers = m.phase !== 'recordings' && (rescued() || m.phase === 'flood');
        objects['flood-worker'].visible = showWorkers;
        if (rescued()) objects['flood-worker'].position.set(points.landing.x + .73, points.landing.y, points.landing.z + 1.14);
        else objects['flood-worker'].position.copy(points['flood-worker']);
        if (objects['flood-worker-2']) {
          objects['flood-worker-2'].visible = showWorkers;
          if (rescued()) objects['flood-worker-2'].position.set(points.landing.x + 1.45, points.landing.y, points.landing.z + .95);
          else if (points['flood-worker-2']) objects['flood-worker-2'].position.copy(points['flood-worker-2']);
        }
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
          () => {
            m.advance('wind', 'lock-control');
            m.speak('Mara: “Tide gauge is at 4.8 meters and climbing! Move between the storm gusts!”', '玛拉：「水位已经涨到 4.8 米！听我报数，趁阵风间隙穿过高架！」');
          })];
        if (m.phase === 'wind') return [m.action('gust-latch', latchWindow() ?
          text('Release the latch · sheltered interval', '解开门闩 · 风力转弱') :
          text('Hold position · gust on deck', '留在背风处 · 阵风来袭'), () => {
          m.advance('barge', 'gust-latch');
          m.speak('Mara: “Swell dropping for twelve seconds—cross the lock road now!”', '玛拉：「浪涌回落十二秒！门闩开了，沿闸顶车道冲过去！」');
        }, { allowed: latchWindow(), hold: .68 })];
        if (m.phase === 'detour' && !m.state.bypass) return [m.action('bypass-control',
          text('Raise the floodway access door', '打开泄洪道检修门'), () => {
            m.advance('detour', 'bypass-control', { bypass: true });
            m.speak('Mara: “Floodway hatch is up! Cross the lower gate chamber to reunite with me!”', '玛拉：「泄洪道检修门开了！从闸体下层检修桥过来和我重聚！」');
          })];
        if (m.phase === 'reunion') return [m.action('mara-tidegate', text('Meet Mara & answer Reed’s incoming call', '与玛拉重聚并接听里德的来电'), () => {
          m.advance('departure', 'mara-tidegate');
          m.speak('Reed (Radio): “Lin? Listen—the outer service platform is listing, but the leeward starboard fender can still take a cutter. Get them out.”', '里德（首次来电）：「林恩？听好——外锚地维修平台已经倾斜，但背浪的右舷护舷一侧还能靠艇。把人带出来。」');
        }, { hold: 1.45 })];
        if (m.phase === 'departure') return [m.action('exit', text('Board the cutter with Mara for Outer Anchorage', '与玛拉登艇前往外锚地'), m.complete)];
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
        m.speak('Eleven aboard (5+6)! The crane boom is snapping! Fall back to the second boarding point via the port catwalk!',
          '十一人已登艇（5+6）！吊臂断裂坠落了！改走左舷栈道去第二处接驳点！');
        m.effect({ sound: 'rail_touchdown', shake: .45, pos: points['muster-b'] });
      } else if (group === 'c') {
        m.speak('Old Hawk: “All seventeen aboard! Take this evacuation receipt addendum—they crossed off the second boat after I signed.”',
          '老霍克（第十七人）：「十七人全上艇了！拿着这份撤离回执附页——我签完字后，有人把第二艘船划掉了。」');
      } else {
        m.speak(`First batch of ${total} aboard—twelve still on the listing deck!`, `第一批 ${total} 人已登艇，平台上还有十二人！`);
      }
    }
    return {
      phases: ['radio', 'platform', 'muster-a', 'muster-b', 'crane', 'muster-c', 'departure'],
      objective() {
        if (m.phase === 'radio') return text('Call the pilot cutter to the leeward side Reed marked', '按里德指出的背浪侧呼叫接应艇靠泊');
        if (m.phase === 'platform') return text('Cross the tilted platform and winch the cutter alongside', '穿过倾斜平台，操作绞盘接驳接应艇');
        if (m.phase === 'crane') return text('Crane boom collapsed! Reroute to the second boarding point via port catwalk', '吊臂坠落堵死梯口！改走左舷栈道前往第二处接驳点');
        if (m.phase === 'departure') return text('Take Old Hawk’s evacuation addendum and cast off with all 17', '收好老霍克交出的撤离回执附页，确认十七人后离泊');
        return text(`Evacuate the 17 workers in 5/6/6 batches (${rescued()}/17)`, `分 5／6／6 三批撤离十七名工人（${rescued()}/17）`);
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
          const label = last() === 'c'
            ? text('Board final 6 workers & Old Hawk (receives addendum)', '安排最后 6 人与老霍克登艇（接收撤离回执附页）')
            : text(`Send the next ${count} workers aboard`, `安排本批 ${count} 名工人登艇`);
          return [m.action(m.phase, label, () => evacuate(last()), { hold: 2.4 })];
        }
        return m.phase === 'departure' ? [m.action('departure-radio', text('Confirm all 17 aboard with Old Hawk’s addendum', '确认十七人全部上艇并收存回执附页'),
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
        if (m.phase === 'meet') return text('Dock silently and meet the nurse in the west cold-storage shed', '静默靠岸，到西侧冷雾库分诊棚找到护士');
        const index = stage();
        return text(`Escort the nurse through cold storage to the field clinic (${assembled[index]}/17 admitted)`,
          `经冷雾库护送护士到临时诊所（已核收 ${assembled[index]}/17 人）`);
      },
      actions() {
        if (m.phase === 'meet') return [m.action('nurse', text('Tell the nurse where the boat docked', '告知护士静默靠岸位置'), () => {
          m.advance('west', 'nurse');
          m.speak('Nurse: “Keep the lights low in cold storage. Clear each bulkhead before I cross.”', '护士：「冷雾库里别打草惊蛇。每过一道隔离门先帮我清出通道。」');
        })];
        const index = stage();
        if (index < 0) return [];
        const id = controls[index];
        return [m.action(id, index === 3 ? text('Witness Mara verify the 17th worker & receive Ward’s 05:50 tape', '见证玛拉核到第十七人并接收沃德 05:50 取消搜救录音') :
          text('Clear the cold-storage crossing for the nurse', '为护士打开冷雾库通道'), () => {
          if (index === 3) {
            m.speak('Mara: “Seventeen—all accounted for. And here’s the raw 05:50 tape: Ward personally cancelled the rescue boat.”',
              '玛拉：「第十七人核对完毕！还有这盘 05:50 原始录音——是沃德亲口下令取消搜救的。」');
            m.complete();
          } else {
            m.advance(segments[index + 1], id);
          }
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
        if (m.phase === 'approach') return text('Choose a dispatch tower entry: watch door, cable duct, or service lock', '选择调度塔入口：值班门、电缆孔或检修门');
        if (m.phase === 'search') return text(`Find the archivist & recover all 4 raw calls (${m.evidence.collected.length}/4)`,
          `找到记录员并找齐四段原始通话（${m.evidence.collected.length}/4）`);
        if (m.phase === 'order') return text(`Reconstruct the timeline to separate Reed’s & Anvil’s liability (${m.state.order?.length ?? 0}/4)`,
          `按时间复原四段通话，厘清里德与铁砧各自的责任（${m.state.order?.length ?? 0}/4）`);
        return text('Transmit the indexed recordings & liability brief', '发送复原后的原始录音与责任清单');
      },
      actions() {
        if (m.phase === 'approach') return routes.map(route => m.action('entry-' + route,
          text('Open tower access', '打开调度塔入口'), () => {
            m.advance('search', 'entry-' + route, { route });
            m.speak('Archivist: “I hid the four master reels before Anvil locked the tower—crack report, transfer order, rescue recall, and the intercept.”',
              '记录员：「铁砧封塔前我藏好了四盘母带：裂缝报告、转移授权、召回搜救艇和拦截命令。」');
          }));
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
              m.speak('Archivist: “Check the timestamps—start with the 05:21 crack report.”', '记录员：「核对时间戳——从 05:21 裂缝报告开始排。」');
            } else {
              if (order.length === 4) {
                m.speak('Timeline verified: Reed signed the 05:28 transfer cover-up; Anvil ordered the 06:13 transport shootdown. Upload it now!',
                  '时间线复原完毕：里德签发了 05:28 转移授权掩盖裂缝，铁砧下达了 06:13 拦截击落运输机命令！立刻发报！');
              }
              m.advance(order.length === 4 ? 'transmit' : 'order', 'console', { order });
            }
          }, { hold: .32, radius: .96 }));
        return m.phase === 'transmit' ? [m.action('record-upload', text('Transmit the verified master recordings', '发出复原后的四段原始录音'), m.complete)] : [];
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
          m.action('pick-bridge', text('Open the upper bridge (fast route)', '开启高架引航桥（快速路线）'),
            () => m.advance('escort','fork',{route:'bridge'})),
          m.action('rescue-workers', text('Free the stranded dock workers first', '先救出避险棚受困的码头工'),
            () => {
              m.effect({ sound: 'rail_log_radio', choice: 'lastPilotWorkersSaved' });
              m.advance('workers','rescue-workers',{route:'workers'});
            }),
        ];
        if (m.phase === 'workers') return [m.action('open-worker-route', text('Clear the service lock with the workers', '和工人们一起打开装卸通道'),
          () => m.advance('escort','open-worker-route'))];
        if (m.phase === 'escort') {
          const step = Number(m.state.handoffStep) || 0;
          const items = [
            text('Chart table 1/3 · Place 05:31 Receipt & 05:34 Handover', '海图桌 1/3 · 移交 05:31 撤离回执与 05:34 交接条'),
            text('Chart table 2/3 · Place Old Hawk’s Addendum & Ward’s 05:50 Tape', '海图桌 2/3 · 移交老霍克附页与沃德 05:50 录音'),
            text('Chart table 3/3 · Place Tower Master Reels & Sign Inquiry', '海图桌 3/3 · 移交调度塔四段母带并签署调查书'),
          ];
          return [m.action('harris-handoff', items[step] ?? items[2], () => {
            if (step === 0) {
              m.advance('escort', 'harris-handoff', { handoffStep: 1 });
              m.speak('Investigator: “First exhibit logged—the falsified departure roster. Keep going.”', '调查员：「第一组证物已登记——伪造的离港名单。请继续移交。」');
            } else if (step === 1) {
              m.advance('escort', 'harris-handoff', { handoffStep: 2 });
              m.speak('Investigator: “Hawk’s addendum and Ward’s 05:50 recall order logged. Place the tower reels.”', '调查员：「老霍克附页与沃德 05:50 召回录音已归档。移交最后四盘母带。」');
            } else {
              m.speak('Harris: “Every original is on the chart table. Berth 4 can finally reopen.”', '哈里斯：「全部原始证物都在海图桌上了。四号泊位终于能重新开航了。」');
              m.complete();
            }
          }, { allowed: m.followDone, hold: .55 })];
        }
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
          m.speak('The ship has cut off the causeway. Take Harris across the upper bridge, or free the trapped workers first.', '巨轮撞断主岸道！带哈里斯走高架引航桥，或先救出避险棚的被困工人！');
          m.effect({ sound:'rail_touchdown', shake:.48, pos:points.impact });
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
    const savedChoices = (() => {
      try { return JSON.parse(window.localStorage?.getItem('saltline.campaign.choices.v1') || '{}'); }
      catch { return {}; }
    })();
    return {
      phases: ['boots','castoff'],
      objective: () => m.phase === 'boots' ? text('Walk the morning quay, meet Mara & the survivors, and take Eli’s work boots', '漫步清晨港区，与玛拉和获救工友会合，取回伊莱的工靴') :
        text('Return the work boots to the boat and cast off for first departure', '将工靴归还上艇，解缆迎接首班出港'),
      actions: () => m.phase === 'boots' ? [m.action('boots', text('Take Eli Venn’s work boots from Mara', '从玛拉手中接过伊莱的工靴'), () => {
        m.advance('castoff','boots');
        const extra = savedChoices.drydockWorkersSaved && savedChoices.lastPilotWorkersSaved
          ? text('Mara: “Everyone you pulled out—from the drydock mechanics to the causeway crew—is on the pier today. Bring Eli’s boots aboard.”',
            '玛拉：「从旧船坞的两名维修工到引航站受困的工友，今天全都在码头送行。把伊莱的工靴带上艇吧。」')
          : savedChoices.drydockWorkersSaved
            ? text('Mara: “The drydock mechanics are back on shift because of you. Bring Eli’s boots aboard.”',
              '玛拉：「旧船坞那两名维修工今天回来当班了，都念着你的好。把伊莱的工靴带上艇吧。」')
            : text('Mara: “All seventeen made it home. Put his boots on the seat—he’ll want them.”',
              '玛拉：「十七个人全部平安回家了。把他的靴子带上艇吧，他回家用得着。」');
        m.speak(...extra);
      }, { hold: .7 })] : [m.action('cast-off', text('Return the boots & untie the bow line to depart', '归还工靴并解缆离港'), () => {
        m.speak('Control: “Berth 4 is open. All seventeen confirmed—full campaign complete.”', '指挥部：「四号泊位正式重新开航。十七人全员确认，全战役圆满完成。」');
        m.complete();
      })],
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
