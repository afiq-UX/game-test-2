# Rumah Off — 3D Design System Spec

> Reference for building/refactoring the appliance game's visual + structural layer.
> Stack: Vanilla Three.js + Vite. No React.

---

## Decisions Locked

| Decision | Choice |
|---|---|
| Stack | Stay vanilla Three.js (no R3F migration) |
| Gameplay | Turn-off-and-leave only. No energy info panel. |
| 3D models | Parametric now, GLTF later. Abstract both behind same interface. |
| Mobile | Desktop + mobile, degrade gracefully |

---

## 1. Folder Structure (Target)

```
src/
├── tokens/
│   ├── materials.js       ← named PBR presets
│   ├── lights.js          ← light color/intensity/distance presets
│   └── quality.js         ← device tier definitions
├── systems/
│   ├── MaterialSystem.js  ← cached material creation, quality-aware
│   ├── GeometrySystem.js  ← parametric registry + future GLTF adapter
│   ├── QualitySystem.js   ← device detection, tier selection, runtime caps
│   └── BehaviorSystem.js  ← spin, emissive toggle, light toggle
├── configs/
│   ├── appliances.js      ← 26 appliance definitions (pure data, no Three.js)
│   └── rooms.js           ← extracted from house.js ROOMS export
├── factory/
│   └── ApplianceFactory.js ← reads config → outputs Group + state object
├── house.js               ← walls, floors, furniture, doors (unchanged)
├── minimap.js             ← unchanged
├── input.js               ← extracted from main.js (keyboard, mouse, touch, joystick)
└── main.js                ← scene setup, game loop, HUD (simplified)
```

**Migration principle:** Extract, don't rewrite. Each refactor step should keep the game playable.

---

## 2. Material Token Layer

### Problem with current code

`appliances.js` creates ~60 separate `MeshStandardMaterial` instances with hardcoded hex values. Same "stainless steel" appears 4 times as different objects. No reuse, no naming, no single source of truth.

### Token schema

```js
// tokens/materials.js
export const MaterialTokens = {
  // --- Metals ---
  stainless:    { color: 0xc0c0c0, roughness: 0.3, metalness: 0.9 },
  chrome:       { color: 0xd0d0d0, roughness: 0.15, metalness: 1.0 },
  darkMetal:    { color: 0x222222, roughness: 0.6, metalness: 0.8 },
  brass:        { color: 0xc9b037, roughness: 0.4, metalness: 0.6 },
  aluminum:     { color: 0xb0bec5, roughness: 0.45, metalness: 0.7 },

  // --- Plastics ---
  whitePlastic: { color: 0xfafafa, roughness: 0.75, metalness: 0 },
  blackPlastic: { color: 0x111111, roughness: 0.7,  metalness: 0 },
  grayPlastic:  { color: 0x666666, roughness: 0.75, metalness: 0 },
  darkGray:     { color: 0x222222, roughness: 0.75, metalness: 0 },
  lightGray:    { color: 0xcccccc, roughness: 0.75, metalness: 0 },
  pinkPlastic:  { color: 0xff5577, roughness: 0.7,  metalness: 0 },

  // --- Natural ---
  wood:         { color: 0x6b4a32, roughness: 0.7, metalness: 0 },
  lightWood:    { color: 0xc99e6b, roughness: 0.7, metalness: 0 },  // fan blades
  rubber:       { color: 0x2a2a2a, roughness: 0.9, metalness: 0 },

  // --- Glass/Transparent ---
  glass:        { color: 0x223344, roughness: 0.1, metalness: 0.2 },
  clearPlastic: { color: 0xa3d8ff, roughness: 0.1, metalness: 0,
                  transparent: true, opacity: 0.5 },

  // --- Emissives (screens, lamps) ---
  screenOn:     { color: 0x224488, emissive: 0x4488cc,
                  emissiveIntensity: 0.9, roughness: 0.4 },
  screenOff:    { color: 0x0a0a0a, emissive: 0x000000,
                  emissiveIntensity: 0, roughness: 0.4 },
  warmGlow:     { color: 0xfff4d6, emissive: 0xffd97a,
                  emissiveIntensity: 1.2, roughness: 0.3,
                  side: 'DoubleSide' },
  coolGlow:     { color: 0xffffff, emissive: 0xe6f0ff,
                  emissiveIntensity: 1.3, roughness: 0.3 },
  warmGlowBright: { color: 0xfff4d6, emissive: 0xffd97a,
                    emissiveIntensity: 1.4, roughness: 0.3,
                    side: 'DoubleSide' },
  ceilingWarm:  { color: 0xfff8e0, emissive: 0xfff0c0,
                  emissiveIntensity: 1.3, roughness: 0.4 },
  ceilingCool:  { color: 0xffffff, emissive: 0xe6f0ff,
                  emissiveIntensity: 1.3, roughness: 0.3 },
};
```

