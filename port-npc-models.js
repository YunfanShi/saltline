/* Saltline Real Rigged 3D Human Character Loader (GLB 2.0 + SkinnedMesh + AnimationMixer).
 * Loads local MIT/CC0 rigged human characters (Soldier.glb, Michelle.glb, CesiumMan.glb),
 * shares Mixamo Idle/Walk/Run clips across Mixamo-rigged models (Soldier -> Michelle),
 * clones independent Skeletons per NPC instance, and drives talking/nodding/gesture overlays. */
(() => {
  const MODEL_CATALOG = {
    soldier: {
      url: './assets/models/characters/Soldier.glb',
      targetHeight: 1.78,
      yawOffset: Math.PI, // Three.js Soldier.glb faces -Z locally; rotate to +Z
      mixamo: true,
      headBone: 'mixamorig_Head',
      neckBone: 'mixamorig_Neck',
      spineBone: 'mixamorig_Spine2',
      rightArm: 'mixamorig_RightArm',
      rightForeArm: 'mixamorig_RightForeArm',
      leftArm: 'mixamorig_LeftArm',
      leftForeArm: 'mixamorig_LeftForeArm',
    },
    female: {
      url: './assets/models/characters/Michelle.glb',
      targetHeight: 1.68,
      yawOffset: 0, // Michelle.glb faces +Z locally
      mixamo: true,
      useSharedMixamoClips: true,
      headBone: 'mixamorig_Head',
      neckBone: 'mixamorig_Neck',
      spineBone: 'mixamorig_Spine2',
      rightArm: 'mixamorig_RightArm',
      rightForeArm: 'mixamorig_RightForeArm',
      leftArm: 'mixamorig_LeftArm',
      leftForeArm: 'mixamorig_LeftForeArm',
    },
    civilian: {
      url: './assets/models/characters/CesiumMan.glb',
      targetHeight: 1.74,
      yawOffset: 0,
      mixamo: false,
      headBone: 'Skeleton_torso_joint_3',
      neckBone: 'Skeleton_torso_joint_2',
      spineBone: 'Skeleton_torso_joint_1',
      rightArm: 'arm_joint_R_1',
      rightForeArm: 'arm_joint_R_2',
      leftArm: 'arm_joint_L_1',
      leftForeArm: 'arm_joint_L_2',
    },
  };

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
    return raw.replace(/[:.\[\]\/\\]/g, '_');
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
      if (m.alphaMode === 'BLEND') {
        opts.transparent = true;
        opts.opacity = pbr.baseColorFactor?.[3] ?? 0.65;
      }
      return new THREE.MeshStandardMaterial(opts);
    });
    const defaultMat = new THREE.MeshStandardMaterial({ color: 0x8b9398, roughness: 0.78, metalness: 0.08 });

    // Build reusable BufferGeometries per mesh
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

    // Decode skin inverse bind matrices
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

    // Build AnimationClips (using sanitized node names!)
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
          rotTracks.push(track);
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

  function instantiateFromTemplate(THREE, tpl, { tintHex = null, sharedMixamoClips = null } = {}) {
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

    // Wire hierarchy
    for (let i = 0; i < (gltf.nodes || []).length; i++) {
      const nd = gltf.nodes[i];
      for (const cIdx of nd.children || []) {
        if (nodeObjs[cIdx]) nodeObjs[i].add(nodeObjs[cIdx]);
      }
    }

    // Attach meshes / skinned meshes with subtle role tinting
    const tintColor = tintHex != null && THREE.Color ? new THREE.Color(tintHex) : null;
    const white = THREE.Color ? new THREE.Color(0xffffff) : null;
    for (let i = 0; i < (gltf.nodes || []).length; i++) {
      const nd = gltf.nodes[i];
      if (nd.mesh === undefined || !meshPrims[nd.mesh]) continue;
      for (const p of meshPrims[nd.mesh]) {
        let mat = p.mat;
        if (tintColor && mat?.clone && !/visor/i.test(mat.name || '')) {
          mat = mat.clone();
          if (mat.color) {
            const blend = white.clone().lerp(tintColor, spec.mixamo ? 0.24 : 0.34);
            mat.color.multiply(blend);
          }
        }
        const mesh = (p.skinned && nd.skin !== undefined && THREE.SkinnedMesh)
          ? new THREE.SkinnedMesh(p.geo, mat)
          : new THREE.Mesh(p.geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false; // Never disappear in close-up dialogue shots!
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

    // Bind skeletons after hierarchy is assembled
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
      // glTF 2.0 skins define inverseBindMatrices in mesh-local space; bindMatrix MUST be identity
      // so modelMatrix * bindMatrixInverse cancels cleanly even after inner scale/yaw normalization.
      mesh.bind(skeleton, new THREE.Matrix4());
    }

    // Normalize orientation (+Z forward), height (~1.74m), and ground flush to y=0
    const root = new THREE.Group();
    root.name = 'glb-character-root';
    inner.rotation.y = spec.yawOffset || 0;
    root.add(inner);
    root.updateMatrixWorld(true);
    if (THREE.Box3) {
      const box = new THREE.Box3().setFromObject(inner);
      const h = box.max.y - box.min.y;
      if (Number.isFinite(h) && h > 0.25 && h < 5.0) {
        const s = (spec.targetHeight || 1.75) / h;
        inner.scale.multiplyScalar(s);
        root.updateMatrixWorld(true);
        const box2 = new THREE.Box3().setFromObject(inner);
        if (Number.isFinite(box2.min.y)) inner.position.y -= box2.min.y;
      }
    }

    // AnimationMixer + action bank
    const mixer = THREE.AnimationMixer ? new THREE.AnimationMixer(inner) : null;
    const actions = {};
    const clipPool = spec.useSharedMixamoClips && sharedMixamoClips
      ? { ...tpl.clips, ...sharedMixamoClips }
      : tpl.clips;

    if (mixer) {
      for (const [k, clip] of Object.entries(clipPool)) {
        actions[k] = mixer.clipAction(clip);
      }
    }

    const pickAction = (...names) => {
      for (const n of names) {
        if (actions[n]) return actions[n];
      }
      const vals = Object.values(actions);
      return vals.length ? vals[0] : null;
    };

    const idleAct = spec.mixamo ? pickAction('idle', 'tpose') : pickAction('anim_0');
    const walkAct = spec.mixamo ? pickAction('walk', 'run', 'idle') : pickAction('anim_0');
    const runAct = spec.mixamo ? pickAction('run', 'walk', 'idle') : pickAction('anim_0');

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

    // Start in idle
    if (idleAct) {
      fadeTo(idleAct, 0.01, spec.mixamo ? 1.0 : 0.0);
      mixer?.update?.(0.016);
    }

    // Resolve expressive bones for dialogue head-nods, look-at & conversational hand gestures
    const findBone = name => (name ? inner.getObjectByName(name) : null);
    const headBone = findBone(spec.headBone);
    const neckBone = findBone(spec.neckBone);
    const spineBone = findBone(spec.spineBone);
    const rightArm = findBone(spec.rightArm);
    const rightForeArm = findBone(spec.rightForeArm);
    const leftArm = findBone(spec.leftArm);
    const leftForeArm = findBone(spec.leftForeArm);

    let talkClock = 0;
    const tmpHeadPos = new THREE.Vector3();

    function updatePose(mode = 'stand', stride = 0, age = 0, moving = false, dt = 0.016) {
      const safeDt = Math.max(0, Math.min(0.08, Number.isFinite(dt) ? dt : 0.016));
      const isTalking = mode === 'talk';
      const isInspect = mode === 'inspect_console';
      const isPoint = mode === 'point_ahead';
      const isWave = mode === 'wave_follow';
      const isRadio = mode === 'radio_call';
      const isWalking = moving || mode === 'walk';
      const isRunning = mode === 'run';

      if (spec.mixamo) {
        if (isRunning) fadeTo(runAct, 0.2, 1.05);
        else if (isWalking) fadeTo(walkAct, 0.2, 1.0);
        else fadeTo(idleAct, 0.25, isTalking ? 0.85 : 0.9);
        mixer?.update?.(safeDt);
      } else if (mixer && walkAct) {
        // CesiumMan has a single walk clip: animate smoothly while walking, park at neutral stance when idle/talking
        if (isWalking || isRunning) {
          fadeTo(walkAct, 0.15, isRunning ? 1.35 : 1.0);
          mixer.update(safeDt);
        } else {
          if (currentAct !== walkAct) fadeTo(walkAct, 0.1, 0);
          walkAct.timeScale = 0;
          walkAct.time = 0.0;
          mixer.update(0.001);
        }
      }

      // Expressive procedural character action overlays on top of skeletal clips
      if (isTalking) {
        talkClock += safeDt;
        const nod = Math.sin(talkClock * 2.8) * 0.065 + Math.sin(talkClock * 1.15) * 0.04;
        const turn = Math.sin(talkClock * 1.45) * 0.09;
        const tilt = Math.cos(talkClock * 0.95) * 0.045;
        if (headBone) { headBone.rotation.x += nod; headBone.rotation.y += turn; headBone.rotation.z += tilt; }
        if (neckBone) { neckBone.rotation.x += nod * 0.45; neckBone.rotation.y += turn * 0.35; }
        if (spineBone) { spineBone.rotation.x += Math.sin(talkClock * 1.8) * 0.025; spineBone.rotation.y += Math.sin(talkClock * 0.85) * 0.04; }
        const gesture = Math.max(0, Math.sin(talkClock * 2.2));
        if (rightArm) rightArm.rotation.x -= 0.18 + gesture * 0.16;
        if (rightForeArm) rightForeArm.rotation.z += 0.22 + Math.sin(talkClock * 3.1) * 0.14;
        if (leftArm) leftArm.rotation.x -= 0.10 + Math.cos(talkClock * 1.9) * 0.08;
        if (leftForeArm) leftForeArm.rotation.z -= 0.14 + Math.cos(talkClock * 2.6) * 0.10;
      } else if (isInspect) {
        talkClock += safeDt;
        if (spineBone) spineBone.rotation.x += 0.11 + Math.sin(talkClock * 1.6) * 0.02;
        if (headBone) { headBone.rotation.x += 0.16; headBone.rotation.y += Math.sin(talkClock * 1.4) * 0.14; }
        if (rightArm) rightArm.rotation.x -= 0.58 + Math.sin(talkClock * 4.5) * 0.08;
        if (rightForeArm) rightForeArm.rotation.z += 0.38 + Math.cos(talkClock * 5.2) * 0.12;
        if (leftArm) leftArm.rotation.x -= 0.48 + Math.cos(talkClock * 3.8) * 0.06;
        if (leftForeArm) leftForeArm.rotation.z -= 0.32;
      } else if (isPoint) {
        talkClock += safeDt;
        if (headBone) headBone.rotation.y += Math.sin(talkClock * 1.3) * 0.16;
        if (spineBone) spineBone.rotation.y -= 0.08;
        if (rightArm) rightArm.rotation.x -= 1.05 + Math.sin(talkClock * 2.4) * 0.06;
        if (rightForeArm) rightForeArm.rotation.z += 0.08;
      } else if (isWave) {
        talkClock += safeDt;
        if (headBone) headBone.rotation.z += Math.sin(talkClock * 2.5) * 0.06;
        if (rightArm) rightArm.rotation.x -= 1.35;
        if (rightForeArm) rightForeArm.rotation.z += 0.35 + Math.sin(talkClock * 6.5) * 0.36;
      } else if (isRadio) {
        talkClock += safeDt;
        if (headBone) { headBone.rotation.z -= 0.09; headBone.rotation.x += Math.sin(talkClock * 2.2) * 0.04; }
        if (leftArm) leftArm.rotation.x -= 0.85;
        if (leftForeArm) leftForeArm.rotation.z -= 0.72;
      } else {
        talkClock = 0;
        if (!isWalking && !isRunning) {
          if (spineBone) spineBone.rotation.x += Math.sin(age * 1.8) * 0.022;
          if (headBone) headBone.rotation.y += Math.sin(age * 0.55) * 0.12;
        }
      }
    }

    function getHeadWorldPos(outVec) {
      const target = outVec || tmpHeadPos;
      if (headBone) {
        root.updateMatrixWorld(true);
        headBone.getWorldPosition(target);
        // Slightly lift from neck/head pivot to eye center
        target.y += spec.mixamo ? 0.06 : 0.08;
        return target;
      }
      root.getWorldPosition(target);
      target.y += (spec.targetHeight || 1.74) - 0.20;
      return target;
    }

    return { root, mixer, updatePose, getHeadWorldPos, headBone };
  }

  const templatePromises = new Map();
  let sharedMixamoPromise = null;

  function loadTemplate(THREE, modelType) {
    const key = MODEL_CATALOG[modelType] ? modelType : 'soldier';
    if (!templatePromises.has(key)) {
      const spec = MODEL_CATALOG[key];
      const p = (typeof fetch === 'function' && typeof window !== 'undefined')
        ? fetch(spec.url)
            .then(r => (r.ok ? r.arrayBuffer() : null))
            .then(buf => {
              if (!buf) return null;
              const parsed = parseGlbBinary(buf);
              if (!parsed) return null;
              return buildTemplateFromGlb(THREE, parsed.gltf, parsed.binBuf, spec);
            })
            .catch(() => null)
        : Promise.resolve(null);
      templatePromises.set(key, p);
    }
    return templatePromises.get(key);
  }

  function loadSharedMixamoClips(THREE) {
    if (!sharedMixamoPromise) {
      sharedMixamoPromise = loadTemplate(THREE, 'soldier').then(tpl => tpl?.rotationOnlyClips || null);
    }
    return sharedMixamoPromise;
  }

  function attachToActor(THREE, actor, { modelType = 'soldier', tintHex = null, onReady = null } = {}) {
    if (!THREE || !actor || typeof fetch !== 'function') return;
    const key = MODEL_CATALOG[modelType] ? modelType : 'soldier';
    const spec = MODEL_CATALOG[key];
    const reqs = spec.useSharedMixamoClips
      ? Promise.all([loadTemplate(THREE, key), loadSharedMixamoClips(THREE)])
      : Promise.all([loadTemplate(THREE, key), Promise.resolve(null)]);

    reqs.then(([tpl, sharedClips]) => {
      if (!tpl) return;
      const inst = instantiateFromTemplate(THREE, tpl, { tintHex, sharedMixamoClips: sharedClips });
      actor.add(inst.root);
      if (typeof onReady === 'function') onReady(inst);
    }).catch(() => {});
  }

  function preloadAll(THREE) {
    if (!THREE || typeof fetch !== 'function') return Promise.resolve();
    return Promise.all([
      loadTemplate(THREE, 'soldier'),
      loadTemplate(THREE, 'female'),
      loadTemplate(THREE, 'civilian'),
    ]).catch(() => {});
  }

  if (typeof window !== 'undefined') {
    window.SaltlineNpcModels = {
      catalog: MODEL_CATALOG,
      attachToActor,
      preloadAll,
    };
  }
})();
