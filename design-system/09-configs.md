# Module: Appliance Configs

Target file: `src/configs/appliances.js`  
**Exports:** `ApplianceConfigs` — array of 26 config objects. Pure data, no Three.js imports.

---

## Config Schema

```js
{
  id: string,           // Unique key (camelCase)
  name: string,         // Display name (Malay where applicable)
  room: string,         // Room key: 'LIV' | 'KIT' | 'DIN' | 'BR1' | 'BR2' | 'BATH'
  kind: string,         // Category: 'screen' | 'fan-light' | 'lamp' | 'fan' | 'ceiling-light' | 'gadget' | 'big' | 'small'
  geometry: string,     // Key registered in GeometrySystem
  materials: {          // Token names → keys passed to geometry builder
    [builderKey]: string | { token: string, toggle: true }
  },
  behaviors: [          // Array of behavior configs
    { type: 'spin', target: string, speed: number },
    { type: 'emissive', target: string },
    { type: 'light' }
  ],
  light: null | {       // PointLight config (null = no light)
    color: number,
    intensity: number,
    distance: number
  },
  position: [x, y, z],  // World position
  rotation: number|null  // Y-rotation in radians (null = 0)
}
```

Materials with `{ token, toggle: true }` → factory calls `createToggleMaterial()`. Plain strings → `getMaterial()`.

---

## Full Registry

### LIV — Ruang Tamu (6 appliances)

```js
{ id: 'tv', name: 'TV', room: 'LIV', kind: 'screen', geometry: 'tv',
  materials: { body: 'blackPlastic', screen: { token: 'screenOn', toggle: true }, stand: 'darkGray' },
  behaviors: [{ type: 'emissive', target: 'screen' }],
  light: null,
  position: [0, 1.8, -1.5], rotation: null },

{ id: 'ceilingFanLiv', name: 'Kipas Siling (Ruang Tamu)', room: 'LIV', kind: 'fan-light', geometry: 'ceilingFan',
  materials: { mount: 'darkGray', blade: 'lightWood', lamp: { token: 'warmGlow', toggle: true } },
  behaviors: [{ type: 'spin', target: 'rotor', speed: 7 }, { type: 'emissive', target: 'lampDome' }, { type: 'light' }],
  light: { color: 0xffe5b0, intensity: 1.4, distance: 9 },
  position: [0, 2.9, 5], rotation: null },

{ id: 'standingLamp', name: 'Lampu Berdiri', room: 'LIV', kind: 'lamp', geometry: 'standingLamp',
  materials: { base: 'darkGray', pole: 'darkCharcoal', shade: { token: 'warmGlowCone', toggle: true } },
  behaviors: [{ type: 'emissive', target: 'shade' }, { type: 'light' }],
  light: { color: 0xffd9a0, intensity: 1.6, distance: 6 },
  position: [-4, 0, 8], rotation: null },

{ id: 'router', name: 'Wi-Fi Router', room: 'LIV', kind: 'gadget', geometry: 'router',
  materials: { body: 'blackPlastic', antenna: 'blackPlastic' },
  behaviors: [],
  light: null,
  position: [1.5, 0.75, -1.3], rotation: null },

{ id: 'speaker', name: 'Speaker', room: 'LIV', kind: 'gadget', geometry: 'speaker',
  materials: { body: 'darkGray', cone: 'blackPlastic' },
  behaviors: [],
  light: null,
  position: [-1.5, 0, -1.3], rotation: null },

{ id: 'playstation', name: 'PlayStation', room: 'LIV', kind: 'gadget', geometry: 'console',
  materials: { body: 'whitePlastic' },
  behaviors: [],
  light: null,
  position: [0, 0.45, -1.3], rotation: null },
```

### KIT — Dapur (6 appliances)

