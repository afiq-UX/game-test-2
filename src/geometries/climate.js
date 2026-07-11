import * as THREE from 'three';
import { registerGeometry, solidMesh } from '../systems/GeometrySystem.js';
import { getMaterial } from '../systems/MaterialSystem.js';
import { getModel } from '../systems/ModelLoader.js';

// Aircond (wall-mounted)
registerGeometry('aircond', (mats) => {
  const model = getModel('aircond', mats, new THREE.Vector3(0.8, -0.1, 0.22));
  if (model) {
    // The source model's own origin isn't at its vertical centre (it's
    // baked at a specific absolute mount height from wherever it was
    // authored) — re-centre it locally so appliance configs can keep using
    // the same "position.y = mount height" convention the parametric
    // fallback below uses (centred on its own origin).
    const g = model.meshes[0];
    g.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(g);
    g.position.y -= (box.min.y + box.max.y) / 2;
    return model;
  }

  const body = solidMesh(new THREE.BoxGeometry(2.0, 0.5, 0.4), getMaterial(mats.body ?? 'whitePlastic'));
  const vent = solidMesh(new THREE.BoxGeometry(1.8, 0.05, 0.08), getMaterial(mats.vent ?? 'lightGray'));
  vent.position.y = -0.2;
  return {
    meshes: [body, vent],
    meta: { indicatorPos: new THREE.Vector3(0.8, -0.1, 0.22) },
  };
});

// Aircond Cassette (ceiling-mounted) — square recessed unit, origin at the
// visible panel roughly ceiling-height, hangs downward.
registerGeometry('aircondCassette', (mats) => {
  const model = getModel('aircondCassette', mats, new THREE.Vector3(0.35, -0.05, 0.35));
  if (model) {
    // Source model's vent/grille faced up (into the ceiling) by default —
    // flip it to face down into the room.
    model.meshes[0].rotation.x = Math.PI;
    return model;
  }

  const panel = solidMesh(new THREE.BoxGeometry(0.8, 0.04, 0.8), getMaterial(mats.body ?? 'whitePlastic'));
  const vent = solidMesh(new THREE.BoxGeometry(0.6, 0.015, 0.6), getMaterial(mats.vent ?? 'lightGray'));
  vent.position.y = -0.025;
  return {
    meshes: [panel, vent],
    meta: { indicatorPos: new THREE.Vector3(0.35, -0.05, 0.35) },
  };
});

// Water Heater (Pemanas Air)
registerGeometry('waterHeater', (mats) => {
  const model = getModel('waterHeater', mats, new THREE.Vector3(0.3, 0.1, 0.25));
  if (model) return model;

  const body = solidMesh(new THREE.CylinderGeometry(0.22, 0.22, 0.7, 16), getMaterial(mats.body ?? 'whitePlastic'));
  body.rotation.z = Math.PI / 2;
  const pipe = solidMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), getMaterial(mats.pipe ?? 'aluminum'));
  pipe.position.set(0, -0.2, 0);
  return {
    meshes: [body, pipe],
    meta: { indicatorPos: new THREE.Vector3(0.3, 0.1, 0.25) },
  };
});

// Water Dispenser (Penyejuk Air)
registerGeometry('waterDispenser', (mats) => {
  const model = getModel('waterDispenser', mats, new THREE.Vector3(0.18, 1.0, 0.26));
  if (model) return model;

  const body = solidMesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), getMaterial(mats.body ?? 'offWhite'));
  body.position.y = 0.7;
  const tank = solidMesh(new THREE.CylinderGeometry(0.18, 0.18, 0.4, 16), getMaterial(mats.tank ?? 'clearBlue'));
  tank.position.y = 1.6;
  const tap = solidMesh(new THREE.BoxGeometry(0.12, 0.12, 0.06), getMaterial(mats.tap ?? 'darkCharcoal'));
  tap.position.set(0, 0.8, 0.27);
  return {
    meshes: [body, tank, tap],
    meta: { indicatorPos: new THREE.Vector3(0.18, 1.0, 0.26) },
  };
});
