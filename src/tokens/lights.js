// tokens/lights.js
// Named light presets attached to appliances.
//
// Two families:
//  - PointLight presets (no `type`): omnidirectional glow — used for lamps and
//    the broad indirect cove "wash" that fills a whole open area.
//  - SpotLight presets (`type: 'spot'`): a downward cone with `angle`/`penumbra`.
//    Ceiling fixtures use these — the cone points at the floor, so it lights the
//    room it's in without spraying sideways through walls into the next room
//    (the reason omnidirectional ceiling lights used to leak), and a spotlight
//    casts a single cheap shadow map, so the nearest few can cast real shadows
//    (see QualitySystem.enforceLightBudget + maxShadowCasters).

export const LightTokens = {
  // ---- Lamps (point) ----
  warmLamp:        { color: 0xffd9a0, intensity: 1.6, distance: 6, decay: 1.5 },
  warmLampSmall:   { color: 0xffd9a0, intensity: 1.0, distance: 4, decay: 1.5 },
  warmLampDesk:    { color: 0xffd9a0, intensity: 0.9, distance: 4, decay: 1.5 },

  // ---- Broad indirect fill (point) ----
  // Fills a whole open area (indirect wash): high intensity, gentle falloff so
  // the floor and far corners read lit. Used only across the intentionally-open
  // living/dining/hall floor, so its wide reach is fine there.
  coveLight:       { color: 0xffd9a0, intensity: 4.5, distance: 13, decay: 1.1 },

  // ---- Ceiling fixtures (spot, cone points down) ----
  // angle is the cone half-angle; penumbra softens the edge. distance is the
  // cone length (must clear the ~2.9m ceiling-to-floor drop), and is usually
  // overridden per config to the room's size.
  warmCeiling:     { type: 'spot', color: 0xffe5b0, intensity: 2.0, distance: 6, decay: 1.5, angle: Math.PI / 3,   penumbra: 0.5 }, // ceiling-fan lamp
  bedroomCeiling:  { type: 'spot', color: 0xfff0c0, intensity: 1.9, distance: 6, decay: 1.5, angle: Math.PI / 3,   penumbra: 0.5 },
  bathCeiling:     { type: 'spot', color: 0xe6f0ff, intensity: 1.7, distance: 6, decay: 1.5, angle: Math.PI / 3,   penumbra: 0.5 },
  // Standalone kitchen cove module — a wider, brighter downward cone (the
  // kitchen has three of these in a row rather than one central fixture).
  coveSpot:        { type: 'spot', color: 0xffd9a0, intensity: 3.5, distance: 5, decay: 1.2, angle: Math.PI / 3.2, penumbra: 0.5 },
  // Recessed soffit downlight — a tight neutral-white accent pool at a corner.
  downlight:       { type: 'spot', color: 0xfff0dd, intensity: 3.0, distance: 5, decay: 1.4, angle: Math.PI / 7,   penumbra: 0.4 },
};