```js
{ id: 'fridge', name: 'Peti Sejuk', room: 'KIT', kind: 'big', geometry: 'fridge',
  materials: { body: 'offWhite', seam: 'lightGray', handle: 'grayPlastic' },
  behaviors: [],
  light: null,
  position: [-13, 0, 8], rotation: null },

{ id: 'microwave', name: 'Microwave', room: 'KIT', kind: 'gadget', geometry: 'microwave',
  materials: { body: 'darkGray', door: 'tintedGlass' },
  behaviors: [],
  light: null,
  position: [-13.5, 1.0, 2], rotation: Math.PI / 2 },

{ id: 'riceCooker', name: 'Periuk Nasi', room: 'KIT', kind: 'gadget', geometry: 'riceCooker',
  materials: { body: 'whitePlastic', lid: 'aluminum' },
  behaviors: [],
  light: null,
  position: [-12, 1.0, 4], rotation: null },

{ id: 'kettle', name: 'Cerek', room: 'KIT', kind: 'gadget', geometry: 'kettle',
  materials: { body: 'stainless', spout: 'darkGray', handle: 'darkGray' },
  behaviors: [],
  light: null,
  position: [-11, 1.0, 2], rotation: null },

{ id: 'toaster', name: 'Toaster', room: 'KIT', kind: 'gadget', geometry: 'toaster',
  materials: { body: 'brushedSteel', slot: 'blackPlastic' },
  behaviors: [],
  light: null,
  position: [-12.5, 1.0, 6], rotation: null },

{ id: 'ceilingLightKit', name: 'Lampu Siling (Dapur)', room: 'KIT', kind: 'ceiling-light', geometry: 'ceilingLightSquare',
  materials: { panel: { token: 'ceilingWarm', toggle: true } },
  behaviors: [{ type: 'emissive', target: 'panel' }, { type: 'light' }],
  light: { color: 0xfff0c0, intensity: 1.5, distance: 10 },
  position: [-10, 2.9, 5], rotation: null },
```

### DIN — Ruang Makan (2 appliances)

```js
{ id: 'waterDispenser', name: 'Penyejuk Air', room: 'DIN', kind: 'big', geometry: 'waterDispenser',
  materials: { body: 'offWhite', tank: 'clearBlue', tap: 'darkCharcoal' },
  behaviors: [],
  light: null,
  position: [13, 0, 2], rotation: -Math.PI / 2 },

{ id: 'ceilingFanDin', name: 'Kipas Siling (Ruang Makan)', room: 'DIN', kind: 'fan-light', geometry: 'ceilingFan',
  materials: { mount: 'darkGray', blade: 'lightWood', lamp: { token: 'warmGlow', toggle: true } },
  behaviors: [{ type: 'spin', target: 'rotor', speed: 6.5 }, { type: 'emissive', target: 'lampDome' }, { type: 'light' }],
  light: { color: 0xffe5b0, intensity: 1.4, distance: 9 },
  position: [10, 2.9, 5], rotation: null },
```

### BR1 — Bilik Tidur 1 (5 appliances)

```js
{ id: 'aircondBr1', name: 'Aircond (Bilik 1)', room: 'BR1', kind: 'big', geometry: 'aircond',
  materials: { body: 'whitePlastic', vent: 'lightGray' },
  behaviors: [],
  light: null,
  position: [-10, 2.3, -11], rotation: null },

{ id: 'bedsideLamp', name: 'Lampu Tepi Katil', room: 'BR1', kind: 'lamp', geometry: 'bedsideLamp',
  materials: { base: 'darkCharcoal', pole: 'grayPlastic', shade: { token: 'warmGlowBright', toggle: true } },
  behaviors: [{ type: 'emissive', target: 'shade' }, { type: 'light' }],
  light: { color: 0xffd9a0, intensity: 1.0, distance: 4 },
  position: [-7, 0.55, -10], rotation: null },

{ id: 'phoneCharger', name: 'Charger Telefon', room: 'BR1', kind: 'small', geometry: 'phoneCharger',
  materials: { block: 'whitePlastic', phone: 'blackPlastic' },
  behaviors: [],
  light: null,
  position: [-8, 0.55, -10], rotation: null },

{ id: 'standingFan', name: 'Kipas Berdiri', room: 'BR1', kind: 'fan', geometry: 'standingFan',
  materials: { base: 'darkGray', pole: 'medGray', cage: 'grayPlastic', blade: 'lightGray' },
  behaviors: [{ type: 'spin', target: 'rotor', speed: 10 }],
  light: null,
  position: [-13, 0, -5], rotation: null },

{ id: 'ceilingLightBr1', name: 'Lampu Siling (Bilik 1)', room: 'BR1', kind: 'ceiling-light', geometry: 'ceilingLightRound',
  materials: { panel: { token: 'ceilingNeutral', toggle: true } },
  behaviors: [{ type: 'emissive', target: 'panel' }, { type: 'light' }],
  light: { color: 0xfff0c0, intensity: 1.2, distance: 8 },
  position: [-10, 2.9, -7], rotation: null },
```

