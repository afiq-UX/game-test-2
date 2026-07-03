// systems/GeometrySystem.js
import * as THREE from 'three';

const registry = new Map();

export function registerGeometry(type, builder) {
  registry.set(type, builder);
}

// Returns { meshes: THREE.Object3D[], meta: { indicatorPos: Vector3, ... } }
// The full config is passed through as a second arg for builders that need
// per-instance data (e.g. coveLight reads config.size = [width, depth]).
// Builders that only need materials simply ignore it.
export function createGeometry(type, materials, config) {
  const builder = registry.get(type);
  if (!builder) throw new Error(`No geometry registered for: "${type}"`);
  return builder(materials, config);
}

export function hasGeometry(type) {
  return registry.has(type);
}

// Helper: create a mesh with shadows enabled
export function solidMesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
