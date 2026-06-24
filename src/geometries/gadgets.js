import * as THREE from 'three';
import { registerGeometry, solidMesh } from '../systems/GeometrySystem.js';
import { getMaterial } from '../systems/MaterialSystem.js';
import { getModel } from '../systems/ModelLoader.js';

// Wi-Fi Router
registerGeometry('router', (mats) => {
  const model = getModel('router', mats, new THREE.Vector3(0.14, 0.05, 0.12));
  if (model) return model;

  const body = solidMesh(new THREE.BoxGeometry(0.4, 0.06, 0.25), getMaterial(mats.body ?? 'blackPlastic'));
  const ant1 = solidMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), getMaterial(mats.body ?? 'blackPlastic'));
  ant1.position.set(-0.13, 0.18, -0.08);
  const ant2 = solidMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), getMaterial(mats.body ?? 'blackPlastic'));
  ant2.position.set(0.13, 0.18, -0.08);
  return {
    meshes: [body, ant1, ant2],
    meta: { indicatorPos: new THREE.Vector3(0.14, 0.05, 0.12) },
  };
});

// Speaker
registerGeometry('speaker', (mats) => {
  const model = getModel('speaker', mats, new THREE.Vector3(0.1, -0.3, 0.16));
  if (model) return model;

  const body = solidMesh(new THREE.BoxGeometry(0.35, 0.7, 0.3), getMaterial(mats.body ?? 'darkGray'));
  const cone1 = solidMesh(new THREE.CircleGeometry(0.1, 16), getMaterial(mats.cone ?? 'blackPlastic'));
  cone1.position.set(0, 0.15, 0.16);
  const cone2 = solidMesh(new THREE.CircleGeometry(0.06, 16), getMaterial(mats.cone ?? 'blackPlastic'));
  cone2.position.set(0, -0.15, 0.16);
  return {
    meshes: [body, cone1, cone2],
    meta: { indicatorPos: new THREE.Vector3(0.1, -0.3, 0.16) },
  };
});

// Console (PlayStation)
registerGeometry('console', (mats) => {
  const model = getModel('console', mats, new THREE.Vector3(0.15, 0.07, 0.16));
  if (model) return model;

  const body = solidMesh(new THREE.BoxGeometry(0.4, 0.1, 0.3), getMaterial(mats.body ?? 'whitePlastic'));
  return {
    meshes: [body],
    meta: { indicatorPos: new THREE.Vector3(0.15, 0.07, 0.16) },
  };
});

// Phone Charger
registerGeometry('phoneCharger', (mats) => {
  const model = getModel('phoneCharger', mats, new THREE.Vector3(0, 0.04, 0.04));
  if (model) return model;

  const block = solidMesh(new THREE.BoxGeometry(0.1, 0.05, 0.07), getMaterial(mats.block ?? 'whitePlastic'));
  const phone = solidMesh(new THREE.BoxGeometry(0.07, 0.005, 0.14), getMaterial(mats.phone ?? 'blackPlastic'));
  phone.position.set(0.12, 0.0, 0);
  return {
    meshes: [block, phone],
    meta: { indicatorPos: new THREE.Vector3(0, 0.04, 0.04) },
  };
});

// Hair Dryer (Pengering Rambut)
registerGeometry('hairDryer', (mats) => {
  const model = getModel('hairDryer', mats, new THREE.Vector3(0.05, 0.15, 0.05));
  if (model) return model;

  const handle = solidMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), getMaterial(mats.body ?? 'pinkPlastic'));
  const barrel = solidMesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 12), getMaterial(mats.body ?? 'pinkPlastic'));
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0.0, 0.15, 0.1);
  return {
    meshes: [handle, barrel],
    meta: { indicatorPos: new THREE.Vector3(0.05, 0.15, 0.05) },
  };
});
