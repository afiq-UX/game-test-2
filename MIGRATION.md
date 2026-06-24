# Migration Guide — Design System (Step by Step)

> Pass each step to CLI **one at a time**. Run `npm run dev` after each step.
> The game must stay playable between every step. If it breaks, fix before moving on.

---

## Step 1 — Tokens (pure data, zero risk)

**Files:** `src/tokens/materials.js`, `src/tokens/lights.js`, `src/tokens/quality.js`

**CLI prompt:**
> These 3 files are pure data — named material presets, light presets, and quality tier definitions. They have NO imports and NOTHING imports them yet. Just add them to the project. Don't touch any existing files.

**Verify:** `npm run dev` — game unchanged, no errors in console.

---

## Step 2 — Systems (QualitySystem + MaterialSystem)

**Files:** `src/systems/QualitySystem.js`, `src/systems/MaterialSystem.js`

**CLI prompt:**
> Add these 2 system files. QualitySystem detects device tier and exports `detectQuality()`, `getQualityTier()`, `getQualityConfig()`, `enforceLightBudget()`. MaterialSystem provides cached `getMaterial(tokenName)` and unique `createToggleMaterial(tokenName)`. They import from `tokens/` but nothing imports THEM yet. Don't touch any existing files.

**Verify:** `npm run dev` — game unchanged, no errors.

---

## Step 3 — GeometrySystem + BehaviorSystem

**Files:** `src/systems/GeometrySystem.js`, `src/systems/BehaviorSystem.js`

**CLI prompt:**
> Add GeometrySystem (geometry builder registry with `registerGeometry()`, `createGeometry()`, `solidMesh()` helper) and BehaviorSystem (composable behavior factories: spin, emissive, light). Nothing imports these yet. Don't touch existing files.

**Verify:** `npm run dev` — game unchanged.

---

## Step 4 — Geometry builders

**Files:** `src/geometries/index.js`, `src/geometries/screens.js`, `src/geometries/fans.js`, `src/geometries/lamps.js`, `src/geometries/kitchen.js`, `src/geometries/climate.js`, `src/geometries/gadgets.js`

**CLI prompt:**
> Add all geometry builder files. Each file calls `registerGeometry(type, builderFn)` to register parametric geometry for appliance types. `index.js` is a barrel that imports all 6 files. These register builders into GeometrySystem but nothing calls `createGeometry()` yet. Don't touch existing files.

**Verify:** `npm run dev` — game unchanged. Optionally add `import './geometries/index.js'` temporarily at top of `main.js` and check console for no errors, then remove it.

---

## Step 5 — Config + Factory

**Files:** `src/configs/appliances.js`, `src/factory/ApplianceFactory.js`

**CLI prompt:**
> Add the appliance config file (26 entries, pure data — geometry IDs, material token names, behavior definitions, positions) and the ApplianceFactory which exports `createAppliance()`, `createAllAppliances()`, `tickAppliances()`, `turnOffAppliance()`. Nothing imports these yet. Don't touch existing files.

**Verify:** `npm run dev` — game unchanged.

---

## Step 6 — Wire into main.js (the actual switchover)

**Files:** Modify `src/main.js` only. Delete nothing yet.

**CLI prompt:**
> Now wire the design system into main.js. This is the only step that changes behavior. Follow these changes exactly:
>
> 1. Add these imports at the top of main.js:
> ```js
> import { detectQuality, enforceLightBudget } from './systems/QualitySystem.js';
> import './geometries/index.js';
> import { ApplianceConfigs } from './configs/appliances.js';
> import { createAllAppliances, tickAppliances, turnOffAppliance } from './factory/ApplianceFactory.js';
> ```
>
> 2. Call `detectQuality()` once, BEFORE creating the renderer. Use the result to set `renderer.setPixelRatio()` from `getQualityConfig().maxPixelRatio` instead of `devicePixelRatio`.
>
> 3. Replace this line:
> ```js
> const appliances = createAppliances(scene);
> ```
> with:
> ```js
> const appliances = createAllAppliances(scene, ApplianceConfigs);
> ```
>
> 4. Remove the `import { createAppliances } from './appliances.js';` line.
>
> 5. Replace the `toggleOff(a)` function body with a call to `turnOffAppliance(a)`:
> ```js
> function toggleOff(a) {
>   turnOffAppliance(a);
>   clickSound();
> }
> ```
>
> 6. In the game loop, replace the manual fan-spin block:
> ```js
> // Spin fans
> for (const a of appliances) {
>   if (a.on && a.spinTarget) {
>     a.spinTarget.rotation.y += dt * a.spinSpeed;
>   }
> }
> ```
> with:
> ```js
> tickAppliances(appliances, dt);
> enforceLightBudget(appliances, player.position);
> ```
>
> 7. The old `src/appliances.js` is now unused. Don't delete it yet — keep as reference until you've verified everything works.

**Verify:**
- `npm run dev`
- All 26 appliances visible in correct positions
- Red indicator dots on all appliances
- Press E near appliances — they turn off (indicator hides, lights/screens/fans stop)
- Ceiling fans spin
- Minimap dots still work
- Win condition triggers when all 26 are off
- Test on mobile (touch controls, joystick, interact button)

---

## Step 7 — Cleanup (optional, after everything works)

**CLI prompt:**
> Delete `src/appliances.js` — it's fully replaced by the design system. The game should work exactly the same without it.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Appliance missing | Config `position` doesn't match original. Compare with old `appliances.js`. |
| Appliance has no indicator | Geometry builder's `meta.indicatorPos` is wrong. |
| Fan doesn't spin | Mesh not named `'rotor'` in geometry builder, or behavior target mismatch. |
| Screen doesn't go dark on turn-off | Used `getMaterial()` instead of `createToggleMaterial()` for screen/shade. |
| All lamps go dark when one turns off | Same as above — toggle materials must be unique per instance. |
| Console error: "Unknown material token" | Typo in config `materials` value — check against `tokens/materials.js`. |
| Console error: "No geometry registered" | `geometries/index.js` not imported, or typo in config `geometry` value. |
| Too few lights on mobile | `enforceLightBudget()` is working as designed — only nearest N lights active. |
