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

    const targetUrl = `http://127.0.0.1:${httpPort}/index.html?mode=openworld&autostart=1&q=medium&seed=4207&noaudio=1`;
    await cdp.send('Page.navigate', { url: targetUrl });

    for (let i = 0; i < 60; i++) {
      await sleep(500);
      const st = await evalJs(cdp, `({ ready: Boolean(window.__ready), hasG: Boolean(window.__G), fatal: window.__fatal || null })`);
      if (st?.fatal) throw new Error(st.fatal);
      if (st?.ready && st?.hasG) break;
    }

    // Start Campaign V2 Chapter 1 and wait for Rocketbox GLB character models to load
    const ch1Info = await evalJs(cdp, `(async () => {
      if (__G.campaignV2) {
        __G.campaignV2.startChapter('ch01', { skipCutscene: true });
        await new Promise(r => setTimeout(r, 2600));
        // Find Mara's world position and yaw
        let maraPos = null, maraYaw = null;
        __G.scene.traverse(n => {
          if (n.name === 'cast-mara') {
            maraPos = [n.position.x, n.position.y, n.position.z];
            maraYaw = n.rotation.y;
          }
        });
        return { maraPos, maraYaw, playerPos: __G.player.pos.toArray(), cast: __G.campaignV2.charCtrl.cast };
      }
      return { error: 'no campaignV2' };
    })()`);
    console.log('CH01_INFO:', JSON.stringify(ch1Info));

    // Shot 1: First-person view from player spawn looking down street at Mara & NPCs
    if (ch1Info?.maraPos) {
      const [mx, my, mz] = ch1Info.maraPos;
      // Stand behind/side of player looking toward Mara and the street objective
      await evalJs(cdp, `(() => {
        __G.openWorld.setPhotoMode(true);
        __G.player.enabled = false;
        __setShot({ cam: "${mx - 2.6},${my + 1.55},${mz + 3.2},${mx},${my + 1.25},${mz - 2.0}", fov: 56 });
        return true;
      })()`);
      await sleep(700);
      const s1 = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
      fs.writeFileSync(path.join(OUT_DIR, 'qa-01-ch01-squad.jpg'), Buffer.from(s1.data, 'base64'));
      console.log('Saved qa-01-ch01-squad.jpg');

      // Shot 2: Front-3/4 close-up of Mara to inspect Rocketbox arms, hands, rifle, and facing direction
      const fwdX = Math.sin(ch1Info.maraYaw || 0);
      const fwdZ = Math.cos(ch1Info.maraYaw || 0);
      const cx = mx + fwdX * 2.4 + fwdZ * 0.9;
      const cz = mz + fwdZ * 2.4 - fwdX * 0.9;
      await evalJs(cdp, `__setShot({ cam: "${cx.toFixed(2)},${(my + 1.38).toFixed(2)},${cz.toFixed(2)},${mx.toFixed(2)},${(my + 1.15).toFixed(2)},${mz.toFixed(2)}", fov: 46 }); true`);
      await sleep(700);
      const s2 = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
      fs.writeFileSync(path.join(OUT_DIR, 'qa-02-mara-closeup.jpg'), Buffer.from(s2.data, 'base64'));
      console.log('Saved qa-02-mara-closeup.jpg');

      // Shot 3: Open [H] squad command panel + issue order '2' (operate_objective / point_ahead)
      await evalJs(cdp, `(() => {
        __G.campaignV2.npcCommands.setOpen(true);
        __G.campaignV2.npcCommands.issueOrder('2');
        return true;
      })()`);
      await sleep(600);
      const s3 = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
      fs.writeFileSync(path.join(OUT_DIR, 'qa-03-squad-command.jpg'), Buffer.from(s3.data, 'base64'));
      console.log('Saved qa-03-squad-command.jpg');
    }

    // Shot 4: Chapter 3 driving gates (3 glowing arches)
    await evalJs(cdp, `(() => {
      __G.campaignV2.npcCommands.setOpen(false);
      __G.campaignV2.startChapter('ch03', { skipCutscene: true });
      const t = __G.campaignV2.getActiveWaypointTarget();
      __setShot({ cam: "${-26},${4.5},${-46},${-26},${2.2},${-80}", fov: 60 });
      return t;
    })()`);
    await sleep(900);
    const s4 = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    fs.writeFileSync(path.join(OUT_DIR, 'qa-04-ch03-driving-gates.jpg'), Buffer.from(s4.data, 'base64'));
    console.log('Saved qa-04-ch03-driving-gates.jpg');

    // Shot 5: Upgraded 360x320m WorldEngine Multiplayer Map (coastal_metropolis)
    await evalJs(cdp, `(() => {
      __G.campaignV2.stop();
      const loader = window.SaltlineMPMaps.createMultiplayerMapLoader(__G);
      const res = loader.loadMap('coastal_metropolis');
      __setShot({ cam: "-48,26,74,10,8,-20", fov: 62 });
      window.__qaMpLoader = loader;
      return { id: res.id, usesWorldEngine: res.usesWorldEngine, buildingCount: res.buildingCount };
    })()`);
    await sleep(900);
    const s5 = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    fs.writeFileSync(path.join(OUT_DIR, 'qa-05-mp-metropolis.jpg'), Buffer.from(s5.data, 'base64'));
    console.log('Saved qa-05-mp-metropolis.jpg');

    const errs = await evalJs(cdp, 'window.__errors || []');
    console.log('CONSOLE_ERRORS:', JSON.stringify([...cdp.consoleErrors, ...errs]));
  } finally {
    if (cdp) cdp.close();
    try { chrome.kill('SIGTERM'); } catch (_) {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch((err) => { console.error('QA_FAIL:', err.message || err); process.exit(1); });
