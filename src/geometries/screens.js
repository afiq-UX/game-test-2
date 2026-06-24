import * as THREE from 'three';
import { registerGeometry, solidMesh } from '../systems/GeometrySystem.js';
import { getMaterial, createToggleMaterial } from '../systems/MaterialSystem.js';

// TV
registerGeometry('tv', (mats) => {
  const frame = solidMesh(new THREE.BoxGeometry(2.6, 1.5, 0.1), getMaterial(mats.frame ?? 'blackPlastic'));
  const screenMat = createToggleMaterial(mats.screen ?? 'screenOn');
  const screen = solidMesh(new THREE.BoxGeometry(2.4, 1.3, 0.04), screenMat);
  screen.position.z = 0.07;
  screen.name = 'screen';
  const stand = solidMesh(new THREE.BoxGeometry(0.6, 0.05, 0.4), getMaterial(mats.stand ?? 'darkGray'));
  stand.position.y = -0.78;
  return {
    meshes: [frame, screen, stand],
    meta: { indicatorPos: new THREE.Vector3(1.15, -0.65, 0.08) },
  };
});

// Computer Monitor
registerGeometry('computerMonitor', (mats) => {
  const stand = solidMesh(new THREE.CylinderGeometry(0.04, 0.08, 0.25, 12), getMaterial(mats.stand ?? 'darkGray'));
  const arm = solidMesh(new THREE.BoxGeometry(0.12, 0.02, 0.08), getMaterial(mats.stand ?? 'darkGray'));
  arm.position.y = 0.13;
  const panel = solidMesh(new THREE.BoxGeometry(0.9, 0.55, 0.04), getMaterial(mats.frame ?? 'blackPlastic'));
  panel.position.y = 0.4;
  const screenMat = createToggleMaterial(mats.screen ?? 'screenOnAlt');
  const screen = solidMesh(new THREE.BoxGeometry(0.84, 0.49, 0.02), screenMat);
  screen.position.set(0, 0.4, 0.025);
  screen.name = 'screen';
  return {
    meshes: [stand, arm, panel, screen],
    meta: { indicatorPos: new THREE.Vector3(0.36, 0.18, 0.03) },
  };
});