### BR2 — Bilik Tidur 2 (4 appliances)

```js
{ id: 'aircondBr2', name: 'Aircond (Bilik 2)', room: 'BR2', kind: 'big', geometry: 'aircond',
  materials: { body: 'whitePlastic', vent: 'lightGray' },
  behaviors: [],
  light: null,
  position: [10, 2.3, -11], rotation: null },

{ id: 'computerMonitor', name: 'Monitor Komputer', room: 'BR2', kind: 'screen', geometry: 'computerMonitor',
  materials: { stand: 'darkGray', body: 'blackPlastic', screen: { token: 'screenOnAlt', toggle: true } },
  behaviors: [{ type: 'emissive', target: 'screen' }],
  light: null,
  position: [12, 0.75, -5], rotation: Math.PI },

{ id: 'deskLamp', name: 'Lampu Meja', room: 'BR2', kind: 'lamp', geometry: 'deskLamp',
  materials: { base: 'darkGray', arm: 'darkCharcoal', head: { token: 'warmGlowCone', toggle: true } },
  behaviors: [{ type: 'emissive', target: 'head' }, { type: 'light' }],
  light: { color: 0xffd9a0, intensity: 0.9, distance: 4 },
  position: [11, 0.75, -5], rotation: null },

{ id: 'ceilingLightBr2', name: 'Lampu Siling (Bilik 2)', room: 'BR2', kind: 'ceiling-light', geometry: 'ceilingLightRound',
  materials: { panel: { token: 'ceilingNeutral', toggle: true } },
  behaviors: [{ type: 'emissive', target: 'panel' }, { type: 'light' }],
  light: { color: 0xfff0c0, intensity: 1.2, distance: 8 },
  position: [10, 2.9, -7], rotation: null },
```

### BATH — Bilik Air (3 appliances)

```js
{ id: 'waterHeater', name: 'Pemanas Air', room: 'BATH', kind: 'big', geometry: 'waterHeater',
  materials: { body: 'whitePlastic', pipe: 'aluminum' },
  behaviors: [],
  light: null,
  position: [0, 2.0, -11], rotation: null },

{ id: 'hairDryer', name: 'Pengering Rambut', room: 'BATH', kind: 'small', geometry: 'hairDryer',
  materials: { handle: 'pinkPlastic', barrel: 'pinkPlastic' },
  behaviors: [],
  light: null,
  position: [3, 0.85, -5], rotation: null },

{ id: 'ceilingLightBath', name: 'Lampu Siling (Bilik Air)', room: 'BATH', kind: 'ceiling-light', geometry: 'ceilingLightRound',
  materials: { panel: { token: 'ceilingCool', toggle: true } },
  behaviors: [{ type: 'emissive', target: 'panel' }, { type: 'light' }],
  light: { color: 0xe6f0ff, intensity: 1.0, distance: 8 },
  position: [0, 2.9, -7], rotation: null },
```

---

## Summary

| Room | Count | With Light | With Spin | With Emissive |
|------|-------|------------|-----------|---------------|
| LIV | 6 | 2 | 1 | 3 |
| KIT | 6 | 1 | 0 | 1 |
| DIN | 2 | 1 | 1 | 1 |
| BR1 | 5 | 2 | 1 | 2 |
| BR2 | 4 | 2 | 0 | 3 |
| BATH | 3 | 1 | 0 | 1 |
| **Total** | **26** | **9** | **3** | **11** |
