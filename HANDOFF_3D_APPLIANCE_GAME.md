# 3D Home Appliance Game — Handoff Brief
> Continue this in Cowork / Claude Code CLI

---

## Project Summary

A browser-based 3D WebGL game set in a home environment featuring **30 electrical appliances**. The player clicks appliances to inspect them. Visual style is **realistic PBR**. Built with **react-three-fiber + drei** using a scalable design system architecture.

---

## What's Been Decided

| Decision | Choice | Rationale |
|---|---|---|
| Stack | React + Vite + TypeScript + react-three-fiber + drei | Afiq's existing competency, declarative component model maps to design system |
| Visual style | Realistic PBR (`MeshStandardMaterial` / `MeshPhysicalMaterial`) | Player expectation for home environment realism |
| Interaction | Click to inspect appliance | Primary UX loop |
| Design system priority | All three pillars equally | Variant system + material tokens + performance (instancing, LOD) |

---

## What's NOT Decided Yet (Needs Answer Before Building)

> ⚠️ Claude Code must ask Afiq this before generating state machine logic:

**Core gameplay loop — which is it?**
- A. **Energy audit** — click appliance → see wattage, usage cost (educational)
- B. **Simulation** — appliances run in real-time, total energy ticks up
- C. **Both A + B**

This changes the component contract significantly:
- Option A → static data layer, simple `inspect` state
- Option B → ticker system, appliance has `isRunning` + `wattage` + `hoursActive`
- Option C → full state machine per appliance

---

## Proposed Architecture

### Stack
```
react + vite + typescript
react-three-fiber (r3f)
@react-three/drei
@react-three/postprocessing   ← PBR polish (bloom, SSAO)
zustand                        ← global game state
leva                           ← dev-time token tuning
```

### Folder Structure
```
src/
├── components/
│   └── appliances/
│       ├── Appliance.tsx          ← base component, all appliances use this
│       ├── Fridge.tsx
│       ├── Microwave.tsx
│       └── ... (28 more)
├── systems/
│   ├── MaterialSystem.ts          ← PBR token registry
│   ├── VariantSystem.ts           ← open/closed, on/off, colorway
│   ├── InteractionSystem.ts       ← click → inspect logic
│   └── EnergySystem.ts            ← (if simulation loop needed)
├── tokens/
│   └── materials.ts               ← roughness, metalness, color constants
├── store/
│   └── gameStore.ts               ← zustand store
├── scenes/
│   └── HomeScene.tsx              ← room layout, camera, lighting
└── ui/
    └── InspectPanel.tsx           ← 2D overlay when appliance clicked
```

### Component API (Target)
```tsx
// Every appliance follows this contract
<Appliance
  type="fridge"
  variant="open"          // open | closed
  colorway="stainless"    // stainless | white | retro
  state="idle"            // idle | running | inspected
  position={[x, y, z]}
  onInspect={(data) => openPanel(data)}
/>
```

### Material Token Schema
```ts
// tokens/materials.ts
export const MaterialTokens = {
  stainless: { roughness: 0.3, metalness: 0.9, color: '#c0c0c0' },
  plastic:   { roughness: 0.7, metalness: 0.0, color: '#e8e8e8' },
  glass:     { roughness: 0.0, metalness: 0.0, transmission: 1.0 },
  rubber:    { roughness: 0.9, metalness: 0.0, color: '#2a2a2a' },
}
```

---

## 30 Appliances List (Draft)
Group them by room for scene layout:

**Kitchen (12):** Fridge, Microwave, Oven, Dishwasher, Toaster, Kettle, Coffee Machine, Range Hood, Rice Cooker, Blender, Electric Stove, Air Fryer

**Living Room (6):** TV, Air Conditioner, Fan, Speaker, Set-top Box, Router

**Bedroom (5):** AC Unit, Lamp, Electric Blanket, Alarm Clock, Hair Dryer

**Bathroom (4):** Water Heater, Electric Shower, Exhaust Fan, Electric Shaver

**Laundry/Utility (3):** Washing Machine, Dryer, Iron

---

## Performance Strategy

| Concern | Solution |
|---|---|
| 30 unique meshes | Shared geometry where possible (box primitives as base, detail via normal maps) |
| PBR cost | Limit dynamic lights to 3 max; bake room lighting into environment map (HDR) |
| LOD | `<Detailed>` from drei — swap to low-poly beyond 5m camera distance |
| Instancing | Not needed for 30 unique items, but use `<Instances>` if duplicates appear |

---

## CLAUDE.md Instructions (for Claude Code)

> Paste this as `CLAUDE.md` at project root:

```markdown
# Claude Code Instructions — 3D Appliance Game

## Stack
React + Vite + TypeScript + react-three-fiber + drei + zustand

## Rules
- Every appliance MUST use the `<Appliance>` base component, never raw `<mesh>`
- Material values MUST reference `MaterialTokens` from `tokens/materials.ts`, never hardcoded
- No inline styles or hardcoded hex colors in JSX
- State lives in zustand store only — no local useState for game state
- Inspect panel is always a 2D HTML overlay (not a 3D plane) for accessibility

## Build Order
1. Token layer first (`tokens/materials.ts`)
2. MaterialSystem + VariantSystem
3. Base `<Appliance>` component
4. HomeScene with lighting + camera
5. One appliance (Fridge) as proof of concept
6. InspectPanel UI
7. Remaining 29 appliances following the same pattern

## File naming
- Components: PascalCase (`Fridge.tsx`)
- Systems: PascalCase (`MaterialSystem.ts`)
- Tokens: camelCase (`materials.ts`)

## Do not
- Use `@react-three/fiber` Canvas outside `scenes/`
- Add postprocessing until base scene is stable
- Generate 3D models from scratch — use simple parametric geometry until real GLTF assets are sourced
```

---

## Open Questions Log

| # | Question | Status |
|---|---|---|
| 1 | Gameplay loop: audit vs simulation vs both? | ❓ Unanswered |
| 2 | GLTF assets: sourced externally (Sketchfab/Poly) or procedural geometry? | ❓ Unanswered |
| 3 | Mobile support needed? (affects PBR material cost ceiling) | ❓ Unanswered |
| 4 | Is there a UI design for the InspectPanel or freeform? | ❓ Unanswered |

---

## Next Action in Cowork / Claude Code

```bash
# Start here
npm create vite@latest appliance-game -- --template react-ts
cd appliance-game
npm install three @react-three/fiber @react-three/drei zustand leva @react-three/postprocessing
```

Then hand Claude Code this file + ask it to:
> "Follow CLAUDE.md. Start with Task 1: scaffold `tokens/materials.ts` and the base `<Appliance>` component. Do not build the scene yet."

---

*Prepared in Claude.ai — June 24, 2026*
*Project: 3D Home Appliance Game | Owner: Afiq (Pocketpixel)*
