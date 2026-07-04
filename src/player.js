// player.js — skinned, bone-rigged character (Aj.fbx) with native Mixamo
// animation clips. Each clip (Idle, Walk, Reaching Out, Victory) was exported
// from Mixamo for this exact rig, so tracks bind directly by bone name — no
// retargeting involved. Only rotation tracks are kept: the clips' position
// tracks carry root motion / hip heights in the source's own units, which
// would fight the model's normalised scale and slide the character around.
//
// createPlayer() is async — it loads the model + 4 animation FBXs — and
// resolves to { player, rig }:
//   player — root group; main.js drives position/rotation + collision
//   rig    — rig.update(dt, moving) advances the mixer and blends idle↔walk;
//            rig.playEmote('victory' | 'reach', onFinish) plays a one-shot
//            emote and calls onFinish when it completes — main.js triggers
//            'reach' on every E interaction (toggling the appliance/door
//            only once the hand actually reaches it) and 'victory' once all
//            appliances are off.
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export const PLAYER_RADIUS = 0.28; // kid-sized

const CHARACTER_URL = '/models/char/Aj.fbx';
const ANIM_URLS = {
  idle: '/models/char/anims/Idle.fbx',
  walk: '/models/char/anims/Walk.fbx',
  reach: '/models/char/anims/ReachingOut.fbx',
  victory: '/models/char/anims/Victory.fbx',
};
const TARGET_HEIGHT = 1.30;        // metres
const MODEL_FORWARD_Y = 0;         // yaw so the mesh's forward aligns with local +Z
const WALK_TIMESCALE = 1.15;       // matches the clip's stride to the movement glide speed
const REACH_TIMESCALE = 2;         // the source clip reads as a slow-motion reach otherwise
const BLEND_RATE = 9;              // idle↔walk weight blend speed (per second)

export async function createPlayer() {
  const player = new THREE.Group();
  player.position.set(0, 0, 4);
  player.rotation.y = 0;

  const loader = new FBXLoader();
  const [model, idleFbx, walkFbx, reachFbx, victoryFbx] = await Promise.all([
    loader.loadAsync(CHARACTER_URL),
    loader.loadAsync(ANIM_URLS.idle),
    loader.loadAsync(ANIM_URLS.walk),
    loader.loadAsync(ANIM_URLS.reach),
    loader.loadAsync(ANIM_URLS.victory),
  ]);

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

  // Pull the clip out of a Mixamo animation FBX and keep rotation tracks only.
  function actionFrom(fbx, name) {
    const src = fbx.animations.find((c) => c.tracks.length > 0);
    const tracks = src.tracks.filter((t) => t.name.endsWith('.quaternion'));
    return mixer.clipAction(new THREE.AnimationClip(name, src.duration, tracks));
  }

  const idle = actionFrom(idleFbx, 'Idle');
  const walk = actionFrom(walkFbx, 'Walk');
  const emotes = {
    victory: actionFrom(victoryFbx, 'Victory'),
    reach: actionFrom(reachFbx, 'Reach'),
  };
  walk.timeScale = WALK_TIMESCALE;
  emotes.reach.timeScale = REACH_TIMESCALE;

  for (const a of [idle, walk]) {
    a.enabled = true;
    a.setEffectiveWeight(0);
    a.play();
  }
  idle.setEffectiveWeight(1);

  for (const e of Object.values(emotes)) e.setLoop(THREE.LoopOnce);

  // 'reach' plays back out after finishing — the hand eases back to the
  // character's side instead of snapping straight to idle. Driven manually
  // (action.paused + hand-set .time) rather than a second play() in reverse,
  // since re-triggering a LoopOnce action's finish logic backwards is fiddly;
  // scrubbing .time while paused still blends normally, it just skips the
  // mixer's own per-frame advance so we can decrement it ourselves.
  const PINGPONG_EMOTES = new Set(['reach']);

  let activeEmote = null;
  let activeEmoteName = null;
  let emotePhase = null; // 'forward' | 'reverse' | null
  let onEmoteFinish = null;

  function finishEmote() {
    activeEmote.setEffectiveWeight(0);
    activeEmote.stop();
    activeEmote = null;
    activeEmoteName = null;
    emotePhase = null;
  }

  mixer.addEventListener('finished', (ev) => {
    if (ev.action !== activeEmote || emotePhase !== 'forward') return;
    const cb = onEmoteFinish;
    onEmoteFinish = null;
    cb?.();
    if (PINGPONG_EMOTES.has(activeEmoteName)) {
      activeEmote.enabled = true; // LoopOnce disables itself right before this event fires
      activeEmote.paused = true;  // we drive .time by hand from here on
      emotePhase = 'reverse';
    } else {
      finishEmote();
    }
  });

  let wWalk = 0; // 0 = full idle, 1 = full walk
  const rig = {
    update(dt, moving) {
      wWalk += ((moving ? 1 : 0) - wWalk) * Math.min(1, dt * BLEND_RATE);
      const locomotion = activeEmote ? 0 : 1; // emote takes over while playing
      idle.setEffectiveWeight((1 - wWalk) * locomotion);
      walk.setEffectiveWeight(wWalk * locomotion);
      if (activeEmote) activeEmote.setEffectiveWeight(1);

      if (emotePhase === 'reverse') {
        activeEmote.time = Math.max(0, activeEmote.time - Math.abs(activeEmote.timeScale) * dt);
        if (activeEmote.time <= 0) finishEmote();
      }

      mixer.update(dt);
    },
    playEmote(name, onFinish) {
      const a = emotes[name];
      if (!a || activeEmote) return;
      activeEmote = a;
      activeEmoteName = name;
      emotePhase = 'forward';
      onEmoteFinish = onFinish;
      a.reset().play();
    },
  };

  return { player, rig };
}
