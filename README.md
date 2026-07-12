# Rumah Off

A night-time "turn off every light before you leave the house" browser game, built with Three.js + Vite.

## Running it

```
npm install
npm run dev       # dev server
npm run build     # production build
npm run preview   # preview a production build
```

## Asset optimization tooling (not in package.json)

The `.glb` models in `public/models/` are Draco-compressed (smaller downloads — some
files shrank 50-95%). Loading them at runtime needs a `DRACOLoader`, which is already
wired up in `src/systems/ModelLoader.js` and `src/systems/PropLoader.js`, decoder files
already sitting in `public/draco/`. **You don't need to do anything to just run or build
the game** — this only matters if you want to re-compress/re-optimize assets later.

The compression itself was done with a few packages that are **intentionally not**
listed in `package.json` — they're one-off tools for an occasional asset pass, not
something the game needs at runtime or build time. If you want to compress/resize
assets again, install them yourself first:

```
npm install --no-save @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions draco3dgltf sharp
```

Install them **all together in one command**, like above — installing just one with
`--no-save` will prune the others out of `node_modules` as "unused," since none of them
are recorded anywhere.

What each one is for:
- `@gltf-transform/core` + `@gltf-transform/extensions` — read/write/inspect `.glb` files from a script
- `@gltf-transform/functions` — the `draco()` transform used to compress geometry
- `draco3dgltf` — the actual Draco encoder/decoder used by that transform
- `sharp` — resizes/re-encodes textures (both loose PNGs in `public/textures/` and ones embedded inside a `.glb`)

There's no saved script for this — each pass so far has been a short one-off Node
script (see git history / commit messages around asset sizes for examples). If you're
compressing a `.glb`, remember: any Draco-compressed file requires the `DRACOLoader`
setup already in place above to load again — don't skip that part if adding a new
model-loading code path elsewhere.