### Mapping from current code → tokens

| Current hardcoded | Token name |
|---|---|
| `sMat(0xfafafa)` | `whitePlastic` |
| `sMat(0x111111)` | `blackPlastic` |
| `sMat(0x222222)` | `darkGray` |
| `sMat(0x666666)` | `grayPlastic` |
| `sMat(0xc0c0c0, { metalness: 0.6, roughness: 0.4 })` | `stainless` |
| `sMat(0xeeeeee, { metalness: 0.4, roughness: 0.5 })` | `aluminum` variant |
| `{ color: 0x224488, emissive: 0x4488cc, ... }` | `screenOn` |
| `{ color: 0xfff4d6, emissive: 0xffd97a, ... }` | `warmGlow` |
| `{ color: 0xfff8e0, emissive: 0xfff0c0, ... }` | `ceilingWarm` |

---

## 3. Material System

Caches materials so token `"stainless"` always returns the same `MeshStandardMaterial` instance. Quality-aware: on `low` tier, strips metalness and drops emissive intensity.

```js
// systems/MaterialSystem.js
import * as THREE from 'three';
import { MaterialTokens } from '../tokens/materials.js';
import { getQualityTier } from './QualitySystem.js';

const cache = new Map();

export function getMaterial(tokenName, overrides = {}) {
  const key = tokenName + JSON.stringify(overrides);
  if (cache.has(key)) return cache.get(key);

  const base = MaterialTokens[tokenName];
  if (!base) throw new Error(`Unknown material token: ${tokenName}`);

  const tier = getQualityTier();
  const props = { ...base, ...overrides };

  // Quality degradation
  if (tier === 'low') {
    delete props.metalness;
    if (props.emissiveIntensity) props.emissiveIntensity *= 0.6;
  }

  // Resolve side strings to Three.js constants
  if (props.side === 'DoubleSide') props.side = THREE.DoubleSide;

  const mat = new THREE.MeshStandardMaterial(props);
  cache.set(key, mat);
  return mat;
}

// For emissive toggle (screens, lamps): returns a NON-cached material
// because each appliance needs independent emissive state
export function createToggleMaterial(tokenName) {
  const base = MaterialTokens[tokenName];
  const props = { ...base };
  if (props.side === 'DoubleSide') props.side = THREE.DoubleSide;
  return new THREE.MeshStandardMaterial(props);
}

export function disposeMaterials() {
  for (const mat of cache.values()) mat.dispose();
  cache.clear();
}
```

**Rule:** Shared materials (body panels, handles, structural parts) use `getMaterial()` — cached, one instance. Emissive/toggle materials (screens, lamp shades) use `createToggleMaterial()` — unique per appliance so `emissiveIntensity = 0` on one doesn't kill all.

---

## 4. Geometry System

Registry pattern. Parametric builders today, GLTF loaders tomorrow. Same interface.

```js
// systems/GeometrySystem.js
import * as THREE from 'three';

const registry = new Map();

// Register a parametric geometry builder
export function registerGeometry(type, builder) {
  registry.set(type, builder);
}

// Create geometry for an appliance type
// Returns: { meshes: THREE.Object3D[], meta: { indicatorPos, screenMat?, ... } }
export function createGeometry(type, materials) {
  const builder = registry.get(type);
  if (!builder) throw new Error(`No geometry registered for: ${type}`);
  return builder(materials);
}

export function hasGeometry(type) {
  return registry.has(type);
}

// ---- Helper (replaces current mesh() function) ----
export function solidMesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
```

