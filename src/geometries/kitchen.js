import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { registerGeometry, solidMesh } from '../systems/GeometrySystem.js';
import { getMaterial } from '../systems/MaterialSystem.js';
import { getModel } from '../systems/ModelLoader.js';

// Fridge (Peti Sejuk) — top-freezer, 0.78 × 1.80 × 0.72. Origin at floor.
// Faces +Z. See design-system/00-art-style.md.
registerGeometry('fridge', (mats) => {
  const bodyMat = getMaterial(mats.body ?? 'offWhite');
  const handleMat = getMaterial(mats.handle ?? 'grayPlastic');

  // Recessed kick plate at the floor
  const kick = solidMesh(new THREE.BoxGeometry(0.70, 0.06, 0.62), getMaterial('darkInset'));
  kick.position.y = 0.03;

  // Cabinet body
  const body = solidMesh(new RoundedBoxGeometry(0.78, 1.74, 0.68, 2, 0.02), bodyMat);
  body.position.set(0, 0.06 + 0.87, -0.02);

  // Doors sit proud of the cabinet with a visible gap between them.
  // Fridge door (lower ⅔): y 0.07..1.16   Freezer door (upper ⅓): y 1.18..1.79
  const doorFridge = solidMesh(new RoundedBoxGeometry(0.76, 1.09, 0.035, 2, 0.012), bodyMat);
  doorFridge.position.set(0, 0.615, 0.3375);
  const doorFreezer = solidMesh(new RoundedBoxGeometry(0.76, 0.61, 0.035, 2, 0.012), bodyMat);
  doorFreezer.position.set(0, 1.485, 0.3375);

  // Door gap seam reads as a dark line between the doors
  const seam = solidMesh(new THREE.BoxGeometry(0.76, 0.02, 0.03), getMaterial(mats.seam ?? 'lightGray'));
  seam.position.set(0, 1.17, 0.335);

  // Vertical bar handles near the left edge (hinges on the right), each on
  // two small standoffs
  const meshes = [kick, body, doorFridge, doorFreezer, seam];
  function barHandle(cy, len) {
    const bar = solidMesh(new THREE.CylinderGeometry(0.013, 0.013, len, 10), handleMat);
    bar.position.set(-0.30, cy, 0.395);
    meshes.push(bar);
    for (const dy of [-len / 2 + 0.03, len / 2 - 0.03]) {
      const standoff = solidMesh(new THREE.CylinderGeometry(0.008, 0.008, 0.035, 8), handleMat);
      standoff.rotation.x = Math.PI / 2;
      standoff.position.set(-0.30, cy + dy, 0.372);
      meshes.push(standoff);
    }
  }
  barHandle(0.90, 0.55); // fridge door
  barHandle(1.42, 0.32); // freezer door

  return {
    meshes,
    meta: { indicatorPos: new THREE.Vector3(0.24, 1.62, 0.36) },
  };
});

// Microwave — 0.50 × 0.30 × 0.38 counter-top. Origin at counter surface.
// Window on the left ⅔, control strip on the right ⅓. Faces +Z.
registerGeometry('microwave', (mats) => {
  const bodyMat = getMaterial(mats.body ?? 'darkGray');
  const meshes = [];

  // Four low feet + body
  for (const [fx, fz] of [[-0.21, -0.15], [0.21, -0.15], [-0.21, 0.15], [0.21, 0.15]]) {
    const foot = solidMesh(new THREE.CylinderGeometry(0.014, 0.016, 0.012, 8), getMaterial('rubber'));
    foot.position.set(fx, 0.006, fz);
    meshes.push(foot);
  }
  const body = solidMesh(new RoundedBoxGeometry(0.50, 0.30, 0.38, 2, 0.015), bodyMat);
  body.position.y = 0.162;
  meshes.push(body);

  // Door frame + tinted window (left ⅔ of the front face)
  const doorFrame = solidMesh(new RoundedBoxGeometry(0.315, 0.25, 0.018, 2, 0.008), bodyMat);
  doorFrame.position.set(-0.075, 0.165, 0.192);
  const glass = solidMesh(new THREE.BoxGeometry(0.265, 0.20, 0.006), getMaterial(mats.door ?? 'tintedGlass'));
  glass.position.set(-0.075, 0.165, 0.2035);
  meshes.push(doorFrame, glass);

  // Door handle bar on the left edge of the control strip
  const handle = solidMesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 8), getMaterial('grayPlastic'));
  handle.position.set(0.095, 0.165, 0.207);
  meshes.push(handle);

  // Control strip (right ⅓): dark panel, display chip, button grid
  const strip = solidMesh(new THREE.BoxGeometry(0.115, 0.25, 0.006), getMaterial('darkInset'));
  strip.position.set(0.175, 0.165, 0.1935);
  meshes.push(strip);
  const display = solidMesh(new THREE.BoxGeometry(0.08, 0.032, 0.004), getMaterial('lightGray'));
  display.position.set(0.175, 0.255, 0.1975);
  meshes.push(display);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 2; col++) {
      const btn = solidMesh(new THREE.BoxGeometry(0.03, 0.018, 0.004), getMaterial('grayPlastic'));
      btn.position.set(0.155 + col * 0.042, 0.21 - row * 0.036, 0.1975);
      meshes.push(btn);
    }
  }

  return {
    meshes,
    meta: { indicatorPos: new THREE.Vector3(0.175, 0.285, 0.20) },
  };
});

