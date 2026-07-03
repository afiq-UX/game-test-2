// viewerMain.js — standalone asset inspector. Loads one appliance geometry at a
// time (real GLB if present, else parametric fallback) in an empty studio scene
// with orbit controls, so models can be judged without hunting them down in the
// dim house. Not part of the shipped game (viewer.html is a separate Vite entry).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './geometries/index.js';
import { createGeometry } from './systems/GeometrySystem.js';
import { preloadModels } from './systems/ModelLoader.js';
import { ApplianceConfigs } from './configs/appliances.js';

// One entry per unique geometry type, remembering a representative config for its materials map.
const byType = new Map();
for (const c of ApplianceConfigs) {
  if (!byType.has(c.geometry)) byType.set(c.geometry, c);
}
const entries = [...byType.values()].sort((a, b) => a.geometry.localeCompare(b.geometry));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1b1d24);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.01, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- Ground + grid (scale reference: 0.5m squares) ----------
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x2a2c34, roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const grid = new THREE.GridHelper(20, 40, 0x4a4d58, 0x33353e);
scene.add(grid);

// ---------- Lighting rigs ----------
const studioRig = new THREE.Group();
{
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2, 3, 2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  const fill = new THREE.DirectionalLight(0xbcd4ff, 0.5);
  fill.position.set(-2, 1.5, -1);
  const rim = new THREE.DirectionalLight(0xffe8c0, 0.6);
  rim.position.set(-1, 2, -3);
  const amb = new THREE.AmbientLight(0xffffff, 0.35);
  studioRig.add(key, fill, rim, amb);
}
const houseRig = new THREE.Group();
{
  const amb = new THREE.AmbientLight(0xaab4d4, 0.22);
  const moon = new THREE.DirectionalLight(0xc6d4ff, 0.55);
  moon.position.set(12, 22, 8);
  moon.castShadow = true;
  houseRig.add(amb, moon);
}
scene.add(studioRig);

document.getElementById('litStudio').addEventListener('click', (e) => {
  scene.remove(houseRig); scene.add(studioRig);
  setActiveBtn(e.target);
});
document.getElementById('litHouse').addEventListener('click', (e) => {
  scene.remove(studioRig); scene.add(houseRig);
  setActiveBtn(e.target);
});
function setActiveBtn(btn) {
  document.querySelectorAll('#panel .btnRow button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ---------- Model swap ----------
// Target bounding-sphere radius (world units) the camera rig is tuned for.
// Framing degrades for objects far outside this regime (very small radii put
// the near/far/target math in a precision-sensitive zone), so every model is
// uniformly re-scaled to fit it before framing. True in-game size is shown
// separately in the stats panel — this scaling only affects the viewer.
const TARGET_RADIUS = 1.2;

let current = null;
function loadType(type) {
  if (current) { scene.remove(current); current = null; }
  const config = byType.get(type);
  const { meshes, meta } = createGeometry(type, config.materials || {}, config);
  const group = new THREE.Group();
  for (const m of meshes) group.add(m);
  group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // Apply the appliance's real in-game scale (e.g. ceiling fans are modeled at
  // 1/4 size and multiplied by 4 in ApplianceFactory) before measuring true size.
  const gameScale = config.scale ?? 1;
  group.scale.setScalar(gameScale);
  scene.add(group);
  current = group;
  group.updateMatrixWorld(true);

  const trueBox = new THREE.Box3().setFromObject(group);
  const trueSize = trueBox.getSize(new THREE.Vector3());
  const trueRadius = Math.max(trueSize.length() * 0.5, 0.001);

  // Re-scale so every model presents the same bounding radius to the camera rig.
  group.scale.multiplyScalar(TARGET_RADIUS / trueRadius);
  group.updateMatrixWorld(true);

  // Ceiling-mounted models hang downward from their origin — below the opaque
  // ground plane. Lift every model so its bounding-box bottom rests on the grid.
  const lift = new THREE.Box3().setFromObject(group);
  group.position.y -= lift.min.y;
  group.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const radius = TARGET_RADIUS;
  camera.near = radius * 0.02;
  camera.far = radius * 50;
  camera.position.set(center.x + radius * 1.4, center.y + radius * 0.9, center.z + radius * 1.6);
  camera.lookAt(center);
  camera.updateProjectionMatrix();

  controls.dispose();
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.copy(center);
  controls.update();

  // Stats
  let meshCount = 0, triCount = 0;
  group.traverse(o => {
    if (o.isMesh) {
      meshCount++;
      const pos = o.geometry?.attributes?.position;
      const idx = o.geometry?.index;
      triCount += idx ? idx.count / 3 : (pos ? pos.count / 3 : 0);
    }
  });
  document.getElementById('src').textContent = meta.source === 'glb' ? 'GLB' : 'parametric';
  document.getElementById('meshCount').textContent = meshCount;
  document.getElementById('triCount').textContent = Math.round(triCount);
  document.getElementById('trueSize').textContent =
    `${trueSize.x.toFixed(2)} × ${trueSize.y.toFixed(2)} × ${trueSize.z.toFixed(2)}`;
}

// ---------- UI ----------
const select = document.getElementById('pick');
for (const c of entries) {
  const opt = document.createElement('option');
  opt.value = c.geometry;
  opt.textContent = `${c.geometry} — ${c.name}`;
  select.appendChild(opt);
}
select.addEventListener('change', () => loadType(select.value));

// ---------- Boot ----------
const modelNames = [...new Set(ApplianceConfigs.map(c => c.geometry))];
await preloadModels(modelNames);
loadType(entries[0].geometry);
select.value = entries[0].geometry;

function step() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(step);
}
step();
