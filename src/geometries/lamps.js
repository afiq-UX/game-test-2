import * as THREE from 'three';
import { registerGeometry, solidMesh } from '../systems/GeometrySystem.js';
import { getMaterial, createToggleMaterial } from '../systems/MaterialSystem.js';
import { getModel } from '../systems/ModelLoader.js';

// Standing Lamp
registerGeometry('standingLamp', (mats) => {
  const model = getModel('standingLamp', mats, new THREE.Vector3(0.18, 0.05, 0));
  if (model) return model;

  const base = solidMesh(new THREE.CylinderGeometry(0.15, 0.2, 0.06, 16), getMaterial(mats.base ?? 'darkGray'));
  const pole = solidMesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8), getMaterial(mats.pole ?? 'darkCharcoal'));
  pole.position.y = 0.73;
  const shadeMat = createToggleMaterial(mats.shade ?? 'warmGlowCone');
  const shade = solidMesh(new THREE.ConeGeometry(0.32, 0.4, 16, 1, true), shadeMat);
  shade.position.y = 1.5;
  shade.rotation.x = Math.PI;
  shade.name = 'shade';
  return {
    meshes: [base, pole, shade],
    meta: { indicatorPos: new THREE.Vector3(0.18, 0.05, 0) },
  };
});

// Bedside Lamp
registerGeometry('bedsideLamp', (mats) => {
  const model = getModel('bedsideLamp', mats, new THREE.Vector3(0.1, 0.05, 0));
  if (model) return model;

  const base = solidMesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 12), getMaterial(mats.base ?? 'darkCharcoal'));
  const pole = solidMesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), getMaterial(mats.pole ?? 'grayPlastic'));
  pole.position.y = 0.2;
  const shadeMat = createToggleMaterial(mats.shade ?? 'warmGlowBright');
  const shade = solidMesh(new THREE.ConeGeometry(0.15, 0.2, 12, 1, true), shadeMat);
  shade.position.y = 0.4;
  shade.rotation.x = Math.PI;
  shade.name = 'shade';
  return {
    meshes: [base, pole, shade],
    meta: { indicatorPos: new THREE.Vector3(0.1, 0.05, 0) },
  };
});

// Desk Lamp
registerGeometry('deskLamp', (mats) => {
  const model = getModel('deskLamp', mats, new THREE.Vector3(0.0, 0.05, 0.1));
  if (model) return model;

  const base = solidMesh(new THREE.CylinderGeometry(0.09, 0.11, 0.03, 12), getMaterial(mats.base ?? 'darkGray'));
  const arm1 = solidMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), getMaterial(mats.arm ?? 'darkCharcoal'));
  arm1.position.y = 0.16;
  const arm2 = solidMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6), getMaterial(mats.arm ?? 'darkCharcoal'));
  arm2.position.set(0.1, 0.32, 0);
  arm2.rotation.z = Math.PI / 4;
  const headMat = createToggleMaterial(mats.head ?? 'warmGlowCone');
  const head = solidMesh(new THREE.ConeGeometry(0.08, 0.16, 10, 1, true), headMat);
  head.position.set(0.25, 0.4, 0);
  head.rotation.z = Math.PI / 2;
  head.name = 'head';
  return {
    meshes: [base, arm1, arm2, head],
    meta: { indicatorPos: new THREE.Vector3(0.0, 0.05, 0.1) },
  };
});

// Ceiling Light — square panel (kitchen)
registerGeometry('ceilingLightSquare', (mats) => {
  const model = getModel('ceilingLightSquare', mats, new THREE.Vector3(0.4, -0.05, 0.4));
  if (model) return model;

  const panelMat = createToggleMaterial(mats.panel ?? 'ceilingWarm');
  const panel = solidMesh(new THREE.BoxGeometry(0.9, 0.05, 0.9), panelMat);
  panel.name = 'panel';
  return {
    meshes: [panel],
    meta: { indicatorPos: new THREE.Vector3(0.4, -0.05, 0.4) },
  };
});

// Ceiling Light — round panel (bedrooms, bath)
registerGeometry('ceilingLightRound', (mats) => {
  const model = getModel('ceilingLightRound', mats, new THREE.Vector3(0.3, -0.05, 0.3));
  if (model) return model;

  const panelMat = createToggleMaterial(mats.panel ?? 'ceilingNeutral');
  const panel = solidMesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 24), panelMat);
  panel.name = 'panel';
  return {
    meshes: [panel],
    meta: { indicatorPos: new THREE.Vector3(0.3, -0.05, 0.3) },
  };
});
