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

// Call each frame: enable the nearest N point lights, disable the rest.
// Appliances may own several lights (e.g. cove wash + corner downlights);
// the budget counts individual lights, ranked by their appliance's distance.
export function enforceLightBudget(appliances, playerPos) {
  const { maxPointLights } = getQualityConfig();
  const entries = [];
  for (const a of appliances) {
    if (!a.on || !a.lights.length) continue;
    const d2 = a.group.position.distanceToSquared(playerPos);
    for (const light of a.lights) entries.push({ light, d2 });
  }
  entries.sort((a, b) => a.d2 - b.d2);
  for (let i = 0; i < entries.length; i++) {
    entries[i].light.visible = i < maxPointLights;
  }
}
