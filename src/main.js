import * as THREE from 'three';
import { buildHouse, ROOMS } from './house.js';
import { createMinimap } from './minimap.js';
import './geometries/index.js';
import { ApplianceConfigs } from './configs/appliances.js';
import { createAllAppliances, tickAppliances, turnOffAppliance } from './factory/ApplianceFactory.js';
import { detectQuality, enforceLightBudget } from './systems/QualitySystem.js';
import { preloadModels } from './systems/ModelLoader.js';

detectQuality();

// ---------- Scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070912);
scene.fog = new THREE.Fog(0x070912, 22, 55);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
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
moon.shadow.mapSize.set(1024, 1024);
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 70;
moon.shadow.camera.left = -25;
moon.shadow.camera.right = 25;
moon.shadow.camera.top = 25;
moon.shadow.camera.bottom = -25;
moon.shadow.bias = -0.0005;
scene.add(moon);

// ---------- House ----------
const { walls, wallMeshes, furniture, roof, doors, ceiling } = buildHouse(scene);
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
await preloadModels(modelNames);
loaderBar.style.width = '100%';
loaderEl.classList.add('hidden');

// ---------- Appliances ----------
const appliances = createAllAppliances(scene, ApplianceConfigs);
document.getElementById('total').textContent = appliances.length;

// ---------- Minimap (always-on, top-right) ----------
const minimap = createMinimap({ walls, appliances });

// ---------- Player ----------
const player = new THREE.Group();
const playerBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.28, 0.32, 0.85, 16),
  new THREE.MeshStandardMaterial({ color: 0x2f5fa8, roughness: 0.8 })
);
playerBody.position.y = 0.5;
playerBody.castShadow = true;

const playerHead = new THREE.Mesh(
  new THREE.SphereGeometry(0.22, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xf4c39b, roughness: 0.7 })
);
playerHead.position.y = 1.12;
playerHead.castShadow = true;

const hair = new THREE.Mesh(
  new THREE.SphereGeometry(0.235, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.1),
  new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
);
hair.position.y = 1.16;
hair.castShadow = true;

// Tiny "nose" so we can see which way the kid faces
const nose = new THREE.Mesh(
  new THREE.ConeGeometry(0.04, 0.08, 8),
  new THREE.MeshStandardMaterial({ color: 0xe8a878 })
);
nose.position.set(0, 1.1, 0.21);
nose.rotation.x = Math.PI / 2;

player.add(playerBody, playerHead, hair, nose);
player.position.set(0, 0, 4);
player.rotation.y = 0; // facing north (toward TV)
scene.add(player);
const PLAYER_RADIUS = 0.32;

// ---------- Camera state ----------
let camYaw = 0;     // 0 = looking north (-Z)
let camPitch = 0.45;
let camDistDesired = 5.5;
let camDistCurrent = 5.5;
const CAM_DIST_MIN = 2.5;
const CAM_DIST_MAX = 11;   // shared by wheel (desktop) and pinch (mobile)

// ---------- Input ----------
const keys = {};
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code.startsWith('Arrow')) e.preventDefault(); // arrows drive the camera, not page scroll
});
addEventListener('keyup', e => { keys[e.code] = false; });

// Mouse look: just MOVE the mouse to turn the camera — no dragging.
// Clicking the scene captures the pointer (Pointer Lock) so you can keep
// turning past the window edge; Esc releases it. movementX/Y is delta-based,
// so look also works before/without a lock (until the cursor hits an edge).
const LOOK_SENS = 0.0026;
const cvEl = renderer.domElement;
cvEl.addEventListener('click', () => {
  if (document.pointerLockElement !== cvEl) cvEl.requestPointerLock?.();
});
addEventListener('mousemove', e => {
  if (gameOver) return;
  const dx = e.movementX || 0;
  const dy = e.movementY || 0;
  camYaw -= dx * LOOK_SENS;
  camPitch += dy * LOOK_SENS; // non-inverted: move mouse up -> look up
  camPitch = Math.max(0.12, Math.min(1.25, camPitch));
});
renderer.domElement.addEventListener('wheel', e => {
  camDistDesired += Math.sign(e.deltaY) * 0.5;
  camDistDesired = Math.max(CAM_DIST_MIN, Math.min(CAM_DIST_MAX, camDistDesired));
  e.preventDefault();
}, { passive: false });
// avoid drag-selecting on the canvas
renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

