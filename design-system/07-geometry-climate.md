# Geometry Module: Climate

Target file: `src/geometries/climate.js`  
**Imports:** `registerGeometry`, `solidMesh` from `../systems/GeometrySystem.js`

Registers: `aircond`, `waterHeater`, `waterDispenser`

---

## `aircond`

Wall-mounted split air conditioner unit.

**Builder receives materials:** `{ body: whitePlastic, vent: lightGray }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Body | BoxGeometry | 2.0 × 0.5 × 0.4 | `body` | (0, 0, 0) | — | Main indoor unit |
| Vent strip | BoxGeometry | 1.8 × 0.05 × 0.02 | `vent` | (0, -0.2, 0.21) | — | Front vent louver accent |

### Meta
- `indicatorPos`: `[0.9, -0.2, 0.21]`

### Behaviors: none

---

## `waterHeater`

Wall-mounted horizontal cylindrical water heater.

**Builder receives materials:** `{ body: whitePlastic, pipe: aluminum }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Body | CylinderGeometry | r=0.22, h=0.7, seg=16 | `body` | (0, 0, 0), rotated π/2 on Z (horizontal) | — | Horizontal tank |
| Pipe | CylinderGeometry | r=0.02, h=0.15, seg=8 | `pipe` | (0, -0.25, 0) | — | Bottom outlet pipe |

### Meta
- `indicatorPos`: `[0.3, 0.15, 0.2]`

### Behaviors: none

---

## `waterDispenser`

Floor-standing water dispenser with translucent blue tank on top.

**Builder receives materials:** `{ body: offWhite, tank: clearBlue, tap: darkCharcoal }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Body | BoxGeometry | 0.5 × 1.4 × 0.5 | `body` | (0, 0.7, 0) | — | Main cabinet |
| Tank | CylinderGeometry | r=0.15, h=0.4, seg=16 | `tank` (transparent) | (0, 1.6, 0) | — | Blue water bottle on top |
| Tap box | BoxGeometry | 0.12 × 0.08 × 0.06 | `tap` | (0, 0.95, 0.28) | — | Front dispenser nozzle area |

### Meta
- `indicatorPos`: `[0.22, 0.5, 0.26]`

### Behaviors: none
