import * as THREE from 'three';
import { buildHouse, roomKeyAt, FRONT_DOOR_GAP, BR3_DOOR_GAP, BR2_DOOR_GAP, BALC_DOOR_GAP, MBR_DOOR_GAP } from './house.js';
import { createMinimap } from './minimap.js';
import './geometries/index.js';
import { ApplianceConfigs } from './configs/appliances.js';
import { createAllAppliances, tickAppliances, turnOffAppliance } from './factory/ApplianceFactory.js';
import { detectQuality, getQualityConfig, enforceLightBudget } from './systems/QualitySystem.js';
import { preloadModels } from './systems/ModelLoader.js';
import { preloadCafeStool, getCafeStoolTemplate, preloadKitchenCabinets, getKitchenCabinets, getFridgeNookWorldPos, preloadKitchenCounter, getKitchenCounter, preloadDiningTableSet, getDiningTableSet, preloadCupboard, getCupboard, preloadTvWallCabinet, getTvWallCabinet, preloadRug, getRug, preloadSofa, getSofa, preloadFrontDoor, getFrontDoor, preloadInteriorDoor, getInteriorDoorInstance, preloadBedAgape, getBedAgape, preloadBed2, getBed2 } from './systems/PropLoader.js';
import { createPlayer, PLAYER_RADIUS } from './player.js';
import { createCameraController } from './cameraController.js';
import { collide } from './collision.js';
import { createHud, formatTime, currentRoomName } from './hud.js';
import { createNerdStats } from './nerdStats.js';
import { clickSound } from './audio.js';
import { setupDesktopControls, setupTouchControls } from './controls.js';

const qualityTier = detectQuality();
const quality = getQualityConfig();

// ---------- Scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070912);
scene.fog = new THREE.Fog(0x070912, 22, 55);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 200); // 60 - 30%, per feedback ("closer" feel)

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, quality.maxPixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = quality.toneMappingExposure;
document.body.appendChild(renderer.domElement);

// F3 / ?stats debug overlay — frame() is called right after each render below.
const nerdStats = createNerdStats(renderer, scene, { tier: qualityTier });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- Lights ----------
scene.add(new THREE.AmbientLight(0xaab4d4, 0.22));
const moon = new THREE.DirectionalLight(0xc6d4ff, 0.55);
moon.position.set(12, 22, 8);
moon.castShadow = true;
moon.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 70;
moon.shadow.camera.left = -25;
moon.shadow.camera.right = 25;
moon.shadow.camera.top = 25;
moon.shadow.camera.bottom = -25;
moon.shadow.bias = -0.0005;
scene.add(moon);

// ---------- House ----------
const { walls, wallMeshes, furniture, roof, doors, ceiling, stoolSpots } = buildHouse(scene);
const colliders = walls.concat(furniture); // walls + furniture for player collision
for (const d of doors) colliders.push(d.collider); // door AABBs (active only when closed)

// Camera occlusion set: walls + ceiling + roof, so tilting up pulls the camera
// in (GTA/RDR2 style) and it stays below the ceiling — never peeking over walls.
const occluders = wallMeshes.slice();
roof.traverse((o) => { if (o.isMesh) occluders.push(o); });
occluders.push(ceiling);
// closed door blocks the view; open leaf swings aside. The front door's leaf
// is null here — its real-model visuals attach later, once its GLB loads —
// so it joins occluders down where that happens instead.
for (const d of doors) if (d.leaf) occluders.push(d.leaf);

// ---------- Model preload ----------
const loaderEl = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const modelNames = [...new Set(ApplianceConfigs.map(c => c.geometry))];
loaderBar.style.width = '30%';

// Ceiling-mounted fixtures (fans, ceiling lights, cove lighting, ceiling
// aircond units) sit well above head height — the player walks under them,
// so they're excluded from floor collision. Everything else (screens,
// lamps, gadgets, big appliances) sits at a height a walking player would
// actually bump into.
const CEILING_KINDS = new Set(['fan-light', 'ceiling-light', 'cove-light', 'ceiling-aircond']);

