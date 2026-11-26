#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const net = require('net');
const os = require('os');
const { spawn } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.resolve(process.argv[2] || path.join(ROOT_DIR, 'docs/world-review/after'));

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
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.woff2': 'font/woff2',
};

function findChromeBinary() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
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
  throw new Error('等待 Chrome DevTools Protocol 就绪超时');
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
            const timer = setTimeout(() => { pending.delete(id); rej(new Error(`CDP 超时: ${method}`)); }, 30000);
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

async function dispatchKey(cdp, type, code, key, windowsVirtualKeyCode) {
  await cdp.send('Input.dispatchKeyEvent', { type, code, key, windowsVirtualKeyCode });
}

async function checkPlayerControls(cdp) {
  const readState = () => evalJs(cdp, `({
    state: __G.game.state, mapOpen: __G.openWorld.mapOpen,
    pos: __G.player.pos.toArray(), chunks: SALTLINE_GET_STATS().loadedCount,
    mapFocus: document.activeElement?.hasAttribute('data-tp-btn'),
    errors: window.__errors
  })`);
  const press = async (code, key, virtualKey) => {
    await dispatchKey(cdp, 'keyDown', code, key, virtualKey);
    await dispatchKey(cdp, 'keyUp', code, key, virtualKey);
  };
  const walk = async () => {
    await dispatchKey(cdp, 'keyDown', 'KeyW', 'w', 87);
    try {
      await evalJs(cdp, `new Promise(resolve => {
        let frames = 0;
        function tick() { if (++frames >= 30) resolve(true); else requestAnimationFrame(tick); }
        requestAnimationFrame(tick);
      })`);
    } finally {
      await dispatchKey(cdp, 'keyUp', 'KeyW', 'w', 87);
    }
  };
  const distance = (a, b) => Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]);
  await press('KeyM', 'm', 77);
  const fitsViewport = await evalJs(cdp, `(() => {
    const card = document.querySelector('.sl-map-overlay.open .sl-map-card');
    if (!card) return false;
    card.querySelector('[data-tp-btn]').focus();
    const bounds = card.getBoundingClientRect();
    return bounds.top >= 0 && bounds.bottom <= innerHeight;
  })()`);
  const before = await readState();
  await walk();
  const mapped = await readState();
  await press('Escape', 'Escape', 27);
  await walk();
  const after = await readState();
  if (!fitsViewport || !before.mapOpen || !mapped.mapOpen || !mapped.mapFocus || distance(before, mapped) > 0.05 ||
      after.mapOpen || after.state !== 'playing' || distance(mapped, after) < 0.3 ||
      !after.chunks || after.errors.length) {
    throw new Error('开放世界移动或地图回归: ' + JSON.stringify({ before, mapped, after }));
  }
}

