// tokens/quality.js
// Device quality tier definitions.

export const QualityTiers = {
  high: {
    shadowMapSize: 1024, // moon's shadow map — the only realtime shadow caster
    // Forward rendering costs pixels × active lights per frame, so these two
    // are the dominant runtime cost. 2× retina at 26 lights pegged even an M1
    // laptop (which lands on this tier). 1.5× pixel ratio (~44% fewer pixels)
    // and a 10-light budget (~57% less per-pixel lighting) cut the combined
    // fragment cost ~4× for negligible visual loss — most of the trimmed
    // lights were the open-plan cove's faint downlights.
    maxPixelRatio: 1.5,
    maxPointLights: 10,
    toneMappingExposure: 1.05,
    materialDegradeEmissive: 1.0,
    materialStripMetalness: false,
  },
  medium: {
    shadowMapSize: 512,
    maxPixelRatio: 1.5,
    maxPointLights: 8,
    toneMappingExposure: 1.0,
    materialDegradeEmissive: 0.8,
    materialStripMetalness: false,
  },
  low: {
    shadowMapSize: 256,
    maxPixelRatio: 1,
    maxPointLights: 4,
    toneMappingExposure: 0.95,
    materialDegradeEmissive: 0.6,
    materialStripMetalness: true,
  },
};