let interactTarget = null;
function interact(target) {
  if (!target) return;
  if (target.type === 'door') toggleDoor(target);
  else if (target.on) toggleOff(target);
}
addEventListener('keydown', e => {
  if (e.code === 'KeyE') interact(interactTarget);
});

// ---------- Touch controls (mobile) ----------
const joy = { active: false, x: 0, y: 0 };
const interactBtn = document.getElementById('interact');

// Enable touch UI when the PRIMARY pointer is coarse (real phones/tablets) — not
// merely when a touchscreen exists, which would wrongly show the joystick on
// mouse-primary touch laptops. Also enable on the first real touchstart as a
// fallback for devices that mis-report their pointer capabilities.
function enableTouchUI() {
  if (document.body.classList.contains('touch')) return;
  document.body.classList.add('touch');
  camDistDesired = 7; // start further out so the player fits a small screen
}
if (window.matchMedia('(pointer: coarse)').matches) enableTouchUI();
addEventListener('touchstart', enableTouchUI, { once: true, passive: true });

// --- Virtual joystick ---
const joyEl = document.getElementById('joy');
const joyNub = document.getElementById('joyNub');
const JOY_R = 50; // px travel radius
let joyId = null;

function joySet(cx, cy, tx, ty) {
  let dx = tx - cx, dy = ty - cy;
  const d = Math.hypot(dx, dy);
  if (d > JOY_R) { dx *= JOY_R / d; dy *= JOY_R / d; }
  joyNub.style.transform = `translate(${dx}px, ${dy}px)`;
  joy.x = dx / JOY_R;
  joy.y = -dy / JOY_R; // screen up = forward
  joy.active = true;
}
function joyReset() {
  joy.active = false; joy.x = 0; joy.y = 0; joyId = null;
  joyNub.style.transform = 'translate(0,0)';
  joyNub.style.background = 'rgba(255,255,255,0.32)';
}
joyEl.addEventListener('touchstart', e => {
  e.preventDefault();
  if (joyId !== null) return; // first finger keeps ownership until it lifts
  const t = e.changedTouches[0];
  joyId = t.identifier;
  const r = joyEl.getBoundingClientRect();
  joySet(r.left + r.width / 2, r.top + r.height / 2, t.clientX, t.clientY);
  joyNub.style.background = 'rgba(255,255,255,0.5)';
}, { passive: false });
joyEl.addEventListener('touchmove', e => {
  e.preventDefault();
  const r = joyEl.getBoundingClientRect();
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) {
      joySet(r.left + r.width / 2, r.top + r.height / 2, t.clientX, t.clientY);
    }
  }
}, { passive: false });
joyEl.addEventListener('touchend', e => {
  for (const t of e.changedTouches) if (t.identifier === joyId) joyReset();
}, { passive: false });
joyEl.addEventListener('touchcancel', joyReset);

// --- Interact button ---
interactBtn.addEventListener('touchstart', e => {
  e.preventDefault();
  interact(interactTarget);
}, { passive: false });

// --- Drag-to-look + pinch-to-zoom on the canvas ---
// We track ONLY touches that started on the canvas (canvasTouches). Using the
// global e.touches here would wrongly count a finger resting on the joystick or
// interact button, so a one-finger look + held joystick was misread as a pinch.
const cv = renderer.domElement;
const canvasTouches = new Map(); // identifier -> { x, y }
let lookId = null, lookX = 0, lookY = 0;
let pinchStartDist = 0, pinchStartCam = 0;

function pinchPair() {
  const ids = [...canvasTouches.keys()];
  if (ids.length < 2) return null;
  return [canvasTouches.get(ids[0]), canvasTouches.get(ids[1])];
}
function beginPinch() {
  const p = pinchPair();
  if (!p) return;
  pinchStartDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  pinchStartCam = camDistDesired;
  lookId = null; // pinch suspends look
}
function beginLook(id) {
  const t = canvasTouches.get(id);
  if (!t) return;
  lookId = id; lookX = t.x; lookY = t.y;
}

cv.addEventListener('touchstart', e => {
  e.preventDefault();
  for (const t of e.changedTouches) canvasTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
  if (canvasTouches.size >= 2) beginPinch();
  else if (lookId === null) beginLook(e.changedTouches[0].identifier);
}, { passive: false });

