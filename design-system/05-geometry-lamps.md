# Geometry Module: Lamps

Target file: `src/geometries/lamps.js`  
**Imports:** `registerGeometry`, `solidMesh` from `../systems/GeometrySystem.js`

Registers: `standingLamp`, `bedsideLamp`, `deskLamp`, `ceilingLightSquare`, `ceilingLightRound`

---

## `standingLamp`

Tall floor lamp with cone shade pointing down.

**Builder receives materials:** `{ base: darkGray, pole: darkCharcoal, shade: warmGlowCone(toggle) }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Base | CylinderGeometry | r=0.15, h=0.03, seg=16 | `base` | (0, 0.015, 0) | — | Floor disc |
| Pole | CylinderGeometry | r=0.02, h=1.4, seg=8 | `pole` | (0, 0.73, 0) | — | Vertical pole |
| Shade | ConeGeometry | r=0.25, h=0.3, seg=16, openEnded=true | `shade` (toggle) | (0, 1.3, 0), rotated π on X | `'shade'` | **Named.** Cone opens downward. |

### Meta
- `indicatorPos`: `[0.15, 0.5, 0]`

---

## `bedsideLamp`

Small table lamp with cone shade.

**Builder receives materials:** `{ base: darkCharcoal, pole: grayPlastic, shade: warmGlowBright(toggle) }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Base | CylinderGeometry | r=0.08, h=0.02, seg=12 | `base` | (0, 0.01, 0) | — | Small disc |
| Pole | CylinderGeometry | r=0.015, h=0.2, seg=8 | `pole` | (0, 0.12, 0) | — | Short stem |
| Shade | ConeGeometry | r=0.12, h=0.15, seg=12, openEnded=true | `shade` (toggle) | (0, 0.27, 0), rotated π on X | `'shade'` | **Named.** Opens downward. |

### Meta
- `indicatorPos`: `[0.1, 0.05, 0]`

---

## `deskLamp`

Articulated desk lamp with angled head.

**Builder receives materials:** `{ base: darkGray, arm: darkCharcoal, head: warmGlowCone(toggle) }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Base | CylinderGeometry | r=0.1, h=0.02, seg=12 | `base` | (0, 0.01, 0) | — | Weighted base |
| Arm 1 | BoxGeometry | 0.02 × 0.3 × 0.02 | `arm` | (0, 0.16, 0) | — | Lower arm segment |
| Arm 2 | BoxGeometry | 0.02 × 0.25 × 0.02 | `arm` | (0.05, 0.36, 0), slight angle | — | Upper arm segment |
| Head | ConeGeometry | r=0.08, h=0.12, seg=12, openEnded=true | `head` (toggle) | (0.1, 0.42, 0), rotated ~π/2 on Z | `'head'` | **Named.** Points sideways/down. |

### Meta
- `indicatorPos`: `[0.1, 0.05, 0]`

---

## `ceilingLightSquare`

Flat flush-mount square ceiling panel.

**Builder receives materials:** `{ panel: ceilingWarm(toggle) }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Panel | BoxGeometry | 0.9 × 0.05 × 0.9 | `panel` (toggle) | (0, 0, 0) | `'panel'` | **Named.** Single glowing slab. |

### Meta
- `indicatorPos`: `[0.5, -0.05, 0]`

---

## `ceilingLightRound`

Flat flush-mount round ceiling panel.

**Builder receives materials:** `{ panel: ceilingNeutral(toggle) }`

| Part | Geometry | Size/Params | Material | Position | Name | Notes |
|------|----------|-------------|----------|----------|------|-------|
| Panel | CylinderGeometry | r=0.35, h=0.05, seg=20 | `panel` (toggle) | (0, 0, 0) | `'panel'` | **Named.** Single glowing disc. |

### Meta
- `indicatorPos`: `[0.3, -0.05, 0]`

**Note:** ceilingLightRound is used for BR1, BR2, and BATH ceilings. The material token varies per config: `ceilingNeutral` for bedrooms, `ceilingCool` for bathroom.
