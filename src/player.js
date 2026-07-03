// player.js — skinned, bone-rigged kid character with a real mocap walk cycle.
// The character asset (Kid.glb) ships only Idle/sitting clips, so its native
// Idle is kept, and a Walk cycle is grafted on by retargeting Vanguard's real
// mocap Walk clip (Soldier.glb) onto the kid's identical Mixamo skeleton —
// see animRetarget.js. Both are skinned meshes deformed by a bone skeleton,
// so limbs bend and cloth/hair follow the bones instead of hinging like the
// old rigid-parts puppet.
//
// createPlayer() is async — it loads two GLBs — and resolves to { player, rig }:
//   player — root group; main.js drives position/rotation + collision
//   rig    — rig.update(dt, moving) advances the mixer and blends idle↔walk
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { retargetClip, collectBindQuaternions } from './animRetarget.js';

export const PLAYER_RADIUS = 0.28; // kid-sized

const CHARACTER_URL = '/models/char/Kid.glb';
const MOCAP_SOURCE_URL = '/models/char/Soldier.glb'; // retarget source only, never rendered
const TARGET_HEIGHT = 1.30;        // metres — a child, not the adult Vanguard proxy
const MODEL_FORWARD_Y = 0;         // yaw so the mesh's forward aligns with local +Z
const WALK_TIMESCALE = 1.15;       // matches the retargeted clip's stride to the 4.2 m/s glide
const BLEND_RATE = 9;              // idle↔walk weight blend speed (per second)

export async function createPlayer() {
  const player = new THREE.Group();
  player.position.set(0, 0, 4);
  player.rotation.y = 0;

  const loader = new GLTFLoader();
  const [kidGltf, mocapGltf] = await Promise.all([
    loader.loadAsync(CHARACTER_URL),
    loader.loadAsync(MOCAP_SOURCE_URL),
  ]);
  const model = kidGltf.scene;

  // Normalise height and drop feet to y=0.
  model.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  model.scale.setScalar(TARGET_HEIGHT / size.y);
  model.updateMatrixWorld(true);
  model.position.y -= new THREE.Box3().setFromObject(model).min.y;

  model.rotation.y = MODEL_FORWARD_Y;

  model.traverse((o) => {
    if (o.isMesh || o.isSkinnedMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false; // skinned bounds jitter; keep it drawn
    }
  });
  player.add(model);

  // ---- Animation ----
  const mixer = new THREE.AnimationMixer(model);

  const idleClip = kidGltf.animations.find((c) => /idle/i.test(c.name) && !/sitting/i.test(c.name));
  const idle = idleClip ? mixer.clipAction(idleClip) : null;

  // Bind (rest) pose per bone, captured before any animation has touched
  // either skeleton — required for retargeting across two rigs whose rest
  // poses don't match (see animRetarget.js).
  const targetBindQuats = collectBindQuaternions(model);
  const sourceBindQuats = collectBindQuaternions(mocapGltf.scene);

  const mocapWalk = mocapGltf.animations.find((c) => c.name === 'Walk');
  const { clip: walkClip, matched, total } = retargetClip(mocapWalk, sourceBindQuats, targetBindQuats, 'WalkRetargeted');
  if (matched < total * 0.8) {
    console.warn(`[player] walk retarget coverage low: ${matched}/${total} bones matched`);
  }
  const walk = mixer.clipAction(walkClip);
  walk.timeScale = WALK_TIMESCALE;

  for (const a of [idle, walk]) {
    if (!a) continue;
    a.enabled = true;
    a.setEffectiveWeight(0);
    a.play();
  }
  if (idle) idle.setEffectiveWeight(1);

  let wWalk = 0; // 0 = full idle, 1 = full walk
  const rig = {
    update(dt, moving) {
      wWalk += ((moving ? 1 : 0) - wWalk) * Math.min(1, dt * BLEND_RATE);
      if (idle) idle.setEffectiveWeight(1 - wWalk);
      walk.setEffectiveWeight(wWalk);
      mixer.update(dt);
    },
  };

  return { player, rig };
}
