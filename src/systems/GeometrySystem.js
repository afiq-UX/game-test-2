// systems/GeometrySystem.js
import * as THREE from 'three';

const registry = new Map();

export function registerGeometry(type, builder) {
  registry.set(type, builder);
}

// Returns { meshes: THREE.Object3D[], meta: { indicatorPos: Vector3, ... } }
export function createGeometry(type, materials) {
  const builder = registry.get(type);
  if (!builder) throw new Error(`No geometry registered for: "${type}"`);
  return builder(materials);
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