Example parametric builder (fridge):

```js
// geometries/fridge.js
import * as THREE from 'three';
import { registerGeometry, solidMesh } from '../systems/GeometrySystem.js';
import { getMaterial } from '../systems/MaterialSystem.js';

registerGeometry('fridge', (mats) => {
  const body = solidMesh(
    new THREE.BoxGeometry(1.0, 2.1, 0.75),
    getMaterial(mats.body ?? 'whitePlastic')
  );
  body.position.y = 1.05;

  const seam = solidMesh(
    new THREE.BoxGeometry(1.02, 0.02, 0.76),
    getMaterial(mats.seam ?? 'lightGray')
  );
  seam.position.y = 1.3;

  const handle1 = solidMesh(
    new THREE.BoxGeometry(0.05, 0.5, 0.04),
    getMaterial(mats.handle ?? 'grayPlastic')
  );
  handle1.position.set(0.4, 1.7, 0.4);

  const handle2 = solidMesh(
    new THREE.BoxGeometry(0.05, 0.3, 0.04),
    getMaterial(mats.handle ?? 'grayPlastic')
  );
  handle2.position.set(0.4, 0.7, 0.4);

  return {
    meshes: [body, seam, handle1, handle2],
    meta: {
      indicatorPos: new THREE.Vector3(-0.4, 2.0, 0.4),
    },
  };
});
```

### Future GLTF adapter

```js
// geometries/gltf-adapter.js (FUTURE)
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { registerGeometry } from '../systems/GeometrySystem.js';
import { getMaterial } from '../systems/MaterialSystem.js';

const loader = new GLTFLoader();

export function registerGLTF(type, path, materialMap, meta) {
  registerGeometry(type, async (mats) => {
    const gltf = await loader.loadAsync(path);
    const scene = gltf.scene;

    // Override materials from tokens
    scene.traverse((child) => {
      if (child.isMesh && materialMap[child.name]) {
        child.material = getMaterial(materialMap[child.name]);
      }
      child.castShadow = true;
      child.receiveShadow = true;
    });

    return { meshes: [scene], meta };
  });
}

// Usage:
// registerGLTF('fridge', '/models/fridge.glb', {
//   'Body': 'whitePlastic',
//   'Handle': 'stainless',
//   'Seam': 'lightGray',
// }, { indicatorPos: new THREE.Vector3(-0.4, 2.0, 0.4) });
```

**Key:** The `ApplianceFactory` doesn't care whether `createGeometry` returns parametric boxes or a loaded GLTF. Same `{ meshes, meta }` shape.

---

## 5. Behavior System

Current code manually sets `spinTarget`, `screen`, `light` per appliance. Formalize into composable behaviors.

```js
// systems/BehaviorSystem.js

// Behavior definitions — each returns { setup(), turnOff(), tick() }
export const Behaviors = {
  spin: (config) => ({
    setup(group, state) {
      // config.target = name of child mesh to spin
      // config.speed = rad/sec
      state.spinTarget = group.getObjectByName(config.target) || null;
      state.spinSpeed = config.speed || 5;
    },
    tick(state, dt) {
      if (state.on && state.spinTarget) {
        state.spinTarget.rotation.y += dt * state.spinSpeed;
      }
    },
    turnOff(state) { /* stops automatically via tick check */ },
  }),

  emissive: (config) => ({
    setup(group, state) {
      // config.target = mesh name whose material toggles emissive
      const mesh = group.getObjectByName(config.target);
      state.emissiveMat = mesh?.material || null;
      state.emissiveOnIntensity = state.emissiveMat?.emissiveIntensity ?? 1;
      state.emissiveOnColor = state.emissiveMat?.color.getHex() ?? 0xffffff;
    },
    tick() {},
    turnOff(state) {
      if (state.emissiveMat) {
        state.emissiveMat.emissiveIntensity = 0;
        state.emissiveMat.color.setHex(0x0a0a0a);
      }
    },
  }),

  light: (config) => ({
    setup(group, state) {
      // Already attached by factory
      // config = { color, intensity, distance, position }
    },
    tick() {},
    turnOff(state) {
      if (state.light) state.light.visible = false;
    },
  }),
};
```

