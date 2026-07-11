// configs/appliances.js
// Pure data. No Three.js imports. Each entry defines one appliance.
import { LightTokens as L } from '../tokens/lights.js';

export const ApplianceConfigs = [
  // ========== LIVING ROOM ==========
  {
    id: 'tv',
    name: 'TV',
    room: 'LIV',
    kind: 'screen',
    geometry: 'tv',
    materials: { frame: 'blackPlastic', screen: 'screenOn', stand: 'darkGray' },
    behaviors: [{ type: 'emissive', target: 'screen' }],
    light: null,
    // Old position was outside LIV entirely (x=0, xMax is -6) — leftover
    // from the pre-rebuild floor plan. Moved to sit on the new TV wall
    // cabinet (main.js: centered x=-10.5, back against the north wall at
    // z=-11.9), just in front of its front face, facing south into the room.
    position: [-10.5, 1.6, -11.3],
    rotation: 0,
  },
  {
    id: 'ceilingFanLiv',
    name: 'Kipas Siling (Ruang Tamu)',
    room: 'LIV',
    kind: 'fan-light',
    geometry: 'ceilingFan',
    materials: { mount: 'darkGray', blades: 'lightWood', lampDome: 'warmGlow' },
    behaviors: [
      { type: 'spin', target: 'rotor', speed: 7 },
      { type: 'emissive', target: 'lampDome' },
      { type: 'light' },
    ],
    light: { ...L.warmCeiling, offset: [0, -0.44, 0] },
    position: [-10.5, 2.90, -6], // hangs from the cove light's central panel
    rotation: 0,
  },
  {
    id: 'coveLightLiv',
    name: 'Lampu Siling Kapur (Ruang Tamu & Makan)',
    room: 'LIV',
    kind: 'cove-light',
    geometry: 'coveLight',
    // LIV + DIN + the open hall (HALL1-4) are all one unwalled floor — a
    // staircase-shaped open-plan area, not a rectangle (it steps in around
    // the Master Bath, Master Bedroom, and Bath2 walls). `shape` traces the
    // wall-face polygon in world XZ (position is [0,y,0] so local == world
    // here); the coveLight geometry insets/extrudes this outline itself and
    // drops a downlight at every one of its 12 corners.
    shape: [
      [-14.9, -11.9], [-6.1, -11.9], [-6.1, -3.4], [7.4, -3.4],
      [7.4, 2.4], [4.4, 2.4], [4.4, 5.4], [-1.6, 5.4],
      [-1.6, 11.9], [-7.4, 11.9], [-7.4, 4.9], [-14.9, 4.9],
    ],
    materials: { tray: 'whitePlastic', panel: 'plasterGlow', strip: 'ledStrip', downlight: 'downlightLens' },
    behaviors: [
      { type: 'emissive', target: 'strip' },
      { type: 'emissive', target: 'panel' },
      { type: 'emissive', target: 'downlights' },
      { type: 'light' },
    ],
    light: null,
    lights: [
      // Broad warm wash lights spread across the span (one light's 13-unit
      // reach doesn't cover this whole shape) — the light budget system
      // enables whichever are nearest the player at runtime.
      { ...L.coveLight, offset: [-10.5, -0.6, -6] },   // over Living
      { ...L.coveLight, offset: [-10.5, -0.6, 2.5] },  // over Dining
      { ...L.coveLight, offset: [0, -0.6, 0] },        // over Hall1
      { ...L.coveLight, offset: [-3.5, -0.6, 8] },     // over Hall3/Hall4, by the kitchen doorway
      // Corner downlights, one per polygon vertex above.
      { ...L.downlight, offset: [-14.675, -0.5, -11.675] },
      { ...L.downlight, offset: [-6.325, -0.5, -11.675] },
      { ...L.downlight, offset: [-6.325, -0.5, -3.175] },
      { ...L.downlight, offset: [7.175, -0.5, -3.175] },
      { ...L.downlight, offset: [7.175, -0.5, 2.175] },
      { ...L.downlight, offset: [4.175, -0.5, 2.175] },
      { ...L.downlight, offset: [4.175, -0.5, 5.175] },
      { ...L.downlight, offset: [-1.825, -0.5, 5.175] },
      { ...L.downlight, offset: [-1.825, -0.5, 11.675] },
      { ...L.downlight, offset: [-7.175, -0.5, 11.675] },
      { ...L.downlight, offset: [-7.175, -0.5, 4.675] },
      { ...L.downlight, offset: [-14.675, -0.5, 4.675] },
    ],
    position: [0, 2.97, 0],
    rotation: 0,
  },
  {
    id: 'standingLamp',
    name: 'Lampu Berdiri',
    room: 'LIV',
    kind: 'lamp',
    geometry: 'standingLamp',
    materials: { base: 'darkGray', pole: 'darkCharcoal', shade: 'warmGlowCone' },
    behaviors: [
      { type: 'emissive', target: 'shade' },
      { type: 'light' },
    ],
    light: { ...L.warmLamp, offset: [0, 1.46, 0] },
    position: [-4.2, 0, 1.5],
    rotation: 0,
  },
  {
    id: 'router',
    name: 'Wi-Fi Router',
    room: 'LIV',
    kind: 'gadget',
    geometry: 'router',
    materials: { body: 'blackPlastic' },
    behaviors: [],
    light: null,
    position: [-4.49, 0.60, -1.57],
    rotation: 0,
  },
  {
    id: 'speaker',
    name: 'Speaker',
    room: 'LIV',
    kind: 'gadget',
    geometry: 'speaker',
    materials: { body: 'darkGray', cone: 'blackPlastic' },
    behaviors: [],
    light: null,
    position: [4.2, 0, -1.5],
    rotation: 0,
  },
  {
    id: 'playstation',
    name: 'PlayStation',
    room: 'LIV',
    kind: 'gadget',
    geometry: 'console',
    materials: { body: 'whitePlastic' },
    behaviors: [],
    light: null,
    position: [-0.7, 0.61, -1.5],
    rotation: 0,
  },
  {
    id: 'aircondCassetteLiv',
    name: 'Aircond Siling (Ruang Tamu)',
    room: 'LIV',
    kind: 'ceiling-aircond', // ceiling-mounted — excluded from floor collision like fans/ceiling lights, see main.js CEILING_KINDS
    geometry: 'aircondCassette',
    materials: { body: 'whitePlastic', vent: 'lightGray' },
    behaviors: [],
    light: null,
    // Offset from the room's centre (-10.5,-6), where the ceiling fan already
    // hangs, so the two ceiling fixtures don't overlap. y pulled down from
    // 1. — the living room's cove ceiling drops the visible ceiling plane
    // down to y=2.77 (see coveLightLiv below), so 2.95 was clipped up inside
    // the structural ceiling/cove tray instead of hanging free below it.
    position: [-10.5, 2.8, -7],
    rotation: 0,
    scale: 2,
  },
  // standingFan removed for now — the skinned 'Electric Fan' GLB was
  // rendering as a huge distorted mesh (a bind-matrix bug in
  // ModelLoader.js's stripSkinning(), now fixed). Re-add an entry with
  // geometry: 'standingFan' once confirmed working; see fans.js.

  // ========== KITCHEN ==========
  {
    id: 'fridge',
    name: 'Peti Sejuk',
    room: 'KIT',
    kind: 'big',
    geometry: 'fridge',
    materials: { body: 'offWhite', seam: 'lightGray', handle: 'grayPlastic' },
    behaviors: [],
    light: null,
    // Old position was a leftover from the previous floor plan, well outside
    // the current kitchen (KIT: x -15..-7.5, z 5..12) — moved into the SW
    // corner, back to the west wall, facing east into the room.
    position: [-14.55, 0, 10.5],
    rotation: Math.PI / 2,
  },
  {
    id: 'microwave',
    name: 'Microwave',
    room: 'KIT',
    kind: 'gadget',
    geometry: 'microwave',
    materials: { body: 'darkGray', door: 'tintedGlass' },
    behaviors: [],
    light: null,
    // Moved onto the cabinet's return-leg counter (past the corner post),
    // per screenshot feedback. Also fixes the floating gap: the previous
    // y used the trim strip found at local y 34.4-39.1 as the counter
    // surface, but that trim actually rides ON TOP of the true counter
    // plane — the base cabinet carcass (mesh32) tops out at local y=35.0
    // raw (0.889m), which is the real surface. Rotation is a guess (this
    // run faces a different way than the main run); check once visible.
    position: [-8.8601, 0.934, 11.6958],
    rotation: 0,
  },
  {
    id: 'riceCooker',
    name: 'Periuk Nasi',
    room: 'KIT',
    kind: 'gadget',
    geometry: 'riceCooker',
    materials: { body: 'whitePlastic', lid: 'aluminum' },
    behaviors: [],
    light: null,
    position: [-7.9229, 1.049, 8.1678],
    rotation: 0,
  },
  {
    id: 'kettle',
    name: 'Cerek',
    room: 'KIT',
    kind: 'gadget',
    geometry: 'kettle',
    materials: { body: 'stainless', spout: 'darkGray', handle: 'darkGray' },
    behaviors: [],
    light: null,
    position: [-7.9229, 1.039, 8.5488],
    rotation: 0,
  },
  {
    id: 'toaster',
    name: 'Toaster',
    room: 'KIT',
    kind: 'gadget',
    geometry: 'toaster',
    materials: { body: 'brushedSteel', slot: 'blackPlastic' },
    behaviors: [],
    light: null,
    // On the pass-through counter itself (see house.js buildKitchenCounter:
    // cx=-11.25, z=5, top at baseH+topH=1.05), on the kitchen side (z > 5) —
    // the other appliances moved to the cabinet's countertop instead.
    position: [-12.5, 1.095, 5.3],
    rotation: 0,
  },
  {
    id: 'coveLightKit1',
    name: 'Lampu Siling Kapur (Dapur) 1',
    room: 'KIT',
    kind: 'cove-light',
    geometry: 'coveLight',
    // Same fixture as the living/dining cove (coveLightLiv below), but sized
    // down to a standalone module (size, not shape) since the kitchen is a
    // single small room — three of them in a row, 3m apart, per feedback
    // (replaces the old square + 2 round ceiling lights). 1.5x1.5 keeps each
    // module flush against the west/east walls at this spacing (KIT: x -15..
    // -7.5, centre -11.25) without poking through them.
    size: [1.5, 1.5],
    materials: { tray: 'whitePlastic', panel: 'plasterGlow', strip: 'ledStrip', downlight: 'downlightLens' },
    behaviors: [
      { type: 'emissive', target: 'strip' },
      { type: 'emissive', target: 'panel' },
      { type: 'emissive', target: 'downlights' },
      { type: 'light' },
    ],
    light: { ...L.coveLight, offset: [0, -0.12, 0] },
    position: [-14.25, 2.96, 8.5],
    rotation: 0,
  },
  {
    id: 'coveLightKit2',
    name: 'Lampu Siling Kapur (Dapur) 2',
    room: 'KIT',
    kind: 'cove-light',
    geometry: 'coveLight',
    size: [1.5, 1.5],
    materials: { tray: 'whitePlastic', panel: 'plasterGlow', strip: 'ledStrip', downlight: 'downlightLens' },
    behaviors: [
      { type: 'emissive', target: 'strip' },
      { type: 'emissive', target: 'panel' },
      { type: 'emissive', target: 'downlights' },
      { type: 'light' },
    ],
    light: { ...L.coveLight, offset: [0, -0.12, 0] },
    position: [-11.25, 2.96, 8.5], // room centre — 3m from each neighbor
    rotation: 0,
  },
  {
    id: 'coveLightKit3',
    name: 'Lampu Siling Kapur (Dapur) 3',
    room: 'KIT',
    kind: 'cove-light',
    geometry: 'coveLight',
    size: [1.5, 1.5],
    materials: { tray: 'whitePlastic', panel: 'plasterGlow', strip: 'ledStrip', downlight: 'downlightLens' },
    behaviors: [
      { type: 'emissive', target: 'strip' },
      { type: 'emissive', target: 'panel' },
      { type: 'emissive', target: 'downlights' },
      { type: 'light' },
    ],
    light: { ...L.coveLight, offset: [0, -0.12, 0] },
    position: [-8.25, 2.96, 8.5],
    rotation: 0,
  },

  // ========== DINING ==========
  {
    id: 'waterDispenser',
    name: 'Penyejuk Air',
    room: 'DIN',
    kind: 'big',
    geometry: 'waterDispenser',
    materials: { body: 'offWhite', tank: 'clearBlue', tap: 'darkCharcoal' },
    behaviors: [],
    light: null,
    position: [14, 0, 11],
    rotation: 0,
  },
  {
    id: 'ceilingFanDin',
    name: 'Kipas Siling (Ruang Makan)',
    room: 'DIN',
    kind: 'fan-light',
    geometry: 'ceilingFan',
    materials: { mount: 'darkGray', blades: 'lightWood', lampDome: 'warmGlow' },
    behaviors: [
      { type: 'spin', target: 'rotor', speed: 6.5 },
      { type: 'emissive', target: 'lampDome' },
      { type: 'light' },
    ],
    light: { ...L.warmCeiling, offset: [0, -0.44, 0] },
    position: [-10.5, 2.96, 2.5], // centered over the dining table zone (old DIN rect, z 0..5)
    rotation: 0,
  },

  // ========== BEDROOM 1 ==========
  // NOTE: 'BR1' isn't a room in ROOMS (house.js) — it and every position below
  // in this section are leftovers from the pre-rebuild floor plan, clustered
  // around x≈-10 (outside every current room). Only the aircond is fixed
  // here (per this request); bedsideLamp/phoneCharger/standingFan/
  // ceilingLightBr1 are still stale and need the same treatment.
  {
    id: 'aircondBr3',
    name: 'Aircond (Bilik 3)',
    room: 'BR3',
    kind: 'big',
    geometry: 'aircond',
    materials: { body: 'whitePlastic', vent: 'lightGray' },
    behaviors: [],
    light: null,
    position: [-3.25, 2.4, -11.7],
    rotation: Math.PI, // was facing back into the wall; flipped per feedback
  },
  {
    id: 'bedsideLamp',
    name: 'Lampu Tepi Katil',
    room: 'BR1',
    kind: 'lamp',
    geometry: 'bedsideLamp',
    materials: { base: 'darkCharcoal', pole: 'grayPlastic', shade: 'warmGlowBright' },
    behaviors: [
      { type: 'emissive', target: 'shade' },
      { type: 'light' },
    ],
    light: { ...L.warmLampSmall, offset: [0, 0.37, 0] },
    position: [-10, 0.80, -9.5],
    rotation: 0,
  },
  {
    id: 'phoneCharger',
    name: 'Charger Telefon',
    room: 'BR1',
    kind: 'small',
    geometry: 'phoneCharger',
    materials: { block: 'whitePlastic', phone: 'blackPlastic' },
    behaviors: [],
    light: null,
    position: [-10, 0.83, -9.7],
    rotation: 0,
  },
  {
    id: 'ceilingLightBr1',
    name: 'Lampu Siling (Bilik 1)',
    room: 'BR1',
    kind: 'ceiling-light',
    geometry: 'ceilingLightRound',
    materials: { panel: 'ceilingNeutral' },
    behaviors: [
      { type: 'emissive', target: 'panel' },
      { type: 'light' },
    ],
    light: { ...L.bedroomCeiling, offset: [0, -0.12, 0] },
    position: [-10, 2.96, -7],
    rotation: 0,
  },

  // ========== BEDROOM 2 ==========
  {
    id: 'aircondBr2',
    name: 'Aircond (Bilik 2)',
    room: 'BR2',
    kind: 'big',
    geometry: 'aircond',
    materials: { body: 'whitePlastic', vent: 'lightGray' },
    behaviors: [],
    light: null,
    // Old x=10 was outside BR2 entirely (xMin -0.5, xMax 5) — leftover from
    // the pre-rebuild floor plan, same bug pattern as aircondBr3.
    position: [2.25, 2.4, -11.7],
    rotation: Math.PI, // was facing back into the wall; flipped per feedback
  },
  {
    id: 'computerMonitor',
    name: 'Monitor Komputer',
    room: 'BR2',
    kind: 'screen',
    geometry: 'computerMonitor',
    materials: { stand: 'darkGray', frame: 'blackPlastic', screen: 'screenOnAlt' },
    behaviors: [{ type: 'emissive', target: 'screen' }],
    light: null,
    position: [8, 1.0, -4],
    rotation: 135,
  },
  {
    id: 'deskLamp',
    name: 'Lampu Meja',
    room: 'BR2',
    kind: 'lamp',
    geometry: 'deskLamp',
    materials: { base: 'darkGray', arm: 'darkCharcoal', head: 'warmGlowCone' },
    behaviors: [
      { type: 'emissive', target: 'head' },
      { type: 'light' },
    ],
    light: { ...L.warmLampDesk, offset: [0.18, 0.33, 0] },
    position: [7.4, 1.0, -4.2],
    rotation: 0,
  },
  {
    id: 'ceilingLightBr2',
    name: 'Lampu Siling (Bilik 2)',
    room: 'BR2',
    kind: 'ceiling-light',
    geometry: 'ceilingLightRound',
    materials: { panel: 'ceilingNeutral' },
    behaviors: [
      { type: 'emissive', target: 'panel' },
      { type: 'light' },
    ],
    light: { ...L.bedroomCeiling, offset: [0, -0.12, 0] },
    position: [10, 2.96, -7],
    rotation: 0,
  },

  // ========== MASTER BEDROOM ==========
  // MBR had no appliances at all until now — this is the 3rd of the "3
  // bedrooms" requested (BR3, BR2, MBR).
  {
    id: 'aircondMbr',
    name: 'Aircond (Bilik Utama)',
    room: 'MBR',
    kind: 'big',
    geometry: 'aircond',
    materials: { body: 'whitePlastic', vent: 'lightGray' },
    behaviors: [],
    light: null,
    // North wall (z=2.5) solid segment between its two door gaps ([5.2,7.2]
    // and [10,12] — see house.js), just inside the room.
    position: [8.5, 2.4, 2.7],
    rotation: Math.PI, // was facing back into the wall; flipped per feedback
  },

  // ========== BATHROOM ==========
  {
    id: 'waterHeater',
    name: 'Pemanas Air',
    room: 'BATH',
    kind: 'big',
    geometry: 'waterHeater',
    materials: { body: 'whitePlastic', pipe: 'aluminum' },
    behaviors: [],
    light: null,
    position: [-4.5, 2.4, -10],
    rotation: 0,
  },
  {
    id: 'hairDryer',
    name: 'Pengering Rambut',
    room: 'BATH',
    kind: 'small',
    geometry: 'hairDryer',
    materials: { body: 'pinkPlastic' },
    behaviors: [],
    light: null,
    position: [3.5, 1.05, -4],
    rotation: 0,
  },
  {
    id: 'ceilingLightBath',
    name: 'Lampu Siling (Bilik Air)',
    room: 'BATH',
    kind: 'ceiling-light',
    geometry: 'ceilingLightRound',
    materials: { panel: 'ceilingCool' },
    behaviors: [
      { type: 'emissive', target: 'panel' },
      { type: 'light' },
    ],
    light: { ...L.bathCeiling, offset: [0, -0.12, 0] },
    position: [0, 2.96, -7],
    rotation: 0,
  },
];
