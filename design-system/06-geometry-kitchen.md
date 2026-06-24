# Geometry Module: Kitchen

Target file: `src/geometries/kitchen.js`  
**Imports:** `registerGeometry`, `solidMesh` from `../systems/GeometrySystem.js`

Registers: `fridge`, `microwave`, `riceCooker`, `kettle`, `toaster`

---

## `fridge`

Full-height refrigerator with door seam and handles.

**Builder receives materials:** `{ body: offWhite, seam: lightGray, handle: grayPlastic }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Body | BoxGeometry | 1.0 × 2.1 × 0.75 | `body` | (0, 1.05, 0) | — | Main fridge body |
| Seam | BoxGeometry | 0.95 × 0.01 × 0.01 | `seam` | (0, 1.05, 0.38) | — | Horizontal door split line |
| Handle top | BoxGeometry | 0.03 × 0.2 × 0.03 | `handle` | (0.4, 1.45, 0.39) | — | Upper door handle |
| Handle bottom | BoxGeometry | 0.03 × 0.15 × 0.03 | `handle` | (0.4, 0.65, 0.39) | — | Lower door handle |

### Meta
- `indicatorPos`: `[0.45, 0.3, 0.38]`

### Behaviors: none (always "on" — player turns it off to unplug)

---

## `microwave`

Countertop microwave with tinted glass door.

**Builder receives materials:** `{ body: darkGray, door: tintedGlass }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Body | BoxGeometry | 0.6 × 0.35 × 0.4 | `body` | (0, 0.175, 0) | — | Main housing |
| Door | BoxGeometry | 0.38 × 0.28 × 0.02 | `door` | (-0.05, 0.175, 0.21) | — | Glass panel on front |

### Meta
- `indicatorPos`: `[0.25, 0.05, 0.21]`

---

## `riceCooker`

Cylindrical rice cooker with domed lid.

**Builder receives materials:** `{ body: whitePlastic, lid: aluminum }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Body | CylinderGeometry | r=0.18, h=0.2, seg=16 | `body` | (0, 0.1, 0) | — | Cylindrical pot |
| Lid | CylinderGeometry | r=0.17, h=0.03, seg=16 | `lid` | (0, 0.215, 0) | — | Flat lid (slight dome via position) |

### Meta
- `indicatorPos`: `[0.15, 0.05, 0]`

---

## `kettle`

Electric kettle with spout and torus handle.

**Builder receives materials:** `{ body: stainless, spout: darkGray, handle: darkGray }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Body | CylinderGeometry | r=0.1, h=0.22, seg=16 | `body` | (0, 0.11, 0) | — | Main kettle body |
| Spout | ConeGeometry | r=0.03, h=0.08, seg=8 | `spout` | (0.1, 0.18, 0), tilted ~30° | — | Small pouring spout |
| Handle | TorusGeometry | r=0.08, tube=0.015, seg=12, tubeSeg=6 | `handle` | (-0.1, 0.14, 0), rotated | — | Side handle arc |

### Meta
- `indicatorPos`: `[0.08, 0.02, 0]`

---

## `toaster`

Compact countertop toaster with slot strip.

**Builder receives materials:** `{ body: brushedSteel, slot: blackPlastic }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Body | BoxGeometry | 0.3 × 0.18 × 0.18 | `body` | (0, 0.09, 0) | — | Main toaster body |
| Slot strip | BoxGeometry | 0.22 × 0.01 × 0.06 | `slot` | (0, 0.185, 0) | — | Dark slot on top |

### Meta
- `indicatorPos`: `[0.12, 0.02, 0.09]`
