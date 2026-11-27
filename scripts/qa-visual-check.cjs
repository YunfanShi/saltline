#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const net = require('net');
const os = require('os');
const { spawn } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.resolve(process.argv[2] || path.join(ROOT_DIR, 'docs/world-review/qa-latest'));

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.cjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

function findChromeBinary() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || null;
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = (req.url || '/').split('?')[0];
      let relPath = decodeURIComponent(urlPath);
      if (relPath === '/' || relPath === '') relPath = '/index.html';
      const safePath = path.normalize(relPath).replace(/^(\.\.[/\\])+/, '');
      const filePath = path.join(ROOT_DIR, safePath);
      if (!filePath.startsWith(ROOT_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }
      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) { res.writeHead(404); res.end('Not Found'); return; }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
        fs.createReadStream(filePath).pipe(res);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForCdpTarget(cdpPort, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
      if (res.ok) {
        const targets = await res.json();
        const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (page) return page.webSocketDebuggerUrl;
      }
    } catch (_) {}
    await sleep(200);
  }
  throw new Error('CDP timeout');
}

function createCdpClient(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let nextId = 1;
    const pending = new Map();
    const consoleErrors = [];
    ws.addEventListener('open', () => {
      resolve({
        send(method, params = {}) {
          const id = nextId++;
          return new Promise((res, rej) => {
            const timer = setTimeout(() => { pending.delete(id); rej(new Error(`CDP timeout: ${method}`)); }, 30000);
            pending.set(id, {
              resolve: (val) => { clearTimeout(timer); res(val); },
              reject: (err) => { clearTimeout(timer); rej(err); },
            });
            ws.send(JSON.stringify({ id, method, params }));
          });
        },
        consoleErrors,
        close() { try { ws.close(); } catch (_) {} },
      });
    });
    ws.addEventListener('message', (event) => {
      let msg;
      try { msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString()); } catch (_) { return; }
      if (msg.id && pending.has(msg.id)) {
        const { resolve: res, reject: rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(`CDP Error (${msg.error.code}): ${msg.error.message}`));
        else res(msg.result);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(msg.params?.exceptionDetails?.exception?.description || msg.params?.exceptionDetails?.text || 'Unknown exception');
      }
    });
    ws.addEventListener('error', (err) => reject(err));
  });
}

async function evalJs(cdp, expression) {
  const res = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text || 'JS eval error');
  return res.result?.value;
}

