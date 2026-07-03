import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
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

// Speaker — floor-standing tower, 0.26 × 0.94 × 0.30. Origin at floor.
// Two woofers + tweeter + bass port on a recessed front baffle. Faces +Z.
// See design-system/00-art-style.md.
registerGeometry('speaker', (mats) => {
  const bodyMat = getMaterial(mats.body ?? 'darkGray');
  const coneMat = getMaterial(mats.cone ?? 'blackPlastic');
  const meshes = [];

  // Plinth base + cabinet
  const plinth = solidMesh(new THREE.BoxGeometry(0.28, 0.035, 0.32), coneMat);
  plinth.position.y = 0.0175;
  const cabinet = solidMesh(new RoundedBoxGeometry(0.26, 0.90, 0.30, 2, 0.012), bodyMat);
  cabinet.position.y = 0.485;
  meshes.push(plinth, cabinet);

  // Recessed front baffle
  const baffle = solidMesh(new THREE.BoxGeometry(0.22, 0.86, 0.012), coneMat);
  baffle.position.set(0, 0.485, 0.148);
  meshes.push(baffle);

  // Driver helper: surround ring + flat cone disc + dust cap
  function driver(cy, r) {
    const surround = solidMesh(new THREE.TorusGeometry(r, 0.011, 8, 20), coneMat);
    surround.position.set(0, cy, 0.157);
    const cone = solidMesh(new THREE.CylinderGeometry(r - 0.005, r - 0.005, 0.008, 20), getMaterial('darkInset'));
    cone.rotation.x = Math.PI / 2;
    cone.position.set(0, cy, 0.156);
    const cap = solidMesh(new THREE.SphereGeometry(r * 0.28, 10, 8), coneMat);
    cap.position.set(0, cy, 0.158);
    meshes.push(surround, cone, cap);
  }
  driver(0.30, 0.068); // lower woofer
  driver(0.52, 0.068); // upper woofer

  // Tweeter: small plate + dome
  const plate = solidMesh(new THREE.CylinderGeometry(0.032, 0.032, 0.01, 16), coneMat);
  plate.rotation.x = Math.PI / 2;
  plate.position.set(0, 0.72, 0.156);
  const tweeter = solidMesh(new THREE.SphereGeometry(0.015, 10, 8), getMaterial('aluminum'));
  tweeter.position.set(0, 0.72, 0.16);
  meshes.push(plate, tweeter);

  // Bass port near the bottom
  const port = solidMesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 16), getMaterial('darkInset'));
  port.rotation.x = Math.PI / 2;
  port.position.set(0, 0.12, 0.156);
  meshes.push(port);

  return {
    meshes,
    meta: { indicatorPos: new THREE.Vector3(0.08, 0.86, 0.15) },
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