---

## 6. Quality Tier System

```js
// tokens/quality.js
export const QualityTiers = {
  high: {
    shadowMapSize: 1024,
    maxPixelRatio: 2,
    maxPointLights: 26,    // all appliances can have lights
    toneMappingExposure: 1.05,
  },
  medium: {
    shadowMapSize: 512,
    maxPixelRatio: 1.5,
    maxPointLights: 8,     // nearest 8 lights active
    toneMappingExposure: 1.0,
  },
  low: {
    shadowMapSize: 256,
    maxPixelRatio: 1,
    maxPointLights: 4,     // nearest 4 only
    toneMappingExposure: 0.95,
  },
};
```

```js
// systems/QualitySystem.js
import { QualityTiers } from '../tokens/quality.js';

let currentTier = 'high';

export function detectQuality() {
  const gpu = navigator.gpu;  // basic heuristic
  const isMobile = /Mobi|Android/i.test(navigator.userAgent)
    || matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 2;
  const mem = navigator.deviceMemory || 4;  // GB, Chrome only

  if (isMobile && mem <= 3) currentTier = 'low';
  else if (isMobile) currentTier = 'medium';
  else if (cores <= 2) currentTier = 'medium';
  else currentTier = 'high';

  return currentTier;
}

export function getQualityTier() { return currentTier; }
export function getQualityConfig() { return QualityTiers[currentTier]; }
```

**Light budget enforcement:** In the game loop, sort point lights by distance to player, enable nearest N based on tier's `maxPointLights`, disable the rest. This keeps mobile GPU happy without removing lights from the scene.

---

## 7. Appliance Config Format

Pure data. No Three.js imports. Each appliance is a plain object.

```js
// configs/appliances.js
export const ApplianceConfigs = [
  {
    id: 'tv',
    name: 'TV',
    room: 'LIV',
    kind: 'screen',
    geometry: 'tv',              // key into GeometrySystem
    materials: {
      frame: 'blackPlastic',
      screen: 'screenOn',        // toggle material (unique per instance)
      stand: 'darkGray',
    },
    position: [0, 1.6, -1.75],
    rotation: 0,
    behaviors: [
      { type: 'emissive', target: 'screen' },
    ],
    light: null,
    indicator: [1.15, -0.65, 0.08],
  },
  {
    id: 'ceilingFanLiv',
    name: 'Kipas Siling (Ruang Tamu)',
    room: 'LIV',
    kind: 'fan-light',
    geometry: 'ceilingFan',
    materials: {
      mount: 'darkGray',
      blades: 'lightWood',
      lampDome: 'warmGlow',      // toggle material
    },
    position: [0, 2.75, 5],
    rotation: 0,
    behaviors: [
      { type: 'spin', target: 'rotor', speed: 7 },
      { type: 'emissive', target: 'lampDome' },
    ],
    light: { color: 0xffe5b0, intensity: 1.4, distance: 9, offset: [0, -0.3, 0] },
    indicator: [0, -0.35, 0.28],
  },
  // ... 24 more configs following this pattern
];
```

### Appliance Factory

