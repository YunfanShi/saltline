/* Shared objective and reinforcement rules for Saltline's port battles. */
(() => {
  const RADIUS = 7;
  const HEIGHT = 3;
  const DURATION = 240;
  const START_TICKETS = 40;
  const SUPPORT_CAP = 12;
  const SUPPORTS = Object.freeze({
    mark: 2, reinforce: 4, supply: 3, smoke: 4, artillery: 7,
    vehicle: 6, motorcycle: 2, ifv: 6, aa: 6, tank: 8, helicopter: 8, jet: 9,
  });
  const SUPPORT_DURATION = {
    mark: 15, reinforce: 18, supply: 3, smoke: 22, artillery: 35,
    vehicle: 45, motorcycle: 20, ifv: 50, aa: 45, tank: 65, helicopter: 60, jet: 70,
  };
  const SMOKE_RADIUS = 6;
  const FIRST_EVENT = 35;
  const EVENT_COOLDOWN = 28;
  const EVENT_WARNING = 5;
  const BOMBARDMENT_RADIUS = 7;
  const BOMBARDMENT_OFFSETS = [[0, 0], [3, -2]];

  function nearby(position, point) {
    return Math.abs(position.y - point.y) <= HEIGHT &&
      Math.hypot(position.x - point.x, position.z - point.z) < RADIUS;
  }

  const VALID_MODES = new Set(['conquest', 'breakthrough', 'coop_rescue', 'coop_campaign', 'sandbox']);

  window.createPortConquest = (relays, {
    mode = 'conquest', duration = DURATION, startingTickets = START_TICKETS, majorEvents = false,
  } = {}) => {
    const activeMode = VALID_MODES.has(mode) ? mode : 'conquest';
    if (![180, 240, 360].includes(duration)) duration = DURATION;
    if (![25, 40, 70].includes(startingTickets)) startingTickets = START_TICKETS;
    const breakthrough = activeMode === 'breakthrough';
    const coopRescue = activeMode === 'coop_rescue';
    const coopCampaign = activeMode === 'coop_campaign';
    const sandbox = activeMode === 'sandbox';
    const sequential = breakthrough || coopCampaign;
    const rescueTarget = coopRescue ? Math.max(4, relays.length * 2) : 0;
    const points = relays.map(({ id, short, o }, index) => ({
      id, short, pos: o.pos, control: sequential || index === 0 ? -100 : 0,
      owner: sequential || index === 0 ? 'red' : null, contested: false,
      locked: sequential && index > 0, secured: false
    }));
    const blueStart = coopCampaign ? startingTickets + 20 : startingTickets;
    const tickets = {
      blue: blueStart,
      red: sequential ? points.length : (coopRescue ? rescueTarget : startingTickets),
    };
    const support = {
      markUntil: 0, reinforceUntil: 0, supplyUntil: 0, reinforcePosition: null,
      smokeUntil: 0, smokePosition: null, artilleryUntil: 0, artillery: null,
      vehicleUntil: 0, motorcycleUntil: 0, ifvUntil: 0, aaUntil: 0, tankUntil: 0, helicopterUntil: 0, jetUntil: 0,
    };
    let sector = 0;
    let rescued = 0;
    let supportPoints = sandbox ? SUPPORT_CAP : 3;
    let elapsed = 0;
    let localTime = 0;
    let winner = null;
    let respawnAt = null;
    let deaths = 0;
    let kills = 0;
    let captures = 0;
    let majorEvent = null;
    let nextEventAt = FIRST_EVENT;
    let nextEventKind = 'counterattack';
    const eventSignals = [];

    function finish() {
      if (sandbox) return;
      if (sequential) {
        if (sector >= points.length) winner = 'blue';
        else if (!tickets.blue || elapsed >= duration) winner = 'red';
        return;
      }
      if (coopRescue) {
        tickets.red = Math.max(0, rescueTarget - rescued);
        if (rescued >= rescueTarget) winner = 'blue';
        else if (!tickets.blue || elapsed >= duration) winner = 'red';
        return;
      }
      if (!tickets.blue && !tickets.red) winner = 'draw';
      else if (!tickets.blue) winner = 'red';
      else if (!tickets.red) winner = 'blue';
      else if (elapsed >= duration) {
        winner = tickets.blue === tickets.red ? 'draw' : tickets.blue > tickets.red ? 'blue' : 'red';
      }
    }

    function awardSupport(amount) {
      supportPoints = Math.min(SUPPORT_CAP, supportPoints + amount);
    }

    function sendEventSignal(action, pos = majorEvent.point.pos) {
      const { kind, point, radius } = majorEvent;
      eventSignals.push({ action, kind, point, pos, radius });
    }

    function advanceMajorEvent() {
      if (!majorEvents || sandbox) return;
      if (majorEvent) {
        if (winner || sequential && majorEvent.point !== points[sector]) {
          sendEventSignal('end');
          majorEvent = null;
          nextEventAt = elapsed + EVENT_COOLDOWN;
          return;
        }
        if (elapsed >= majorEvent.warningUntil) {
          if (!majorEvent.started) {
            majorEvent.started = true;
            sendEventSignal('start');
          }
          if (majorEvent.kind === 'bombardment') {
            while (majorEvent.pulse < BOMBARDMENT_OFFSETS.length &&
              elapsed >= majorEvent.warningUntil + majorEvent.pulse * 3) {
              const [dx, dz] = BOMBARDMENT_OFFSETS[majorEvent.pulse++];
              const { x, y, z } = majorEvent.point.pos;
              sendEventSignal('impact', { x: x + dx, y, z: z + dz });
            }
          }
        }
        if (elapsed >= majorEvent.endsAt) {
          sendEventSignal('end');
          majorEvent = null;
        }
        return;
      }
      if (winner || elapsed < nextEventAt) return;
      // Conquest defenders react to a Blue-held point. Sequential modes always
      // keep the pressure on the one sector the team can currently take.
      const target = sequential ? points[sector] : points
        .filter(point => point.owner === 'blue')
        .sort((a, b) => Number(b.contested) - Number(a.contested) || a.control - b.control)[0];
      if (!target) {
        nextEventAt = elapsed + 8;
        return;
      }
      const kind = nextEventKind;
      const warningUntil = elapsed + EVENT_WARNING;
      const endsAt = warningUntil + (kind === 'counterattack' ? 12 : 5);
      majorEvent = {
        kind, point: target, warningUntil, endsAt,
        radius: kind === 'bombardment' ? BOMBARDMENT_RADIUS : RADIUS,
        started: false, pulse: 0,
      };
      nextEventAt = endsAt + EVENT_COOLDOWN;
      nextEventKind = kind === 'counterattack' ? 'bombardment' : 'counterattack';
      sendEventSignal('warning');
    }

    finish();
    return {
      points, tickets, support, supportCosts: SUPPORTS,
      mode: activeMode,
      get activePoint() { return sequential && !winner ? points[sector] ?? null : null; },
      get rescued() { return rescued; },
      get rescueTarget() { return rescueTarget; },
      get supportPoints() { return supportPoints; },
      get elapsed() { return elapsed; },
      get remaining() { return sandbox ? duration : Math.max(0, duration - elapsed); },
      get winner() { return winner; },
      get deaths() { return deaths; },
      get kills() { return kills; },
      get captures() { return captures; },
      get respawning() { return respawnAt !== null; },
      get majorEvent() { return winner ? null : majorEvent; },
      takeMajorEventSignals() {
        const signals = eventSignals.splice(0);
        return winner ? signals.filter(signal => signal.action === 'end') : signals;
      },
      near(position) { return points.find(point => nearby(position, point.pos)); },
      exportSharedState() {
        return {
          mode: activeMode, elapsed, winner, sector, rescued, rescueTarget,
          tickets: { ...tickets },
          points: points.map(({ owner, control, contested, locked, secured }) =>
            ({ owner, control, contested, locked, secured })),
        };
      },
      applySharedState(state) {
        if (!state || state.mode !== activeMode ||
          !Number.isFinite(state.elapsed) || state.elapsed < 0 || (!sandbox && state.elapsed > duration) ||
          ![null, 'blue', 'red', 'draw'].includes(state.winner) ||
          !Number.isInteger(state.sector) || state.sector < 0 || state.sector > points.length ||
          !state.tickets || !['blue', 'red'].every(team => Number.isFinite(state.tickets[team]) && state.tickets[team] >= 0) ||
          !Array.isArray(state.points) || state.points.length !== points.length ||
          !state.points.every(point => point && [null, 'blue', 'red'].includes(point.owner) &&
            Number.isFinite(point.control) && point.control >= -100 && point.control <= 100 &&
            ['contested', 'locked', 'secured'].every(key => typeof point[key] === 'boolean'))) return false;
        elapsed = state.elapsed;
        winner = state.winner;
        sector = state.sector;
        if (Number.isFinite(state.rescued)) rescued = Math.max(0, state.rescued);
        tickets.blue = state.tickets.blue;
        tickets.red = state.tickets.red;
        points.forEach((point, index) => {
          const shared = state.points[index];
          for (const key of ['owner', 'control', 'contested', 'locked', 'secured']) point[key] = shared[key];
        });
        return true;
      },
      updateGuest(dt) {
        if (winner || !Number.isFinite(dt) || dt <= 0) return { captures: [], respawn: false };
        elapsed = sandbox ? elapsed + dt : Math.min(duration, elapsed + dt);
        localTime += dt;
        if (sandbox) supportPoints = SUPPORT_CAP;
        const respawn = respawnAt !== null && localTime >= respawnAt;
        if (respawn) respawnAt = null;
        return { captures: [], respawn };
      },
      useSupport(kind, position, targetId, deployVehicle) {
        if (winner || respawnAt !== null || !Object.hasOwn(SUPPORTS, kind)) return false;
        const durationKey = kind + 'Until';
        if (supportPoints < SUPPORTS[kind] || support[durationKey] > elapsed) return false;
        if (deployVehicle && !deployVehicle()) return false;
        if (kind === 'reinforce') {
          const point = position && points.find(point => !point.locked && !point.secured && nearby(position, point.pos));
          if (!point) return false;
          support.reinforcePosition = point.pos;
        }
        if (kind === 'smoke' || kind === 'artillery') {
          const point = points.find(candidate => candidate.id === targetId && !candidate.locked);
          if (!point || kind === 'artillery' && point.owner === 'blue') return false;
          if (kind === 'smoke') support.smokePosition = point.pos;
          else support.artillery = { position: point.pos, next: elapsed + 5, remaining: 4 };
        }
        if (!sandbox) supportPoints -= SUPPORTS[kind];
        support[durationKey] = elapsed + (sandbox ? Math.min(4, SUPPORT_DURATION[kind]) : SUPPORT_DURATION[kind]);
        return true;
      },
      smokeBlocks(from, to) {
        if (elapsed >= support.smokeUntil) return false;
        const point = support.smokePosition;
        const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
        const length = dx * dx + dy * dy + dz * dz;
        const height = point.y + 1.5;
        const projection = length ? ((point.x - from.x) * dx + (height - from.y) * dy +
          (point.z - from.z) * dz) / length : 0;
        const t = Math.min(1, Math.max(0, projection));
        return Math.hypot(from.x + t * dx - point.x, from.y + t * dy - height,
          from.z + t * dz - point.z) < SMOKE_RADIUS;
      },
      takeArtilleryImpacts() {
        const barrage = support.artillery;
        const impacts = [];
        while (!winner && barrage?.remaining && elapsed >= barrage.next) {
          impacts.push(barrage.position);
          barrage.remaining--;
          barrage.next += 3;
        }
        return impacts;
      },
      casualty({ affectsTickets = true, team = 'blue' } = {}) {
        if (winner || respawnAt !== null) return;
        deaths++;
        if (!sandbox && affectsTickets && (team === 'blue' || (!sequential && !coopRescue))) {
          tickets[team] = Math.max(0, tickets[team] - (coopCampaign ? 3 : 4));
          finish();
        }
        respawnAt = localTime + 3;
      },
      killedMachine({ affectsTickets = true } = {}) {
        if (winner) return;
        kills++;
        awardSupport(1);
        if (coopRescue && kills % 3 === 0) {
          rescued = Math.min(rescueTarget, rescued + 1);
          finish();
          return;
        }
        if (!sandbox && affectsTickets) {
          if (!sequential && !coopRescue) tickets.red = Math.max(0, tickets.red - 1);
          finish();
        }
      },
      update(dt, player, machines, allies = []) {
        if (winner || !Number.isFinite(dt) || dt <= 0) return { captures: [], respawn: false };
        const previousElapsed = elapsed;
        dt = sandbox ? dt : Math.min(dt, duration - previousElapsed);
        elapsed += dt;
        localTime += dt;
        if (sandbox) supportPoints = SUPPORT_CAP;
        const capturedPoints = [];
        for (const point of sequential ? [points[sector]] : points) {
          if (!point) continue;
          const fullPresence = (player.alive && player.pos && nearby(player.pos, point.pos)) ||
            allies.some(ally => ally.alive && ally.pos && nearby(ally.pos, point.pos));
          const reinforcementTime = support.reinforcePosition === point.pos ?
            Math.min(dt, Math.max(0, support.reinforceUntil - previousElapsed)) : 0;
          const blueTime = fullPresence ? dt : reinforcementTime;
          const red = machines.some(machine => machine.alive && machine.pos && nearby(machine.pos, point.pos));
          point.contested = red && (fullPresence || reinforcementTime > 0 && support.reinforceUntil > elapsed);
          const controlTime = red ? blueTime - dt : blueTime;
          if (!controlTime) continue;
          const before = point.owner;
          point.control = Math.min(100, Math.max(-100, point.control + 13 * controlTime));
          if (point.owner === 'red' && point.control >= 0 || point.owner === 'blue' && point.control <= 0) point.owner = null;
          if (point.control >= 99.999) point.owner = 'blue';
          if (point.control <= -99.999) point.owner = 'red';
          if (point.owner === 'blue' && before !== 'blue') {
            capturedPoints.push(point);
            captures++;
            awardSupport(coopCampaign ? 4 : 3);
            if (sequential) {
              point.secured = true;
              sector++;
              tickets.red = points.length - sector;
              if (points[sector]) points[sector].locked = false;
            } else if (coopRescue) {
              rescued = Math.min(rescueTarget, rescued + 2);
              tickets.red = Math.max(0, rescueTarget - rescued);
            }
          }
        }
        if (!sequential && !coopRescue && !sandbox) {
          const majority = points.reduce((sum, point) => sum + (point.owner === 'blue' ? 1 : point.owner === 'red' ? -1 : 0), 0);
          if (majority > 0) tickets.red = Math.max(0, tickets.red - majority * .85 * dt);
          if (majority < 0) tickets.blue = Math.max(0, tickets.blue + majority * .85 * dt);
        }
        finish();
        advanceMajorEvent();
        const respawn = !winner && respawnAt !== null && localTime >= respawnAt;
        if (respawn) respawnAt = null;
        return { captures: capturedPoints, respawn };
      }
    };
  };

  window.portConquestLabel = game => {
    const seconds = Math.ceil(game.remaining);
    const time = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    const marks = game.points.map(point => point.short + ' ' + (point.locked ? '×' : point.contested ? '!' :
      point.owner === 'blue' ? '▲' : point.owner === 'red' ? '▼' : '·')).join('  ');
    return { blue: Math.ceil(game.tickets.blue), red: Math.ceil(game.tickets.red), time, marks };
  };
})();
