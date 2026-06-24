// tokens/quality.js
// Device quality tier definitions.

export const QualityTiers = {
  high: {
    shadowMapSize: 1024,
    maxPixelRatio: 2,
    maxPointLights: 26,
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
