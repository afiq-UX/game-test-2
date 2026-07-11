// systems/PropLoader.js
// One-off loaders for imported props that don't fit ModelLoader.js's
// per-appliance GLB pipeline (registerGeometry + ApplianceConfigs) — either
// because the source is FBX (the cafe stool) or because it's a large static
// decoration rather than a single interactive appliance (the kitchen
// cabinets). Both are added directly to the scene from main.js.
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { getMaterial } from './MaterialSystem.js';

const loader = new FBXLoader();
const STOOL_HEIGHT = 0.7; // matches the counter's proportions (see house.js buildKitchenCounter)

let template = null;

function findStoolNode(root) {
  let found = null;
  root.traverse((o) => { if (!found && /^cafe_stool$/i.test(o.name)) found = o; });
  if (!found) root.traverse((o) => { if (!found && /^cafe_stool/i.test(o.name)) found = o; });
  return found;
}

export async function preloadCafeStool() {
  const fbx = await loader.loadAsync('/models/cafeStool/cafeStool.fbx');
  const stool = findStoolNode(fbx);
  if (!stool) {
    console.warn('cafeStool.fbx: no "cafe_stool" object found — skipping stool placement');
    return;
  }

  // Re-anchor to the origin, but keep its WORLD rotation/scale rather than
  // zeroing them out: this FBX was modeled Z-up, and the corrective rotation
  // that stands it upright is baked into an ancestor node (Root/Sketchfab_model),
  // not onto "cafe_stool" itself — resetting local rotation to identity here
  // discarded that correction and left the stool lying on its side. Reading
  // matrixWorld (the fully composed transform) before detaching preserves it.
  const worldPos = new THREE.Vector3();
  const worldQuat = new THREE.Quaternion();
  const worldScale = new THREE.Vector3();
  fbx.updateMatrixWorld(true);
  stool.matrixWorld.decompose(worldPos, worldQuat, worldScale);
  stool.position.set(0, 0, 0);
  stool.quaternion.copy(worldQuat);
  stool.scale.copy(worldScale);

  const mat = getMaterial('darkWood');
  stool.traverse((o) => {
    if (!o.isMesh) return;
    o.material = mat;
    o.castShadow = true;
    o.receiveShadow = true;
  });

  const group = new THREE.Group();
  group.add(stool);

  // Normalise height and drop to floor, same approach as player.js's model.
  group.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
  group.scale.setScalar(STOOL_HEIGHT / size.y);
  group.updateMatrixWorld(true);
  group.position.y -= new THREE.Box3().setFromObject(group).min.y;

  template = group;
}

// Returns a fresh clone positioned at the origin, or null if the FBX failed
// to load / didn't contain a recognizable stool node.
export function getCafeStoolTemplate() {
  return template ? template.clone(true) : null;
}

// ---------------------------------------------------------------------------
// Kitchen cabinets — a large L-shaped run (base cabinets + counter + upper
// cabinets) with a built-in appliance nook, exported from SketchUp. Unlike
// the stool, this is a single big static decoration, not something we place
// more than once, so there's no clone-per-instance API — just load it and
// hand the whole scene to main.js to position.
const gltfLoader = new GLTFLoader();
const INCH = 0.0254; // source file's raw units read as inches (SketchUp default)

// Best-effort estimate of the fridge nook's centre, in the model's own local
// space (raw inches, before our INCH scale below). The source file's meshes
// are all generically named "Material2" with no semantic markers, so this
// was found by computing every mesh's world-space AABB and locating the gap
// in coverage near the L-shape's corner (where the reference photo shows the
// nook) rather than read directly off a named node — treat it as a starting
// point to nudge once it's visible, not a precise measurement.
const NOOK_LOCAL = new THREE.Vector3(85.9, 0, 26.6);

let cabinets = null;

export async function preloadKitchenCabinets() {
  const gltf = await gltfLoader.loadAsync('/models/kitchenCabinets.glb');
  const group = gltf.scene;
  group.scale.setScalar(INCH);
  group.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
  });
  cabinets = group;
}

// Returns the (single) loaded cabinet group, or null if it hasn't loaded.
export function getKitchenCabinets() {
  return cabinets;
}

// World-space position of the fridge nook, given the cabinet group has
// already been placed (position/rotation set) — call after that, not before.
export function getFridgeNookWorldPos() {
  if (!cabinets) return null;
  return cabinets.localToWorld(NOOK_LOCAL.clone());
}

