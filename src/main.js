import * as THREE from 'three';
import { buildHouse, ROOMS } from './house.js';
import { createAppliances } from './appliances.js';

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
const { walls, wallMeshes } = buildHouse(scene);

// ---------- Appliances ----------
const appliances = createAppliances(scene);
document.getElementById('total').textContent = appliances.length;

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

// ---------- Input ----------
const keys = {};
addEventListener('keydown', e => { keys[e.code] = true; });
addEventListener('keyup', e => { keys[e.code] = false; });

let dragging = false, lastMX = 0, lastMY = 0;
renderer.domElement.addEventListener('mousedown', e => {
  dragging = true;
  lastMX = e.clientX;
  lastMY = e.clientY;
});
addEventListener('mouseup', () => { dragging = false; });
addEventListener('mouseleave', () => { dragging = false; });
addEventListener('mousemove', e => {
  if (!dragging) return;
  camYaw -= (e.clientX - lastMX) * 0.005;
  camPitch -= (e.clientY - lastMY) * 0.005;
  camPitch = Math.max(0.12, Math.min(1.25, camPitch));
  lastMX = e.clientX;
  lastMY = e.clientY;
});
renderer.domElement.addEventListener('wheel', e => {
  camDistDesired += Math.sign(e.deltaY) * 0.5;
  camDistDesired = Math.max(2.5, Math.min(10, camDistDesired));
  e.preventDefault();
}, { passive: false });
// avoid drag-selecting on the canvas
renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

let interactTarget = null;
addEventListener('keydown', e => {
  if (e.code === 'KeyE' && interactTarget && interactTarget.on) {
    toggleOff(interactTarget);
  }
});

// ---------- Touch controls (mobile) ----------
const joy = { active: false, x: 0, y: 0 };
const interactBtn = document.getElementById('interact');

if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) {
  document.body.classList.add('touch');
  // Start a bit further out so the player fits a small screen
  camDistDesired = 7;
}

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
  if (interactTarget && interactTarget.on) toggleOff(interactTarget);
}, { passive: false });

// --- Drag-to-look + pinch-to-zoom on the canvas ---
let lookId = null, lookX = 0, lookY = 0;
let pinchStartDist = 0, pinchStartCam = 0;

const cv = renderer.domElement;
cv.addEventListener('touchstart', e => {
  e.preventDefault();
  if (e.touches.length === 2) {
    const [a, b] = e.touches;
    pinchStartDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    pinchStartCam = camDistDesired;
    lookId = null;
  } else if (lookId === null) {
    const t = e.changedTouches[0];
    lookId = t.identifier; lookX = t.clientX; lookY = t.clientY;
  }
}, { passive: false });
cv.addEventListener('touchmove', e => {
  e.preventDefault();
  if (e.touches.length === 2 && pinchStartDist > 0) {
    const [a, b] = e.touches;
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    camDistDesired = Math.max(2.5, Math.min(11, pinchStartCam * (pinchStartDist / d)));
    return;
  }
  for (const t of e.changedTouches) {
    if (t.identifier === lookId) {
      camYaw -= (t.clientX - lookX) * 0.006;
      camPitch -= (t.clientY - lookY) * 0.006;
      camPitch = Math.max(0.12, Math.min(1.25, camPitch));
      lookX = t.clientX; lookY = t.clientY;
    }
  }
}, { passive: false });
function endLook(e) {
  for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null;
  if (e.touches.length < 2) pinchStartDist = 0;
}
cv.addEventListener('touchend', endLook, { passive: false });
cv.addEventListener('touchcancel', endLook, { passive: false });

// ---------- Web Audio click ----------
let audioCtx = null;
function clickSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
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
  a.on = false;
  a.indicator.visible = false;
  if (a.light) a.light.visible = false;
  if (a.screen) {
    a.screen.emissiveIntensity = 0;
    a.screen.color.setHex(0x0a0a0a);
    a.screen.needsUpdate = true;
  }
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
  for (const w of walls) {
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
    // Player movement, camera-relative on XZ
    tmpForward.set(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    tmpRight.set(Math.cos(camYaw), 0, -Math.sin(camYaw));
    tmpMove.set(0, 0, 0);
    if (keys['KeyW'] || keys['ArrowUp'])    tmpMove.add(tmpForward);
    if (keys['KeyS'] || keys['ArrowDown'])  tmpMove.sub(tmpForward);
    if (keys['KeyD'] || keys['ArrowRight']) tmpMove.add(tmpRight);
    if (keys['KeyA'] || keys['ArrowLeft'])  tmpMove.sub(tmpRight);
    // Analog joystick (mobile): forward = joy.y, strafe = joy.x
    if (joy.active) {
      tmpMove.addScaledVector(tmpForward, joy.y);
      tmpMove.addScaledVector(tmpRight, joy.x);
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

    // Spin fans
    for (const a of appliances) {
      if (a.on && a.spinTarget) {
        a.spinTarget.rotation.y += dt * a.spinSpeed;
      }
    }

    // Nearest interactable (XZ distance)
    let nearest = null;
    let nearestDist = 1.8;
    for (const a of appliances) {
      if (!a.on) continue;
      const dx = a.group.position.x - player.position.x;
      const dz = a.group.position.z - player.position.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < nearestDist) { nearestDist = d; nearest = a; }
    }
    interactTarget = nearest;
    if (nearest) {
      promptEl.style.display = 'block';
      promptTextEl.textContent = ` Tutup ${nearest.name}`;
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

    if (remaining === 0) {
      gameOver = true;
      frozenTime = elapsed;
      winTimeEl.textContent = formatTime(elapsed);
      winEl.style.display = 'flex';
      document.getElementById('touch').style.display = 'none';
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
  const hits = raycaster.intersectObjects(wallMeshes, false);
  if (hits.length && hits[0].distance < dist) {
    dist = Math.max(1.5, hits[0].distance - 0.25);
  }
  camDistCurrent += (dist - camDistCurrent) * Math.min(1, dt * 12);
  camera.position.copy(tmpHead).addScaledVector(tmpDir, camDistCurrent);
  camera.lookAt(tmpHead);

  renderer.render(scene, camera);
  requestAnimationFrame(step);
}
step();
