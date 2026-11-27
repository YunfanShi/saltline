#!/usr/bin/env node
/**
 * Strips unused 175 morph targets and downscales embedded PNG textures to 1024px JPEG
 * using macOS `sips`, turning 30-50MB uncompressed Rocketbox engine GLBs into ~1.5MB
 * standard uncompressed GLB 2.0 files compatible with zero-dependency WebGL loaders.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

function pad4(buf, byte = 0) {
  const rem = buf.length % 4;
  if (rem === 0) return buf;
  return Buffer.concat([buf, Buffer.alloc(4 - rem, byte)]);
}

function optimizeGlb(inPath, outPath, maxTex = 1024) {
  const raw = fs.readFileSync(inPath);
  if (raw.readUInt32LE(0) !== 0x46546C67) throw new Error('Not a GLB file: ' + inPath);
  let offset = 12;
  let gltf = null;
  let bin = null;
  while (offset + 8 <= raw.length) {
    const len = raw.readUInt32LE(offset);
    const type = raw.readUInt32LE(offset + 4);
    offset += 8;
    if (type === 0x4E4F534A) gltf = JSON.parse(raw.subarray(offset, offset + len).toString('utf8'));
    else if (type === 0x004E4942) bin = raw.subarray(offset, offset + len);
    offset += len;
  }
  if (!gltf || !bin) throw new Error('Malformed GLB: ' + inPath);

  // 1. Drop morph targets (175 face blendshapes) to slash geometry size by ~85%
  for (const mesh of gltf.meshes || []) {
    delete mesh.weights;
    for (const prim of mesh.primitives || []) {
      delete prim.targets;
    }
  }
  for (const node of gltf.nodes || []) {
    delete node.weights;
  }

  // 2. Collect referenced accessors & images
  const usedAccessors = new Set();
  for (const mesh of gltf.meshes || []) {
    for (const prim of mesh.primitives || []) {
      if (prim.indices !== undefined) usedAccessors.add(prim.indices);
      for (const accIdx of Object.values(prim.attributes || {})) usedAccessors.add(accIdx);
    }
  }
  for (const skin of gltf.skins || []) {
    if (skin.inverseBindMatrices !== undefined) usedAccessors.add(skin.inverseBindMatrices);
  }
  for (const anim of gltf.animations || []) {
    for (const smp of anim.samplers || []) {
      if (smp.input !== undefined) usedAccessors.add(smp.input);
      if (smp.output !== undefined) usedAccessors.add(smp.output);
    }
  }

  // Identify alpha-bearing images (hair/eyelashes) so we keep PNG for them, JPEG for opaque diffuse/normal
  const alphaImageSet = new Set();
  for (const mat of gltf.materials || []) {
    if (mat.alphaMode === 'MASK' || mat.alphaMode === 'BLEND') {
      const idx = mat.pbrMetallicRoughness?.baseColorTexture?.index;
      const src = idx !== undefined ? gltf.textures?.[idx]?.source : undefined;
      if (src !== undefined) alphaImageSet.add(src);
    }
  }

  // 3. Rebuild compact bufferViews & BIN chunk
  const newChunks = [];
  let newBinLen = 0;
  const newBufferViews = [];
  const oldToNewBv = new Map();

  function appendChunk(buf, target, byteStride) {
    const padLen = (4 - (newBinLen % 4)) % 4;
    if (padLen > 0) {
      newChunks.push(Buffer.alloc(padLen, 0));
      newBinLen += padLen;
    }
    const bvIdx = newBufferViews.length;
    const bv = { buffer: 0, byteOffset: newBinLen, byteLength: buf.length };
    if (target !== undefined) bv.target = target;
    if (byteStride !== undefined) bv.byteStride = byteStride;
    newBufferViews.push(bv);
    newChunks.push(buf);
    newBinLen += buf.length;
    return bvIdx;
  }

  // Copy only bufferViews used by active accessors
  const usedOldBvs = new Set();
  for (const accIdx of usedAccessors) {
    const acc = gltf.accessors?.[accIdx];
    if (acc && acc.bufferView !== undefined) usedOldBvs.add(acc.bufferView);
  }
  for (const oldBvIdx of [...usedOldBvs].sort((a, b) => a - b)) {
    const oldBv = gltf.bufferViews[oldBvIdx];
    const slice = Buffer.from(bin.subarray(oldBv.byteOffset || 0, (oldBv.byteOffset || 0) + oldBv.byteLength));
    const newIdx = appendChunk(slice, oldBv.target, oldBv.byteStride);
    oldToNewBv.set(oldBvIdx, newIdx);
  }
  for (const accIdx of usedAccessors) {
    const acc = gltf.accessors[accIdx];
    if (acc && acc.bufferView !== undefined) acc.bufferView = oldToNewBv.get(acc.bufferView);
  }
  // Null out unused accessors' bufferView cleanly
  for (let i = 0; i < (gltf.accessors || []).length; i++) {
    if (!usedAccessors.has(i) && gltf.accessors[i]) {
      delete gltf.accessors[i].bufferView;
      gltf.accessors[i].count = 0;
    }
  }

  // Re-encode embedded images via macOS sips
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rb-opt-'));
  try {
    for (let i = 0; i < (gltf.images || []).length; i++) {
      const img = gltf.images[i];
      if (img.bufferView === undefined) continue;
      const oldBv = gltf.bufferViews[img.bufferView];
      const imgBuf = bin.subarray(oldBv.byteOffset || 0, (oldBv.byteOffset || 0) + oldBv.byteLength);
      const ext = img.mimeType === 'image/jpeg' ? '.jpg' : '.png';
      const srcFile = path.join(tmpDir, `in_${i}${ext}`);
      fs.writeFileSync(srcFile, imgBuf);

      const keepPng = alphaImageSet.has(i);
      const dstFile = path.join(tmpDir, `out_${i}${keepPng ? '.png' : '.jpg'}`);
      try {
        if (keepPng) {
          execFileSync('sips', ['-Z', String(Math.min(maxTex, 512)), '-s', 'format', 'png', srcFile, '--out', dstFile], { stdio: 'ignore' });
          img.mimeType = 'image/png';
        } else {
          execFileSync('sips', ['-Z', String(maxTex), '-s', 'format', 'jpeg', '-s', 'formatOptions', '80', srcFile, '--out', dstFile], { stdio: 'ignore' });
          img.mimeType = 'image/jpeg';
        }
        const outImg = fs.readFileSync(dstFile);
        img.bufferView = appendChunk(outImg);
      } catch {
        img.bufferView = appendChunk(Buffer.from(imgBuf));
      }
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  gltf.bufferViews = newBufferViews;
  const binBuf = pad4(Buffer.concat(newChunks), 0);
  gltf.buffers = [{ byteLength: binBuf.length }];

  const jsonBuf = pad4(Buffer.from(JSON.stringify(gltf), 'utf8'), 0x20);
  const totalLen = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLen, 8);

  const jsonHdr = Buffer.alloc(8);
  jsonHdr.writeUInt32LE(jsonBuf.length, 0);
  jsonHdr.writeUInt32LE(0x4E4F534A, 4);

  const binHdr = Buffer.alloc(8);
  binHdr.writeUInt32LE(binBuf.length, 0);
  binHdr.writeUInt32LE(0x004E4942, 4);

  fs.writeFileSync(outPath, Buffer.concat([header, jsonHdr, jsonBuf, binHdr, binBuf]));
  console.log(`Optimized ${path.basename(inPath)}: ${(raw.length / 1e6).toFixed(2)} MB -> ${(totalLen / 1e6).toFixed(2)} MB`);
}

if (require.main === module) {
  const [inFile, outFile, maxTex] = process.argv.slice(2);
  if (!inFile || !outFile) {
    console.error('Usage: node scripts/optimize-rocketbox-glb.cjs <in.glb> <out.glb> [maxTex]');
    process.exit(1);
  }
  optimizeGlb(inFile, outFile, Number(maxTex) || 1024);
}
