import * as THREE from 'three';
import { registerGeometry, solidMesh } from '../systems/GeometrySystem.js';
import { getMaterial } from '../systems/MaterialSystem.js';

// Fridge (Peti Sejuk)
registerGeometry('fridge', (mats) => {
  const body = solidMesh(new THREE.BoxGeometry(1.0, 2.1, 0.75), getMaterial(mats.body ?? 'offWhite'));
  body.position.y = 1.05;
  const seam = solidMesh(new THREE.BoxGeometry(1.02, 0.02, 0.76), getMaterial(mats.seam ?? 'lightGray'));
  seam.position.y = 1.3;
  const handle1 = solidMesh(new THREE.BoxGeometry(0.05, 0.5, 0.04), getMaterial(mats.handle ?? 'grayPlastic'));
  handle1.position.set(0.4, 1.7, 0.4);
  const handle2 = solidMesh(new THREE.BoxGeometry(0.05, 0.3, 0.04), getMaterial(mats.handle ?? 'grayPlastic'));
  handle2.position.set(0.4, 0.7, 0.4);
  return {
    meshes: [body, seam, handle1, handle2],
    meta: { indicatorPos: new THREE.Vector3(-0.4, 2.0, 0.4) },
  };
});

// Microwave
registerGeometry('microwave', (mats) => {
  const body = solidMesh(new THREE.BoxGeometry(0.6, 0.35, 0.4), getMaterial(mats.body ?? 'darkGray'));
  const door = solidMesh(new THREE.BoxGeometry(0.4, 0.28, 0.02), getMaterial(mats.door ?? 'tintedGlass'));
  door.position.set(-0.05, 0, 0.21);
  return {
    meshes: [body, door],
    meta: { indicatorPos: new THREE.Vector3(0.25, -0.08, 0.21) },
  };
});

// Rice Cooker (Periuk Nasi)
registerGeometry('riceCooker', (mats) => {
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
  const body = solidMesh(new THREE.CylinderGeometry(0.13, 0.16, 0.25, 16), getMaterial(mats.body ?? 'stainless'));
  const spout = solidMesh(new THREE.ConeGeometry(0.04, 0.12, 8), getMaterial(mats.body ?? 'stainless'));
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

// Toaster
registerGeometry('toaster', (mats) => {
  const body = solidMesh(new THREE.BoxGeometry(0.35, 0.22, 0.22), getMaterial(mats.body ?? 'brushedSteel'));
  const slot = solidMesh(new THREE.BoxGeometry(0.25, 0.02, 0.08), getMaterial(mats.slot ?? 'blackPlastic'));
  slot.position.y = 0.12;
  return {
    meshes: [body, slot],
    meta: { indicatorPos: new THREE.Vector3(0.15, -0.08, 0.12) },
  };
});
