# Module: Systems

Target files: `src/systems/MaterialSystem.js`, `src/systems/GeometrySystem.js`, `src/systems/BehaviorSystem.js`, `src/systems/QualitySystem.js`

---

## MaterialSystem (`src/systems/MaterialSystem.js`)

**Imports:** `THREE`, `MaterialTokens` from `../tokens/materials.js`, `getQualityConfig` from `./QualitySystem.js`

**Exports:**

### `getMaterial(tokenName, overrides?) → MeshStandardMaterial`
- **Cached** — same tokenName+overrides returns same instance. Shared across appliances.
- Looks up `MaterialTokens[tokenName]`, merges overrides, creates MeshStandardMaterial.
- Quality-aware: if tier is `low` and `stripMetalness`, sets metalness=0. Multiplies `emissiveIntensity` by tier's `emissiveMultiplier`.
- Resolves string `side` values (`"DoubleSide"` → `THREE.DoubleSide`).
- Cache key: `tokenName + JSON.stringify(overrides)`.

### `createToggleMaterial(tokenName, overrides?) → MeshStandardMaterial`
- **NOT cached** — returns a unique instance every call.
- Same token lookup + quality adjustment as `getMaterial`.
- Use for any mesh whose emissive gets toggled independently (screens, lamp shades, ceiling panels).

### `disposeMaterials()`
- Disposes all cached materials. Call on cleanup/scene teardown.

---

## GeometrySystem (`src/systems/GeometrySystem.js`)

**Imports:** `THREE`

**Exports:**

### `registerGeometry(type, builderFn)`
- Stores `builderFn` in a `Map<string, Function>`.
- Called at module load time by each geometry file (side-effect import).
- `builderFn` signature: `(materials: Record<string, MeshStandardMaterial>) → { meshes: THREE.Group, meta: { indicatorPos: [number, number, number] } }`

### `createGeometry(type, materials) → { meshes, meta }`
- Calls the registered builder for `type`.
- Throws if `type` not registered.

### `hasGeometry(type) → boolean`
- Check if a builder is registered.

### `solidMesh(geometry, material) → THREE.Mesh`
- Helper: creates Mesh, sets `castShadow = true`, `receiveShadow = true`.

**Registration trigger:** `src/geometries/index.js` barrel-imports all geometry files:
```js
import './screens.js'
import './fans.js'
import './lamps.js'
import './kitchen.js'
import './climate.js'
import './gadgets.js'
```
Import `src/geometries/index.js` once before calling `createGeometry`.

---

## BehaviorSystem (`src/systems/BehaviorSystem.js`)

**Exports:** `Behaviors` object with behavior factory functions.

Each behavior factory: `(config) → { init(state), tick(state, dt), turnOff(state) }`

### `Behaviors.spin`
- **Config:** `{ target: string, speed: number }` — e.g. `{ target: 'rotor', speed: 7 }`
- **init:** Finds `state.group.getObjectByName(config.target)`, stores as `state._spinTarget`, stores `state._spinSpeed = config.speed`
- **tick:** `state._spinTarget.rotation.y += dt * state._spinSpeed` (only if `state.on`)
- **turnOff:** no-op (spin stops because tick checks `state.on`)

### `Behaviors.emissive`
- **Config:** `{ target: string }` — e.g. `{ target: 'screen' }`
- **init:** Finds mesh by name, stores original emissive values
- **tick:** no-op
- **turnOff:** Sets `mesh.material.emissiveIntensity = 0`, `mesh.material.color.set(0x0a0a0a)`

### `Behaviors.light`
- **Config:** `{}` (no params — operates on `state.light`)
- **init:** no-op
- **tick:** no-op
- **turnOff:** `state.light.visible = false`

---

## QualitySystem (`src/systems/QualitySystem.js`)

**Imports:** `QualityTiers` from `../tokens/quality.js`

**Exports:**

### `detectQuality() → 'high' | 'medium' | 'low'`
- Checks `navigator.userAgent` for mobile, `navigator.deviceMemory`, `navigator.hardwareConcurrency`
- Mobile + ≤4GB RAM → low; mobile → medium; ≤2 cores → medium; else high

### `getQualityTier() → string`
- Returns current tier name.

### `getQualityConfig() → QualityTiers[tier]`
- Returns the full config object for current tier.

### `setQualityTier(tier)`
- Override auto-detection. Must be called before materials are created.

### `enforceLightBudget(appliances, playerPos)`
- Sorts appliances that have `.light` and `.on === true` by distance to `playerPos`.
- Enables nearest N lights (per `maxPointLights`), disables rest.
- Call every frame in game loop.
