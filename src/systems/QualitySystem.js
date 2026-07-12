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

// Rooms with no walls between them at all (one continuous open floor) — a
// light tagged to any one of these is visible from any other, no door check
// needed. See house.js ROOMS comments for the floor plan.
const OPEN_ZONE = new Set(['LIV', 'DIN', 'HALL1', 'HALL2', 'HALL3', 'HALL4']);
// Room pairs joined by a gap with no door leaf at all — always open, unlike
// the doors in `doors[]` which can be closed. Currently just the kitchen
// doorway (see house.js buildDoors comment).
const ALWAYS_OPEN = [['KIT', 'HALL4']];

// A door tagged to e.g. HALL1 opens the room on its other side to the WHOLE
// open-plan floor, not just that one HALL# rectangle — HALL1-4/LIV/DIN share
// no walls with each other at all, so standing in any of them is physically
// the same as standing right at that door. Treat any OPEN_ZONE room as
// interchangeable with the zone itself when matching a door's room tag.
function sameSide(room, side) {
  return room === side || (OPEN_ZONE.has(room) && OPEN_ZONE.has(side));
}
function connects(a, b, fromRoom, toRoom) {
  return (sameSide(fromRoom, a) && sameSide(toRoom, b)) || (sameSide(fromRoom, b) && sameSide(toRoom, a));
}

// Cheap stand-in for real light occlusion (see conversation: real per-light
// shadow casting is too expensive for ~27 lights). A light's room only
// counts as visible from the player's room if they're the same room, both
// share the open-plan living/dining/hall floor, or a door directly between
// them is currently open — otherwise it's treated as blocked, same as if a
// solid wall were in the way.
function canSeeRoom(fromRoom, toRoom, doors) {
  if (!fromRoom || !toRoom || fromRoom === toRoom) return true;
  if (OPEN_ZONE.has(fromRoom) && OPEN_ZONE.has(toRoom)) return true;
  for (const [a, b] of ALWAYS_OPEN) {
    if (connects(a, b, fromRoom, toRoom)) return true;
  }
  for (const d of doors) {
    if (!d.rooms || !d.open) continue;
    const [a, b] = d.rooms;
    if (connects(a, b, fromRoom, toRoom)) return true;
  }
  return false; // no connection at all between these two rooms
}

// Call each frame: only lights whose room the player can currently see (see
// canSeeRoom) AND rank among the nearest `maxPointLights` (ranked by each
// light's real WORLD position, not its appliance origin — one fixture, e.g.
// the open-plan cove, spreads its lights across the whole floor, so a
// per-appliance distance would mis-rank them) actually illuminate; the rest
// are dimmed to zero. Appliance lights never cast realtime shadows (reverted
// per feedback — only the moon's structural shadow remains); canSeeRoom is
// the cheap substitute for real per-light shadow occlusion.
//
// CRITICAL — this NEVER toggles `light.visible`. three.js bakes each light
// type's COUNT into every material's shader program, so hiding a light
// changes that count and forces a synchronous recompile of *every* material
// in the scene — the multi-hundred-ms freezes that showed up as intermittent
// startup/gameplay lag. Every light stays `visible = true` for its whole
// life; budgeting is done by setting `intensity = 0` (a uniform, not a
// compile-time define) instead, so the light count is constant.
const _wp = new THREE.Vector3();
export function enforceLightBudget(appliances, playerPos, playerRoom, doors) {
  const { maxPointLights } = getQualityConfig();
  const entries = [];
  for (const a of appliances) {
    if (!a.lights.length) continue;
    const roomVisible = canSeeRoom(playerRoom, a.room, doors);
    for (const light of a.lights) {
      // Remember each light's authored intensity once, so we can restore it
      // after dimming it to zero for the budget.
      if (light.userData.baseIntensity === undefined) {
        light.userData.baseIntensity = light.intensity;
      }
      // A switched-off appliance's lights, or ones whose room is currently
      // blocked from view, stay in the scene (visible, so the shader light
      // count doesn't change) but contribute nothing.
      if (!a.on || !roomVisible) {
        light.intensity = 0;
        continue;
      }
      light.getWorldPosition(_wp);
      entries.push({ light, d2: _wp.distanceToSquared(playerPos) });
    }
  }
  entries.sort((a, b) => a.d2 - b.d2);
  for (let i = 0; i < entries.length; i++) {
    entries[i].light.intensity = i < maxPointLights ? entries[i].light.userData.baseIntensity : 0;
  }
}
