import * as THREE from 'three';
import { registerGeometry, solidMesh } from '../systems/GeometrySystem.js';
import { getMaterial } from '../systems/MaterialSystem.js';
import { getModel } from '../systems/ModelLoader.js';

// Aircond (wall-mounted)
registerGeometry('aircond', (mats) => {
  const model = getModel('aircond', mats, new THREE.Vector3(0.8, -0.1, 0.22));
  if (model) return model;

  const body = solidMesh(new THREE.BoxGeometry(2.0, 0.5, 0.4), getMaterial(mats.body ?? 'whitePlastic'));
  const vent = solidMesh(new THREE.BoxGeometry(1.8, 0.05, 0.08), getMaterial(mats.vent ?? 'lightGray'));
  vent.position.y = -0.2;
  return {
    meshes: [body, vent],
    meta: { indicatorPos: new THREE.Vector3(0.8, -0.1, 0.22) },
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
