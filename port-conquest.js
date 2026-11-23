/* Shared objective and reinforcement rules for Saltline's port battles. */
(() => {
  const RADIUS = 7;
  const HEIGHT = 3;
  const DURATION = 240;
  const START_TICKETS = 40;
  const SUPPORT_CAP = 12;
  const SUPPORTS = Object.freeze({ mark: 2, reinforce: 4, supply: 3 });
  const SUPPORT_DURATION = { mark: 15, reinforce: 18, supply: 3 };

  function nearby(position, point) {
    return Math.abs(position.y - point.y) <= HEIGHT &&
      Math.hypot(position.x - point.x, position.z - point.z) < RADIUS;
  }

  window.createPortConquest = (relays, { mode = 'conquest' } = {}) => {
    const breakthrough = mode === 'breakthrough';
    const points = relays.map(({ id, short, o }, index) => ({
      id, short, pos: o.pos, control: breakthrough || index === 0 ? -100 : 0,
      owner: breakthrough || index === 0 ? 'red' : null, contested: false,
      locked: breakthrough && index > 0, secured: false
    }));
    const tickets = { blue: START_TICKETS, red: breakthrough ? points.length : START_TICKETS };
    const support = {
      markUntil: 0, reinforceUntil: 0, supplyUntil: 0, reinforcePosition: null
    };
    let sector = 0;
    let supportPoints = 3;
    let elapsed = 0;
    let winner = null;
    let respawnAt = null;
    let deaths = 0;

    function finish() {
      if (breakthrough) {
        if (sector >= points.length) winner = 'blue';
        else if (!tickets.blue || elapsed >= DURATION) winner = 'red';
        return;
      }
      if (!tickets.blue && !tickets.red) winner = 'draw';
      else if (!tickets.blue) winner = 'red';
      else if (!tickets.red) winner = 'blue';
      else if (elapsed >= DURATION) {
        winner = tickets.blue === tickets.red ? 'draw' : tickets.blue > tickets.red ? 'blue' : 'red';
      }
    }

    function awardSupport(amount) {
      supportPoints = Math.min(SUPPORT_CAP, supportPoints + amount);
    }

    finish();
    return {
      points, tickets, support, supportCosts: SUPPORTS,
      mode: breakthrough ? 'breakthrough' : 'conquest',
      get activePoint() { return breakthrough && !winner ? points[sector] ?? null : null; },
      get supportPoints() { return supportPoints; },
      get elapsed() { return elapsed; },
      get remaining() { return Math.max(0, DURATION - elapsed); },
      get winner() { return winner; },
      get deaths() { return deaths; },
      get respawning() { return respawnAt !== null; },
      near(position) { return points.find(point => nearby(position, point.pos)); },
      useSupport(kind, position) {
        if (winner || respawnAt !== null || !Object.hasOwn(SUPPORTS, kind)) return false;
        const durationKey = kind + 'Until';
        if (supportPoints < SUPPORTS[kind] || support[durationKey] > elapsed) return false;
        if (kind === 'reinforce') {
          const point = position && points.find(point => !point.locked && !point.secured && nearby(position, point.pos));
          if (!point) return false;
          support.reinforcePosition = point.pos;
        }
        supportPoints -= SUPPORTS[kind];
        support[durationKey] = elapsed + SUPPORT_DURATION[kind];
        return true;
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
        awardSupport(1);
        if (!breakthrough) tickets.red = Math.max(0, tickets.red - 1);
        finish();
      },
      update(dt, player, machines, allies = []) {
        if (winner || !Number.isFinite(dt) || dt <= 0) return { captures: [], respawn: false };
        const previousElapsed = elapsed;
        if (breakthrough) dt = Math.min(dt, DURATION - previousElapsed);
        elapsed += dt;
        const captures = [];
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
            captures.push(point);
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
        const respawn = !winner && respawnAt !== null && elapsed >= respawnAt;
        if (respawn) respawnAt = null;
        return { captures, respawn };
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