cv.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (canvasTouches.has(t.identifier)) canvasTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
  }
  // Pinch: two canvas-owned fingers
  if (canvasTouches.size >= 2 && pinchStartDist > 0) {
    const p = pinchPair();
    const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    if (d > 0) camDistDesired = Math.max(CAM_DIST_MIN, Math.min(CAM_DIST_MAX, pinchStartCam * (pinchStartDist / d)));
    return;
  }
  // Look: drag the tracked look finger
  if (lookId === null) return;
  for (const t of e.changedTouches) {
    if (t.identifier === lookId) {
      camYaw -= (t.clientX - lookX) * 0.006;
      camPitch += (t.clientY - lookY) * 0.006; // non-inverted: drag up -> look up
      camPitch = Math.max(0.12, Math.min(1.25, camPitch));
      lookX = t.clientX; lookY = t.clientY;
    }
  }
}, { passive: false });

function endCanvasTouch(e) {
  for (const t of e.changedTouches) canvasTouches.delete(t.identifier);
  if (canvasTouches.size < 2) {
    pinchStartDist = 0;
    // If a pinch (or a lifted look finger) degraded to one canvas finger,
    // hand that finger control of look so drag-to-look resumes without a re-tap.
    if (canvasTouches.size === 1) beginLook(canvasTouches.keys().next().value);
    else lookId = null;
  }
}
cv.addEventListener('touchend', endCanvasTouch, { passive: false });
cv.addEventListener('touchcancel', endCanvasTouch, { passive: false });

// ---------- Web Audio click ----------
let audioCtx = null;
function clickSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
    // iOS/Safari starts (and can re-suspend) the context; resume inside the user gesture
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.07);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) { /* ignore */ }
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

// ---------- HUD ----------
const countEl = document.getElementById('count');
const promptEl = document.getElementById('prompt');
const promptTextEl = document.getElementById('promptText');
const timerEl = document.getElementById('timer');
const roomEl = document.getElementById('room');
const winEl = document.getElementById('win');
const winTimeEl = document.getElementById('winTime');
document.getElementById('restart').addEventListener('click', () => location.reload());

const gameStart = performance.now();
let gameOver = false;
let frozenTime = 0;

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function currentRoomName(pos) {
  for (const [key, r] of Object.entries(ROOMS)) {
    if (pos.x > r.xMin && pos.x < r.xMax && pos.z > r.zMin && pos.z < r.zMax) return r.name;
  }
  return 'Luar rumah';
}

// ---------- Collision ----------
function collide(pos, radius) {
  for (const w of colliders) {
    if (w.active === false) continue; // open door — passable
    const cx = Math.max(w.minX, Math.min(pos.x, w.maxX));
    const cz = Math.max(w.minZ, Math.min(pos.z, w.maxZ));
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < radius * radius) {
      const d = Math.sqrt(d2) || 0.0001;
      pos.x = cx + (dx / d) * radius;
      pos.z = cz + (dz / d) * radius;
    }
  }
}

// Keep the camera inside the building so it can never go through / see past a
// wall. Clamps to the outer envelope while indoors, then pushes it out of any
// structural wall it lands in (at wall height). Only walls — not low furniture,
// which the camera flies safely above.
const HOUSE_X = 15, HOUSE_Z = 12, WALL_TOP = 3.0, CAM_WALL_R = 0.3;
function clampCameraInside(cam, p) {
  if (p.x > -HOUSE_X && p.x < HOUSE_X && p.z > -HOUSE_Z && p.z < HOUSE_Z) {
    const m = 0.3;
    cam.x = Math.max(-HOUSE_X + m, Math.min(HOUSE_X - m, cam.x));
    cam.z = Math.max(-HOUSE_Z + m, Math.min(HOUSE_Z - m, cam.z));
    if (cam.y > 2.85) cam.y = 2.85; // stay under the ceiling (no peeking over walls)
  }
  if (cam.y < WALL_TOP) {
    for (const w of walls) {
      const cx = Math.max(w.minX, Math.min(cam.x, w.maxX));
      const cz = Math.max(w.minZ, Math.min(cam.z, w.maxZ));
      const dx = cam.x - cx, dz = cam.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < CAM_WALL_R * CAM_WALL_R) {
        const d = Math.sqrt(d2) || 0.0001;
        cam.x = cx + (dx / d) * CAM_WALL_R;
        cam.z = cz + (dz / d) * CAM_WALL_R;
      }
    }
  }
}

// ---------- Loop ----------
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const tmpForward = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const tmpMove = new THREE.Vector3();
const tmpDir = new THREE.Vector3();
const tmpHead = new THREE.Vector3();

let walkPhase = 0;

