import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { registerGeometry, solidMesh } from '../systems/GeometrySystem.js';
import { getMaterial, createToggleMaterial } from '../systems/MaterialSystem.js';
import { getModel } from '../systems/ModelLoader.js';

// Ceiling Fan with Light — 1.30 m blade span, 5 blades, built at real size
// (no config scale needed). Origin at the ceiling attach point, hangs down.
// 'rotor' spins; 'lampDome' is the emissive toggle. See 00-art-style.md.
registerGeometry('ceilingFan', (mats) => {
  const mountMat = getMaterial(mats.mount ?? 'darkGray');
  const meshes = [];

  // Canopy against the ceiling + downrod
  const canopy = solidMesh(new THREE.CylinderGeometry(0.05, 0.062, 0.045, 16), mountMat);
  canopy.position.y = -0.0225;
  const downrod = solidMesh(new THREE.CylinderGeometry(0.011, 0.011, 0.24, 10), mountMat);
  downrod.position.y = -0.165;
  meshes.push(canopy, downrod);

  // Motor housing: main drum + narrower bottom cap
  const motor = solidMesh(new THREE.CylinderGeometry(0.105, 0.105, 0.10, 20), mountMat);
  motor.position.y = -0.335;
  const motorCap = solidMesh(new THREE.CylinderGeometry(0.082, 0.070, 0.03, 20), mountMat);
  motorCap.position.y = -0.40;
  meshes.push(motor, motorCap);

  // Rotor: 5 blades on short irons, each with a slight aerodynamic pitch.
  // The whole group spins around Y (BehaviorSystem finds it by name).
  const rotor = new THREE.Group();
  rotor.name = 'rotor';
  rotor.position.y = -0.31;
  const bladeMat = getMaterial(mats.blades ?? 'lightWood');
  for (let i = 0; i < 5; i++) {
    const arm = new THREE.Group();
    arm.rotation.y = (i * Math.PI * 2) / 5;

    const iron = solidMesh(new THREE.BoxGeometry(0.10, 0.008, 0.032), getMaterial('darkMetal'));
    iron.position.set(0.14, -0.01, 0);

    const blade = solidMesh(new RoundedBoxGeometry(0.50, 0.011, 0.12, 1, 0.005), bladeMat);
    blade.position.set(0.42, -0.014, 0);
    blade.rotation.x = 0.12; // blade pitch

    arm.add(iron, blade);
    rotor.add(arm);
  }
  meshes.push(rotor);

  // Lamp dome under the motor — single named mesh for the emissive toggle
  const dome = solidMesh(
    new THREE.SphereGeometry(0.095, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    createToggleMaterial(mats.lampDome ?? 'warmGlow')
  );
  dome.position.y = -0.415;
  dome.name = 'lampDome';
  const finial = solidMesh(new THREE.SphereGeometry(0.016, 10, 8), mountMat);
  finial.position.y = -0.515;
  meshes.push(dome, finial);

  return {
    meshes,
    meta: { indicatorPos: new THREE.Vector3(0.13, -0.335, 0) },
  };
});

// Standing Fan — GLB-only, no parametric fallback (removed per request: the
// real model replaced the old placeholder mesh entirely).
registerGeometry('standingFan', (mats) => {
  const model = getModel('standingFan', mats, new THREE.Vector3(0.2, 0.6, 0));
  if (!model) console.warn('standingFan: /models/standingFan.glb missing or failed to load — nothing will render');
  return model ?? { meshes: [], meta: { indicatorPos: new THREE.Vector3(0.2, 0.6, 0) } };
});
