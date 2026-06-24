import * as THREE from 'three';
import { registerGeometry, solidMesh } from '../systems/GeometrySystem.js';
import { getMaterial, createToggleMaterial } from '../systems/MaterialSystem.js';

function fanRotor(bladeMat) {
  const rotor = new THREE.Group();
  rotor.name = 'rotor';
  const hub = solidMesh(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 12), getMaterial('darkGray'));
  rotor.add(hub);
  for (let i = 0; i < 4; i++) {
    const b = solidMesh(new THREE.BoxGeometry(1.6, 0.04, 0.22), bladeMat);
    b.position.x = 0.8;
    const arm = new THREE.Group();
    arm.add(b);
    arm.rotation.y = (i * Math.PI) / 2;
    rotor.add(arm);
  }
  return rotor;
}

// Ceiling Fan with Light
registerGeometry('ceilingFan', (mats) => {
  const mount = solidMesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8), getMaterial(mats.mount ?? 'darkGray'));
  mount.position.y = 0.1;
  const rotor = fanRotor(getMaterial(mats.blades ?? 'lightWood'));
  rotor.position.y = -0.05;
  const domeMat = createToggleMaterial(mats.lampDome ?? 'warmGlow');
  const lampDome = solidMesh(
    new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    domeMat
  );
  lampDome.rotation.x = Math.PI;
  lampDome.position.y = -0.18;
  lampDome.name = 'lampDome';
  return {
    meshes: [mount, rotor, lampDome],
    meta: { indicatorPos: new THREE.Vector3(0, -0.35, 0.28) },
  };
});

// Standing Fan
registerGeometry('standingFan', (mats) => {
  const base = solidMesh(new THREE.CylinderGeometry(0.25, 0.3, 0.05, 16), getMaterial(mats.base ?? 'darkGray'));
  const pole = solidMesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8), getMaterial(mats.pole ?? 'medGray'));
  pole.position.y = 0.5;
  const cage = solidMesh(new THREE.TorusGeometry(0.3, 0.02, 8, 24), getMaterial(mats.cage ?? 'grayPlastic'));
  cage.position.y = 1.1;
  cage.rotation.y = Math.PI / 2;

  const rotor = new THREE.Group();
  rotor.name = 'rotor';
  const hub = solidMesh(new THREE.CylinderGeometry(0.16 * 0.32, 0.16 * 0.32, 0.18 * 0.32, 12), getMaterial('darkGray'));
  rotor.add(hub);
  for (let i = 0; i < 4; i++) {
    const b = solidMesh(new THREE.BoxGeometry(1.6 * 0.32, 0.04 * 0.32, 0.22 * 0.32), getMaterial(mats.blades ?? 'lightGray'));
    b.position.x = 0.8 * 0.32;
    const a = new THREE.Group();
    a.add(b);
    a.rotation.y = (i * Math.PI) / 2;
    rotor.add(a);
  }
  rotor.position.y = 1.1;
  rotor.rotation.x = Math.PI / 2;

  return {
    meshes: [base, pole, cage, rotor],
    meta: { indicatorPos: new THREE.Vector3(0.2, 0.6, 0) },
  };
});