```js
// factory/ApplianceFactory.js
import * as THREE from 'three';
import { createGeometry } from '../systems/GeometrySystem.js';
import { getMaterial, createToggleMaterial } from '../systems/MaterialSystem.js';
import { Behaviors } from '../systems/BehaviorSystem.js';
import { getQualityConfig } from '../systems/QualitySystem.js';

const INDICATOR_GEO = new THREE.SphereGeometry(0.055, 8, 8);
const INDICATOR_MAT = new THREE.MeshBasicMaterial({ color: 0xff2a2a });

export function createAppliance(config) {
  const { meshes, meta } = createGeometry(config.geometry, config.materials);

  const group = new THREE.Group();
  for (const m of meshes) group.add(m);

  // Indicator
  const indicator = new THREE.Mesh(INDICATOR_GEO, INDICATOR_MAT);
  const indPos = config.indicator || meta.indicatorPos || [0, 1.5, 0];
  indicator.position.set(...(Array.isArray(indPos) ? indPos : [indPos.x, indPos.y, indPos.z]));
  group.add(indicator);

  // Light (if configured and within budget)
  let pointLight = null;
  if (config.light) {
    const { color, intensity, distance, decay, offset } = config.light;
    pointLight = new THREE.PointLight(
      color ?? 0xffeebb, intensity ?? 1.0,
      distance ?? 8, decay ?? 1.5
    );
    if (offset) pointLight.position.set(...offset);
    group.add(pointLight);
  }

  // Position + rotation
  group.position.set(...config.position);
  if (config.rotation) group.rotation.y = config.rotation;

  // State object
  const state = {
    id: config.id,
    name: config.name,
    room: config.room,
    kind: config.kind,
    group,
    indicator,
    light: pointLight,
    on: true,
    behaviors: [],
  };

  // Wire up behaviors
  for (const bConfig of (config.behaviors || [])) {
    const factory = Behaviors[bConfig.type];
    if (!factory) continue;
    const behavior = factory(bConfig);
    behavior.setup(group, state);
    state.behaviors.push(behavior);
  }

  return state;
}

// Called each frame
export function tickAppliances(appliances, dt) {
  for (const a of appliances) {
    for (const b of a.behaviors) b.tick(a, dt);
  }
}

// Called when player turns off an appliance
export function turnOffAppliance(a) {
  a.on = false;
  a.indicator.visible = false;
  if (a.light) a.light.visible = false;
  for (const b of a.behaviors) b.turnOff(a);
}
```

---

## 8. Light Budget Manager

```js
// In main.js game loop, after player movement:
import { getQualityConfig } from './systems/QualitySystem.js';

function enforceLightBudget(appliances, playerPos) {
  const { maxPointLights } = getQualityConfig();
  const withLights = appliances.filter(a => a.on && a.light);

  // Sort by distance to player
  withLights.sort((a, b) => {
    const da = a.group.position.distanceToSquared(playerPos);
    const db = b.group.position.distanceToSquared(playerPos);
    return da - db;
  });

  for (let i = 0; i < withLights.length; i++) {
    withLights[i].light.visible = i < maxPointLights;
  }
}
```

---

## 9. Migration Path (Build Order)

Each step keeps the game playable. No big-bang rewrite.

| Step | What | Breaks anything? |
|---|---|---|
| 1 | Create `tokens/materials.js` with all token definitions | No |
| 2 | Create `systems/MaterialSystem.js` with cache | No |
| 3 | Create `systems/QualitySystem.js` with detection | No |
| 4 | Create `systems/GeometrySystem.js` + register ONE appliance (fridge) | No |
| 5 | Create `factory/ApplianceFactory.js`, create fridge through it | No |
| 6 | Test: fridge works identically to before | No |
| 7 | Migrate remaining 25 appliances one-by-one to config+geometry | No* |
| 8 | Delete old `createAppliances()` from `appliances.js` | Yes — clean break |
| 9 | Extract input handling to `input.js` | No |
| 10 | Add light budget enforcement to game loop | No |
| 11 | (Future) Add GLTF adapter, register GLTF geometry for appliances that have models | No |

*Step 7: Each appliance can be migrated independently. If one breaks, only that one is affected.

---

## 10. Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Token keys | camelCase | `whitePlastic`, `screenOn` |
| System files | PascalCase | `MaterialSystem.js` |
| Config files | camelCase | `appliances.js` |
| Geometry builders | camelCase (id matches config) | `'fridge'`, `'ceilingFan'` |
| Mesh names (for behavior targeting) | camelCase | `mesh.name = 'rotor'`, `'screen'`, `'lampDome'` |

---

## 11. Rules (for CLAUDE.md)

```
- Material values MUST reference MaterialTokens, never hardcoded hex in geometry builders
- Shared materials use getMaterial() (cached). Toggle materials use createToggleMaterial() (unique)
- Every appliance MUST go through ApplianceFactory, never raw new THREE.Group()
- Geometry builders MUST return { meshes, meta } shape
- Name meshes that behaviors target (mesh.name = 'rotor')
- State lives on the appliance state object, not on Three.js userData
- Light budget is enforced per frame — don't assume a light is always visible
- New appliance = new config entry + new geometry builder. No other files touched.
```
