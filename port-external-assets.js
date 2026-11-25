/* Saltline External CC0 3D PBR Asset Loader (Powered by Poly Haven CC0 glTF 2.0 Library).
 * Self-contained native glTF 2.0 loader built directly on Saltline's bundled THREE instance:
 *   - Loads verified CC0 1K PBR glTF models from Poly Haven CDN (CORS-enabled, works on file:// & http://)
 *   - Supports interleaved vertex attributes, indexed/non-indexed meshes, node hierarchies, and PBR textures
 *   - Auto-grounds every model flush to y = 0, caches templates, and clones cleanly across all 7 districts
 *   - Fails silently when offline or in headless Node.js unit tests (never blocks gameplay!) */
(() => {
  const POLYHAVEN_CATALOG = {
    portable_generator: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/portable_generator/portable_generator_1k.gltf',
    utility_box_01: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/utility_box_01/utility_box_01_1k.gltf',
    concrete_road_barrier: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/concrete_road_barrier/concrete_road_barrier_1k.gltf',
    exterior_aircon_unit: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/exterior_aircon_unit/exterior_aircon_unit_1k.gltf',
    modular_industrial_pipes_01: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/modular_industrial_pipes_01/modular_industrial_pipes_01_1k.gltf',
    modular_electricity_poles: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/modular_electricity_poles/modular_electricity_poles_1k.gltf',
    overhead_crane: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/1k/overhead_crane/overhead_crane_1k.gltf',
  };

  const localModels = ["desk_lamp_arm_01", "industrial_wall_lamp", "metal_office_desk", "modular_factory_facade", "office_notepads", "painted_wooden_chair_02", "vintage_radio_transceiver"];
  for (const id of localModels) POLYHAVEN_CATALOG[id] = './assets/models/' + id + '/scene.gltf';

  const TYPE_SIZES = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const COMP_ARRAYS = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
  };

  function resolveUrl(baseUrl, uri) {
    if (!uri) return '';
    if (/^(https?:|data:|blob:)/i.test(uri)) return uri;
    return baseUrl.slice(0, baseUrl.lastIndexOf('/') + 1) + uri;
  }

  function loadImageTexture(THREE, url, isColor) {
    if (typeof Image === 'undefined') return null;
    const tex = new THREE.Texture();
    tex.flipY = false;
    if (THREE.RepeatWrapping !== undefined) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
    }
    if (isColor && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      tex.image = img;
      tex.needsUpdate = true;
    };
    img.src = url;
    return tex;
  }

  function readAccessor(gltf, buffers, accIdx) {
    const acc = gltf.accessors?.[accIdx];
    if (!acc || acc.bufferView === undefined) return null;
    const bv = gltf.bufferViews?.[acc.bufferView];
    if (!bv) return null;
    const buf = buffers[bv.buffer || 0];
    if (!buf) return null;
    const TypedArr = COMP_ARRAYS[acc.componentType];
    if (!TypedArr) return null;
    const itemSize = TYPE_SIZES[acc.type] || 1;
    const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
    const elemBytes = TypedArr.BYTES_PER_ELEMENT;
    const stride = bv.byteStride || 0;
    let array;
    if (!stride || stride === itemSize * elemBytes) {
      array = new TypedArr(buf, byteOffset, acc.count * itemSize);
    } else {
      array = new TypedArr(acc.count * itemSize);
      const dv = new DataView(buf);
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
    return { array, itemSize, normalized: !!acc.normalized };
  }

  async function fetchGltfTemplate(THREE, url, id) {
    if (typeof fetch !== 'function' || typeof window === 'undefined') return null;
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const gltf = await res.json();
    const buffers = await Promise.all((gltf.buffers || []).map(async b => {
      const bUrl = resolveUrl(url, b.uri);
      const bRes = await fetch(bUrl, { mode: 'cors' });
      return bRes.ok ? bRes.arrayBuffer() : null;
    }));
    const textures = (gltf.textures || []).map(t => {
      const imgDef = gltf.images?.[t.source];
      return imgDef?.uri ? resolveUrl(url, imgDef.uri) : null;
    });
    const materials = (gltf.materials || []).map(m => {
      const pbr = m.pbrMetallicRoughness || {};
      const opts = {
        roughness: pbr.roughnessFactor !== undefined ? pbr.roughnessFactor : .82,
        metalness: pbr.metallicFactor !== undefined ? pbr.metallicFactor : .18,
      };
      if (Array.isArray(pbr.baseColorFactor)) {
        opts.color = new THREE.Color(pbr.baseColorFactor[0], pbr.baseColorFactor[1], pbr.baseColorFactor[2]);
      }
      if (m.doubleSided && THREE.DoubleSide !== undefined) opts.side = THREE.DoubleSide;
      if (pbr.baseColorTexture && textures[pbr.baseColorTexture.index]) {
        opts.map = loadImageTexture(THREE, textures[pbr.baseColorTexture.index], true);
      }
      if (pbr.metallicRoughnessTexture && textures[pbr.metallicRoughnessTexture.index]) {
        const mrTex = loadImageTexture(THREE, textures[pbr.metallicRoughnessTexture.index], false);
        opts.roughnessMap = mrTex;
        opts.metalnessMap = mrTex;
      }
      if (m.normalTexture && textures[m.normalTexture.index]) {
        opts.normalMap = loadImageTexture(THREE, textures[m.normalTexture.index], false);
      }
      if (m.occlusionTexture?.index === pbr.metallicRoughnessTexture?.index && opts.roughnessMap) opts.aoMap = opts.roughnessMap;
      if (m.alphaMode === 'BLEND') {
        opts.transparent = true;
        opts.depthWrite = false;
        opts.opacity = pbr.baseColorFactor?.[3] ?? .56;
      }
      return new THREE.MeshStandardMaterial(opts);
    });
    const defaultMat = new THREE.MeshStandardMaterial({ color: 0x6c7276, roughness: .8, metalness: .2 });

    function buildNode(nodeIdx) {
      const nd = gltf.nodes?.[nodeIdx];
      if (!nd) return null;
      const g = new THREE.Group();
      if (nd.name) g.name = nd.name;
      if (Array.isArray(nd.matrix) && nd.matrix.length === 16 && g.applyMatrix4 && THREE.Matrix4) {
        const m4 = new THREE.Matrix4().fromArray(nd.matrix);
        g.applyMatrix4(m4);
      } else {
        if (Array.isArray(nd.translation)) g.position.set(nd.translation[0], nd.translation[1], nd.translation[2]);
        if (Array.isArray(nd.rotation) && g.quaternion) g.quaternion.set(nd.rotation[0], nd.rotation[1], nd.rotation[2], nd.rotation[3]);
        if (Array.isArray(nd.scale)) g.scale.set(nd.scale[0], nd.scale[1], nd.scale[2]);
      }
      if (nd.mesh !== undefined && gltf.meshes?.[nd.mesh]) {
        for (const prim of gltf.meshes[nd.mesh].primitives || []) {
          if (prim.mode !== undefined && prim.mode !== 4) continue; // TRIANGLES only
          const posAcc = readAccessor(gltf, buffers, prim.attributes?.POSITION);
          if (!posAcc) continue;
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(posAcc.array, posAcc.itemSize, posAcc.normalized));
          const nrmAcc = readAccessor(gltf, buffers, prim.attributes?.NORMAL);
          if (nrmAcc) geo.setAttribute('normal', new THREE.BufferAttribute(nrmAcc.array, nrmAcc.itemSize, nrmAcc.normalized));
          const uvAcc = readAccessor(gltf, buffers, prim.attributes?.TEXCOORD_0);
          if (uvAcc) geo.setAttribute('uv', new THREE.BufferAttribute(uvAcc.array, uvAcc.itemSize, uvAcc.normalized));
          if (prim.indices !== undefined) {
            const idxAcc = readAccessor(gltf, buffers, prim.indices);
            if (idxAcc) geo.setIndex(new THREE.BufferAttribute(idxAcc.array, 1));
          }
          if (!nrmAcc && geo.computeVertexNormals) geo.computeVertexNormals();
          const mat = prim.material !== undefined && materials[prim.material] ? materials[prim.material] : defaultMat;
          const mesh = new THREE.Mesh(geo, mat);
          mesh.receiveShadow = true;
          mesh.castShadow = false;
          g.add(mesh);
        }
      }
      for (const childIdx of nd.children || []) {
        const child = buildNode(childIdx);
        if (child) g.add(child);
      }
      return g;
    }

    const root = new THREE.Group();
    const sceneDef = gltf.scenes?.[gltf.scene || 0] || gltf.scenes?.[0];
    for (const rootIdx of sceneDef?.nodes || []) {
      const name = gltf.nodes[rootIdx]?.name || '';
      if (id === 'modular_factory_facade' && !['wall_window_centered_double_01','window_centered_double_01','cornice01_standard_standard_01','wall_pier_standard_01'].includes(name)) continue;
      const nodeObj = buildNode(rootIdx);
      if (nodeObj) root.add(nodeObj);
    }
    // Auto-ground template so bottom sits cleanly on y = 0
    if (THREE.Box3 && root.children.length) {
      root.updateMatrixWorld?.(true);
      const box = new THREE.Box3().setFromObject(root);
      if (Number.isFinite(box.min.y)) root.position.y -= box.min.y;
    }
    const wrapper = new THREE.Group();
    wrapper.add(root);
    return wrapper;
  }

  window.createSaltlineExternalAssets = THREE => {
    const cache = new Map();
    let disposed = false;

    function load(id) {
      const url = POLYHAVEN_CATALOG[id];
      if (!url) return Promise.resolve(null);
      if (!cache.has(id)) {
        cache.set(id, fetchGltfTemplate(THREE, url, id).catch(() => null));
      }
      return cache.get(id);
    }

    function place(parent, id, x, y, z, yaw = 0, scale = 1.0, part = null) {
      if (!parent || !POLYHAVEN_CATALOG[id] || typeof fetch !== 'function') return null;
      const anchor = new THREE.Group();
      anchor.name = 'polyhaven-' + id;
      anchor.position.set(x, y, z);
      anchor.rotation.y = yaw;
      if (Array.isArray(scale)) anchor.scale.set(...scale);
      else anchor.scale.setScalar(scale);
      parent.add(anchor);
      load(id).then(tpl => {
        if (!tpl || disposed || !anchor.parent) return;
        const src = part ? tpl.getObjectByName(part) : tpl;
        if (!src) return;
        const inst = src.clone(true);
        if (part) inst.position.set(0,0,0);
        anchor.add(inst);
      });
      return anchor;
    }

    function placeFacadeModules(parent, placements) {
      const group = new THREE.Group();
      group.name = 'polyhaven-modular_factory_facade';
      parent.add(group);
      load('modular_factory_facade').then(template => {
        if (!template || disposed || !group.parent) return;
        const transform = new THREE.Object3D();
        const batches = new Map();
        for (const [part,x,y,z,yaw,sx,sy] of placements) {
          const node = template.getObjectByName(part);
          if (!node) continue;
          transform.position.set(x,y,z); transform.rotation.y=yaw; transform.scale.set(sx,sy,1);
          transform.updateMatrix();
          for (const primitive of node.children) {
            let instances=batches.get(primitive);
            if (!instances) batches.set(primitive,instances=[]);
            instances.push(transform.matrix.clone());
          }
        }
        for (const [primitive,matrices] of batches) {
          const mesh=new THREE.InstancedMesh(primitive.geometry,primitive.material,matrices.length);
          for(let i=0;i<matrices.length;i++) mesh.setMatrixAt(i,matrices[i]);
          mesh.receiveShadow=true;
          group.add(mesh);
        }
      });
    }

    function dispose() {
      disposed = true;
      for (const pending of cache.values()) pending.then(template => {
        const resources = new Set();
        template?.traverse(node => {
          if (!node.isMesh) return;
          resources.add(node.geometry);
          for (const material of [].concat(node.material)) {
            resources.add(material);
            for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
          }
        });
        for (const resource of resources) resource.dispose();
      });
      cache.clear();
    }

    return { catalog: POLYHAVEN_CATALOG, load, place, placeFacadeModules, dispose };
  };
})();
