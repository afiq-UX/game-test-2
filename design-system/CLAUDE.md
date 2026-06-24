# Rumah Off — 3D Design System for Claude CLI

## What This Is

A module-by-module spec for building 3D appliance models in a Malaysian-themed "turn everything off" game. Vanilla Three.js + Vite. No React.

## Architecture

```
src/
  tokens/          ← Design tokens (materials, lights, quality tiers)
  systems/         ← Core systems (Material, Geometry, Behavior, Quality)
  geometries/      ← 3D model builders per category (register into GeometrySystem)
  configs/         ← Pure data configs (appliance registry)
  factory/         ← ApplianceFactory (assembles configs → scene objects)
  main.js          ← Game loop, scene, player, camera, input, collision
  house.js         ← Room geometry, walls, furniture, doors
  minimap.js       ← 2D overhead minimap
```

## How It Works

1. **Tokens** define reusable material presets, light presets, and quality tiers
2. **Systems** consume tokens to create Three.js objects (cached materials, geometry registry, behavior tick/turnOff)
3. **Geometries** register builder functions into GeometrySystem — each builds meshes from token-based materials
4. **Configs** define every appliance as pure data: position, geometry key, material overrides, behaviors, light
5. **Factory** reads a config → calls GeometrySystem → attaches behaviors → adds indicator LED + light → returns state object
6. **main.js** calls `createAllAppliances(scene, configs)` and uses `tickAppliances` / `turnOffAppliance` in the game loop

## Data Flow

```
ApplianceConfigs[i]
  → ApplianceFactory.createAppliance(config)
    → GeometrySystem.createGeometry(config.geometry, materials)
      → registered builder fn returns { meshes, meta }
    → MaterialSystem.getMaterial(tokenName) for structural parts
    → MaterialSystem.createToggleMaterial(tokenName) for emissive parts
    → BehaviorSystem wires spin/emissive/light behaviors
  → returns state { id, name, room, kind, group, indicator, light, on, _behaviors }
```

## Module Spec Files (read the one you need)

| File | What It Specs |
|------|---------------|
| `01-tokens.md` | Material tokens, light tokens, quality tiers |
| `02-systems.md` | MaterialSystem, GeometrySystem, BehaviorSystem, QualitySystem APIs |
| `03-geometry-screens.md` | TV, computer monitor |
| `04-geometry-fans.md` | Ceiling fan, standing fan |
| `05-geometry-lamps.md` | Standing lamp, bedside lamp, desk lamp, ceiling lights |
| `06-geometry-kitchen.md` | Fridge, microwave, rice cooker, kettle, toaster |
| `07-geometry-climate.md` | Aircond, water heater, water dispenser |
| `08-geometry-gadgets.md` | Router, speaker, console, phone charger, hair dryer |
| `09-configs.md` | Full appliance registry (26 entries) |
| `10-integration.md` | How to wire into main.js, replacing legacy appliances.js |

## Critical Rules

- **Mesh naming matters.** Behaviors find targets via `group.getObjectByName(name)`. A mesh named `'screen'`, `'rotor'`, `'shade'`, `'head'`, `'panel'`, or `'lampDome'` is how BehaviorSystem hooks in.
- **Toggle materials must be unique.** Use `createToggleMaterial()` for any emissive surface that gets turned off independently. Use `getMaterial()` for shared structural parts.
- **All geometry builders must return `{ meshes: Group, meta: { indicatorPos: [x,y,z] } }`.**
- **Quality tier affects materials at creation time**, not runtime. Set tier before creating materials.
- **Coordinate system:** X: left-right (-15 to +15), Y: up (floor=0, ceiling=2.97), Z: front-back (-12 to +12). Player starts at (0,0,4) facing -Z (north).

## Room Layout

```
         Z = -12
  ┌──────────┬──────────┬──────────┐
  │  BR1     │  BATH    │  BR2     │
  │ -15..-5  │ -5..5    │  5..15   │
  │          │          │          │
  ├──────────┼──────────┼──────────┤ Z = -2
  │  KIT     │  LIV     │  DIN     │
  │ -15..-5  │ -5..5    │  5..15   │
  │          │          │          │
  └──────────┴──────────┴──────────┘
         Z = 12
```

Room names (Malay): BR1="Bilik Tidur 1", BATH="Bilik Air", BR2="Bilik Tidur 2", KIT="Dapur", LIV="Ruang Tamu", DIN="Ruang Makan"
