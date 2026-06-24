// systems/ModelLoader.js
// Preloads GLB files and provides GLTF-first geometry with parametric fallback.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getMaterial, createToggleMaterial } from './MaterialSystem.js';
import { MaterialTokens } from '../tokens/materials.js';

const loader = new GLTFLoader();
const cache = new Map(); // geometryType → THREE.Group

// Load all GLBs from /models/<name>.glb. Missing files are silently skipped —
// geometry builders fall back to parametric when cache has no entry.
export async function preloadModels(names) {
  await Promise.allSettled(
    names.map(name =>
      loader.loadAsync(`/models/${name}.glb`)
        .then(gltf => cache.set(name, gltf.scene))
    )
  );
}

// Traverse a cloned scene and replace materials using the config's materials map.
// Keys are mesh names in the model; values are MaterialToken names.
// Emissive tokens get createToggleMaterial (unique instance) so behaviors can
// toggle them independently. Everything else gets the shared cached material.
function applyMaterials(root, materialsMap) {
  root.traverse(child => {
    if (!child.isMesh) return;
    const tokenName = materialsMap[child.name];
    if (!tokenName) return;
    const token = MaterialTokens[tokenName];
    if (!token) return;
    child.material = token.emissive != null
      ? createToggleMaterial(tokenName)
      : getMaterial(tokenName);
    child.castShadow = true;
    child.receiveShadow = true;
  });
}

// Returns { meshes, meta } if the GLB is cached, or null to trigger parametric fallback.
// If the model contains a mesh named 'indicator', its position is used as indicatorPos
// and the mesh is hidden — lets artists place the indicator marker in Blender.
export function getModel(name, materialsMap, fallbackIndicatorPos) {
  const original = cache.get(name);
  if (!original) return null;

  const clone = original.clone(true);

  let indicatorPos = fallbackIndicatorPos;
  const marker = clone.getObjectByName('indicator');
  if (marker) {
    indicatorPos = marker.position.clone();
    marker.visible = false;
  }

  applyMaterials(clone, materialsMap);

  return { meshes: [clone], meta: { indicatorPos } };
}