async function main() {
  const chromePath = findChromeBinary();
  if (!chromePath) throw new Error('Chrome not found');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { server, port: httpPort } = await startStaticServer();
  const cdpPort = await getFreePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'saltline-qa-'));

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1280,720',
    '--force-device-scale-factor=1',
    '--enable-webgl', '--mute-audio', '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--autoplay-policy=no-user-gesture-required',
    '--no-first-run', '--no-default-browser-check',
    'about:blank',
  ], { stdio: 'ignore' });

  let cdp = null;
  try {
    const wsUrl = await waitForCdpTarget(cdpPort);
    cdp = await createCdpClient(wsUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });

    const bootT0 = Date.now();
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/index.html?mode=openworld&autostart=1&q=medium&seed=4207&noaudio=1` });

    for (let i = 0; i < 60; i++) {
      await sleep(500);
      const st = await evalJs(cdp, `({ ready: Boolean(window.__ready), hasG: Boolean(window.__G), fatal: window.__fatal || null })`);
      if (st?.fatal) throw new Error(st.fatal);
      if (st?.ready && st?.hasG) break;
    }
    const worldBootMs = Date.now() - bootT0;
    const metrics = [];
    const samplePerf = () => evalJs(cdp, `new Promise(resolve => {
      let prev, frames = 0, calls = 0, tris = 0;
      const deltas = [];
      function tick(now) {
        if (prev !== undefined) {
          deltas.push(now - prev);
          const st = typeof SALTLINE_GET_STATS === 'function' ? SALTLINE_GET_STATS() : {};
          calls += st.drawCalls || 0; tris += st.triangles || 0;
          if (++frames >= 20) {
            const avgMs = deltas.reduce((a, b) => a + b, 0) / deltas.length;
            resolve({ fps: Number((1000 / Math.max(0.1, avgMs)).toFixed(1)), frameMs: Number(avgMs.toFixed(1)), drawCalls: Math.round(calls / frames), triangles: Math.round(tris / frames) });
            return;
          }
        }
        prev = now; requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    })`);
    const snap = async (filename, label, loadMs = null) => {
      await sleep(650);
      const perf = await samplePerf();
      const s = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 88 });
      fs.writeFileSync(path.join(OUT_DIR, filename), Buffer.from(s.data, 'base64'));
      metrics.push({ file: filename, label, loadMs, ...perf });
      console.log(`📸 ${filename} | ${label} | FPS: ${perf.fps} | DC: ${perf.drawCalls} | Tris: ${perf.triangles}${loadMs != null ? ` | Load: ${loadMs}ms` : ''}`);
    };

    const ch1Info = await evalJs(cdp, `(async () => {
      __G.campaignV2.startChapter('ch01', { skipCutscene: true });
      await new Promise(r => setTimeout(r, 2400));
      let maraPos = null, maraYaw = 0;
      __G.scene.traverse(n => { if (n.name === 'cast-mara') { maraPos = [n.position.x, n.position.y, n.position.z]; maraYaw = n.rotation.y; } });
      __G.openWorld.setPhotoMode(true);
      __G.player.enabled = false;
      __G.weapon.setVisible(false);
      return { maraPos, maraYaw };
    })()`);

    if (ch1Info?.maraPos) {
      const [mx, my, mz] = ch1Info.maraPos;
      await evalJs(cdp, `__setShot({ cam: "${mx - 2.6},${my + 1.55},${mz + 3.2},${mx},${my + 1.25},${mz - 2.0}", fov: 56 }); true`);
      await snap('qa-01-ch01-squad.jpg', 'Ch01 Squad & Street', worldBootMs);

      const fwdX = Math.sin(ch1Info.maraYaw || 0), fwdZ = Math.cos(ch1Info.maraYaw || 0);
      const cx = mx + fwdX * 2.4 + fwdZ * 0.9, cz = mz + fwdZ * 2.4 - fwdX * 0.9;
      await evalJs(cdp, `__setShot({ cam: "${cx.toFixed(2)},${(my + 1.38).toFixed(2)},${cz.toFixed(2)},${mx.toFixed(2)},${(my + 1.15).toFixed(2)},${mz.toFixed(2)}", fov: 46 }); true`);
      await snap('qa-02-mara-closeup.jpg', 'Mara Rifle & Pose Close-up');

      await evalJs(cdp, `__G.campaignV2.npcCommands.setOpen(true); __G.campaignV2.npcCommands.issueOrder('2'); true`);
      await snap('qa-03-squad-command.jpg', '[H] Tactical Squad Command UI');
      await evalJs(cdp, `__G.campaignV2.npcCommands.setOpen(false); true`);
    }

    await evalJs(cdp, `__G.campaignV2.startChapter('ch03', { skipCutscene: true }); __setShot({ cam: "-26,4.5,-44,-26,2.0,-82", fov: 60 }); true`);
    await snap('qa-04-ch03-city.jpg', 'Showcase Ch03 Across the City');

    await evalJs(cdp, `__G.campaignV2.startChapter('ch06', { skipCutscene: true }); for (let i=0;i<30;i++) __G.campaignV2.update(0.2); __setShot({ cam: "-26,7.5,64,-16,3.2,86", fov: 62 }); true`);
    await snap('qa-05-ch06-rising-water.jpg', 'Showcase Ch06 Rising Water Drydock');

    await evalJs(cdp, `__G.campaignV2.startChapter('ch10', { skipCutscene: true }); __setShot({ cam: "76,14.5,86,108,8.5,60", fov: 58 }); true`);
    await snap('qa-06-ch10-offshore-platform.jpg', 'Showcase Ch10 Offshore Platform');

    const mpShots = [
      ['coastal_metropolis', 'qa-07-mp-coastal_metropolis.jpg', '-48,26,74,10,8,-20'],
      ['iron_harbor', 'qa-08-mp-iron_harbor.jpg', '-64,22,68,14,6,-18'],
      ['highland_passage', 'qa-09-mp-highland_passage.jpg', '-110,24,78,30,10,-28'],
      ['old_saltline', 'qa-10-mp-old_saltline.jpg', '-58,18,62,6,6,-12'],
      ['industrial_coast', 'qa-11-mp-industrial_coast.jpg', '-74,22,76,22,8,-26'],
    ];
    await evalJs(cdp, `__G.campaignV2.stop(); window.__qaMpLoader = window.SaltlineMPMaps.createMultiplayerMapLoader(__G); true`);
    for (const [mapId, file, cam] of mpShots) {
      const loadMs = await evalJs(cdp, `(() => { const t0 = performance.now(); window.__qaMpLoader.loadMap('${mapId}'); __setShot({ cam: "${cam}", fov: 62 }); return Math.round(performance.now() - t0); })()`);
      await snap(file, `MP Map: ${mapId}`, loadMs);
    }

    await evalJs(cdp, `window.__qaMpLoader.loadMap('coastal_metropolis'); __setShot({ cam: "-62,8.5,38,-86,9.0,58", fov: 52 }); true`);
    await snap('qa-12-building-closeup.jpg', 'Building Facade & PBR Detail Close-up');

    await evalJs(cdp, `window.__qaMpLoader.unloadMap(); __setShot({ cam: "-11.3,1.8,-55,-0.8,1.55,-57", fov: 60 }); true`);
    await snap('qa-13-building-interior.jpg', 'Accessible Building Interior');

    await evalJs(cdp, `window.__qaMpLoader.loadMap('coastal_metropolis'); __setShot({ cam: "152,12,48,205,0,-10", fov: 60 }); true`);
    await snap('qa-14-water-coastline.jpg', 'Layered Coastal Water & Seawall');

    await evalJs(cdp, `window.__qaMpLoader.unloadMap(); true`);
    const errs = [...new Set([...cdp.consoleErrors, ...(await evalJs(cdp, 'window.__errors || []'))])];
    const summary = {
      capturedAt: new Date().toISOString(),
      worldBootMs,
      shotCount: metrics.length,
      avgFps: Number((metrics.reduce((s, m) => s + m.fps, 0) / Math.max(1, metrics.length)).toFixed(1)),
      consoleErrors: errs,
      shots: metrics,
    };
    fs.writeFileSync(path.join(OUT_DIR, 'qa-metrics.json'), JSON.stringify(summary, null, 2));
    console.log('QA_METRICS_SAVED:', path.join(OUT_DIR, 'qa-metrics.json'), 'ERRORS:', errs.length);
  } finally {
    if (cdp) cdp.close();
    try { chrome.kill('SIGTERM'); } catch (_) {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch((err) => { console.error('QA_FAIL:', err.message || err); process.exit(1); });
