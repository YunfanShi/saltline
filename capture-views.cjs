#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const net = require('net');
const os = require('os');
const { spawn } = require('child_process');

const ROOT_DIR = __dirname;
const OUT_DIR = path.join(ROOT_DIR, 'screenshots');

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
    '--window-size=1600,900',
    '--force-device-scale-factor=1',
    '--enable-webgl',
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
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });

    const targetUrl = `http://127.0.0.1:${httpPort}/index.html?mode=openworld`;
    const loadStart = Date.now();
    await cdp.send('Page.navigate', { url: targetUrl });

    let ready = false;
    for (let i = 0; i < 60; i++) {
      await sleep(500);
      const state = await evalJs(cdp, `(() => {
        const boot = document.getElementById('boot');
        const bootDone = !boot || boot.classList.contains('done') || getComputedStyle(boot).display === 'none';
        return { bootDone, hasApi: typeof window.SALTLINE_INSPECT_VIEW === 'function' };
      })()`);
      if (state?.bootDone && state?.hasApi) { ready = true; break; }
    }
    if (!ready) throw new Error('等待 Saltline 开放世界初始化超时（30秒）');

    const mapLoadTimeMs = Date.now() - loadStart;
    console.log(`✅ 地图加载完成，耗时 ${mapLoadTimeMs} ms`);

    await evalJs(cdp, `(() => {
      const btn = document.querySelector('.menu .btn.primary');
      if (btn && btn.offsetParent !== null) btn.click();
      return true;
    })()`);
    await sleep(1800);

    const views = (await evalJs(cdp, 'window.SALTLINE_INSPECT_VIEWS || []')) || [];
    const total = views.length || 6;
    const results = [];

    for (let idx = 0; idx < total; idx++) {
      const viewMeta = views[idx] || { id: `view-${idx + 1}`, name: `View ${idx + 1}` };
      await evalJs(cdp, `window.SALTLINE_INSPECT_VIEW(${idx}, { photoClean: true })`);
      await sleep(2200);
      const stats = await evalJs(cdp, `typeof window.SALTLINE_GET_STATS === 'function' ? window.SALTLINE_GET_STATS() : null`);
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const filename = `${String(idx + 1).padStart(2, '0')}-${viewMeta.id}.png`;
      fs.writeFileSync(path.join(OUT_DIR, filename), Buffer.from(shot.data, 'base64'));

      const row = {
        index: idx + 1, id: viewMeta.id, name: viewMeta.name, file: `screenshots/${filename}`,
        fps: stats?.fps ?? null, frameTimeMs: stats?.frameTimeMs ?? null,
        drawCalls: stats?.drawCalls ?? null, triangles: stats?.triangles ?? null,
        gpuGeometries: stats?.gpuGeometries ?? null, gpuTextures: stats?.gpuTextures ?? null,
        loadedChunks: stats?.loadedCount ?? null, detailedChunks: stats?.detailedCount ?? null,
        quality: stats?.quality ?? null, dprScale: stats?.dprScale ?? null,
      };
      results.push(row);
      console.log(`📸 [${idx + 1}/${total}] ${viewMeta.name} -> ${row.file} | FPS: ${row.fps ?? '-'} | Frame: ${row.frameTimeMs ?? '-'}ms | DC: ${row.drawCalls ?? '-'} | Tris: ${row.triangles ?? '-'}`);
    }

    const avg = (arr) => (arr.length ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null);
    const validFps = results.map((r) => r.fps).filter((v) => typeof v === 'number' && v > 0);
    const validFrame = results.map((r) => r.frameTimeMs).filter((v) => typeof v === 'number' && v > 0);
    const validDc = results.map((r) => r.drawCalls).filter((v) => typeof v === 'number');
    const validTris = results.map((r) => r.triangles).filter((v) => typeof v === 'number');

    const report = {
      capturedAt: new Date().toISOString(),
      viewport: '1600x900',
      mapLoadTimeMs,
      summary: {
        avgFps: avg(validFps),
        minFps: validFps.length ? Math.min(...validFps) : null,
        avgFrameTimeMs: avg(validFrame),
        maxDrawCalls: validDc.length ? Math.max(...validDc) : null,
        maxTriangles: validTris.length ? Math.max(...validTris) : null,
      },
      views: results,
      consoleErrors: cdp.consoleErrors,
    };
    fs.writeFileSync(path.join(OUT_DIR, 'benchmark-report.json'), JSON.stringify(report, null, 2), 'utf-8');
    console.log(`\n📊 报告已生成: screenshots/benchmark-report.json`);
  } finally {
    if (cdp) cdp.close();
    try { chrome.kill('SIGTERM'); } catch (_) {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (_) {}
  }
}

main().catch((err) => { console.error('❌ 批量截图失败:', err.message || err); process.exit(1); });
