(() => {
  const SUPPORT = [
    { key: '5', type: 'mark', en: 'Recon', zh: '侦察' },
    { key: '6', type: 'reinforce', en: 'Reinforce', zh: '增援' },
    { key: '7', type: 'supply', en: 'Supply', zh: '补给' },
  ];
  const t = (english, chinese) => window.SaltlineLocale?.t(english, chinese) ?? english;

  window.createPortOperations = ({ world, onSupport }) => {
    const panel = document.createElement('section');
    panel.className = 'port-operations';
    panel.dataset.noLocalize = '';
    panel.hidden = true;
    const map = document.createElement('canvas');
    map.width = 520;
    map.height = 390;
    map.className = 'port-operations-map';
    map.hidden = true;
    const bar = document.createElement('div');
    bar.className = 'port-operations-bar';
    const mapButton = document.createElement('button');
    mapButton.type = 'button';
    mapButton.setAttribute('aria-expanded', 'false');
    const buttons = new Map();
    const credits = document.createElement('span');
    bar.append(mapButton, credits);
    for (const support of SUPPORT) {
      const button = document.createElement('button');
      button.type = 'button';
      button.addEventListener('click', () => onSupport(support.type));
      buttons.set(support.type, button);
      bar.append(button);
    }
    panel.append(map, bar);
    document.getElementById('app').append(panel);

    const context = map.getContext('2d');
    const base = document.createElement('canvas');
    base.width = map.width;
    base.height = map.height;
    const terrain = base.getContext('2d');
    const bounds = world.physics.bounds;
    const extent = {
      minX: Math.max(bounds.min.x, -40), maxX: Math.min(bounds.max.x, 32),
      minZ: Math.max(bounds.min.z, -30), maxZ: Math.min(bounds.max.z, 30),
    };
    const project = position => [
      16 + (position.x - extent.minX) * (map.width - 32) / (extent.maxX - extent.minX),
      16 + (position.z - extent.minZ) * (map.height - 32) / (extent.maxZ - extent.minZ),
    ];
    terrain.fillStyle = '#10191e';
    terrain.fillRect(0, 0, map.width, map.height);
    terrain.strokeStyle = '#20343c';
    terrain.lineWidth = 1;
    for (let x = -40; x <= 32; x += 8) {
      const [a, b] = project({x, z: extent.minZ});
      terrain.beginPath();terrain.moveTo(a, b);terrain.lineTo(a, map.height - 16);terrain.stroke();
    }
    for (let z = -30; z <= 30; z += 6) {
      const [a, b] = project({x: extent.minX, z});
      terrain.beginPath();terrain.moveTo(a, b);terrain.lineTo(map.width - 16, b);terrain.stroke();
    }
    terrain.fillStyle = '#31454e';
    for (const box of world.physics.boxes) {
      if (box.noNav || box.bulletOnly || box.min.y > 2 || box.max.y < .6) continue;
      const [x, y] = project(box.min);
      const [right, bottom] = project(box.max);
      if (right - x > map.width * .85 && bottom - y > map.height * .85) continue;
      terrain.fillRect(x, y, Math.max(1, right - x), Math.max(1, bottom - y));
    }

    function toggleMap() {
      if (panel.hidden) return;
      map.hidden = !map.hidden;
      mapButton.setAttribute('aria-expanded', String(!map.hidden));
      lastUpdate = -Infinity;
    }
    mapButton.addEventListener('click', toggleMap);
    panel.addEventListener('pointerdown', event => event.stopPropagation());
    let lastUpdate = -Infinity;
    let round = null;
    let active = false;

    function keydown(event) {
      if (!active || event.repeat || event.ctrlKey || event.altKey || event.metaKey ||
          /^(INPUT|SELECT|TEXTAREA)$/.test(event.target?.tagName)) return;
      if (event.code === 'KeyM') {
        event.preventDefault();
        toggleMap();
      }
      const item = SUPPORT.find(item => 'Digit' + item.key === event.code);
      if (item) {
        event.preventDefault();
        onSupport(item.type);
      }
    }
    document.addEventListener('keydown', keydown);

    function dot(position, color, radius) {
      const [x, y] = project(position);
      context.beginPath();context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = color;context.fill();
      return [x, y];
    }

    return {
      show(next) {
        active = Boolean(next);
        panel.hidden = !active;
        if (!active) {
          map.hidden = true;
          mapButton.setAttribute('aria-expanded', 'false');
        }
        if (round !== next) lastUpdate = -Infinity;
        round = next;
      },
      update(game, player, enemies) {
        if (!active || game.elapsed < lastUpdate + .12) return;
        lastUpdate = game.elapsed;
        mapButton.textContent = t('M Map', 'M 地图');
        const support = game.support;
        credits.textContent = t('RP ', '支援点 ') + game.supportPoints;
        for (const item of SUPPORT) {
          const button = buttons.get(item.type);
          button.textContent = item.key + ' ' + t(item.en, item.zh) + ' ' + game.supportCosts[item.type];
          button.disabled = !player.alive || game.supportPoints < game.supportCosts[item.type] ||
            (support[item.type + 'Until'] ?? 0) > game.elapsed;
        }
        if (map.hidden || !context) return;
        context.drawImage(base, 0, 0);
        context.font = 'bold 15px system-ui';
        for (const point of game.points) {
          const color = point.contested ? '#ffc271' : point.locked ? '#758691' :
            point.owner === 'blue' ? '#64d5ff' : point.owner === 'red' ? '#ff796a' : '#eeeeee';
          const [x, y] = dot(point.pos, color, 8);
          context.fillStyle = color;context.fillText(point.short, x + 12, y + 5);
        }
        if (support.markUntil > game.elapsed) {
          for (const enemy of enemies) if (enemy.alive && enemy.pos) dot(enemy.pos, '#ff796a', 4);
        }
        if (support.reinforceUntil > game.elapsed && support.reinforcePosition) {
          dot(support.reinforcePosition, '#9afdde', 5);
        }
        const [x, y] = dot(player.pos, '#64d5ff', 5);
        const yaw = player.yaw || 0;
        context.beginPath();context.moveTo(x, y);
        context.lineTo(x - Math.sin(yaw) * 13, y - Math.cos(yaw) * 13);
        context.strokeStyle = '#edfaff';context.lineWidth = 2;context.stroke();
      },
    };
  };
})();
