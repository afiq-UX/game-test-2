// systems/QualitySystem.js
import * as THREE from 'three';
import { QualityTiers } from '../tokens/quality.js';

let currentTier = 'high';

export function detectQuality() {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent)
    || matchMedia('(pointer: coarse)').matches;
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 2;

  if (isMobile && mem <= 3) currentTier = 'low';
  else if (isMobile) currentTier = 'medium';
  else if (cores <= 2) currentTier = 'medium';
  else currentTier = 'high';

  return currentTier;
}

export function getQualityTier() {
  return currentTier;
}

export function getQualityConfig() {
  return QualityTiers[currentTier];
}

export function setQualityTier(tier) {
  if (QualityTiers[tier]) currentTier = tier;
}

// One-time shadow-camera setup for a spotlight the first time it's asked to
// cast. Kept off the hot path (only runs once per light).
const _wp = new THREE.Vector3();
function initSpotShadow(light, mapSize) {
  light.shadow.mapSize.set(mapSize, mapSize);
  light.shadow.camera.near = 0.3;
  light.shadow.camera.far = (light.distance || 6) + 1;
  light.shadow.bias = -0.0008;
  light.userData.shadowInit = true;
}

// Call each frame. Two jobs, both ranked by each light's real WORLD position
// (not its appliance origin — one fixture, e.g. the open-plan cove, spreads its
// lights across the whole floor, so a per-appliance distance would mis-rank
// them):
//   1. Light budget: only the nearest `maxPointLights` lights stay visible.
//   2. Realtime shadows: among those, only the nearest `maxShadowCasters`
//      spotlights cast (each is one extra render/frame). Point lights and
//      farther spots stay shadowless fill.
export function enforceLightBudget(appliances, playerPos) {
  const { maxPointLights, maxShadowCasters, shadowMapSize } = getQualityConfig();
  const entries = [];
  for (const a of appliances) {
    if (!a.on || !a.lights.length) continue;
    for (const light of a.lights) {
      light.getWorldPosition(_wp);
      entries.push({ light, d2: _wp.distanceToSquared(playerPos) });
    }
  }
  entries.sort((a, b) => a.d2 - b.d2);
  let shadowCount = 0;
  for (let i = 0; i < entries.length; i++) {
    const light = entries[i].light;
    const visible = i < maxPointLights;
    light.visible = visible;
    if (visible && light.isSpotLight && shadowCount < maxShadowCasters) {
      if (!light.userData.shadowInit) initSpotShadow(light, shadowMapSize);
      light.castShadow = true;
      shadowCount++;
    } else {
      light.castShadow = false;
    }
  }
}
