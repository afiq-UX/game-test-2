import * as THREE from 'three';
import { registerGeometry, solidMesh } from '../systems/GeometrySystem.js';
import { getMaterial } from '../systems/MaterialSystem.js';
import { getModel } from '../systems/ModelLoader.js';

// Wi-Fi Router — Linksys-style: flat wide body, 3 flat paddle antennas, blue LED
registerGeometry('router', (mats) => {
  const model = getModel('router', mats, new THREE.Vector3(0.13, 0.045, 0.10));
  if (model) return model;

  const mat = getMaterial(mats.body ?? 'blackPlastic');

  // Main flat body
  const body = solidMesh(new THREE.BoxGeometry(0.30, 0.038, 0.22), mat);
  body.position.set(0, 0.019, 0);

  // Slightly raised top ridge — simulates the vented surface
  const ridge = solidMesh(new THREE.BoxGeometry(0.26, 0.004, 0.18), mat);
  ridge.position.set(0, 0.040, 0);

  // 4 rubber feet
  const footGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.008, 8);
  const feet = [[-0.11, -0.08], [0.11, -0.08], [-0.11, 0.08], [0.11, 0.08]].map(([x, z]) => {
    const f = solidMesh(footGeo, mat);
    f.position.set(x, 0.004, z);
    return f;
  });

  // 3 flat paddle antennas at the back — thin rectangular blades
  const antGeo = new THREE.BoxGeometry(0.016, 0.15, 0.006);
  const antBaseY = 0.038 + 0.075; // body top + half antenna height

  const ant1 = solidMesh(antGeo, mat);
  ant1.position.set(-0.09, antBaseY, -0.10);
  ant1.rotation.z = -0.14; // tilt left

  const ant2 = solidMesh(antGeo, mat);
  ant2.position.set(-0.01, antBaseY, -0.10); // upright centre-left

  const ant3 = solidMesh(antGeo, mat);
  ant3.position.set(0.11, antBaseY, -0.10);
  ant3.rotation.z = 0.14; // tilt right

  // Blue LED strip on front-left face
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x0044ff,
    emissive: 0x0033cc,
    emissiveIntensity: 2.0,
    roughness: 0.2,
    metalness: 0,
  });
  const led = solidMesh(new THREE.BoxGeometry(0.030, 0.005, 0.003), ledMat);
  led.position.set(-0.082, 0.022, 0.111);

  return {
    meshes: [body, ridge, ...feet, ant1, ant2, ant3, led],
    meta: { indicatorPos: new THREE.Vector3(0.13, 0.045, 0.10) },
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