function step() {
  const dt = Math.min(0.05, clock.getDelta());

  if (!gameOver) {
    // Arrow keys orbit the camera (desktop); same sign convention as mouse drag
    const camKey = 1.9 * dt;
    if (keys['ArrowLeft'])  camYaw += camKey;
    if (keys['ArrowRight']) camYaw -= camKey;
    if (keys['ArrowUp'])    camPitch -= camKey; // non-inverted: up -> look up
    if (keys['ArrowDown'])  camPitch += camKey;
    camPitch = Math.max(0.12, Math.min(1.25, camPitch));

    // Player movement, camera-relative on XZ
    tmpForward.set(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    tmpRight.set(Math.cos(camYaw), 0, -Math.sin(camYaw));
    tmpMove.set(0, 0, 0);
    if (joy.active) {
      // Analog joystick (mobile): forward = joy.y, strafe = joy.x. Takes
      // precedence over keys so the two inputs never fight on hybrid devices.
      tmpMove.addScaledVector(tmpForward, joy.y);
      tmpMove.addScaledVector(tmpRight, joy.x);
    } else {
      if (keys['KeyW']) tmpMove.add(tmpForward);
      if (keys['KeyS']) tmpMove.sub(tmpForward);
      if (keys['KeyD']) tmpMove.add(tmpRight);
      if (keys['KeyA']) tmpMove.sub(tmpRight);
    }
    const len = tmpMove.length();
    const moving = len > 0.06;
    if (moving) {
      // Clamp magnitude to 1 (keeps analog speed; caps diagonal keyboard input)
      if (len > 1) tmpMove.multiplyScalar(1 / len);
      tmpMove.multiplyScalar(4.2 * dt);
      // Move on X, then Z, collide after each (cleaner sliding)
      player.position.x += tmpMove.x;
      collide(player.position, PLAYER_RADIUS);
      player.position.z += tmpMove.z;
      collide(player.position, PLAYER_RADIUS);

      const targetYaw = Math.atan2(tmpMove.x, tmpMove.z);
      let diff = targetYaw - player.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      player.rotation.y += diff * Math.min(1, dt * 14);

      walkPhase += dt * 11;
      playerBody.position.y = 0.5 + Math.abs(Math.sin(walkPhase)) * 0.05;
    } else {
      playerBody.position.y += (0.5 - playerBody.position.y) * Math.min(1, dt * 10);
    }

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
      promptEl.style.display = 'block';
      promptTextEl.textContent = nearest.type === 'door'
        ? (nearest.open ? ' Tutup pintu' : ' Buka pintu')
        : ` Tutup ${nearest.name}`;
      interactBtn.classList.add('live');
    } else {
      promptEl.style.display = 'none';
      interactBtn.classList.remove('live');
    }

    // HUD numbers
    const remaining = appliances.filter(a => a.on).length;
    countEl.textContent = appliances.length - remaining;
    const elapsed = (performance.now() - gameStart) / 1000;
    timerEl.textContent = formatTime(elapsed);
    roomEl.textContent = currentRoomName(player.position);
    minimap.update(player, camYaw);

    if (remaining === 0) {
      gameOver = true;
      frozenTime = elapsed;
      winTimeEl.textContent = formatTime(elapsed);
      winEl.style.display = 'flex';
      document.body.classList.add('gameover'); // hides #touch via CSS
      document.exitPointerLock?.();             // free the cursor for the button
    }
  }

  // Camera follow with raycast occlusion
  tmpHead.copy(player.position);
  tmpHead.y += 1.15;
  tmpDir.set(
    Math.cos(camPitch) * Math.sin(camYaw),
    Math.sin(camPitch),
    Math.cos(camPitch) * Math.cos(camYaw),
  );
  let dist = camDistDesired;
  raycaster.set(tmpHead, tmpDir);
  raycaster.far = dist + 0.5;
  // Occlude against walls AND roof: tilting up / backing into a wall pulls the
  // camera in toward the player instead of clipping through (GTA/RDR2 style).
  // Low floor + bigger buffer so it stays IN FRONT of a near wall rather than
  // being forced past it.
  const hits = raycaster.intersectObjects(occluders, false);
  if (hits.length && hits[0].distance < dist) {
    dist = Math.max(0.4, hits[0].distance - 0.3);
  }
  camDistCurrent += (dist - camDistCurrent) * Math.min(1, dt * 12);
  camera.position.copy(tmpHead).addScaledVector(tmpDir, camDistCurrent);
  clampCameraInside(camera.position, player.position); // never leave the house
  camera.lookAt(tmpHead);

  renderer.render(scene, camera);
  requestAnimationFrame(step);
}
step();
