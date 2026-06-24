# Module: Integration into main.js

How to replace the legacy `src/appliances.js` with the refactored design system.

---

## Current State

`main.js` imports:
```js
import { createAppliances } from './appliances.js'
```
And calls:
```js
const appliances = createAppliances(scene)
```

The legacy `appliances.js` is a single 520-line monolith that creates all 26 appliances with inline geometry, materials, and behaviors.

---

## Replacement Steps

### 1. Import the new system instead

```js
// REMOVE:
// import { createAppliances } from './appliances.js'

// ADD:
import './geometries/index.js'  // Side-effect: registers all geometry builders
import { ApplianceConfigs } from './configs/appliances.js'
import { createAllAppliances, tickAppliances, turnOffAppliance } from './factory/ApplianceFactory.js'
import { detectQuality, enforceLightBudget } from './systems/QualitySystem.js'
```

### 2. Initialize quality before creating appliances

```js
detectQuality()  // Sets tier based on device capability
const appliances = createAllAppliances(scene, ApplianceConfigs)
```

### 3. Replace game loop appliance tick

**Legacy** (inline in animation loop):
```js
appliances.forEach(a => {
  if (a.on && a.spinTarget) {
    a.spinTarget.rotation.y += dt * a.spinSpeed
  }
})
```

**New:**
```js
tickAppliances(appliances, dt)
enforceLightBudget(appliances, player.position)
```

### 4. Replace toggleOff function

**Legacy:**
```js
function toggleOff(a) {
  a.on = false
  a.indicator.visible = false
  if (a.light) a.light.visible = false
  if (a.screen) {
    a.screen.material.emissiveIntensity = 0
    a.screen.material.color.set(0x0a0a0a)
  }
}
```

**New:**
```js
turnOffAppliance(a)
// Handles: on=false, indicator hidden, light hidden, all behavior turnOff() calls
```

### 5. State object shape comparison

The state objects returned by the factory match the legacy shape:

| Property | Legacy | New | Notes |
|----------|--------|-----|-------|
| `name` | ✓ | ✓ | Same |
| `room` | ✓ | ✓ | Same |
| `kind` | ✓ | ✓ | Same |
| `group` | ✓ | ✓ | Same (THREE.Group added to scene) |
| `indicator` | ✓ | ✓ | Same (green sphere mesh) |
| `light` | ✓ / null | ✓ / null | Same (PointLight or null) |
| `on` | ✓ | ✓ | Same (boolean) |
| `spinTarget` | ✓ / null | — | **Gone.** Handled internally by spin behavior. |
| `spinSpeed` | ✓ / 0 | — | **Gone.** Handled internally by spin behavior. |
| `screen` | ✓ / null | — | **Gone.** Handled internally by emissive behavior. |
| `id` | — | ✓ | **New.** Unique string key. |
| `_behaviors` | — | ✓ | **New.** Internal array, don't touch directly. |

### 6. Things that DON'T change

- `minimap.js` — reads `a.on`, `a.group.position`, `a.room`. All still present.
- Interaction detection — checks `a.on` and distance to `a.group.position`. Still works.
- Win condition — counts `appliances.filter(a => a.on).length`. Still works.
- HUD remaining count — same logic.

### 7. Delete legacy file

After confirming everything works, delete `src/appliances.js`.
