# Module: Tokens

Target files: `src/tokens/materials.js`, `src/tokens/lights.js`, `src/tokens/quality.js`

## Material Tokens (`src/tokens/materials.js`)

Export a single `MaterialTokens` object. Each key maps to MeshStandardMaterial params.

### Metals
| Token | color | metalness | roughness | Notes |
|-------|-------|-----------|-----------|-------|
| `stainless` | `0xc0c0c0` | 0.8 | 0.3 | Kettle body |
| `chrome` | `0xd0d0d0` | 0.9 | 0.15 | Shiny accents |
| `darkMetal` | `0x2a2a2a` | 0.7 | 0.4 | Fan motor caps |
| `brass` | `0xc9b037` | 0.7 | 0.35 | Door handles (house.js) |
| `aluminum` | `0xd8d8d8` | 0.6 | 0.35 | Rice cooker lid, water heater pipe |
| `brushedSteel` | `0xb0b0b0` | 0.7 | 0.4 | Toaster body |

### Plastics
| Token | color | metalness | roughness | Notes |
|-------|-------|-----------|-----------|-------|
| `whitePlastic` | `0xf0f0f0` | 0.0 | 0.6 | Aircond, rice cooker, console |
| `offWhite` | `0xe8e0d0` | 0.0 | 0.55 | Fridge, dispenser body |
| `blackPlastic` | `0x1a1a1a` | 0.0 | 0.5 | TV frame, router |
| `grayPlastic` | `0x888888` | 0.0 | 0.5 | Fridge handles, fan guard |
| `darkGray` | `0x333333` | 0.0 | 0.5 | TV stand, fan base, microwave |
| `lightGray` | `0xcccccc` | 0.0 | 0.5 | Aircond vent, fan blades |
| `medGray` | `0x777777` | 0.0 | 0.5 | Standing fan pole |
| `darkCharcoal` | `0x222222` | 0.0 | 0.5 | Lamp poles |
| `pinkPlastic` | `0xe89bae` | 0.0 | 0.5 | Hair dryer |

### Natural
| Token | color | metalness | roughness | Notes |
|-------|-------|-----------|-----------|-------|
| `wood` | `0x8b6914` | 0.0 | 0.75 | General wood |
| `lightWood` | `0xc4a35a` | 0.0 | 0.7 | Fan blades |
| `darkWood` | `0x5c3a1e` | 0.0 | 0.8 | Dark furniture |
| `rubber` | `0x222222` | 0.0 | 0.9 | Grips |
| `hair` | `0x1a1209` | 0.0 | 0.8 | Player hair |

### Glass
| Token | color | metalness | roughness | opacity | transparent | Notes |
|-------|-------|-----------|-----------|---------|-------------|-------|
| `tintedGlass` | `0x2a2a2a` | 0.2 | 0.1 | 0.7 | true | Microwave door |
| `clearBlue` | `0x88ccff` | 0.1 | 0.1 | 0.4 | true | Water dispenser tank |
| `darkInset` | `0x0a0a0a` | 0.0 | 0.3 | — | — | Inset panels |

### Emissive — Screens
| Token | color | emissive | emissiveIntensity | Notes |
|-------|-------|----------|-------------------|-------|
| `screenOn` | `0x224488` | `0x4488cc` | 0.9 | TV screen |
| `screenOnAlt` | `0x224477` | `0x336699` | 0.8 | Computer monitor |

### Emissive — Lamps
| Token | color | emissive | emissiveIntensity | side | Notes |
|-------|-------|----------|-------------------|------|-------|
| `warmGlow` | `0xfff4e0` | `0xffe0a0` | 1.2 | DoubleSide | Ceiling fan lamp dome |
| `warmGlowBright` | `0xfff4e0` | `0xffe0a0` | 1.4 | DoubleSide | Bedside lamp shade |
| `warmGlowCone` | `0xfff4e0` | `0xffe0a0` | 1.3 | DoubleSide | Standing/desk lamp shade |

### Emissive — Ceiling Panels
| Token | color | emissive | emissiveIntensity | side | Notes |
|-------|-------|----------|-------------------|------|-------|
| `ceilingWarm` | `0xfff8e8` | `0xfff0c0` | 1.3 | DoubleSide | Kitchen ceiling |
| `ceilingCool` | `0xe8f0ff` | `0xe6f0ff` | 1.3 | DoubleSide | Bathroom ceiling |
| `ceilingNeutral` | `0xfff8f0` | `0xffeedd` | 1.1 | DoubleSide | Bedroom ceilings |

---

## Light Tokens (`src/tokens/lights.js`)

Export a `LightTokens` object. Each key maps to PointLight params.

**Note:** Currently defined but NOT referenced by configs (configs use inline light values). Wire these in when you refactor configs.

| Token | color | intensity | distance | decay | shadow | Notes |
|-------|-------|-----------|----------|-------|--------|-------|
| `warmCeiling` | `0xffe5b0` | 1.4 | 9 | 2 | false | Ceiling fan lights |
| `warmLamp` | `0xffd9a0` | 1.6 | 6 | 2 | false | Standing lamp |
| `warmLampSmall` | `0xffd9a0` | 1.0 | 4 | 2 | false | Bedside lamp |
| `warmLampDesk` | `0xffd9a0` | 0.9 | 4 | 2 | false | Desk lamp |
| `kitchenCeiling` | `0xfff0c0` | 1.5 | 10 | 2 | false | Kitchen ceiling light |
| `bedroomCeiling` | `0xfff0c0` | 1.2 | 8 | 2 | false | Bedroom ceiling lights |
| `bathCeiling` | `0xe6f0ff` | 1.0 | 8 | 2 | false | Bathroom ceiling light |

---

## Quality Tiers (`src/tokens/quality.js`)

Export a `QualityTiers` object with three tiers.

| Property | high | medium | low |
|----------|------|--------|-----|
| `shadowMapSize` | 1024 | 512 | 256 |
| `pixelRatio` | 2 | 1.5 | 1 |
| `maxPointLights` | 26 | 8 | 4 |
| `emissiveMultiplier` | 1.0 | 0.8 | 0.6 |
| `stripMetalness` | false | false | true |

Detection logic (in QualitySystem): mobile + low memory → low; mobile → medium; low cores → medium; else high.
