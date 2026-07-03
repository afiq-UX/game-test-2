import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { registerGeometry, solidMesh } from '../systems/GeometrySystem.js';
import { getMaterial, createToggleMaterial } from '../systems/MaterialSystem.js';

// TV — 75" class, wall-mounted. Origin at panel centre (config y = screen
// centre height on the wall). Faces +Z. See design-system/00-art-style.md.
registerGeometry('tv', (mats) => {
  const frameMat = getMaterial(mats.frame ?? 'blackPlastic');
  const standMat = getMaterial(mats.stand ?? 'darkGray');

  // Display panel with a thin uniform bezel
  const panel = solidMesh(new RoundedBoxGeometry(1.66, 0.96, 0.04, 2, 0.008), frameMat);

  // Screen inset into the front face — single named mesh for the emissive toggle
  const screen = solidMesh(new THREE.BoxGeometry(1.60, 0.90, 0.006), createToggleMaterial(mats.screen ?? 'screenOn'));
  screen.position.z = 0.02;
  screen.name = 'screen';

  // Electronics bulge on the back (gives the side profile some truth)
  const back = solidMesh(new RoundedBoxGeometry(0.92, 0.56, 0.05, 2, 0.012), frameMat);
  back.position.set(0, -0.08, -0.04);

  // Bottom chin strip with a small logo chip
  const chin = solidMesh(new THREE.BoxGeometry(1.66, 0.03, 0.012), standMat);
  chin.position.set(0, -0.495, 0.012);
  const logo = solidMesh(new THREE.BoxGeometry(0.10, 0.015, 0.004), getMaterial('aluminum'));
  logo.position.set(0, -0.495, 0.021);

  // Wall-mount bracket reaching back toward the wall (wall face sits ~0.15 behind)
  const bracket = solidMesh(new THREE.BoxGeometry(0.30, 0.36, 0.10), standMat);
  bracket.position.set(0, -0.02, -0.105);

  return {
    meshes: [panel, screen, back, chin, logo, bracket],
    meta: { indicatorPos: new THREE.Vector3(0.72, -0.46, 0.04) },
  };
});

// Computer Monitor — 27" desk monitor. Origin at base bottom (config y = desk
// top). Faces +Z toward the chair. See design-system/00-art-style.md.
registerGeometry('computerMonitor', (mats) => {
  const standMat = getMaterial(mats.stand ?? 'darkGray');
  const frameMat = getMaterial(mats.frame ?? 'blackPlastic');

  // Flat weighted base
  const base = solidMesh(new RoundedBoxGeometry(0.24, 0.018, 0.17, 2, 0.006), standMat);
  base.position.y = 0.009;

  // Neck riser, set slightly behind the panel
  const neck = solidMesh(new THREE.BoxGeometry(0.055, 0.30, 0.022), standMat);
  neck.position.set(0, 0.165, -0.045);

  // VESA-style attachment block between neck and panel back
  const vesa = solidMesh(new THREE.BoxGeometry(0.11, 0.11, 0.024), frameMat);
  vesa.position.set(0, 0.30, -0.026);

  // Display panel — thin, near-borderless
  const panel = solidMesh(new RoundedBoxGeometry(0.62, 0.37, 0.016, 2, 0.005), frameMat);
  panel.position.set(0, 0.32, -0.008);

  const screen = solidMesh(new THREE.BoxGeometry(0.596, 0.346, 0.004), createToggleMaterial(mats.screen ?? 'screenOnAlt'));
  screen.position.set(0, 0.32, 0.001);
  screen.name = 'screen';

  return {
    meshes: [base, neck, vesa, panel, screen],
    meta: { indicatorPos: new THREE.Vector3(0.27, 0.155, 0.01) },
  };
});
