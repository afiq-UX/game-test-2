# Module: Art Style — "Grounded Realism"

> Decided 2026-07-03. Supersedes the geometry described in `03`–`08` for the 12
> appliance types that previously had GLB models. Those GLBs (generic asset-pack
> meshes with mismatched names, broken material/behavior binding, and wrong
> scale) are retired — **parametric geometry is the one and only model path.**

## Direction

Real appliances at real sizes, built from parametric Three.js geometry and
shaded entirely by `MaterialTokens`. No textures, no imported meshes. Fidelity
comes from **silhouette and proportion**, not surface detail:

- Real-world metric dimensions (a fridge is 1.8 m, a toaster is 19 cm).
- Soft bevels on plastic/metal bodies (`RoundedBoxGeometry`, lathed profiles).
- Multi-part construction: seams, insets, handles, feet, trim, control panels.
- Every emissive surface is exactly ONE named mesh so toggle-off works.

Think furniture-catalog readability at game-poly cost — not photorealism, not
toy-like low-poly.

## Hard rules

| Rule | Why |
|---|---|
| Dimensions in real metres | Player is ~1.35 m tall; wrong scale reads instantly |
| ≤ ~2,000 triangles per appliance | 26 appliances + house on mobile |
| Materials only via `getMaterial()` / `createToggleMaterial()` | Token system is the single source of truth |
| Emissive/toggle surface = one mesh, correctly named | `BehaviorSystem` binds by `getObjectByName` |
| Behavior mesh names: `screen`, `rotor`, `shade`, `head`, `panel`, `lampDome` | Contract with configs |
| Builders return `{ meshes, meta: { indicatorPos } }` | Factory contract |
| No `getModel()` call in rebuilt builders | Parametric is primary, not a fallback |

## Origin conventions

| Placement | Origin | Config `position.y` |
|---|---|---|
| Floor-standing (fridge, lamps, speaker) | bottom centre (resting plane) | `0` or surface height |
| Counter/table-top (microwave, toaster, monitor, bedside/desk lamp) | bottom centre | top of counter/table |
| Ceiling-mounted (fans, ceiling lights) | top centre (ceiling plane) | `2.96` |
| Wall-mounted (TV, aircond) | volume centre | eye-height centre |

Known surface heights: kitchen counter top `1.045`, desk top `1.00`,
bedside table top `0.80`, ceiling plane `2.97`.

## Reference dimensions (rebuilt types)

| Type | W × H × D (m) | Notes |
|---|---|---|
| `tv` | 1.66 × 0.96 × 0.04 | 75″ class, wall-mounted, back bulge + bracket |
| `computerMonitor` | 0.62 × 0.37 panel | 27″, flat base + neck |
| `fridge` | 0.78 × 1.80 × 0.72 | top-freezer, two proud doors, kick plate |
| `microwave` | 0.50 × 0.30 × 0.38 | window left ⅔, control strip right ⅓ |
| `toaster` | 0.28 × 0.19 × 0.17 | 2-slice, domed shoulders, side lever |
| `ceilingFan` | 1.30 span | 5 blades, downrod + motor + `lampDome` |
| `ceilingLightRound` | ⌀ 0.40 | trim ring + squashed glass dome (`panel`) |
| `ceilingLightSquare` | 0.48 × 0.48 | LED slim panel in frame (`panel`) |
| `standingLamp` | ⌀ 0.38 shade, 1.60 tall | weighted base, collared pole |
| `bedsideLamp` | 0.42 tall | lathed vase body, drum shade |
| `deskLamp` | 0.45 reach | two-arm architect style, tilted head |
| `speaker` | 0.26 × 0.94 × 0.30 | floor tower: 2 woofers + tweeter + port |
| `coveLight` | per-room via `config.size` | "siling kapur" perimeter soffit + hidden LED strip + raised panel; soffit meshes flag `userData.occludeCamera` |

## Indicator LED

`meta.indicatorPos` goes on the front face / most camera-visible surface,
never floating in air. The factory renders it as a red sphere (r 0.055).
