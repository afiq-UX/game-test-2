// tokens/materials.js
// Named PBR material presets — single source of truth for all visual properties.
// Keys are camelCase. Values are plain objects matching THREE.MeshStandardMaterial params.
// 'side' uses string values ('DoubleSide') resolved by MaterialSystem at creation time.

export const MaterialTokens = {
  // --- Metals ---
  stainless:      { color: 0xc0c0c0, roughness: 0.3, metalness: 0.9 },
  chrome:         { color: 0xd0d0d0, roughness: 0.15, metalness: 1.0 },
  darkMetal:      { color: 0x222222, roughness: 0.6, metalness: 0.8 },
  brass:          { color: 0xc9b037, roughness: 0.4, metalness: 0.6 },
  aluminum:       { color: 0xb0bec5, roughness: 0.45, metalness: 0.7 },
  brushedSteel:   { color: 0xeeeeee, roughness: 0.5, metalness: 0.4 },

  // --- Plastics ---
  whitePlastic:   { color: 0xfafafa, roughness: 0.75, metalness: 0 },
  offWhite:       { color: 0xeeeeee, roughness: 0.75, metalness: 0 },
  blackPlastic:   { color: 0x111111, roughness: 0.7, metalness: 0 },
  grayPlastic:    { color: 0x666666, roughness: 0.75, metalness: 0 },
  darkGray:       { color: 0x222222, roughness: 0.75, metalness: 0 },
  lightGray:      { color: 0xcccccc, roughness: 0.75, metalness: 0 },
  medGray:        { color: 0x555555, roughness: 0.75, metalness: 0 },
  darkCharcoal:   { color: 0x444444, roughness: 0.75, metalness: 0 },
  pinkPlastic:    { color: 0xff5577, roughness: 0.7, metalness: 0 },

  // --- Natural ---
  wood:           { color: 0x6b4a32, roughness: 0.7, metalness: 0 },
  lightWood:      { color: 0xc99e6b, roughness: 0.7, metalness: 0 },
  darkWood:       { color: 0x5a4636, roughness: 0.8, metalness: 0 },
  rubber:         { color: 0x2a2a2a, roughness: 0.9, metalness: 0 },
  hair:           { color: 0x1a1a1a, roughness: 0.9, metalness: 0 },

  // --- Glass / Transparent ---
  tintedGlass:    { color: 0x223344, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.7 },
  clearBlue:      { color: 0xa3d8ff, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.5 },
  darkInset:      { color: 0x263238, roughness: 0.5, metalness: 0 },

  // --- Emissives (screens) ---
  screenOn:       { color: 0x224488, emissive: 0x4488cc, emissiveIntensity: 0.9, roughness: 0.4 },
  screenOnAlt:    { color: 0x224477, emissive: 0x336699, emissiveIntensity: 0.8, roughness: 0.4 },

  // --- Emissives (lamps / glows) ---
  warmGlow:       { color: 0xfff4d6, emissive: 0xffd97a, emissiveIntensity: 1.2, roughness: 0.3, side: 'DoubleSide' },
  warmGlowBright: { color: 0xfff4d6, emissive: 0xffd97a, emissiveIntensity: 1.4, roughness: 0.3, side: 'DoubleSide' },
  warmGlowCone:   { color: 0xfff4d6, emissive: 0xffd97a, emissiveIntensity: 1.3, roughness: 0.4, side: 'DoubleSide' },

  // --- Emissives (ceiling lights) ---
  ceilingWarm:    { color: 0xfff8e0, emissive: 0xfff0c0, emissiveIntensity: 1.3, roughness: 0.4, side: 'DoubleSide' },
  ceilingCool:    { color: 0xffffff, emissive: 0xe6f0ff, emissiveIntensity: 1.3, roughness: 0.3, side: 'DoubleSide' },
  ceilingNeutral: { color: 0xfff8e0, emissive: 0xfff0c0, emissiveIntensity: 1.1, roughness: 0.4, side: 'DoubleSide' },
};
