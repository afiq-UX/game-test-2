// systems/ModelLoader.js
// Preloads GLB files and provides GLTF-first geometry with parametric fallback.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getMaterial, createToggleMaterial } from './MaterialSystem.js';
import { MaterialTokens } from '../tokens/materials.js';

const loader = new GLTFLoader();
const cache = new Map(); // geometryType → THREE.Group

// Rigged/skinned models (e.g. a fan with an animatable blade bone): nothing
// here ever plays a skeletal animation (the only motion is the 'spin'
// behavior rotating a plain Object3D by name), so there's no reason to keep
// the skeleton around — bake its rest pose into a plain static Mesh instead.
//
// First attempt at this just copied geometry.attributes.position directly,
// which is wrong: a SkinnedMesh's raw vertex positions are defined relative
// to its bindMatrix and each bone's inverse bind matrix, not directly in
// local mesh space, so skipping that transform produced a massively
// distorted mesh (reported as "a big ass wall" in one room). skeleton.pose()
// resets every bone to its bind-time transform, and boneTransform() is
// SkinnedMesh's own API for computing a vertex's fully-skinned position —
// using both together bakes exactly what the renderer would show for an
// unanimated skinned mesh at rest.
function stripSkinning(root) {
  const skinned = [];
  root.traverse((o) => { if (o.isSkinnedMesh) skinned.push(o); });
  const v = new THREE.Vector3();
  for (const o of skinned) {
    o.skeleton.pose();
    const srcPos = o.geometry.attributes.position;
    const baked = new Float32Array(srcPos.count * 3);
    for (let i = 0; i < srcPos.count; i++) {
      o.boneTransform(i, v);
      baked[i * 3] = v.x; baked[i * 3 + 1] = v.y; baked[i * 3 + 2] = v.z;
    }
    const geo = o.geometry.clone();
    geo.setAttribute('position', new THREE.BufferAttribute(baked, 3));
    geo.computeVertexNormals(); // positions moved; stale normals would shade wrong

    const mesh = new THREE.Mesh(geo, o.material);
    mesh.name = o.name;
    mesh.position.copy(o.position);
    mesh.quaternion.copy(o.quaternion);
    mesh.scale.copy(o.scale);
    mesh.castShadow = o.castShadow;
    mesh.receiveShadow = o.receiveShadow;
    o.parent.add(mesh);
    o.parent.remove(o);
  }
}

// Load all GLBs from /models/<name>.glb. Missing files are silently skipped —
// geometry builders fall back to parametric when cache has no entry.
export async function preloadModels(names) {
  await Promise.allSettled(
    names.map(name =>
      loader.loadAsync(`/models/${name}.glb`)
        .then(gltf => {
          stripSkinning(gltf.scene);
          cache.set(name, gltf.scene);
        })
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

  // Plain clone is safe now that stripSkinning() (in preloadModels) has
  // already removed every SkinnedMesh from the cached original — nothing
  // left with a skeleton binding to worry about.
  const clone = original.clone(true);

  // Defensive: keep frustum culling off regardless. Cheap, and rules out any
  // future case where a cloned mesh's bounds don't match its actual render
  // position (this is what player.js's own skinned character mesh does too).
  clone.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });

  let indicatorPos = fallbackIndicatorPos;
  const marker = clone.getObjectByName('indicator');
  if (marker) {
    indicatorPos = marker.position.clone();
    marker.visible = false;
  }

  applyMaterials(clone, materialsMap);

  return { meshes: [clone], meta: { indicatorPos, source: 'glb' } };
}