// Add a floor collider spanning an object's actual XZ footprint (computed
// from its real geometry rather than hand-guessed dimensions).
function addBoxCollider(object3D) {
  object3D.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object3D);
  colliders.push({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z });
}

// Add a floor collider for just one local-space region of an object (e.g.
// one solid segment of a multi-part model), transformed through its current
// world position/rotation/scale — used so a single L-shaped model doesn't
// get one giant bounding box covering its empty notches/nooks as solid.
function addLocalBoxCollider(object3D, localMin, localMax) {
  const pts = [];
  for (const x of [localMin[0], localMax[0]])
    for (const y of [localMin[1], localMax[1]])
      for (const z of [localMin[2], localMax[2]])
        pts.push(object3D.localToWorld(new THREE.Vector3(x, y, z)));
  const box = new THREE.Box3().setFromPoints(pts);
  colliders.push({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z });
}

(async () => {
  // allSettled, not all: one prop asset failing to load (flaky network, a
  // large GLB timing out, a renamed file) must NOT abort startup — it used to
  // reject the whole chain and leave the loading bar stuck at 30% forever.
  // Every prop is optional and its placement below is already null-guarded, so
  // a failed load just skips that decoration. preloadModels is internally
  // tolerant too (allSettled), so it never rejects here.
  // Kick the player model (≈10 MB of FBX, parsed on the main thread) off now so
  // it loads *concurrently* with the prop GLBs instead of serially after them
  // (it used to be awaited separately further down). Awaited later, once the
  // scene is otherwise built.
  const playerPromise = createPlayer();

  const preloads = {
    models: preloadModels(modelNames), cafeStool: preloadCafeStool(),
    kitchenCabinets: preloadKitchenCabinets(), kitchenCounter: preloadKitchenCounter(),
    diningTableSet: preloadDiningTableSet(), cupboard: preloadCupboard(),
    tvWallCabinet: preloadTvWallCabinet(), rug: preloadRug(), sofa: preloadSofa(),
    frontDoor: preloadFrontDoor(), interiorDoor: preloadInteriorDoor(),
    bedAgape: preloadBedAgape(), bed2: preloadBed2(),
  };
  const results = await Promise.allSettled(Object.values(preloads));
  Object.keys(preloads).forEach((name, i) => {
    if (results[i].status === 'rejected') {
      console.warn(`Prop "${name}" failed to load — skipping it.`, results[i].reason);
    }
  });
  loaderBar.style.width = '70%';
  // NOTE: the loader is intentionally NOT hidden here. The heaviest main-thread
  // work still comes AFTER this point — building 30 appliances, placing props,
  // parsing the player FBX, and (the big one) compiling every material's shader
  // on the first render. Hiding the loader now would show the game, then freeze
  // for seconds. Instead we keep it up through the shader warmup below.

  // ---------- Appliances ----------
  const appliances = createAllAppliances(scene, ApplianceConfigs);
  for (const a of appliances) {
    if (CEILING_KINDS.has(a.kind)) continue;
    addBoxCollider(a.group);
  }

  // ---------- Kitchen counter stools ----------
  for (const [sx, sz] of stoolSpots) {
    const stool = getCafeStoolTemplate();
    if (!stool) continue;
    stool.position.x = sx;
    stool.position.z = sz;
    scene.add(stool);
    addBoxCollider(stool);
  }

  // ---------- Kitchen cabinets ----------
  const cabinets = getKitchenCabinets();
  if (cabinets) {
    // Best-effort orientation: turns the model's long run to hug the west
    // wall, with its return leg sweeping along the south wall — check this
    // once it's visible, the rotation direction is a guess. Flipped 180°
    // per feedback once it was visible.
    cabinets.rotation.y = Math.PI / 2 + Math.PI;
    cabinets.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(cabinets);
    // Snap flush into the kitchen's SW corner (west wall inner face ≈ x -14.9,
    // south wall inner face ≈ z 11.9 — see house.js ROOMS.KIT / wall thickness).
    cabinets.position.x += -13.67 - box.min.x;
    cabinets.position.z += 14.5 - box.max.z;
    // The SW-corner anchor left the assembly short of the room's footprint
    // (7.5×7m room, 4.5×4m cabinet run), leaving an empty gap toward the
    // doorway/east side where the player was standing — shift it NE to close
    // that gap. Adjust further if it still doesn't reach.
    cabinets.position.x += 2.0;
    cabinets.position.z -= 2.5;
    cabinets.updateMatrixWorld(true);
    scene.add(cabinets);
    // One box over the whole L-shaped assembly also covered its empty
    // notches (the appliance nooks) as solid, blocking the player from ever
    // getting close enough to interact with anything sitting in them — so
    // this uses one collider per actual solid segment (in the model's own
    // local space, found the same way as the fridge nook in PropLoader.js)
    // instead, leaving the nooks themselves open to walk into.
    addLocalBoxCollider(cabinets, [-77.6, 0, -88.9], [-29.6, 39.1, -64.9]); // main run, before the stove-style gap
    addLocalBoxCollider(cabinets, [0.4, 0, -88.9], [73.9, 39.1, -64.9]);    // main run, after the gap
    addLocalBoxCollider(cabinets, [73.9, 0, -88.9], [97.9, 39.1, 8.6]);     // return leg, before the fridge nook
    addLocalBoxCollider(cabinets, [73.9, 0, 44.6], [97.9, 39.1, 68.6]);     // return leg, after the fridge nook

    // Move the fridge into the cabinet's built-in nook (see PropLoader.js —
    // the nook position is a geometric estimate, not a precise measurement).
    const nook = getFridgeNookWorldPos();
    const fridgeAppliance = appliances.find(a => a.id === 'fridge');
    if (nook && fridgeAppliance) fridgeAppliance.group.position.set(nook.x, 0, nook.z);
  }

  // ---------- Kitchen Counter (opposite wall from the kitchen cabinets,
  // which hug the east/south side near the doorway — this hugs west/north).
  // Replaces the earlier Counter-Corner asset in the same slot, same placement. ----------
  const kitchenCounter = getKitchenCounter();
  if (kitchenCounter) {
    // Scaled up 5x, then down 2x (net 2.5x) per feedback — the MM unit guess
    // in PropLoader.js likely read too small.
    kitchenCounter.scale.multiplyScalar(2.5);
    // Best-effort orientation, carried over from the Counter-Corner asset it
    // replaced — check once visible, this model's own natural facing may
    // not match. Turned another 270° per feedback.
    kitchenCounter.rotation.y = Math.PI / 2 + Math.PI + Math.PI + Math.PI / 2 + Math.PI / 2 + (Math.PI * 3) / 2;
    kitchenCounter.updateMatrixWorld(true);
    const kcBox = new THREE.Box3().setFromObject(kitchenCounter);
    // West wall inner face ≈ x -14.9. North edge starts at z 5.5, just past
    // the pass-through counter's kitchen-side reach (z 5..5.45), so it
    // doesn't clip through that.
    kitchenCounter.position.x += -14.8 - kcBox.min.x;
    kitchenCounter.position.z += 11.3 - kcBox.min.z;
    kitchenCounter.updateMatrixWorld(true);
    scene.add(kitchenCounter);
    addBoxCollider(kitchenCounter);
  }

  // ---------- Dining table set, centered in the dining area (ROOMS.DIN:
  // cx=-10.5, cz=2.5 — see house.js) ----------
  const diningTableSet = getDiningTableSet();
  if (diningTableSet) {
    diningTableSet.position.x += -11.1;
    diningTableSet.position.z += 0.5;
    scene.add(diningTableSet);
    addBoxCollider(diningTableSet);
  }

  // ---------- Cupboard — same wall plane as the pass-through counter (north
  // wall, z=5), on the solid segment east of the opening (x -9.375..-7.5),
  // dining side — moved here per feedback (previously placed on the west
  // segment instead). ----------
  const cupboard = getCupboard();
  if (cupboard) {
    cupboard.rotation.y = Math.PI; // turned 180° per feedback
    cupboard.position.x = -14.4;
    cupboard.position.z = 4.5;
    scene.add(cupboard);
    addBoxCollider(cupboard);
  }

  // ---------- TV Wall Cabinet — against the living room's north wall
  // (LIV: x -15..-6, z -12..0), centered in x, facing south into the room. ----------
  const tvWallCabinet = getTvWallCabinet();
  if (tvWallCabinet) {
    tvWallCabinet.updateMatrixWorld(true);
    const tvBox = new THREE.Box3().setFromObject(tvWallCabinet);
    tvWallCabinet.position.x += -10.5 - (tvBox.min.x + tvBox.max.x) / 2;
    tvWallCabinet.position.z += -11.9 - tvBox.min.z;
    tvWallCabinet.updateMatrixWorld(true);
    scene.add(tvWallCabinet);
    addBoxCollider(tvWallCabinet);
  }

  // ---------- Rug, in front of the TV wall cabinet, long axis running
  // toward/away from it ----------
  const rug = getRug();
  if (rug) {
    rug.scale.multiplyScalar(2);
    rug.position.x += -10.5;
    rug.position.y += 0.02; // clear of the floor to avoid z-fighting
    rug.position.z += -7;
    scene.add(rug);
  }

  // ---------- Sofa, centered on the rug, facing the TV wall (north) ----------
  const sofa = getSofa();
  if (sofa) {
    sofa.rotation.y = Math.PI / 2;
    sofa.position.x += -10.5;
    sofa.position.z += -7;
    scene.add(sofa);
    // It's a U-shaped sectional, not a solid block — one box over the whole
    // footprint also covered its open middle lounge pocket as solid, blocking
    // the player from ever walking up to the coffee table in the middle. Found
    // these segments by parsing the raw GLB vertex data (same approach as the
    // kitchen cabinet nooks) and gridding occupancy across X/Z: one long arm,
    // its back corner extension, the opposite back block, and the front run —
    // leaving the central pocket (and the back's small notch) open to walk into.
    addLocalBoxCollider(sofa, [-2.85, 0, -1.5], [-1.3, 1, 2.65]);  // long arm
    addLocalBoxCollider(sofa, [-1.3, 0, 1.15], [0.05, 1, 2.65]);   // arm's back corner
    addLocalBoxCollider(sofa, [1.5, 0, 1.15], [2.65, 1, 2.65]);    // opposite back block
    addLocalBoxCollider(sofa, [-0.5, 0, -2.95], [2.65, 1, -1.45]); // front run
  }

  // ---------- Beds — BR3 (Bed Agape) and BR2 (Bed), each centred in its own
  // room, flush against the back (north) wall, opposite the doorway on the
  // south wall. Both rooms share the same footprint (BR3: house.js ROOMS
  // xMin -6, xMax -0.5, zMin -12, zMax -3.5, centre x=-3.25; BR2: xMin -0.5,
  // xMax 5, zMin -12, zMax -3.5, centre x=2.25). ----------
  const bedAgape = getBedAgape();
  if (bedAgape) {
    bedAgape.updateMatrixWorld(true);
    const bedBox = new THREE.Box3().setFromObject(bedAgape);
    bedAgape.position.x += -1.5 - (bedBox.min.x + bedBox.max.x) / 2; // BR3 room centre
    bedAgape.position.z += -12 - bedBox.min.z; // flush against the back wall
    bedAgape.rotation.y = Math.PI / 2;
    bedAgape.updateMatrixWorld(true);
    scene.add(bedAgape);
    addBoxCollider(bedAgape);
  }

  const bed2 = getBed2();
  if (bed2) {
    bed2.updateMatrixWorld(true);
    const bed2Box = new THREE.Box3().setFromObject(bed2);
    bed2.position.x += 2.25 - (bed2Box.min.x + bed2Box.max.x) / 2; // BR2 room centre
    bed2.position.z += -12 - bed2Box.min.z; // flush against the back wall
    bed2.updateMatrixWorld(true);
    scene.add(bed2);
    addBoxCollider(bed2);
  }

  // ---------- Front door — real model, wired into the placeholder door
  // object house.js's buildFrontDoor() already set up (collider/interaction/
  // rooms were computed synchronously there; only the visuals arrive now). ----------
  const frontDoorAsset = getFrontDoor();
  const frontDoorEntry = doors.find((d) => d.name === 'Pintu Depan');
  if (frontDoorAsset && frontDoorEntry) {
    const [, gx1] = FRONT_DOOR_GAP;
    const fixed = 12; // south wall
    // Both groups are anchored (in PropLoader.js) to the SAME point — the
    // hinge line — so placing them at the identical world position preserves
    // their original frame<->leaf alignment exactly, instead of positioning
    // each piece with independently guessed coordinates that can drift them
    // apart (the bug that made the leaf render visibly detached from its frame).
    frontDoorAsset.staticGroup.position.set(gx1, 0, fixed);
    frontDoorAsset.leafGroup.position.set(gx1, 0, fixed);
    scene.add(frontDoorAsset.staticGroup, frontDoorAsset.leafGroup);
    // Wire into the SAME shape every other door object already has, so the
    // existing generic open/close animation + camera occlusion code (below,
    // and in the step() loop) doesn't need a front-door special case at all.
    frontDoorEntry.group = frontDoorAsset.leafGroup; // rotated open/closed by step()'s door-animation loop
    frontDoorEntry.leaf = frontDoorAsset.occluderMesh; // camera-occlusion reference
    occluders.push(frontDoorAsset.occluderMesh);
  }

  // ---------- Interior real doors — BR3, BR2, balcony, master-bedroom entry.
  // Same wiring as the front door above, just 4 independent clones (this
  // asset is placed 4x, unlike the front door's single instance) — each one
  // gets its own fresh getInteriorDoorInstance() call, not the same object
  // repositioned, so opening one doesn't move the others. ----------
  function attachRealDoor(doorName, fixed, gap) {
    const asset = getInteriorDoorInstance();
    const entry = doors.find((d) => d.name === doorName);
    if (!asset || !entry) return;
    const [g0] = gap; // pivot/hinge sits at the gap's low-x edge for this model — see PropLoader.js
    asset.staticGroup.position.set(g0, 0, fixed);
    asset.leafGroup.position.set(g0, 0, fixed);
    scene.add(asset.staticGroup, asset.leafGroup);
    entry.group = asset.leafGroup;
    entry.leaf = asset.occluderMesh;
    occluders.push(asset.occluderMesh);
  }
  attachRealDoor('Pintu Bilik Tidur 3', -3.5, BR3_DOOR_GAP);
  attachRealDoor('Pintu Bilik Tidur 2', -3.5, BR2_DOOR_GAP);
  attachRealDoor('Pintu Balkoni', -3.5, BALC_DOOR_GAP);
  attachRealDoor('Pintu Bilik Utama', 2.5, MBR_DOOR_GAP);

  // Appliance meshes flagged as camera occluders (e.g. the cove-light soffit,
  // which sits right at the camera's indoor height clamp) join the walls/roof/
  // ceiling occlusion set so the camera pulls in instead of entering them.
  for (const a of appliances) {
    a.group.traverse((o) => { if (o.isMesh && o.userData.occludeCamera) occluders.push(o); });
  }

  // ---------- Player ----------
  const { player, rig } = await playerPromise; // already loading since startup
  scene.add(player);

  // ---------- Camera ----------
  const cam = createCameraController(camera, occluders, walls);
  cam.update(0, player.position);

  // ---------- Full scene warmup (prime everything before the player ever sees a frame) ----------
  // Like a AAA loading screen: get the whole level GPU-resident — every
  // texture uploaded, every mipmap generated, every shader (main-pass AND
  // shadow-pass) compiled — before spawning the player, instead of letting
  // any of that stream in live during play. Two gaps this closes that
  // compileAsync alone doesn't:
  //   1. compileAsync only compiles main-pass material programs; it never
  //      renders anything, so it never touches the moon's shadow depth
  //      material programs (WebGLShadowMap compiles those on demand, per
  //      mesh, the first time an actual shadow pass draws it).
  //   2. Textures upload to the GPU lazily, the first time a mesh is actually
  //      drawn. Every prop (sofa, dining set, cabinets, TV cabinet, ...) uses
  //      normal frustum culling, so anything outside the spawn camera's
  //      initial view — which is most of the house, since the player spawns
  //      facing one direction — wouldn't upload its textures until the
  //      player later turned the camera toward it, causing a live stall.
  //
  // Fix: temporarily disable frustum culling on every mesh, render a couple
  // of throwaway frames (forces every mesh to draw at least once — main pass
  // uploads its textures, shadow pass compiles the moon's depth materials
  // against it), then restore each mesh's real culling flag before the
  // player ever sees a frame.
  enforceLightBudget(appliances, player.position, roomKeyAt(player.position), doors);
  const __cullState = [];
  scene.traverse((o) => {
    if (o.isMesh) { __cullState.push([o, o.frustumCulled]); o.frustumCulled = false; }
  });
  renderer.render(scene, camera);
  renderer.render(scene, camera); // second pass: forces any async-queued GPU work from the first to actually finish
  for (const [o, wasculled] of __cullState) o.frustumCulled = wasculled;

  await renderer.compileAsync(scene, camera);
  loaderBar.style.width = '100%';
  loaderEl.classList.add('hidden');

  // ---------- Minimap & HUD ----------
  const minimap = createMinimap({ walls, appliances });
  const hud = createHud();
  hud.setTotal(appliances.length);

  // ---------- Game state & interaction ----------
  let gameOver = false;
  const gameStart = performance.now();
  let interactTarget = null;

  function interact(target) {
    if (!target) return;
    // Toggle only once the reach animation actually gets there, not the instant E is pressed.
    rig.playEmote('reach', () => {
      if (target.type === 'door') toggleDoor(target);
      else if (target.on) toggleOff(target);
    });
  }
  function toggleOff(a) {
    turnOffAppliance(a);
    clickSound();
  }
  function toggleDoor(d) {
    d.open = !d.open;
    // Move the collider to match: blocks the doorway when closed, blocks the
    // swung-open leaf when open (so you can pass the doorway but not the panel).
    const b = d.open ? d.openBounds : d.closedBounds;
    d.collider.minX = b.minX; d.collider.maxX = b.maxX;
    d.collider.minZ = b.minZ; d.collider.maxZ = b.maxZ;
    clickSound();
  }

  // ---------- Input ----------
  const { keys } = setupDesktopControls(renderer.domElement, cam, {
    onInteract: () => interact(interactTarget),
    isGameOver: () => gameOver,
  });
  const { joy } = setupTouchControls(renderer.domElement, cam, {
    onInteract: () => interact(interactTarget),
  });

  // ---------- Loop ----------
  const clock = new THREE.Clock();
  const tmpForward = new THREE.Vector3();
  const tmpRight = new THREE.Vector3();
  const tmpMove = new THREE.Vector3();

  function step() {
    const dt = Math.min(0.05, clock.getDelta());

    if (!gameOver) {
      // Arrow keys orbit the camera (desktop); same sign convention as mouse drag
      const camKey = 1.9 * dt;
      if (keys['ArrowLeft'])  cam.applyLook(camKey, 0);
      if (keys['ArrowRight']) cam.applyLook(-camKey, 0);
      if (keys['ArrowUp'])    cam.applyLook(0, -camKey); // non-inverted: up -> look up
      if (keys['ArrowDown'])  cam.applyLook(0, camKey);

      // Player movement, camera-relative on XZ
      tmpForward.set(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw));
      tmpRight.set(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw));
      tmpMove.set(0, 0, 0);
      // While the reach (E-interact) emote is playing, freeze walk/run entirely
      // so the character stands still and commits to the door/appliance action
      // instead of sliding across the floor mid-reach.
      if (!rig.isBusy() && joy.active) {
        // Analog joystick (mobile): forward = joy.y, strafe = joy.x. Takes
        // precedence over keys so the two inputs never fight on hybrid devices.
        tmpMove.addScaledVector(tmpForward, joy.y);
        tmpMove.addScaledVector(tmpRight, joy.x);
      } else if (!rig.isBusy()) {
        if (keys['KeyW']) tmpMove.add(tmpForward);
        if (keys['KeyS']) tmpMove.sub(tmpForward);
        if (keys['KeyD']) tmpMove.add(tmpRight);
        if (keys['KeyA']) tmpMove.sub(tmpRight);
      }
      const len = tmpMove.length();
      const moving = len > 0.06;
      const running = moving && (keys['ShiftLeft'] || keys['ShiftRight']);
      if (moving) {
        // Clamp magnitude to 1 (keeps analog speed; caps diagonal keyboard input)
        if (len > 1) tmpMove.multiplyScalar(1 / len);
        tmpMove.multiplyScalar((running ? 5.0 : 1.5) * dt);
        // Move on X, then Z, collide after each (cleaner sliding)
        player.position.x += tmpMove.x;
        collide(colliders, player.position, PLAYER_RADIUS);
        player.position.z += tmpMove.z;
        collide(colliders, player.position, PLAYER_RADIUS);

        const targetYaw = Math.atan2(tmpMove.x, tmpMove.z);
        let diff = targetYaw - player.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        player.rotation.y += diff * Math.min(1, dt * 14);

      }
      rig.update(dt, moving, running); // blends idle↔walk↔run; eases back to idle

      // Tick appliance behaviors (spin, emissive, etc.)
      tickAppliances(appliances, dt);
      enforceLightBudget(appliances, player.position, roomKeyAt(player.position), doors);

      // Animate doors toward their open/closed angle
      for (const dr of doors) {
        const target = dr.open ? dr.openAngle : dr.closedAngle;
        dr.group.rotation.y += (target - dr.group.rotation.y) * Math.min(1, dt * 10);
      }

      // Nearest interactable (XZ distance) — appliances that are on, plus doors
      let nearest = null;
      let nearestDist = 1.8;
      for (const a of appliances) {
        if (!a.on) continue;
        const dx = a.group.position.x - player.position.x;
        const dz = a.group.position.z - player.position.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < nearestDist) { nearestDist = d; nearest = a; }
      }
      for (const dr of doors) {
        const dx = dr.ix - player.position.x;
        const dz = dr.iz - player.position.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < nearestDist) { nearestDist = d; nearest = dr; }
      }
      interactTarget = nearest;
      if (nearest) {
        hud.showPrompt(nearest.type === 'door'
          ? (nearest.open ? ' Tutup pintu' : ' Buka pintu')
          : ` Tutup ${nearest.name}`);
      } else {
        hud.hidePrompt();
      }

      // HUD numbers
      const remaining = appliances.filter(a => a.on).length;
      hud.setOffCount(appliances.length - remaining);
      const elapsed = (performance.now() - gameStart) / 1000;
      hud.setTimer(formatTime(elapsed));
      hud.setRoom(currentRoomName(player.position));
      minimap.update(player, cam.yaw);

      if (remaining === 0) {
        gameOver = true;
        rig.playEmote('victory');
        hud.showWin(formatTime(elapsed));
        document.body.classList.add('gameover'); // hides #touch via CSS
        document.exitPointerLock?.();             // free the cursor for the button
      }
    } else {
      rig.update(dt, false); // keep the mixer running so the victory emote plays out
    }

    // Camera follow with raycast occlusion (never leaves the house)
    cam.update(dt, player.position);

    renderer.render(scene, camera);
    nerdStats.frame();
    requestAnimationFrame(step);
  }
  step();
})();
