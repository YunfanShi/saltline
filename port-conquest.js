/* Shared objective and reinforcement rules for Saltline's port battles. */
(() => {
  const RADIUS = 7;
  const HEIGHT = 3;
  const DURATION = 240;
  const START_TICKETS = 40;
  const SUPPORT_CAP = 12;
  const SUPPORTS = Object.freeze({ mark: 2, reinforce: 4, supply: 3, smoke: 4, artillery: 7 });
  const SUPPORT_DURATION = { mark: 15, reinforce: 18, supply: 3, smoke: 22, artillery: 35 };
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

  window.createPortConquest = (relays, {
    mode = 'conquest', duration = DURATION, startingTickets = START_TICKETS, majorEvents = false,
  } = {}) => {
    if (![180, 240, 360].includes(duration)) duration = DURATION;
    if (![25, 40, 70].includes(startingTickets)) startingTickets = START_TICKETS;
    const breakthrough = mode === 'breakthrough';
    const points = relays.map(({ id, short, o }, index) => ({
      id, short, pos: o.pos, control: breakthrough || index === 0 ? -100 : 0,
      owner: breakthrough || index === 0 ? 'red' : null, contested: false,
      locked: breakthrough && index > 0, secured: false
    }));
    const tickets = { blue: startingTickets, red: breakthrough ? points.length : startingTickets };
    const support = {
      markUntil: 0, reinforceUntil: 0, supplyUntil: 0, reinforcePosition: null,
      smokeUntil: 0, smokePosition: null, artilleryUntil: 0, artillery: null,
    };
    let sector = 0;
    let supportPoints = 3;
    let elapsed = 0;
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
      if (breakthrough) {
        if (sector >= points.length) winner = 'blue';
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
      if (!majorEvents) return;
      if (majorEvent) {
        if (winner || breakthrough && majorEvent.point !== points[sector]) {
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
      // Conquest defenders react to a Blue-held point. Breakthrough always
      // keeps the pressure on the one sector the player can currently take.
      const target = breakthrough ? points[sector] : points
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
      mode: breakthrough ? 'breakthrough' : 'conquest',
      get activePoint() { return breakthrough && !winner ? points[sector] ?? null : null; },
      get supportPoints() { return supportPoints; },
      get elapsed() { return elapsed; },
      get remaining() { return Math.max(0, duration - elapsed); },
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
      useSupport(kind, position, targetId) {
        if (winner || respawnAt !== null || !Object.hasOwn(SUPPORTS, kind)) return false;
        const durationKey = kind + 'Until';
        if (supportPoints < SUPPORTS[kind] || support[durationKey] > elapsed) return false;
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
        supportPoints -= SUPPORTS[kind];
        support[durationKey] = elapsed + SUPPORT_DURATION[kind];
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
      casualty() {
        if (winner || respawnAt !== null) return;
        deaths++;
        tickets.blue = Math.max(0, tickets.blue - 4);
        respawnAt = elapsed + 3;
        finish();
      },
      killedMachine() {
        if (winner) return;
        kills++;
        awardSupport(1);
        if (!breakthrough) tickets.red = Math.max(0, tickets.red - 1);
        finish();
      },
      update(dt, player, machines, allies = []) {
        if (winner || !Number.isFinite(dt) || dt <= 0) return { captures: [], respawn: false };
        const previousElapsed = elapsed;
        dt = Math.min(dt, duration - previousElapsed);
        elapsed += dt;
        const capturedPoints = [];
        for (const point of breakthrough ? [points[sector]] : points) {
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
            awardSupport(3);
            if (breakthrough) {
              point.secured = true;
              sector++;
              tickets.red = points.length - sector;
              if (points[sector]) points[sector].locked = false;
            }
          }
        }
        if (!breakthrough) {
          const majority = points.reduce((sum, point) => sum + (point.owner === 'blue' ? 1 : point.owner === 'red' ? -1 : 0), 0);
          if (majority > 0) tickets.red = Math.max(0, tickets.red - majority * .85 * dt);
          if (majority < 0) tickets.blue = Math.max(0, tickets.blue + majority * .85 * dt);
        }
        finish();
        advanceMajorEvent();
        const respawn = !winner && respawnAt !== null && elapsed >= respawnAt;
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
