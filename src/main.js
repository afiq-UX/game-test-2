import * as THREE from 'three';
import { buildHouse } from './house.js';
import { createMinimap } from './minimap.js';
import './geometries/index.js';
import { ApplianceConfigs } from './configs/appliances.js';
import { createAllAppliances, tickAppliances, turnOffAppliance } from './factory/ApplianceFactory.js';
import { detectQuality, getQualityConfig, enforceLightBudget } from './systems/QualitySystem.js';
import { preloadModels } from './systems/ModelLoader.js';
import { preloadCafeStool, getCafeStoolTemplate, preloadKitchenCabinets, getKitchenCabinets, getFridgeNookWorldPos, preloadKitchenCounter, getKitchenCounter, preloadDiningTableSet, getDiningTableSet, preloadCupboard, getCupboard } from './systems/PropLoader.js';
import { createPlayer, PLAYER_RADIUS } from './player.js';
import { createCameraController } from './cameraController.js';
import { collide } from './collision.js';
import { createHud, formatTime, currentRoomName } from './hud.js';
import { clickSound } from './audio.js';
import { setupDesktopControls, setupTouchControls } from './controls.js';

detectQuality();
const quality = getQualityConfig();

// ---------- Scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070912);
scene.fog = new THREE.Fog(0x070912, 22, 55);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, quality.maxPixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = quality.toneMappingExposure;
document.body.appendChild(renderer.domElement);

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
for (const d of doors) occluders.push(d.leaf); // closed door blocks the view; open leaf swings aside

// ---------- Model preload ----------
const loaderEl = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const modelNames = [...new Set(ApplianceConfigs.map(c => c.geometry))];
loaderBar.style.width = '30%';

// Ceiling-mounted fixtures (fans, ceiling lights, cove lighting) sit well
// above head height — the player walks under them, so they're excluded from
// floor collision. Everything else (screens, lamps, gadgets, big appliances)
// sits at a height a walking player would actually bump into.
const CEILING_KINDS = new Set(['fan-light', 'ceiling-light', 'cove-light']);

// Add a floor collider spanning an object's actual XZ footprint (computed
// from its real geometry rather than hand-guessed dimensions).
function addBoxCollider(object3D) {
  object3D.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object3D);
  colliders.push({ minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z });
}

(async () => {
  await Promise.all([preloadModels(modelNames), preloadCafeStool(), preloadKitchenCabinets(), preloadKitchenCounter(), preloadDiningTableSet(), preloadCupboard()]);
  loaderBar.style.width = '100%';
  loaderEl.classList.add('hidden');

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
    addBoxCollider(cabinets);

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

  // ---------- Cupboard — against the kitchen's north wall (solid segment at
  // x -15..-13.125, west of the pass-through gap), by the counter's left end
  // where the overhang used to be. Best-effort spot per feedback — check
  // once visible. ----------
  const cupboard = getCupboard();
  if (cupboard) {
    cupboard.position.x = -14;
    cupboard.position.z = 6;
    scene.add(cupboard);
    addBoxCollider(cupboard);
  }

  // Appliance meshes flagged as camera occluders (e.g. the cove-light soffit,
  // which sits right at the camera's indoor height clamp) join the walls/roof/
  // ceiling occlusion set so the camera pulls in instead of entering them.
  for (const a of appliances) {
    a.group.traverse((o) => { if (o.isMesh && o.userData.occludeCamera) occluders.push(o); });
  }

  // ---------- Player ----------
  const { player, rig } = await createPlayer();
  scene.add(player);

  // ---------- Minimap & HUD ----------
  const minimap = createMinimap({ walls, appliances });
  const hud = createHud();
  hud.setTotal(appliances.length);

  // ---------- Camera ----------
  const cam = createCameraController(camera, occluders, walls);

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
      enforceLightBudget(appliances, player.position);

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
    requestAnimationFrame(step);
  }
  step();
})();