// Rice Cooker (Periuk Nasi)
registerGeometry('riceCooker', (mats) => {
  const model = getModel('riceCooker', mats, new THREE.Vector3(0.15, -0.1, 0.15));
  if (model) return model;

  const body = solidMesh(new THREE.CylinderGeometry(0.18, 0.18, 0.28, 16), getMaterial(mats.body ?? 'whitePlastic'));
  const lid = solidMesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16), getMaterial(mats.lid ?? 'aluminum'));
  lid.position.y = 0.16;
  return {
    meshes: [body, lid],
    meta: { indicatorPos: new THREE.Vector3(0.15, -0.1, 0.15) },
  };
});

// Kettle (Cerek)
registerGeometry('kettle', (mats) => {
  const model = getModel('kettle', mats, new THREE.Vector3(0.0, -0.1, 0.15));
  if (model) return model;

  const body = solidMesh(new THREE.CylinderGeometry(0.13, 0.16, 0.25, 16), getMaterial(mats.body ?? 'stainless'));
  const spout = solidMesh(new THREE.ConeGeometry(0.04, 0.12, 8), getMaterial(mats.spout ?? 'darkGray'));
  spout.position.set(0.15, 0.05, 0);
  spout.rotation.z = -Math.PI / 3;
  const handle = solidMesh(new THREE.TorusGeometry(0.09, 0.012, 6, 12, Math.PI), getMaterial(mats.handle ?? 'darkGray'));
  handle.position.set(-0.15, 0.05, 0);
  handle.rotation.y = Math.PI / 2;
  return {
    meshes: [body, spout, handle],
    meta: { indicatorPos: new THREE.Vector3(0.0, -0.1, 0.15) },
  };
});

// Toaster — 2-slice, 0.28 × 0.19 × 0.17, domed shoulders. Origin at counter
// surface. Slots on top, lever on the right side, dial on the front.
registerGeometry('toaster', (mats) => {
  const bodyMat = getMaterial(mats.body ?? 'brushedSteel');
  const slotMat = getMaterial(mats.slot ?? 'blackPlastic');
  const meshes = [];

  // Dark plinth base
  const plinth = solidMesh(new RoundedBoxGeometry(0.29, 0.03, 0.18, 2, 0.008), getMaterial('darkGray'));
  plinth.position.y = 0.015;
  meshes.push(plinth);

  // Body with generously rounded shoulders
  const body = solidMesh(new RoundedBoxGeometry(0.28, 0.165, 0.17, 3, 0.04), bodyMat);
  body.position.y = 0.11;
  meshes.push(body);

  // Two slots inset into the top
  for (const dz of [-0.034, 0.034]) {
    const rim = solidMesh(new THREE.BoxGeometry(0.21, 0.008, 0.036), slotMat);
    rim.position.set(0, 0.192, dz);
    const slot = solidMesh(new THREE.BoxGeometry(0.19, 0.008, 0.02), getMaterial('darkInset'));
    slot.position.set(0, 0.196, dz);
    meshes.push(rim, slot);
  }

  // Lever on the right side, riding a slim track
  const track = solidMesh(new THREE.BoxGeometry(0.006, 0.10, 0.012), slotMat);
  track.position.set(0.142, 0.115, 0);
  const lever = solidMesh(new RoundedBoxGeometry(0.022, 0.026, 0.05, 2, 0.006), slotMat);
  lever.position.set(0.152, 0.14, 0);
  meshes.push(track, lever);

  // Browning dial + cancel button on the front
  const dial = solidMesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 16), slotMat);
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0.08, 0.07, 0.088);
  const btn = solidMesh(new THREE.BoxGeometry(0.03, 0.014, 0.008), slotMat);
  btn.position.set(0.08, 0.115, 0.086);
  meshes.push(dial, btn);

  return {
    meshes,
    meta: { indicatorPos: new THREE.Vector3(0.03, 0.07, 0.09) },
  };
});