// ---------------------------------------------------------------------------
// Kitchen Counter — replaces the earlier Counter-Corner asset (same slot,
// same "load once, let main.js position it" pattern). 5 meshes, 2 textured
// materials.
const MM = 0.001; // source file's raw units read as millimetres — inferred
                   // from proportions (its own node matrices already bake in
                   // an odd mix of an inch-scale factor from an earlier FBX
                   // export step), not a confirmed measurement; check scale
                   // once visible.

let kitchenCounter = null;

export async function preloadKitchenCounter() {
  const gltf = await gltfLoader.loadAsync('/models/kitchenCounter.glb');
  const group = gltf.scene;
  group.scale.setScalar(MM);
  group.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
  });
  // This model's own origin isn't at floor level either — drop it to the
  // floor before any rotation, since rotation.y never affects Y.
  group.updateMatrixWorld(true);
  group.position.y -= new THREE.Box3().setFromObject(group).min.y;
  kitchenCounter = group;
}

export function getKitchenCounter() {
  return kitchenCounter;
}

// ---------------------------------------------------------------------------
// Dining Table Set — table + 6 chairs, one merged scene. Unlike the last two
// assets, its own node hierarchy already bakes in a correct cm→m conversion
// (confirmed by computing its full transform chain: the result comes out at
// a sensible ~3 x 1 x 2.3m footprint with no extra guessing), so no
// additional scale is applied here.
let diningTableSet = null;

export async function preloadDiningTableSet() {
  const gltf = await gltfLoader.loadAsync('/models/diningTableSet.glb');
  const group = gltf.scene;
  group.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
  });
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  // Re-anchor so group.position lands exactly at the footprint's centre on
  // the floor, so main.js can just point it at the room's centre point.
  const center = box.getCenter(new THREE.Vector3());
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= box.min.y;
  diningTableSet = group;
}

export function getDiningTableSet() {
  return diningTableSet;
}

// ---------------------------------------------------------------------------
// Cupboard — glass-front display cupboard, 9 meshes/materials. Its raw units
// don't resolve to a clean single factor either way: read as inches, height
// and depth look plausible but width balloons to ~2m (more armoire than
// cupboard); read as centimetres, all three dimensions (~0.82 x 0.78 x 0.18m)
// match a modest cupboard far better, so that's the guess here — check scale
// once visible.
const CUPBOARD_CM = 0.01;

let cupboard = null;

export async function preloadCupboard() {
  const gltf = await gltfLoader.loadAsync('/models/cupboard.glb');
  const group = gltf.scene;
  group.scale.setScalar(CUPBOARD_CM);
  group.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
  });
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= box.min.y;
  cupboard = group;
}

export function getCupboard() {
  return cupboard;
}

// ---------------------------------------------------------------------------
// TV Wall Cabinet — 30 meshes/4 materials, no scale needed (confirmed via the
// full transform chain: already a sensible ~3.37 x 2.24 x 0.56m footprint).
let tvWallCabinet = null;

export async function preloadTvWallCabinet() {
  const gltf = await gltfLoader.loadAsync('/models/tvWallCabinet.glb');
  const group = gltf.scene;
  group.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
  });
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= box.min.y;
  tvWallCabinet = group;
}

export function getTvWallCabinet() {
  return tvWallCabinet;
}

// ---------------------------------------------------------------------------
// Boho Rug — single flat mesh, no scale needed (already ~1.84 x 3.02m, thin).
let rug = null;

export async function preloadRug() {
  const gltf = await gltfLoader.loadAsync('/models/rug.glb');
  const group = gltf.scene;
  group.traverse((o) => {
    if (!o.isMesh) return;
    o.receiveShadow = true;
  });
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= box.min.y;
  rug = group;
}

export function getRug() {
  return rug;
}

// ---------------------------------------------------------------------------
// Outdoors Sofa — 3 meshes (cushions/wood frame/stand), no scale needed. All
// three parts independently confirm the same large footprint (~5.45 x 5.53m,
// ~0.87m tall) — a big U/sectional arrangement rather than a single loveseat,
// not a bounding-box fluke from one stray mesh.
let sofa = null;

export async function preloadSofa() {
  const gltf = await gltfLoader.loadAsync('/models/sofa.glb');
  const group = gltf.scene;
  group.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
  });
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= box.min.y;
  sofa = group;
}

export function getSofa() {
  return sofa;
}
