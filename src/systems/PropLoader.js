// systems/PropLoader.js
// One-off loaders for imported props that don't fit ModelLoader.js's
// per-appliance GLB pipeline (registerGeometry + ApplianceConfigs) — either
// because the source is FBX (the cafe stool) or because it's a large static
// decoration rather than a single interactive appliance (the kitchen
// cabinets). Both are added directly to the scene from main.js.
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
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
// Some GLBs use Draco geometry compression (smaller downloads) — this decoder
// is required to load them regardless of whether a given file actually uses
// it (GLTFLoader only invokes it when a KHR_draco_mesh_compression extension
// is present, so plain GLBs are unaffected).
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
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
// TV Wall Shelf — "Modern Wooden Shelf" (12 meshes/3 materials), replacing the
// old plain cabinet. Raw units are already a sensible ~3.0 x 1.93 x 0.49m
// footprint. Its long axis runs along the model's own Z (not X) and its
// front (cabinet doors + open middle TV cubby) faces its own +X — rotated
// -90° around Y here, before centering, so the long side ends up along world
// X (against the wall) and the front faces south into the room, matching how
// main.js expects to place it (same as every other prop).
//
// Scaled up 1.5x per feedback, but NOT uniformly: width/depth get the full
// 1.5x (~4.5 x 0.65m), while height is capped just under the living room's
// cove ceiling (drops to y=2.77 here — see appliances.js's ceilingFanLiv
// comment) instead of the ~2.89m a uniform 1.5x would reach, which clipped
// visibly through it. Height scale is computed from the model's own measured
// raw height, not a hardcoded ratio, so it stays correct if the source file
// ever changes.
const TV_SHELF_SCALE = 1.5; // width/depth
const TV_SHELF_MAX_HEIGHT = 2.75; // ~0.02m clearance under the 2.77m cove ceiling
let tvWallCabinet = null;

export async function preloadTvWallCabinet() {
  const gltf = await gltfLoader.loadAsync('/models/tvWallCabinet.glb');
  const group = gltf.scene;
  group.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
  });
  group.rotation.y = -Math.PI / 2;
  group.updateMatrixWorld(true);
  const rawBox = new THREE.Box3().setFromObject(group); // pre-scale
  const heightScale = TV_SHELF_MAX_HEIGHT / (rawBox.max.y - rawBox.min.y);
  group.scale.set(TV_SHELF_SCALE, heightScale, TV_SHELF_SCALE);
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

// ---------------------------------------------------------------------------
// Front entrance door — "Modern Wood Door" (5 meshes: frame, leaf, handles,
// hinges, latch). Unlike every other prop, this one gets SPLIT into two
// groups instead of loaded as one static piece: a static half (frame +
// hinges, never moves) and a swinging half (leaf + handle + latch, rotated
// open/closed by main.js — same mechanic house.js's procedural doors use).
//
// Scale is measured, not guessed: the source model's own frame is ~17.6 units
// tall raw, scaled here to match this game's standard DOOR_H (2.3m, the same
// opening height every other door in the house uses) — giving a real leaf
// width of ~0.865m, which is what house.js's buildFrontDoor() collider math
// (LEAF = 0.87) was sized to match.
const DOOR_OPENING_HEIGHT = 2.3;
let frontDoor = null; // { group: <static frame>, leaf: <swinging pivot group> }

