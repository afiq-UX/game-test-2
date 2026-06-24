// systems/MaterialSystem.js
import * as THREE from 'three';
import { MaterialTokens } from '../tokens/materials.js';
import { getQualityConfig } from './QualitySystem.js';

const cache = new Map();

const SIDE_MAP = {
  DoubleSide: THREE.DoubleSide,
  FrontSide: THREE.FrontSide,
  BackSide: THREE.BackSide,
};

function resolveProps(base, overrides) {
  const props = { ...base, ...overrides };
  const qc = getQualityConfig();

  if (qc.materialStripMetalness) {
    delete props.metalness;
  }
  if (props.emissiveIntensity != null) {
    props.emissiveIntensity *= qc.materialDegradeEmissive;
  }
  if (typeof props.side === 'string') {
    props.side = SIDE_MAP[props.side] ?? THREE.FrontSide;
  }
  return props;
}

// Cached shared material — use for body panels, structural parts.
// Same token+overrides always returns same instance.
export function getMaterial(tokenName, overrides) {
  const key = overrides ? tokenName + JSON.stringify(overrides) : tokenName;
  if (cache.has(key)) return cache.get(key);

  const base = MaterialTokens[tokenName];
  if (!base) throw new Error(`Unknown material token: "${tokenName}"`);

  const mat = new THREE.MeshStandardMaterial(resolveProps(base, overrides));
  cache.set(key, mat);
  return mat;
}

// Unique material — use for emissive/toggle surfaces (screens, lamp shades)
// so toggling one appliance doesn't affect others.
export function createToggleMaterial(tokenName, overrides) {
  const base = MaterialTokens[tokenName];
  if (!base) throw new Error(`Unknown material token: "${tokenName}"`);
  return new THREE.MeshStandardMaterial(resolveProps(base, overrides));
}

export function disposeMaterials() {
  for (const mat of cache.values()) mat.dispose();
  cache.clear();
}