async function main() {
  const chromePath = findChromeBinary();
  if (!chromePath) {
    console.error('❌ 未找到本地 Chrome，请通过 CHROME_PATH 环境变量指定路径。');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { server, port: httpPort } = await startStaticServer();
  const cdpPort = await getFreePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'saltline-cdp-'));
  console.log(`🚀 本地服务已启动: http://127.0.0.1:${httpPort}`);
  console.log(`🌐 启动 Chrome: ${chromePath}`);

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1120,630',
    '--force-device-scale-factor=1',
    '--enable-webgl','--mute-audio','--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--autoplay-policy=no-user-gesture-required',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ], { stdio: 'ignore' });

  let cdp = null;
  try {
    const wsUrl = await waitForCdpTarget(cdpPort);
    cdp = await createCdpClient(wsUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1120, height: 630, deviceScaleFactor: 1, mobile: false });

    const targetUrl = `http://127.0.0.1:${httpPort}/index.html?mode=openworld&autostart=1&q=medium&seed=4207&noaudio=1`;
    const loadStart = Date.now();
    await cdp.send('Page.navigate', { url: targetUrl });

    let ready = false;
    for (let i = 0; i < 60; i++) {
      await sleep(500);
      const state = await evalJs(cdp, `(() => {
        const boot = document.getElementById('boot');
        const bootDone = !boot || boot.classList.contains('done') || getComputedStyle(boot).display === 'none';
        return { bootDone, ready: window.__ready, fatal: window.__fatal,
          hasApi: typeof window.SALTLINE_INSPECT_VIEW === 'function' };
      })()`);
      if (state?.fatal) throw new Error(state.fatal);
      if (state?.bootDone && state?.ready && state?.hasApi) { ready = true; break; }
    }
    if (!ready) throw new Error('等待 Saltline 开放世界初始化超时（30秒）');

    const mapLoadTimeMs = Date.now() - loadStart;
    console.log(`✅ 地图加载完成，耗时 ${mapLoadTimeMs} ms`);
    await checkPlayerControls(cdp);
    console.log('✅ 地图打开时暂停步行，按 Esc 关闭后恢复移动和分块加载');

    const views = [
      ['street',[-26,2.8,-42],[-26,4.8,-108],1],
      ['facade',[-24,2.4,-49],[-13,2.7,-56],1],
      ['entrance',[-17.2,2.1,-53.5],[-12.5,2.2,-55.0],1],
      ['interior',[-11.3,1.8,-55],[-.8,1.55,-57],1],
      ['rooftop',[-44,19.5,-72],[-62,10.5,-118],1],
      ['alley',[-66,2.3,-42],[-66,5.2,-96],1],
      ['plaza',[-46,3.4,-118],[-60,3.2,-126],1],
      ['skyline',[19,15.5,-34],[-58,7.5,-98],1],
      ['industrial',[-185,6.5,56],[-204,5.5,78],1],
      ['terrain',[-210,7,60],[-231,11,91],1],
      ['coastline',[15,4.2,72],[32,6.5,118],1],
      ['night',[-26,3.6,-48],[-26,5.2,-110],5],
    ];
    const total=views.length, results=[];
    for(let idx=0;idx<total;idx++){
      const [id,pos,look,presetView]=views[idx];
      const viewMeta={id,name:id};
      await evalJs(cdp,`window.SALTLINE_INSPECT_VIEW(${presetView===5?5:0},{photoClean:false}); __G.openWorld.setPhotoMode(true); __G.player.invulnerable=true; __G.player.enabled=false; __G.player.pos.set(${pos}); __G.player.vel.set(0,0,0); __setShot({cam:"${[...pos,...look]}",fov:62}); __G.hud.show(false);__G.weapon.setVisible(false);document.body.classList.add('audit-clean');true`);
      await evalJs(cdp,`(()=>{if(!document.querySelector('#audit-clean')){const s=document.createElement('style');s.id='audit-clean';s.textContent='body.audit-clean > :not(#app):not(canvas),body.audit-clean #ui{visibility:hidden!important}';document.head.append(s)}return true})()`);
      await sleep(1400);
      const stats=await evalJs(cdp,`new Promise(resolve=>{
        let prev, frames=0, calls=0, triangles=0;
        const deltas=[];
        function tick(now){
          if(prev===undefined) prev=now;
          else {
            deltas.push(now-prev);
            prev=now;
            const st=SALTLINE_GET_STATS();
            calls+=st.drawCalls;
            triangles+=st.triangles;
            if(++frames===60){
              const sorted=[...deltas].sort((a,b)=>a-b);
              const avgMs=deltas.reduce((a,b)=>a+b,0)/deltas.length;
              const pct=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];
              const p99Ms=pct(0.99);
              resolve({...st,
                fps:Number((1000/avgMs).toFixed(2)),
                onePercentLowFps:Number((1000/Math.max(0.01,p99Ms)).toFixed(2)),
                frameTimeMs:Number(avgMs.toFixed(2)),
                p50FrameMs:Number(pct(0.50).toFixed(2)),
                p95FrameMs:Number(pct(0.95).toFixed(2)),
                p99FrameMs:Number(p99Ms.toFixed(2)),
                maxFrameMs:Number(sorted[sorted.length-1].toFixed(2)),
                state:__G.game.state,
                drawCalls:Math.round(calls/frames),triangles:Math.round(triangles/frames)});
              return;
            }
          }
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      })`);
      if(stats.state!=='playing'||!stats.loadedCount)throw Error('Streaming inactive '+JSON.stringify(stats));
      const shot=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:87});
      const filename=id+'.jpg';
      fs.writeFileSync(path.join(OUT_DIR,filename),Buffer.from(shot.data,'base64'));
      const row = {
        index: idx + 1, id: viewMeta.id, name: viewMeta.name, file: filename,
        fps: stats?.fps ?? null, onePercentLowFps: stats?.onePercentLowFps ?? null,
        frameTimeMs: stats?.frameTimeMs ?? null, p50FrameMs: stats?.p50FrameMs ?? null,
        p95FrameMs: stats?.p95FrameMs ?? null, p99FrameMs: stats?.p99FrameMs ?? null,
        maxFrameMs: stats?.maxFrameMs ?? null,
        drawCalls: stats?.drawCalls ?? null, triangles: stats?.triangles ?? null,
        gpuGeometries: stats?.gpuGeometries ?? null, gpuTextures: stats?.gpuTextures ?? null,
        loadedChunks: stats?.loadedCount ?? null, detailedChunks: stats?.detailedCount ?? null,
        quality: stats?.quality ?? null, dprScale: stats?.dprScale ?? null,
      };
      results.push(row);
      console.log(`📸 [${idx + 1}/${total}] ${viewMeta.name} -> ${row.file} | AvgFPS: ${row.fps ?? '-'} | 1%Low: ${row.onePercentLowFps ?? '-'} | P50/P95/P99: ${row.p50FrameMs}/${row.p95FrameMs}/${row.p99FrameMs}ms | DC: ${row.drawCalls ?? '-'} | Tris: ${row.triangles ?? '-'}`);
    }

    const lifecycle = await evalJs(cdp,`(async()=>{
      const names=['metal_office_desk','vintage_radio_transceiver','desk_lamp_arm_01','painted_wooden_chair_02','industrial_wall_lamp','office_notepads','modular_factory_facade'];
      const imports=Object.fromEntries(names.map(id=>[id,0]));
      __G.scene.traverse(n=>{for(const id of names) if(n.name==='polyhaven-'+id && n.children.length) imports[id]++});
      if(Object.values(imports).some(n=>!n)) throw Error('Missing imported mesh '+JSON.stringify(imports));
      const cycles=[];
      for(const loc of [[-215,.2,140],[-26,.2,-55],[-215,.2,140],[-26,.2,-55]]) {
        __G.player.pos.set(...loc);
        for(let i=0;i<55;i++) __G.openWorld.update(.25,__G.player.pos);
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        const s=SALTLINE_GET_STATS();
        cycles.push({loc,geometries:s.gpuGeometries,textures:s.gpuTextures,disposals:s.totalDisposals,active:s.loadedCount});
      }
      const geoDrift = Math.abs(cycles[3].geometries - cycles[1].geometries);
      const texDrift = Math.abs(cycles[3].textures - cycles[1].textures);
      if (geoDrift > 40 || texDrift > 4 || cycles[3].disposals <= cycles[0].disposals) {
        throw Error('GPU resource leak detected across streaming cycles: ' + JSON.stringify({ geoDrift, texDrift, cycles }));
      }
      const door=__G.openWorld.interactables.find(v=>v.id==='city-precinct-door');
      function crossDoor(){
        const p=__G.player.pos.clone().set(-14.8,.30,-55);
        for(let i=0;i<75;i++) __G.physics.moveCapsule(p,__G.player.vel.clone().set(2,-.2,0),1/60);
        return p.x;
      }
      const closed=crossDoor(); door.use(); const opened=crossDoor(); door.use();
      if(closed>-13.3 || opened < -13) throw Error('Door collider '+JSON.stringify({closed,opened}));
      const buildTimings = Array.isArray(window.SALTLINE_BUILD_TIMINGS) ? window.SALTLINE_BUILD_TIMINGS : [];
      const maxPhaseMs = buildTimings.length ? Math.max(...buildTimings.map(b => b.maxPhaseMs || 0)) : null;
      return {imports,cycles,geoDrift,texDrift,door:{closed,opened},buildTimingCount:buildTimings.length,maxPhaseMs,buildTimings};
    })()`);
    fs.writeFileSync(path.join(OUT_DIR,'streaming.json'),JSON.stringify(lifecycle,null,2));
    for (const r of results) {
      const sz = fs.statSync(path.join(OUT_DIR, r.file)).size;
      if (sz < 25000) throw Error(`Rendered screenshot too small / blank: ${r.file} (${sz} bytes)`);
    }
    const gameErrors = await evalJs(cdp, 'window.__errors');
    const errors = [...new Set([...cdp.consoleErrors, ...gameErrors])];
    if (errors.length) {
      throw Error('Browser console errors during render audit: ' + errors.join(' | '));
    }
    const avg = (arr) => (arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null);
    const validFps = results.map((r) => r.fps).filter((v) => typeof v === 'number' && v > 0);
    const validFrame = results.map((r) => r.frameTimeMs).filter((v) => typeof v === 'number' && v > 0);
    const validDc = results.map((r) => r.drawCalls).filter((v) => typeof v === 'number');
    const validTris = results.map((r) => r.triangles).filter((v) => typeof v === 'number');

    const valid1Low = results.map((r) => r.onePercentLowFps).filter((v) => typeof v === 'number' && v > 0);
    const validP95 = results.map((r) => r.p95FrameMs).filter((v) => typeof v === 'number');
    const validP99 = results.map((r) => r.p99FrameMs).filter((v) => typeof v === 'number');
    const validMaxMs = results.map((r) => r.maxFrameMs).filter((v) => typeof v === 'number');
    const report = {
      capturedAt: new Date().toISOString(),
      viewport: '1120x630',
      mapLoadTimeMs,
      summary: {
        avgFps: avg(validFps),
        minFps: validFps.length ? Math.min(...validFps) : null,
        avgOnePercentLowFps: avg(valid1Low),
        avgFrameTimeMs: avg(validFrame),
        maxP95FrameMs: validP95.length ? Math.max(...validP95) : null,
        maxP99FrameMs: validP99.length ? Math.max(...validP99) : null,
        worstMaxFrameMs: validMaxMs.length ? Math.max(...validMaxMs) : null,
        maxDrawCalls: validDc.length ? Math.max(...validDc) : null,
        maxTriangles: validTris.length ? Math.max(...validTris) : null,
      },
      views: results,
      consoleErrors: cdp.consoleErrors,
    };
    fs.writeFileSync(path.join(OUT_DIR, 'benchmark-report.json'), JSON.stringify(report, null, 2), 'utf-8');
    console.log('报告已生成', path.join(OUT_DIR, 'benchmark-report.json'));
  } finally {
    if (cdp) cdp.close();
    try { chrome.kill('SIGTERM'); } catch (_) {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch((err) => { console.error('❌ 批量截图失败:', err.message || err); process.exit(1); });
