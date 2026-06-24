# Geometry Module: Fans

Target file: `src/geometries/fans.js`  
**Imports:** `registerGeometry`, `solidMesh` from `../systems/GeometrySystem.js`

Registers: `ceilingFan`, `standingFan`

---

## Shared Helper: `fanRotor(bladeMaterial)`

Creates a Group named `'rotor'` (critical — BehaviorSystem.spin targets this name).

| Part | Geometry | Size/Params | Material | Transform | Notes |
|------|----------|-------------|----------|-----------|-------|
| Hub | CylinderGeometry | r=0.08, h=0.06, seg=12 | darkMetal | (0, 0, 0) | Center hub |
| Blade ×4 | BoxGeometry | 0.6 × 0.015 × 0.12 | `bladeMaterial` | Offset x=±0.35 / z=±0.35, rotated 90° apart | 4 blades at 0°, 90°, 180°, 270° |

Returns: `THREE.Group` named `'rotor'`

---

## `ceilingFan`

Ceiling-mounted fan with integrated lamp dome. Hangs from ceiling.

**Builder receives materials:** `{ mount: darkGray, blade: lightWood, lamp: warmGlow(toggle) }`

### Parts

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Mount | CylinderGeometry | r=0.1, h=0.15, seg=12 | `mount` | (0, 0, 0) | — | Flush to ceiling |
| Rotor | fanRotor() | — | `blade` | (0, -0.12, 0) | `'rotor'` | **Named.** spin behavior target. |
| Lamp dome | HemisphereGeometry | r=0.12, seg=12 | `lamp` (toggle) | (0, -0.2, 0), rotated π on X | `'lampDome'` | **Named.** Hemisphere pointing down. emissive behavior target. |

### Meta
- `indicatorPos`: `[0.15, -0.25, 0]`

### Behaviors (from config)
- `spin`: target `'rotor'`, speed 6.5–7
- `emissive`: target `'lampDome'`
- `light`: PointLight warm

---

## `standingFan`

Floor-standing oscillating fan with vertical rotor.

**Builder receives materials:** `{ base: darkGray, pole: medGray, cage: grayPlastic, blade: lightGray }`

### Parts

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Base | CylinderGeometry | r=0.22, h=0.04, seg=16 | `base` | (0, 0.02, 0) | — | Heavy floor base |
| Pole | CylinderGeometry | r=0.025, h=1.1, seg=8 | `pole` | (0, 0.57, 0) | — | Vertical pole |
| Cage | TorusGeometry | r=0.28, tube=0.01, seg=16, tubeSeg=8 | `cage` | (0, 1.1, 0.05), rotated π/2 on X | — | Circular guard ring |
| Rotor | fanRotor() scaled (0.32, 0.32, 0.32) | — | `blade` | (0, 1.1, 0.05), rotated π/2 on X | `'rotor'` | **Named.** Scaled down, rotated to spin vertically (face-on). |

### Meta
- `indicatorPos`: `[0.2, 0.5, 0]`

### Behaviors (from config)
- `spin`: target `'rotor'`, speed 10
- No light, no emissive
