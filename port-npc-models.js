/* Saltline Real Rigged 3D Human Character Loader (GLB 2.0 + SkinnedMesh + AnimationMixer).
 * Supports 8 distinct character archetypes:
 *   - Teammates (Special Forces, armed with 3D tactical rifles): specops_male, specops_female, commander
 *   - Friendly NPCs (distinct uniforms/civilians): medic_female, worker_male, civilian_male, civilian_female
 *   - Hostile Mercenaries: mercenary (armored dark-visor Soldier.glb)
 * Supports both Mixamo (Soldier.glb) and Microsoft Rocketbox Bip01 (MIT) skeletons,
 * full walking/running/seated/combat-aim/talking/gesture poses, and right-hand 3D rifle attachment. */
(() => {
  const MIXAMO_BONES = {
    rigType: 'mixamo',
    mixamo: true,
    hipsBone: 'mixamorig_Hips',
    headBone: 'mixamorig_Head',
    neckBone: 'mixamorig_Neck',
    spineBone: 'mixamorig_Spine2',
    rightArm: 'mixamorig_RightArm',
    rightForeArm: 'mixamorig_RightForeArm',
    rightHand: 'mixamorig_RightHand',
    leftArm: 'mixamorig_LeftArm',
    leftForeArm: 'mixamorig_LeftForeArm',
    leftUpLeg: 'mixamorig_LeftUpLeg',
    leftLeg: 'mixamorig_LeftLeg',
    rightUpLeg: 'mixamorig_RightUpLeg',
    rightLeg: 'mixamorig_RightLeg',
  };

  const BIP01_BONES = {
    rigType: 'bip01',
    mixamo: false,
    hipsBone: 'Bip01_Pelvis',
    headBone: 'Bip01_Head',
    neckBone: 'Bip01_Neck',
    spineBone: 'Bip01_Spine2',
    rightArm: 'Bip01_R_UpperArm',
    rightForeArm: 'Bip01_R_Forearm',
    rightHand: 'Bip01_R_Hand',
    leftArm: 'Bip01_L_UpperArm',
    leftForeArm: 'Bip01_L_Forearm',
    leftUpLeg: 'Bip01_L_Thigh',
    leftLeg: 'Bip01_L_Calf',
    rightUpLeg: 'Bip01_R_Thigh',
    rightLeg: 'Bip01_R_Calf',
  };

  const MODEL_CATALOG = {
    // Enemy Mercenary (armored dark-visor Soldier.glb)
    mercenary: {
      url: './assets/models/characters/Soldier.glb',
      targetHeight: 1.80,
      buildScale: [1.02, 1.0, 1.02],
      yawOffset: Math.PI,
      tintStrength: 0.32,
      defaultTint: 0x3a2626,
      armed: true,
      ...MIXAMO_BONES,
    },
    // Special Forces Teammates (Microsoft Rocketbox MIT Military Male/Female + 3D Rifle)
    specops_male: {
      url: './assets/models/characters/specops_male.glb',
      targetHeight: 1.80,
      buildScale: [1.0, 1.0, 1.0],
      yawOffset: 0,
      armed: true,
      ...BIP01_BONES,
    },
    specops_female: {
      url: './assets/models/characters/specops_female.glb',
      targetHeight: 1.70,
      buildScale: [1.0, 1.0, 1.0],
      yawOffset: 0,
      armed: true,
      ...BIP01_BONES,
    },
    commander: {
      url: './assets/models/characters/commander.glb',
      targetHeight: 1.80,
      buildScale: [1.0, 1.0, 1.0],
      yawOffset: 0,
      armed: false,
      ...BIP01_BONES,
    },
    // Friendly Specialist & Civilian NPCs (each with a completely distinct Rocketbox MIT model)
    medic_female: {
      url: './assets/models/characters/medic_female.glb',
      targetHeight: 1.68,
      buildScale: [1.0, 1.0, 1.0],
      yawOffset: 0,
      armed: false,
      ...BIP01_BONES,
    },
    worker_male: {
      url: './assets/models/characters/worker_male.glb',
      targetHeight: 1.76,
      buildScale: [1.0, 1.0, 1.0],
      yawOffset: 0,
      armed: false,
      ...BIP01_BONES,
    },
    civilian_male: {
      url: './assets/models/characters/civilian_male.glb',
      targetHeight: 1.76,
      buildScale: [1.0, 1.0, 1.0],
      yawOffset: 0,
      armed: false,
      ...BIP01_BONES,
    },
    civilian_female: {
      url: './assets/models/characters/civilian_female.glb',
      targetHeight: 1.67,
      buildScale: [1.0, 1.0, 1.0],
      yawOffset: 0,
      armed: false,
      ...BIP01_BONES,
    },
  };

  // Backwards-compatible aliases (never map friendly roles to enemy mercenary!)
  const ALIASES = {
    soldier: 'specops_male',
    female: 'specops_female',
    civilian: 'civilian_male',
    enemy: 'mercenary',
  };

  function resolveKey(modelType) {
    if (MODEL_CATALOG[modelType]) return modelType;
    if (ALIASES[modelType] && MODEL_CATALOG[ALIASES[modelType]]) return ALIASES[modelType];
    return 'specops_male';
  }

  const TYPE_SIZES = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const COMP_ARRAYS = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
  };

  function sanitizeName(name, fallbackIdx) {
    const raw = (name && String(name).trim()) || `node_${fallbackIdx}`;
    return raw.replace(/[:.\[\]\/\\ ]/g, '_');
  }

  function createTacticalRifle(THREE) {
    const { Group, Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial } = THREE;
    if (!BoxGeometry || !CylinderGeometry) return null;
    const g = new Group();
    g.name = 'npc-tactical-rifle';
    const gunMat = new MeshStandardMaterial({ color: 0x1e242a, roughness: 0.36, metalness: 0.72 });
    const gripMat = new MeshStandardMaterial({ color: 0x2d3230, roughness: 0.78, metalness: 0.14 });
    const metalMat = new MeshStandardMaterial({ color: 0x6f7980, roughness: 0.28, metalness: 0.85 });
    const add = (geo, mat, sx, sy, sz, x, y, z, rx = 0) => {
      const m = new Mesh(geo, mat);
      m.scale.set(sx, sy, sz);
      m.position.set(x, y, z);
      if (rx) m.rotation.x = rx;
      m.castShadow = true;
      g.add(m);
      return m;
    };
    const box = new BoxGeometry(1, 1, 1);
    const cyl = new CylinderGeometry(1, 1, 1, 10);
    add(box, gunMat, 0.052, 0.078, 0.36, 0, 0, 0.10);          // Receiver
    add(box, gripMat, 0.044, 0.054, 0.24, 0, -0.004, 0.36);    // Handguard
    add(cyl, metalMat, 0.012, 0.22, 0.012, 0, 0.008, 0.54, Math.PI / 2); // Barrel + suppressor
    add(box, gripMat, 0.042, 0.086, 0.20, 0, -0.012, -0.15);   // Tactical stock
    add(box, gunMat, 0.030, 0.145, 0.054, 0, -0.092, 0.15, 0.18); // Curved magazine
    add(box, gunMat, 0.036, 0.044, 0.088, 0, 0.058, 0.09);     // Holographic optic
    add(box, gripMat, 0.032, 0.090, 0.038, 0, -0.068, -0.01, -0.25); // Pistol grip
    return g;
  }

  function readAccessor(gltf, binBuf, accIdx) {
    const acc = gltf.accessors?.[accIdx];
    if (!acc || acc.bufferView === undefined) return null;
    const bv = gltf.bufferViews?.[acc.bufferView];
    if (!bv) return null;
    const TypedArr = COMP_ARRAYS[acc.componentType];
    if (!TypedArr) return null;
    const itemSize = TYPE_SIZES[acc.type] || 1;
    const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
    const elemBytes = TypedArr.BYTES_PER_ELEMENT;
    const stride = bv.byteStride || 0;
    const total = acc.count * itemSize;
    let array;
    if (!stride || stride === itemSize * elemBytes) {
      if (byteOffset % elemBytes === 0) {
        array = new TypedArr(binBuf, byteOffset, total);
      } else {
        const copy = binBuf.slice(byteOffset, byteOffset + total * elemBytes);
        array = new TypedArr(copy);
      }
    } else {
      array = new TypedArr(total);
      const dv = new DataView(binBuf);
      for (let i = 0; i < acc.count; i++) {
        const base = byteOffset + i * stride;
        for (let k = 0; k < itemSize; k++) {
          const off = base + k * elemBytes;
          if (acc.componentType === 5126) array[i * itemSize + k] = dv.getFloat32(off, true);
          else if (acc.componentType === 5123) array[i * itemSize + k] = dv.getUint16(off, true);
          else if (acc.componentType === 5125) array[i * itemSize + k] = dv.getUint32(off, true);
          else if (acc.componentType === 5121) array[i * itemSize + k] = dv.getUint8(off);
          else if (acc.componentType === 5122) array[i * itemSize + k] = dv.getInt16(off, true);
          else array[i * itemSize + k] = dv.getInt8(off);
        }
      }
    }
    return { array, itemSize, count: acc.count, normalized: !!acc.normalized };
  }

  function decodeEmbeddedTexture(THREE, gltf, binBuf, texIdx, isColor) {
    if (typeof Image === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') return null;
    const texDef = gltf.textures?.[texIdx];
    if (!texDef) return null;
    const imgDef = gltf.images?.[texDef.source];
    if (!imgDef || imgDef.bufferView === undefined) return null;
    const bv = gltf.bufferViews?.[imgDef.bufferView];
    if (!bv) return null;
    const start = bv.byteOffset || 0;
    const slice = new Uint8Array(binBuf, start, bv.byteLength);
    const blob = new Blob([slice], { type: imgDef.mimeType || 'image/png' });
    const objUrl = URL.createObjectURL(blob);
    const tex = new THREE.Texture();
    tex.flipY = false;
    if (THREE.RepeatWrapping !== undefined) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
    }
    if (isColor && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    const img = new Image();
    img.onload = () => {
      tex.image = img;
      tex.needsUpdate = true;
      try { URL.revokeObjectURL(objUrl); } catch {}
    };
    img.onerror = () => {
      try { URL.revokeObjectURL(objUrl); } catch {}
    };
    img.src = objUrl;
    return tex;
  }

  function parseGlbBinary(arrayBuffer) {
    const dv = new DataView(arrayBuffer);
    if (arrayBuffer.byteLength < 20 || dv.getUint32(0, true) !== 0x46546C67) return null;
    let offset = 12;
    let gltf = null;
    let binBuf = null;
    while (offset + 8 <= arrayBuffer.byteLength) {
      const chunkLen = dv.getUint32(offset, true);
      const chunkType = dv.getUint32(offset + 4, true);
      offset += 8;
      if (chunkType === 0x4E4F534A) {
        const jsonBytes = new Uint8Array(arrayBuffer, offset, chunkLen);
        gltf = JSON.parse(new TextDecoder('utf-8').decode(jsonBytes));
      } else if (chunkType === 0x004E4942) {
        binBuf = arrayBuffer.slice(offset, offset + chunkLen);
      }
      offset += chunkLen;
    }
    if (!gltf || !binBuf) return null;
    return { gltf, binBuf };
  }

  function buildTemplateFromGlb(THREE, gltf, binBuf, spec) {
    const jointSet = new Set();
    for (const skin of gltf.skins || []) {
      for (const j of skin.joints || []) jointSet.add(j);
    }

    const texCache = new Map();
    const getTex = (idx, isColor) => {
      if (idx === undefined) return null;
      const key = `${idx}_${isColor ? 1 : 0}`;
      if (!texCache.has(key)) texCache.set(key, decodeEmbeddedTexture(THREE, gltf, binBuf, idx, isColor));
      return texCache.get(key);
    };

    const materials = (gltf.materials || []).map(m => {
      const pbr = m.pbrMetallicRoughness || {};
      const opts = {
        name: m.name || '',
        roughness: pbr.roughnessFactor !== undefined ? pbr.roughnessFactor : 0.78,
        metalness: pbr.metallicFactor !== undefined ? pbr.metallicFactor : 0.08,
      };
      if (Array.isArray(pbr.baseColorFactor)) {
        opts.color = new THREE.Color(pbr.baseColorFactor[0], pbr.baseColorFactor[1], pbr.baseColorFactor[2]);
      }
      if (m.doubleSided && THREE.DoubleSide !== undefined) opts.side = THREE.DoubleSide;
      if (pbr.baseColorTexture) opts.map = getTex(pbr.baseColorTexture.index, true);
      if (pbr.metallicRoughnessTexture) {
        const mr = getTex(pbr.metallicRoughnessTexture.index, false);
        opts.roughnessMap = mr;
        opts.metalnessMap = mr;
      }
      if (m.normalTexture) opts.normalMap = getTex(m.normalTexture.index, false);
      if (m.alphaMode === 'MASK') {
        opts.alphaTest = m.alphaCutoff ?? 0.45;
      } else if (m.alphaMode === 'BLEND') {
        opts.transparent = true;
        opts.opacity = pbr.baseColorFactor?.[3] ?? 0.65;
      }
      return new THREE.MeshStandardMaterial(opts);
    });
    const defaultMat = new THREE.MeshStandardMaterial({ color: 0x8b9398, roughness: 0.78, metalness: 0.08 });

    const meshPrims = (gltf.meshes || []).map(meshDef => {
      const out = [];
      for (const prim of meshDef.primitives || []) {
        if (prim.mode !== undefined && prim.mode !== 4) continue;
        const posAcc = readAccessor(gltf, binBuf, prim.attributes?.POSITION);
        if (!posAcc) continue;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(posAcc.array, posAcc.itemSize, posAcc.normalized));
        const nrmAcc = readAccessor(gltf, binBuf, prim.attributes?.NORMAL);
        if (nrmAcc) geo.setAttribute('normal', new THREE.BufferAttribute(nrmAcc.array, nrmAcc.itemSize, nrmAcc.normalized));
        const uvAcc = readAccessor(gltf, binBuf, prim.attributes?.TEXCOORD_0);
        if (uvAcc) geo.setAttribute('uv', new THREE.BufferAttribute(uvAcc.array, uvAcc.itemSize, uvAcc.normalized));
        const jntAcc = readAccessor(gltf, binBuf, prim.attributes?.JOINTS_0);
        if (jntAcc) geo.setAttribute('skinIndex', new THREE.BufferAttribute(jntAcc.array, 4, false));
        const wgtAcc = readAccessor(gltf, binBuf, prim.attributes?.WEIGHTS_0);
        if (wgtAcc) {
          let wArr = wgtAcc.array;
          if (!(wArr instanceof Float32Array)) {
            wArr = new Float32Array(wgtAcc.array.length);
            const denom = wgtAcc.normalized ? (wgtAcc.array instanceof Uint16Array ? 65535 : 255) : 1;
            for (let i = 0; i < wArr.length; i++) wArr[i] = wgtAcc.array[i] / denom;
          }
          geo.setAttribute('skinWeight', new THREE.BufferAttribute(wArr, 4, false));
        }
        if (prim.indices !== undefined) {
          const idxAcc = readAccessor(gltf, binBuf, prim.indices);
          if (idxAcc) geo.setIndex(new THREE.BufferAttribute(idxAcc.array, 1));
        }
        if (!nrmAcc && geo.computeVertexNormals) geo.computeVertexNormals();
        out.push({
          geo,
          mat: prim.material !== undefined && materials[prim.material] ? materials[prim.material] : defaultMat,
          skinned: !!(jntAcc && wgtAcc),
        });
      }
      return out;
    });

    const skinDefs = (gltf.skins || []).map(sk => {
      const ibmAcc = sk.inverseBindMatrices !== undefined ? readAccessor(gltf, binBuf, sk.inverseBindMatrices) : null;
      const inverses = [];
      if (ibmAcc && THREE.Matrix4) {
        for (let i = 0; i < sk.joints.length; i++) {
          const m = new THREE.Matrix4();
          m.fromArray(ibmAcc.array, i * 16);
          inverses.push(m);
        }
      }
      return { joints: sk.joints || [], inverses };
    });

    const nodeNames = (gltf.nodes || []).map((nd, i) => sanitizeName(nd.name, i));
    const clips = {};
    const rotationOnlyClips = {};
    for (let ai = 0; ai < (gltf.animations || []).length; ai++) {
      const anim = gltf.animations[ai];
      const clipName = (anim.name || `anim_${ai}`).trim();
      const tracks = [];
      const rotTracks = [];
      for (const ch of anim.channels || []) {
        if (ch.target?.node === undefined) continue;
        const sampler = anim.samplers?.[ch.sampler];
        if (!sampler) continue;
        const inAcc = readAccessor(gltf, binBuf, sampler.input);
        const outAcc = readAccessor(gltf, binBuf, sampler.output);
        if (!inAcc || !outAcc) continue;
        const targetName = nodeNames[ch.target.node];
        const path = ch.target.path;
        let track = null;
        if (path === 'rotation' && THREE.QuaternionKeyframeTrack) {
          track = new THREE.QuaternionKeyframeTrack(`${targetName}.quaternion`, inAcc.array, outAcc.array);
          if (!/hips|pelvis/i.test(targetName)) rotTracks.push(track);
        } else if (path === 'translation' && THREE.VectorKeyframeTrack) {
          track = new THREE.VectorKeyframeTrack(`${targetName}.position`, inAcc.array, outAcc.array);
        } else if (path === 'scale' && THREE.VectorKeyframeTrack) {
          track = new THREE.VectorKeyframeTrack(`${targetName}.scale`, inAcc.array, outAcc.array);
        }
        if (track) tracks.push(track);
      }
      if (tracks.length && THREE.AnimationClip) {
        clips[clipName.toLowerCase()] = new THREE.AnimationClip(clipName, -1, tracks);
      }
      if (rotTracks.length && THREE.AnimationClip) {
        rotationOnlyClips[clipName.toLowerCase()] = new THREE.AnimationClip(`${clipName}_rot`, -1, rotTracks);
      }
    }

    return { gltf, spec, jointSet, meshPrims, skinDefs, nodeNames, clips, rotationOnlyClips };
  }

  function instantiateFromTemplate(THREE, tpl, { tintHex = null, armed = false } = {}) {
    const { gltf, spec, jointSet, meshPrims, skinDefs, nodeNames } = tpl;
    const nodeObjs = new Array((gltf.nodes || []).length);
    const skinnedEntries = [];

    for (let i = 0; i < (gltf.nodes || []).length; i++) {
      const nd = gltf.nodes[i];
      const isJoint = jointSet.has(i);
      const obj = isJoint && THREE.Bone ? new THREE.Bone() : new THREE.Group();
      obj.name = nodeNames[i];
      if (Array.isArray(nd.matrix) && nd.matrix.length === 16 && obj.applyMatrix4 && THREE.Matrix4) {
        obj.applyMatrix4(new THREE.Matrix4().fromArray(nd.matrix));
      } else {
        if (Array.isArray(nd.translation)) obj.position.set(nd.translation[0], nd.translation[1], nd.translation[2]);
        if (Array.isArray(nd.rotation)) obj.quaternion.set(nd.rotation[0], nd.rotation[1], nd.rotation[2], nd.rotation[3]);
        if (Array.isArray(nd.scale)) obj.scale.set(nd.scale[0], nd.scale[1], nd.scale[2]);
      }
      nodeObjs[i] = obj;
    }

    for (let i = 0; i < (gltf.nodes || []).length; i++) {
      const nd = gltf.nodes[i];
      for (const cIdx of nd.children || []) {
        if (nodeObjs[cIdx]) nodeObjs[i].add(nodeObjs[cIdx]);
      }
    }

    const effectiveTint = spec.rigType === 'bip01' ? null : (tintHex != null ? tintHex : (spec.defaultTint ?? null));
    const tintColor = effectiveTint != null && THREE.Color ? new THREE.Color(effectiveTint) : null;
    const white = THREE.Color ? new THREE.Color(0xffffff) : null;
    const tintStrength = spec.tintStrength ?? 0.34;
    for (let i = 0; i < (gltf.nodes || []).length; i++) {
      const nd = gltf.nodes[i];
      if (nd.mesh === undefined || !meshPrims[nd.mesh]) continue;
      for (const p of meshPrims[nd.mesh]) {
        let mat = p.mat;
        if (tintColor && mat?.clone && !/visor|head|face|skin|hair|eye/i.test(mat.name || '')) {
          mat = mat.clone();
          if (mat.color) {
            const blend = white.clone().lerp(tintColor, tintStrength);
            mat.color.multiply(blend);
          }
        }
        const mesh = (p.skinned && nd.skin !== undefined && THREE.SkinnedMesh)
          ? new THREE.SkinnedMesh(p.geo, mat)
          : new THREE.Mesh(p.geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        nodeObjs[i].add(mesh);
        if (mesh.isSkinnedMesh && nd.skin !== undefined) {
          skinnedEntries.push({ mesh, skinIdx: nd.skin });
        }
      }
    }

    const inner = new THREE.Group();
    inner.name = 'glb-character-inner';
    const sceneDef = gltf.scenes?.[gltf.scene || 0] || gltf.scenes?.[0];
    for (const rIdx of sceneDef?.nodes || []) {
      if (nodeObjs[rIdx]) inner.add(nodeObjs[rIdx]);
    }

    inner.updateMatrixWorld(true);
    for (const { mesh, skinIdx } of skinnedEntries) {
      const skDef = skinDefs[skinIdx];
      if (!skDef || !THREE.Skeleton) continue;
      const bones = skDef.joints.map(j => nodeObjs[j]).filter(Boolean);
      const inverses = skDef.inverses.length === bones.length
        ? skDef.inverses.map(m => m.clone())
        : undefined;
      const skeleton = new THREE.Skeleton(bones, inverses);
      mesh.normalizeSkinWeights?.();
      mesh.bind(skeleton, new THREE.Matrix4());
    }

    const root = new THREE.Group();
    root.name = 'glb-character-root';
    inner.rotation.y = spec.yawOffset || 0;
    root.add(inner);
    root.updateMatrixWorld(true);
    let baseInnerY = 0;
    if (THREE.Box3) {
      const box = new THREE.Box3().setFromObject(inner);
      const h = box.max.y - box.min.y;
      if (Number.isFinite(h) && h > 0.25 && h < 5.0) {
        const s = (spec.targetHeight || 1.75) / h;
        const [bx, by, bz] = Array.isArray(spec.buildScale) ? spec.buildScale : [1, 1, 1];
        inner.scale.set(inner.scale.x * s * bx, inner.scale.y * s * by, inner.scale.z * s * bz);
        root.updateMatrixWorld(true);
        const box2 = new THREE.Box3().setFromObject(inner);
        if (Number.isFinite(box2.min.y)) {
          inner.position.y -= box2.min.y;
          baseInnerY = inner.position.y;
        }
      }
    }

    const mixer = THREE.AnimationMixer && Object.keys(tpl.clips).length ? new THREE.AnimationMixer(inner) : null;
    const actions = {};
    if (mixer) {
      for (const [k, clip] of Object.entries(tpl.clips)) actions[k] = mixer.clipAction(clip);
    }

    const pickAction = (...names) => {
      for (const n of names) if (actions[n]) return actions[n];
      const vals = Object.values(actions);
      return vals.length ? vals[0] : null;
    };

    const idleAct = spec.mixamo ? pickAction('idle', 'tpose') : pickAction('idle', 'anim_0');
    const walkAct = spec.mixamo ? pickAction('walk', 'run', 'idle') : pickAction('walk', 'anim_0');
    const runAct = spec.mixamo ? pickAction('run', 'walk', 'idle') : pickAction('run', 'walk', 'anim_0');

    let currentAct = null;
    function fadeTo(nextAct, fadeSec = 0.22, timeScale = 1.0) {
      if (!nextAct) return;
      nextAct.timeScale = timeScale;
      if (currentAct === nextAct) return;
      if (currentAct) {
        nextAct.reset().setEffectiveTimeScale(timeScale).setEffectiveWeight(1).play();
        currentAct.crossFadeTo(nextAct, fadeSec, false);
      } else {
        nextAct.reset().setEffectiveTimeScale(timeScale).setEffectiveWeight(1).play();
      }
      currentAct = nextAct;
    }

    if (idleAct) {
      fadeTo(idleAct, 0.01, 1.0);
      mixer?.update?.(0.016);
    }

    const findBone = name => (name ? inner.getObjectByName(name) : null);
    const headBone = findBone(spec.headBone);
    const neckBone = findBone(spec.neckBone);
    const spineBone = findBone(spec.spineBone);
    const rightArm = findBone(spec.rightArm);
    const rightForeArm = findBone(spec.rightForeArm);
    const rightHand = findBone(spec.rightHand);
    const leftArm = findBone(spec.leftArm);
    const leftForeArm = findBone(spec.leftForeArm);
    const leftUpLeg = findBone(spec.leftUpLeg);
    const leftLeg = findBone(spec.leftLeg);
    const rightUpLeg = findBone(spec.rightUpLeg);
    const rightLeg = findBone(spec.rightLeg);

    // Save rest Euler rotations for procedural Bip01 animation & clean seated/aim overrides
    const restRot = new Map();
    for (const b of [headBone, neckBone, spineBone, rightArm, rightForeArm, leftArm, leftForeArm, leftUpLeg, leftLeg, rightUpLeg, rightLeg]) {
      if (b) restRot.set(b, b.rotation.clone());
    }

    // Attach a real 3D tactical assault rifle directly to the right hand bone for Special Forces teammates & mercenaries!
    const isArmed = Boolean(armed || spec.armed);
    if (isArmed && rightHand) {
      const rifle = createTacticalRifle(THREE);
      if (rifle) {
        // Compensate for bone world scale (Mixamo uses 0.01 cm scale; Bip01 uses meters)
        const handScale = spec.mixamo ? 100 : 1;
        rifle.scale.setScalar(handScale);
        if (spec.mixamo) {
          rifle.position.set(0, 8, 6);
          rifle.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
        } else {
          rifle.position.set(0.06, -0.02, 0.04);
          rifle.rotation.set(0, Math.PI / 2, 0);
        }
        rightHand.add(rifle);
      }
    }

    let talkClock = 0;
    let walkClock = 0;
    let poseBlend = 0;
    let lastOverlayMode = 'stand';
    const tmpHeadPos = new THREE.Vector3();

    function resetToRest(bone) {
      const r = bone ? restRot.get(bone) : null;
      if (r) bone.rotation.copy(r);
    }

    function updatePose(mode = 'stand', stride = 0, age = 0, moving = false, dt = 0.016) {
      const safeDt = Math.max(0, Math.min(0.08, Number.isFinite(dt) ? dt : 0.016));
      const isSeated = mode === 'seated';
      const isTalking = mode === 'talk';
      const isInspect = mode === 'inspect_console';
      const isPoint = mode === 'point_ahead';
      const isWave = mode === 'wave_follow';
      const isRadio = mode === 'radio_call';
      const isSalute = mode === 'salute';
      const isGuardAim = mode === 'aim_guard';
      const hasOverlay = isTalking || isInspect || isPoint || isWave || isRadio || isSalute || isGuardAim;
      const isWalking = !isSeated && (moving || mode === 'walk');
      const isRunning = !isSeated && mode === 'run';

      if (hasOverlay) {
        if (lastOverlayMode !== mode) { poseBlend = Math.min(poseBlend, 0.25); lastOverlayMode = mode; }
        poseBlend = Math.min(1, poseBlend + safeDt * 5.2);
      } else {
        poseBlend = Math.max(0, poseBlend - safeDt * 6.0);
        if (poseBlend <= 0.01) lastOverlayMode = 'stand';
      }
      const w = poseBlend * poseBlend * (3 - 2 * poseBlend);

      // Seated pelvis lowering
      inner.position.y = isSeated ? baseInnerY - 0.34 : baseInnerY;

      if (mixer && spec.mixamo) {
        if (isRunning) fadeTo(runAct, 0.22, 1.05);
        else if (isWalking) fadeTo(walkAct, 0.22, 1.0);
        else fadeTo(idleAct, 0.28, isTalking ? 0.85 : 0.9);
        mixer.update(safeDt);
      } else {
        // Procedural Bip01 skeletal animation (for Microsoft Rocketbox photorealistic characters)
        for (const b of restRot.keys()) resetToRest(b);
        if (isWalking || isRunning) {
          walkClock += safeDt * (isRunning ? 10.5 : 6.4);
          const sw = Math.sin(walkClock) * (isRunning ? 0.62 : 0.38);
          const knL = Math.max(0, -Math.sin(walkClock)) * (isRunning ? 0.85 : 0.52);
          const knR = Math.max(0, Math.sin(walkClock)) * (isRunning ? 0.85 : 0.52);
          if (leftUpLeg) leftUpLeg.rotation.z += sw;
          if (rightUpLeg) rightUpLeg.rotation.z -= sw;
          if (leftLeg) leftLeg.rotation.z -= knL;
          if (rightLeg) rightLeg.rotation.z -= knR;
          if (spineBone) spineBone.rotation.y += Math.sin(walkClock) * 0.04;
          if (!isArmed) {
            if (leftArm) leftArm.rotation.z -= sw * 0.65;
            if (rightArm) rightArm.rotation.z += sw * 0.65;
          }
        } else {
          // Relaxed natural arms-down posture from T-pose + subtle breathing
          if (leftArm) leftArm.rotation.x += 1.12;
          if (rightArm) rightArm.rotation.x -= 1.12;
          if (spineBone) spineBone.rotation.z += Math.sin(age * 1.8) * 0.018;
          if (headBone) headBone.rotation.y += Math.sin(age * 0.55) * 0.10;
        }
        // Rifle-ready hold for armed Special Forces teammates
        if (isArmed && !isSeated && !hasOverlay) {
          if (rightArm) { rightArm.rotation.x -= 0.45; rightArm.rotation.z += 0.55; }
          if (rightForeArm) rightForeArm.rotation.y -= 0.72;
          if (leftArm) { leftArm.rotation.x += 0.55; leftArm.rotation.z += 0.65; }
          if (leftForeArm) leftForeArm.rotation.y += 0.82;
        }
      }

      // Proper seated pose inside SAR 4x4 vehicle (works for both Mixamo & Bip01!)
      if (isSeated) {
        if (spec.mixamo) {
          if (leftUpLeg) leftUpLeg.rotation.x -= 1.35;
          if (rightUpLeg) rightUpLeg.rotation.x -= 1.35;
          if (leftLeg) leftLeg.rotation.x += 1.38;
          if (rightLeg) rightLeg.rotation.x += 1.38;
          if (rightArm) rightArm.rotation.x -= 0.48;
          if (leftArm) leftArm.rotation.x -= 0.48;
        } else {
          if (leftUpLeg) leftUpLeg.rotation.z += 1.38;
          if (rightUpLeg) rightUpLeg.rotation.z += 1.38;
          if (leftLeg) leftLeg.rotation.z -= 1.42;
          if (rightLeg) rightLeg.rotation.z -= 1.42;
          if (rightArm) rightArm.rotation.z += 0.45;
          if (leftArm) leftArm.rotation.z += 0.45;
        }
        return;
      }

      // Expressive procedural character action overlays (works for both Mixamo & Rocketbox Bip01)
      if (isTalking && w > 0.001) {
        talkClock += safeDt;
        const nod = (Math.sin(talkClock * 2.8) * 0.065 + Math.sin(talkClock * 1.15) * 0.04) * w;
        const turn = Math.sin(talkClock * 1.45) * 0.09 * w;
        const tilt = Math.cos(talkClock * 0.95) * 0.045 * w;
        if (headBone) { headBone.rotation.x += nod; headBone.rotation.y += turn; headBone.rotation.z += tilt; }
        if (neckBone) { neckBone.rotation.x += nod * 0.45; neckBone.rotation.y += turn * 0.35; }
        if (spineBone) { spineBone.rotation.x += Math.sin(talkClock * 1.8) * 0.025 * w; spineBone.rotation.y += Math.sin(talkClock * 0.85) * 0.04 * w; }
        const gesture = Math.max(0, Math.sin(talkClock * 2.2));
        if (rightArm) rightArm.rotation.z += (0.28 + gesture * 0.22) * w;
        if (rightForeArm) rightForeArm.rotation.y -= (0.35 + Math.sin(talkClock * 3.1) * 0.16) * w;
      } else if (isInspect && w > 0.001) {
        talkClock += safeDt;
        if (spineBone) spineBone.rotation.z += (0.14 + Math.sin(talkClock * 1.8) * 0.03) * w;
        if (headBone) { headBone.rotation.z += 0.18 * w; headBone.rotation.x += Math.sin(talkClock * 1.6) * 0.16 * w; }
        if (rightArm) rightArm.rotation.z += (0.72 + Math.sin(talkClock * 5.2) * 0.14) * w;
        if (rightForeArm) rightForeArm.rotation.y -= (0.65 + Math.cos(talkClock * 5.8) * 0.18) * w;
        if (leftArm) leftArm.rotation.z += (0.68 + Math.cos(talkClock * 4.8) * 0.12) * w;
        if (leftForeArm) leftForeArm.rotation.y += (0.58 + Math.sin(talkClock * 5.4) * 0.16) * w;
      } else if (isPoint && w > 0.001) {
        talkClock += safeDt;
        if (headBone) headBone.rotation.y += Math.sin(talkClock * 1.3) * 0.16 * w;
        if (rightArm) { rightArm.rotation.x += 0.42 * w; rightArm.rotation.z += (1.12 + Math.sin(talkClock * 2.6) * 0.08) * w; }
        if (rightForeArm) rightForeArm.rotation.y -= 0.12 * w;
      } else if (isWave && w > 0.001) {
        talkClock += safeDt;
        if (rightArm) { rightArm.rotation.x += 1.48 * w; rightArm.rotation.z += (0.42 + Math.sin(talkClock * 7.2) * 0.34) * w; }
        if (rightForeArm) rightForeArm.rotation.y -= (0.48 + Math.cos(talkClock * 7.2) * 0.28) * w;
      } else if (isRadio && w > 0.001) {
        talkClock += safeDt;
        if (headBone) { headBone.rotation.z -= 0.12 * w; headBone.rotation.x += Math.sin(talkClock * 3.2) * 0.05 * w; }
        if (leftArm) { leftArm.rotation.x -= 0.65 * w; leftArm.rotation.z += 0.85 * w; }
        if (leftForeArm) leftForeArm.rotation.y += 1.25 * w;
      } else if (isSalute && w > 0.001) {
        talkClock += safeDt;
        if (spineBone) spineBone.rotation.z -= 0.04 * w;
        if (rightArm) { rightArm.rotation.x += 0.92 * w; rightArm.rotation.z += 0.72 * w; }
        if (rightForeArm) rightForeArm.rotation.y -= 1.45 * w;
      } else if (isGuardAim && w > 0.001) {
        talkClock += safeDt;
        const scan = Math.sin(talkClock * 1.15) * 0.32 * w;
        if (spineBone) spineBone.rotation.y += scan * 0.45;
        if (headBone) headBone.rotation.y += scan;
        if (isArmed) {
          if (rightArm) { rightArm.rotation.x -= 0.38 * w; rightArm.rotation.z += 0.82 * w; }
          if (rightForeArm) rightForeArm.rotation.y -= 0.78 * w;
          if (leftArm) { leftArm.rotation.x += 0.48 * w; leftArm.rotation.z += 0.86 * w; }
          if (leftForeArm) leftForeArm.rotation.y += 0.88 * w;
        } else {
          if (rightArm) rightArm.rotation.z += 0.22 * w;
          if (leftArm) leftArm.rotation.z += 0.22 * w;
        }
      } else {
        talkClock = 0;
      }
    }

    function getHeadWorldPos(outVec) {
      const target = outVec || tmpHeadPos;
      if (headBone) {
        root.updateMatrixWorld(true);
        headBone.getWorldPosition(target);
        target.y += 0.06;
        return target;
      }
      root.getWorldPosition(target);
      target.y += (spec.targetHeight || 1.74) - 0.20;
      return target;
    }

    return { root, mixer, updatePose, getHeadWorldPos, headBone };
  }

  const urlBufferPromises = new Map();
  const templatePromises = new Map();

  function fetchGlbOnce(url) {
    if (!urlBufferPromises.has(url)) {
      const p = (typeof fetch === 'function' && typeof window !== 'undefined')
        ? fetch(url).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null)
        : Promise.resolve(null);
      urlBufferPromises.set(url, p);
    }
    return urlBufferPromises.get(url);
  }

  function loadTemplate(THREE, modelType) {
    const key = resolveKey(modelType);
    if (!templatePromises.has(key)) {
      const spec = MODEL_CATALOG[key];
      const p = fetchGlbOnce(spec.url)
        .then(buf => {
          if (!buf) return null;
          const parsed = parseGlbBinary(buf);
          if (!parsed) return null;
          return buildTemplateFromGlb(THREE, parsed.gltf, parsed.binBuf, spec);
        })
        .catch(() => null);
      templatePromises.set(key, p);
    }
    return templatePromises.get(key);
  }

  function attachToActor(THREE, actor, { modelType = 'specops_male', tintHex = null, armed = false, onReady = null } = {}) {
    if (!THREE || !actor || typeof fetch !== 'function') return;
    const key = resolveKey(modelType);
    loadTemplate(THREE, key).then(tpl => {
      if (!tpl) return; // Cleanly keep role-specific procedural character when optional Rocketbox GLB isn't downloaded yet
      const inst = instantiateFromTemplate(THREE, tpl, { tintHex, armed });
      actor.add(inst.root);
      if (typeof onReady === 'function') onReady(inst);
    }).catch(() => {});
  }

  function preloadAll(THREE) {
    if (!THREE || typeof fetch !== 'function') return Promise.resolve();
    return Promise.all(Object.keys(MODEL_CATALOG).map(k => loadTemplate(THREE, k))).catch(() => {});
  }

  if (typeof window !== 'undefined') {
    window.SaltlineNpcModels = {
      catalog: MODEL_CATALOG,
      aliases: ALIASES,
      attachToActor,
      preloadAll,
    };
  }
})();