export async function preloadFrontDoor() {
  const gltf = await gltfLoader.loadAsync('/models/frontDoor.glb');
  const root = gltf.scene;
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
  });
  root.updateMatrixWorld(true);

  // Split into static (frame + hinges) and swinging (leaf + handle + latch)
  // groups. .attach() preserves each node's current world transform while
  // reparenting (still in the model's own raw authoring space at this point —
  // nothing has been re-centered, so the frame and leaf are still exactly
  // where the source model put them relative to each other).
  const byName = (n) => root.getObjectByName(n);
  // Both looked up now, while still findable under `root` — .attach() below
  // moves them out, and getObjectByName only searches its caller's own subtree.
  const leafMesh = byName('door2_door2_0'); // camera-occlusion reference (main.js's raycaster only tests meshes directly, non-recursively)

  const staticGroup = new THREE.Group();
  staticGroup.attach(byName('door2_frame'));
  staticGroup.attach(byName('door2_hinges'));

  const leafGroup = new THREE.Group();
  leafGroup.attach(byName('door2')); // the leaf's parent node is named 'door2', not 'door2_door2'
  leafGroup.attach(byName('door2_handles'));
  leafGroup.attach(byName('door2_latch'));

  // Re-anchor BOTH groups to the SAME point — the frame's own outer edge, at
  // floor level — instead of repositioning frame and leaf separately with
  // independently guessed target coordinates (that drifted them out of
  // alignment: the leaf rendered visibly detached from its own frame). Since
  // they're anchored to one shared reference, their original frame<->leaf
  // alignment — already correct, straight from the source model — is
  // preserved exactly; main.js then places both groups at the identical
  // world position, which is the doorway's edge (FRONT_DOOR_GAP[1]).
  //
  // Anchored to the FRAME's edge specifically, not the hinge hardware's own
  // position: a real door frame installs flush with the rough wall opening,
  // and the hinge sits wherever it naturally mounts on that frame (measured
  // ~0.09m recessed from the frame's outer edge on this model) — anchoring to
  // the hinge instead left the frame overhanging past the wall opening.
  staticGroup.updateMatrixWorld(true);
  const frameBox = new THREE.Box3().setFromObject(staticGroup); // frame is the tallest/widest reference
  const anchor = new THREE.Vector3(frameBox.max.x, frameBox.min.y, (frameBox.min.z + frameBox.max.z) / 2);
  for (const group of [staticGroup, leafGroup]) {
    for (const child of [...group.children]) child.position.sub(anchor);
  }

  const frameHeight = frameBox.max.y - frameBox.min.y; // ~17.6 raw units
  const scale = DOOR_OPENING_HEIGHT / frameHeight;
  staticGroup.scale.setScalar(scale);
  leafGroup.scale.setScalar(scale);

  // Named to match how main.js wires this into the doors[] entry: leafGroup
  // becomes that door object's `.group` (the thing the open/close animation
  // rotates) and occluderMesh becomes its `.leaf` (the camera-occlusion
  // reference) — deliberately NOT called `.group`/`.leaf` here too, to avoid
  // that mix-up while reading this file on its own.
  frontDoor = { staticGroup, leafGroup, occluderMesh: leafMesh };
}

export function getFrontDoor() {
  return frontDoor;
}

// ---------------------------------------------------------------------------
// Interior real door — "clean wooden door with metal handle" — replaces the
// procedural makeDoor() box for 4 doorways (BR3, BR2, balcony, master-bedroom
// entry). Same split-groups pattern as the front door above: a static half
// (both frame meshes — metal trim + wood) and a swinging half (both leaf
// meshes — metal hardware + wood), anchored to a shared reference point (the
// frame's own edge, at floor level) so their original alignment is preserved
// — see preloadFrontDoor's comments for why this matters and why it's
// anchored to the frame's edge, not any specific hardware mesh's position.
//
// Unlike the front door (placed once), this asset is placed 4x, so it's
// loaded ONCE here and getInteriorDoorInstance() returns a FRESH CLONE each
// time — main.js needs 4 independent objects it can position/rotate on
// their own, not the same shared group moved around.
//
// This model's hinge side is the OPPOSITE edge from the front door's model
// (low-x here vs high-x there) — found the same way, by comparing where the
// small hardware pieces on the frame side and the leaf side cluster (both at
// x≈-1.12, the model's low-x edge), not guessed.
let interiorDoorTemplate = null;

