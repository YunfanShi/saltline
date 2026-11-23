/* IRONFRONT's contested capture and majority ticket bleed, scaled to Saltline's berth. */
(() => {
  const RADIUS = 7;
  const HEIGHT = 3;
  const DURATION = 240;
  const START_TICKETS = 40;

  function nearby(position, point) {
    return Math.abs(position.y - point.y) <= HEIGHT &&
      Math.hypot(position.x - point.x, position.z - point.z) < RADIUS;
  }

  window.createPortConquest = (relays) => {
    const points = relays.map(({ id, short, o }, index) => ({
      id, short, pos: o.pos, control: index === 0 ? -100 : 0,
      owner: index === 0 ? 'red' : null, contested: false
    }));
    const tickets = { blue: START_TICKETS, red: START_TICKETS };
    let elapsed = 0;
    let winner = null;
    let respawnAt = null;
    let deaths = 0;

    function finish() {
      if (!tickets.blue && !tickets.red) winner = 'draw';
      else if (!tickets.blue) winner = 'red';
      else if (!tickets.red) winner = 'blue';
      else if (elapsed >= DURATION) {
        winner = tickets.blue === tickets.red ? 'draw' : tickets.blue > tickets.red ? 'blue' : 'red';
      }
    }

    return {
      points, tickets,
      get elapsed() { return elapsed; },
      get remaining() { return Math.max(0, DURATION - elapsed); },
      get winner() { return winner; },
      get deaths() { return deaths; },
      get respawning() { return respawnAt !== null; },
      near(position) { return points.find(point => nearby(position, point.pos)); },
      casualty() {
        if (winner || respawnAt !== null) return;
        deaths++;
        tickets.blue = Math.max(0, tickets.blue - 4);
        respawnAt = elapsed + 3;
        finish();
      },
      killedMachine() {
        if (winner) return;
        tickets.red = Math.max(0, tickets.red - 1);
        finish();
      },
      update(dt, player, machines) {
        if (winner) return { captures: [], respawn: false };
        elapsed += dt;
        const captures = [];
        for (const point of points) {
          const blue = player.alive && nearby(player.pos, point.pos);
          const red = machines.some(machine => machine.alive && machine.pos && nearby(machine.pos, point.pos));
          point.contested = blue && red;
          if (blue === red) continue;
          const before = point.owner;
          point.control = Math.min(100, Math.max(-100, point.control + (blue ? 1 : -1) * 13 * dt));
          if (point.owner === 'red' && point.control >= 0 || point.owner === 'blue' && point.control <= 0) point.owner = null;
          if (point.control >= 99.999) point.owner = 'blue';
          if (point.control <= -99.999) point.owner = 'red';
          if (point.owner === 'blue' && before !== 'blue') captures.push(point);
        }
        const majority = points.reduce((sum, point) => sum + (point.owner === 'blue' ? 1 : point.owner === 'red' ? -1 : 0), 0);
        if (majority > 0) tickets.red = Math.max(0, tickets.red - majority * .85 * dt);
        if (majority < 0) tickets.blue = Math.max(0, tickets.blue + majority * .85 * dt);
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
    const marks = game.points.map(point => point.short + ' ' + (point.contested ? '!' :
      point.owner === 'blue' ? '▲' : point.owner === 'red' ? '▼' : '·')).join('  ');
    return { blue: Math.ceil(game.tickets.blue), red: Math.ceil(game.tickets.red), time, marks };
  };
})();
