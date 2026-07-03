// animRetarget.js — remap a skeletal AnimationClip from one Mixamo-derived
// skeleton onto another when the bone hierarchy/names correspond but the
// rest ("bind") pose differs per bone — e.g. a Blender re-export gives every
// bone an arbitrary rest rotation instead of Mixamo's default T-pose. Used to
// graft real mocap (Vanguard's Walk clip) onto a character that only ships
// an Idle/sit set, without touching the target's skin binding at all — this
// only rewrites which bone each keyframe targets and how its rotation maps.
import * as THREE from 'three';

// Strip the "mixamorig:" prefix (colon optional) and any exporter-added
// trailing "_NN" suffix, so "mixamorig:LeftArm" and "mixamorig:LeftArm_09"
// both reduce to "LeftArm" for matching.
function baseBoneName(name) {
  return name.replace(/^mixamorig:?/, '').replace(/_\d+$/, '');
}

// Bind-pose quaternion per bone name, captured from a freshly-loaded model
// before any animation has run (root.traverse order visits bones once).
export function collectBindQuaternions(root) {
  const map = new Map();
  root.traverse((o) => { if (o.isBone) map.set(o.name, o.quaternion.clone()); });
  return map;
}

export function collectBoneNames(root) {
  return [...collectBindQuaternions(root).keys()];
}

// Only rotation is transferred (translation/scale encode bone LENGTH, which
// is specific to the source skeleton's proportions and must come from the
// target's own bind pose instead — copying it mid-clip snaps the target's
// limbs to the source's sizes, producing detached-looking hands/feet).
//
// Because the two skeletons don't share a rest pose, a raw quaternion copy
// also fails — it would rotate the whole chain by however much the bind
// poses differ. Instead each keyframe is re-expressed as "rotation relative
// to the source's own rest pose", then reapplied on top of the target's rest
// pose:  targetLocal(t) = targetBind · (sourceBind⁻¹ · sourceLocal(t))
// which correctly reproduces the TARGET's neutral pose when the source clip
// is at its own neutral moment, regardless of how different the two bind
// poses are.
export function retargetClip(sourceClip, sourceBindQuats, targetBindQuats, newName) {
  const targetNameByBase = new Map([...targetBindQuats.keys()].map((n) => [baseBoneName(n), n]));

  const tracks = [];
  const matchedBones = new Set();
  for (const track of sourceClip.tracks) {
    const { nodeName, propertyName } = THREE.PropertyBinding.parseTrackName(track.name);
    if (propertyName !== 'quaternion') continue; // skip translation/scale — see note above

    const targetName = targetNameByBase.get(baseBoneName(nodeName));
    const sourceBind = sourceBindQuats.get(nodeName);
    const targetBind = targetName && targetBindQuats.get(targetName);
    if (!targetName || !sourceBind || !targetBind) continue; // bone missing on one side — drop

    // Precompute the constant per-bone correction: targetBind · sourceBind⁻¹
    const correction = targetBind.clone().multiply(sourceBind.clone().invert());

    const srcValues = track.values;
    const outValues = new Float32Array(srcValues.length);
    const q = new THREE.Quaternion();
    for (let i = 0; i < srcValues.length; i += 4) {
      q.set(srcValues[i], srcValues[i + 1], srcValues[i + 2], srcValues[i + 3]);
      q.premultiply(correction); // correction · q, in three.js's post-multiply convention
      outValues[i] = q.x; outValues[i + 1] = q.y; outValues[i + 2] = q.z; outValues[i + 3] = q.w;
    }

    matchedBones.add(nodeName);
    tracks.push(new THREE.QuaternionKeyframeTrack(`${targetName}.quaternion`, track.times.slice(), outValues));
  }

  return {
    clip: new THREE.AnimationClip(newName ?? sourceClip.name, sourceClip.duration, tracks),
    matched: matchedBones.size,
    total: new Set(sourceClip.tracks.map((t) => THREE.PropertyBinding.parseTrackName(t.name).nodeName)).size,
  };
}
