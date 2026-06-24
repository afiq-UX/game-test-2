# Geometry Module: Gadgets

Target file: `src/geometries/gadgets.js`  
**Imports:** `registerGeometry`, `solidMesh` from `../systems/GeometrySystem.js`

Registers: `router`, `speaker`, `console`, `phoneCharger`, `hairDryer`

---

## `router`

Flat Wi-Fi router with two antennas.

**Builder receives materials:** `{ body: blackPlastic, antenna: blackPlastic }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Body | BoxGeometry | 0.25 × 0.04 × 0.15 | `body` | (0, 0.02, 0) | — | Flat rectangular body |
| Antenna L | CylinderGeometry | r=0.008, h=0.15, seg=6 | `antenna` | (-0.08, 0.1, -0.05) | — | Left antenna |
| Antenna R | CylinderGeometry | r=0.008, h=0.15, seg=6 | `antenna` | (0.08, 0.1, -0.05) | — | Right antenna |

### Meta
- `indicatorPos`: `[0.1, 0.05, 0.06]`

---

## `speaker`

Bookshelf speaker with two driver cones.

**Builder receives materials:** `{ body: darkGray, cone: blackPlastic }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Body | BoxGeometry | 0.35 × 0.7 × 0.3 | `body` | (0, 0.35, 0) | — | Speaker cabinet |
| Woofer | CircleGeometry | r=0.1, seg=16 | `cone` | (0, 0.25, 0.151) | — | Lower driver cone |
| Tweeter | CircleGeometry | r=0.05, seg=12 | `cone` | (0, 0.5, 0.151) | — | Upper driver cone |

### Meta
- `indicatorPos`: `[0.14, 0.1, 0.16]`

---

## `console`

Game console (PlayStation-style). Single flat box.

**Builder receives materials:** `{ body: whitePlastic }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Body | BoxGeometry | 0.4 × 0.1 × 0.3 | `body` | (0, 0.05, 0) | — | Slim console slab |

### Meta
- `indicatorPos`: `[0.18, 0.06, 0.15]`

---

## `phoneCharger`

Small charging block with phone resting on it.

**Builder receives materials:** `{ block: whitePlastic, phone: blackPlastic }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Block | BoxGeometry | 0.06 × 0.03 × 0.06 | `block` | (0, 0.015, 0) | — | Tiny wall charger cube |
| Phone | BoxGeometry | 0.08 × 0.005 × 0.16 | `phone` | (0.08, 0.01, 0) | — | Phone lying flat next to it |

### Meta
- `indicatorPos`: `[0.04, 0.03, 0.02]`

---

## `hairDryer`

Handheld hair dryer with handle and barrel.

**Builder receives materials:** `{ handle: pinkPlastic, barrel: pinkPlastic }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Handle | CylinderGeometry | r=0.03, h=0.14, seg=8 | `handle` | (0, 0.07, 0) | — | Grip handle |
| Barrel | CylinderGeometry | r=0.04, h=0.16, seg=10 | `barrel` | (0, 0.15, 0.1), rotated π/2 on X | — | Horizontal blower barrel |

### Meta
- `indicatorPos`: `[0.04, 0.04, 0.08]`
