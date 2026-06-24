# Geometry Module: Screens

Target file: `src/geometries/screens.js`  
**Imports:** `registerGeometry`, `solidMesh` from `../systems/GeometrySystem.js`

Registers: `tv`, `computerMonitor`

---

## `tv`

A wall-mounted flat-screen TV on a small stand.

**Builder receives materials:** `{ body: blackPlastic, screen: screenOn(toggle), stand: darkGray }`

### Parts

| Part | Geometry | Size/Params | Material | Position (relative) | Name | Notes |
|------|----------|-------------|----------|---------------------|------|-------|
| Frame | BoxGeometry | 2.6 × 1.5 × 0.1 | `body` | (0, 0, 0) | — | Main TV body |
| Screen | BoxGeometry | 2.4 × 1.3 × 0.04 | `screen` (toggle) | (0, 0, 0.04) | `'screen'` | Sits on front face of frame. **Must be named** for emissive behavior. |
| Stand | BoxGeometry | 0.6 × 0.05 × 0.4 | `stand` | (0, -0.775, 0.15) | — | Bottom-center of TV |

### Meta
- `indicatorPos`: `[1.2, -0.65, 0.06]` — bottom-right of TV face

---

## `computerMonitor`

A desktop monitor on a cylindrical stand with arm.

**Builder receives materials:** `{ stand: darkGray, body: blackPlastic, screen: screenOnAlt(toggle) }`

### Parts

| Part | Geometry | Size/Params | Material | Position (relative) | Name | Notes |
|------|----------|-------------|----------|---------------------|------|-------|
| Stand base | CylinderGeometry | r=0.15, h=0.02, seg=16 | `stand` | (0, 0, 0) | — | Flat disc on desk |
| Stand arm | BoxGeometry | 0.04 × 0.35 × 0.04 | `stand` | (0, 0.185, 0) | — | Vertical arm |
| Panel | BoxGeometry | 0.9 × 0.55 × 0.04 | `body` | (0, 0.45, 0) | — | Monitor housing |
| Screen | BoxGeometry | 0.84 × 0.49 × 0.02 | `screen` (toggle) | (0, 0.45, 0.03) | `'screen'` | **Must be named** for emissive behavior. |

### Meta
- `indicatorPos`: `[0.4, 0.22, 0.03]` — bottom-right of screen
