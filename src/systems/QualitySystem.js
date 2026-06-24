// systems/QualitySystem.js
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

// Call each frame: enable nearest N point lights, disable the rest.
export function enforceLightBudget(appliances, playerPos) {
  const { maxPointLights } = getQualityConfig();
  const withLights = [];
  for (const a of appliances) {
    if (a.on && a.light) withLights.push(a);
  }
  withLights.sort((a, b) => {
    const da = a.group.position.distanceToSquared(playerPos);
    const db = b.group.position.distanceToSquared(playerPos);
    return da - db;
  });
  for (let i = 0; i < withLights.length; i++) {
    withLights[i].light.visible = i < maxPointLights;
  }
}