export async function preloadInteriorDoor() {
  const gltf = await gltfLoader.loadAsync('/models/interiorDoor.glb');
  const root = gltf.scene;
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
  });
  root.updateMatrixWorld(true);

  // GLTFLoader sanitizes node names — spaces become underscores AND periods
  // are stripped entirely (confirmed at runtime by dumping the loaded names,
  // not guessed off the raw file's own node dump): "door frame.001" loads as
  // "door_frame001", "Door.001" loads as "Door001".
  const byName = (n) => root.getObjectByName(n);
  const staticGroup = new THREE.Group();
  staticGroup.attach(byName('door_frame'));     // metal trim (4 meshes)
  staticGroup.attach(byName('door_frame001'));  // wood (1 mesh)

  const leafGroup = new THREE.Group();
  leafGroup.attach(byName('Door001'));          // metal hardware (4 meshes)
  leafGroup.attach(byName('Door002'));          // wood (1 mesh)

  // Shared anchor: the frame's own edge on the hinge side (min-x — see
  // comment above), at floor level, mid-depth.
  staticGroup.updateMatrixWorld(true);
  const frameBox = new THREE.Box3().setFromObject(staticGroup);
  const anchor = new THREE.Vector3(frameBox.min.x, frameBox.min.y, (frameBox.min.z + frameBox.max.z) / 2);
  for (const group of [staticGroup, leafGroup]) {
    for (const child of [...group.children]) child.position.sub(anchor);
  }

  const frameHeight = frameBox.max.y - frameBox.min.y;
  const scale = DOOR_OPENING_HEIGHT / frameHeight; // same 2.3m convention as the front door
  staticGroup.scale.setScalar(scale);
  leafGroup.scale.setScalar(scale);

  interiorDoorTemplate = { staticGroup, leafGroup };
}

// Returns a FRESH deep clone of the loaded template (this asset is reused
// 4x, unlike every other prop in this file). The occluder mesh is looked up
// fresh from the CLONE, not the template — using the template's own mesh
// reference here would point every instance's camera-occlusion check at the
// same single (arbitrarily-positioned) object.
export function getInteriorDoorInstance() {
  if (!interiorDoorTemplate) return null;
  const staticGroup = interiorDoorTemplate.staticGroup.clone(true);
  const leafGroup = interiorDoorTemplate.leafGroup.clone(true);
  const occluderMesh = leafGroup.getObjectByName('Door002_Wood_black_0'); // sanitized name (period stripped, space -> underscore)
  return { staticGroup, leafGroup, occluderMesh };
}

// ---------------------------------------------------------------------------
// Bed Agape — 6 meshes/3 materials, for BR3. Raw units read as centimetres
// (250 x 90 x 216 raw -> a plausible ~2.5 x 0.9 x 2.16m bed with frame/
// headboard, not guessed blind — same "divide by 100 gives sane real-world
// numbers" check used for this codebase's other cm-scale assets).
const BED_CM = 0.01;
let bedAgape = null;

export async function preloadBedAgape() {
  const gltf = await gltfLoader.loadAsync('/models/bedAgape.glb');
  const group = gltf.scene;
  group.scale.setScalar(BED_CM);
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
  bedAgape = group;
}

export function getBedAgape() {
  return bedAgape;
}

// ---------------------------------------------------------------------------
// Bed (bed-2) — 7 meshes/2 materials, for BR2. Same cm-unit reasoning as Bed
// Agape above (199 x 100 x 233 raw -> a plausible ~2.0 x 1.0 x 2.3m bed).
let bed2 = null;

export async function preloadBed2() {
  const gltf = await gltfLoader.loadAsync('/models/bed2.glb');
  const group = gltf.scene;
  group.scale.setScalar(BED_CM);
  group.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    o.material.color.multiplyScalar(0.7); // darken bed2's near-white      materials
  });
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= box.min.y;
  bed2 = group;
}

export function getBed2() {
  return bed2;
}
