// tokens/lights.js
// Named light presets for point lights attached to appliances.

export const LightTokens = {
  warmCeiling:     { color: 0xffe5b0, intensity: 1.4, distance: 9, decay: 1.5 },
  warmLamp:        { color: 0xffd9a0, intensity: 1.6, distance: 6, decay: 1.5 },
  warmLampSmall:   { color: 0xffd9a0, intensity: 1.0, distance: 4, decay: 1.5 },
  warmLampDesk:    { color: 0xffd9a0, intensity: 0.9, distance: 4, decay: 1.5 },
  kitchenCeiling:  { color: 0xfff0c0, intensity: 1.5, distance: 10, decay: 1.5 },
  bedroomCeiling:  { color: 0xfff0c0, intensity: 1.2, distance: 8, decay: 1.5 },
  bathCeiling:     { color: 0xe6f0ff, intensity: 1.0, distance: 8, decay: 1.5 },
  // Cove light fills the whole room (indirect wash): high intensity with a
  // gentle falloff so the floor and far corners read lit, not just the ceiling.
  coveLight:       { color: 0xffd9a0, intensity: 4.5, distance: 13, decay: 1.1 },
  // Recessed soffit downlight — a tight neutral-white pool for the room corners.
  downlight:       { color: 0xfff0dd, intensity: 2.2, distance: 6, decay: 1.4 },
};
