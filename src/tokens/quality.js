// tokens/quality.js
// Device quality tier definitions.

export const QualityTiers = {
  high: {
    shadowMapSize: 1024,
    maxPixelRatio: 2,
    maxPointLights: 26,
    // How many of the nearest spotlights may cast realtime shadows at once.
    // Each spotlight shadow is one extra scene render per frame, so this is the
    // main perf knob for realtime lighting. Desktop-first: 3 on high.
    maxShadowCasters: 3,
    toneMappingExposure: 1.05,
    materialDegradeEmissive: 1.0,
    materialStripMetalness: false,
  },
  medium: {
    shadowMapSize: 512,
    maxPixelRatio: 1.5,
    maxPointLights: 8,
    maxShadowCasters: 1,
    toneMappingExposure: 1.0,
    materialDegradeEmissive: 0.8,
    materialStripMetalness: false,
  },
  low: {
    shadowMapSize: 256,
    maxPixelRatio: 1,
    maxPointLights: 4,
    maxShadowCasters: 0, // no per-light shadows on weak devices (moon still casts)
    toneMappingExposure: 0.95,
    materialDegradeEmissive: 0.6,
    materialStripMetalness: true,
  },
};
