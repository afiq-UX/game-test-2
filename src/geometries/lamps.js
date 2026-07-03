import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { registerGeometry, solidMesh } from '../systems/GeometrySystem.js';
import { getMaterial, createToggleMaterial } from '../systems/MaterialSystem.js';

// Standing Lamp — 1.60 m floor lamp. Origin at floor. Weighted disc base,
// collared pole, tapered fabric-style shade. See design-system/00-art-style.md.
registerGeometry('standingLamp', (mats) => {
  const baseMat = getMaterial(mats.base ?? 'darkGray');
  const poleMat = getMaterial(mats.pole ?? 'darkCharcoal');
  const meshes = [];

  // Weighted base: wide disc + smaller cap disc
  const base = solidMesh(new THREE.CylinderGeometry(0.15, 0.16, 0.03, 24), baseMat);
  base.position.y = 0.015;
  const baseCap = solidMesh(new THREE.CylinderGeometry(0.05, 0.07, 0.025, 16), baseMat);
  baseCap.position.y = 0.042;
  meshes.push(base, baseCap);

  // Pole with two joint collars
  const pole = solidMesh(new THREE.CylinderGeometry(0.011, 0.011, 1.26, 10), poleMat);
  pole.position.y = 0.685;
  meshes.push(pole);
  for (const cy of [0.48, 0.95]) {
    const collar = solidMesh(new THREE.CylinderGeometry(0.016, 0.016, 0.025, 10), baseMat);
    collar.position.y = cy;
    meshes.push(collar);
  }

  // Socket cup under the shade
  const socket = solidMesh(new THREE.CylinderGeometry(0.02, 0.026, 0.06, 12), baseMat);
  socket.position.y = 1.335;
  meshes.push(socket);

  // Shade: open tapered drum — single named mesh for the emissive toggle
  const shade = solidMesh(
    new THREE.CylinderGeometry(0.13, 0.19, 0.28, 24, 1, true),
    createToggleMaterial(mats.shade ?? 'warmGlowCone')
  );
  shade.position.y = 1.46;
  shade.name = 'shade';
  meshes.push(shade);

  // Finial on top
  const finial = solidMesh(new THREE.SphereGeometry(0.016, 10, 8), baseMat);
  finial.position.y = 1.615;
  meshes.push(finial);

  return {
    meshes,
    meta: { indicatorPos: new THREE.Vector3(0.04, 1.26, 0.04) },
  };
});

// Bedside Lamp — 0.44 m table lamp. Origin at table surface. Lathed vase body
// with a drum shade.
registerGeometry('bedsideLamp', (mats) => {
  const baseMat = getMaterial(mats.base ?? 'darkCharcoal');
  const poleMat = getMaterial(mats.pole ?? 'grayPlastic');
  const meshes = [];

  // Lathed vase-profile body (radius, height pairs from bottom to top)
  const profile = [
    new THREE.Vector2(0.060, 0.000),
    new THREE.Vector2(0.063, 0.015),
    new THREE.Vector2(0.052, 0.060),
    new THREE.Vector2(0.047, 0.120),
    new THREE.Vector2(0.028, 0.175),
    new THREE.Vector2(0.016, 0.210),
  ];
  const body = solidMesh(new THREE.LatheGeometry(profile, 20), baseMat);
  meshes.push(body);

  // Stem up to the socket
  const stem = solidMesh(new THREE.CylinderGeometry(0.009, 0.009, 0.09, 8), poleMat);
  stem.position.y = 0.25;
  meshes.push(stem);

  // Drum shade — single named mesh for the emissive toggle
  const shade = solidMesh(
    new THREE.CylinderGeometry(0.088, 0.108, 0.155, 20, 1, true),
    createToggleMaterial(mats.shade ?? 'warmGlowBright')
  );
  shade.position.y = 0.365;
  shade.name = 'shade';
  meshes.push(shade);

  return {
    meshes,
    meta: { indicatorPos: new THREE.Vector3(0.045, 0.06, 0.045) },
  };
});

// Desk Lamp — two-arm architect style, ~0.45 m reach. Origin at desk surface.
// Lower arm leans back, upper arm reaches forward, head aims down at the desk.
registerGeometry('deskLamp', (mats) => {
  const baseMat = getMaterial(mats.base ?? 'darkGray');
  const armMat = getMaterial(mats.arm ?? 'darkCharcoal');
  const meshes = [];

  // Weighted base + short post up to the first joint
  const base = solidMesh(new THREE.CylinderGeometry(0.075, 0.082, 0.02, 20), baseMat);
  base.position.y = 0.01;
  const post = solidMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8), armMat);
  post.position.y = 0.045;
  meshes.push(base, post);

  // Helper: arm segment between two points (same pattern as the side-table legs)
  function armSegment(ax, ay, bx, by, r) {
    const a = new THREE.Vector3(ax, ay, 0);
    const b = new THREE.Vector3(bx, by, 0);
    const seg = solidMesh(new THREE.CylinderGeometry(r, r, a.distanceTo(b), 8), armMat);
    seg.position.copy(a.clone().add(b).multiplyScalar(0.5));
    seg.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      b.clone().sub(a).normalize()
    );
    return seg;
  }
  function joint(x, y, r) {
    const s = solidMesh(new THREE.SphereGeometry(r, 12, 10), armMat);
    s.position.set(x, y, 0);
    return s;
  }

  meshes.push(joint(0, 0.075, 0.018));                 // base joint
  meshes.push(armSegment(0, 0.075, -0.07, 0.26, 0.009)); // lower arm leans back
  meshes.push(joint(-0.07, 0.26, 0.016));              // elbow
  meshes.push(armSegment(-0.07, 0.26, 0.13, 0.36, 0.008)); // upper arm reaches forward
  meshes.push(joint(0.13, 0.36, 0.014));               // wrist

  // Head shade: open cone tilted to aim down-forward onto the desk —
  // single named mesh for the emissive toggle
  const head = solidMesh(
    new THREE.CylinderGeometry(0.02, 0.062, 0.11, 16, 1, true),
    createToggleMaterial(mats.head ?? 'warmGlowCone')
  );
  head.position.set(0.175, 0.33, 0);
  head.rotation.z = 0.6;
  head.name = 'head';
  meshes.push(head);

  return {
    meshes,
    meta: { indicatorPos: new THREE.Vector3(0.06, 0.035, 0.05) },
  };
});

// Cove Light ("siling kapur") — Malaysian plaster-ceiling cove lighting: a
// perimeter soffit band dropped below the ceiling with a hidden warm LED strip
// washing a raised central panel (see reference: recessed tray + warm rim glow).
// Sized per room via config.size = [innerWidth, innerDepth]. Origin at the
// ceiling-plane centre of the room, hangs downward.
registerGeometry('coveLight', (mats, config) => {
  const [w, d] = config?.size ?? [6, 6];
  const BAND = 0.45;      // soffit band width in from each wall
  const PANEL_Y = -0.06;  // central panel level below the structural ceiling
  const DROP = 0.20;      // soffit underside below the structural ceiling
  const ow = w / 2 - BAND; // central opening half-width
  const od = d / 2 - BAND; // central opening half-depth

  const trayMat = getMaterial(mats.tray ?? 'whitePlastic');
  const meshes = [];

  // Perimeter soffit: four slabs from PANEL_Y down to DROP. Flagged as camera
  // occluders — the follow camera's indoor height clamp sits inside this band,
  // so main.js adds these to the occlusion set to keep the camera out of them.
  const soffitH = DROP + PANEL_Y;       // vertical extent -DROP..PANEL_Y → 0.14
  const soffitCY = (PANEL_Y - DROP) / 2; // its midpoint: -0.13
  const soffitDefs = [
    { geo: new THREE.BoxGeometry(w, soffitH, BAND), x: 0, z: -(d / 2 - BAND / 2) }, // north
    { geo: new THREE.BoxGeometry(w, soffitH, BAND), x: 0, z: d / 2 - BAND / 2 },    // south
    { geo: new THREE.BoxGeometry(BAND, soffitH, d - 2 * BAND), x: -(w / 2 - BAND / 2), z: 0 }, // west
    { geo: new THREE.BoxGeometry(BAND, soffitH, d - 2 * BAND), x: w / 2 - BAND / 2, z: 0 },    // east
  ];
  for (const s of soffitDefs) {
    const m = solidMesh(s.geo, trayMat);
    m.position.set(s.x, soffitCY, s.z);
    m.userData.occludeCamera = true;
    meshes.push(m);
  }

  // Raised central panel spanning the opening (slight overlap hides the seam).
  // Faintly emissive so it reads as washed by the cove light; toggles off with it.
  const panel = solidMesh(
    new THREE.BoxGeometry(2 * ow + 0.1, 0.02, 2 * od + 0.1),
    createToggleMaterial(mats.panel ?? 'plasterGlow')
  );
  panel.position.y = PANEL_Y;
  panel.name = 'panel';
  meshes.push(panel);

  // Hidden LED strip: one merged rim hugging the soffit inner faces just under
  // the panel — reads as the bright cove line from below.
  const stripY = -0.088;
  const stripGeos = [
    new THREE.BoxGeometry(2 * ow - 0.1, 0.035, 0.05).translate(0, stripY, -(od - 0.045)), // north
    new THREE.BoxGeometry(2 * ow - 0.1, 0.035, 0.05).translate(0, stripY, od - 0.045),    // south
    new THREE.BoxGeometry(0.05, 0.035, 2 * od - 0.1).translate(-(ow - 0.045), stripY, 0), // west
    new THREE.BoxGeometry(0.05, 0.035, 2 * od - 0.1).translate(ow - 0.045, stripY, 0),    // east
  ];
  const strip = solidMesh(mergeGeometries(stripGeos), createToggleMaterial(mats.strip ?? 'ledStrip'));
  strip.name = 'strip';
  meshes.push(strip);

  // Recessed downlights in the four soffit corners (see reference: small round
  // spots in the plaster band). Aluminum trim ring per corner + one merged
  // glowing-lens mesh so a single emissive behavior toggles all four.
  const cornerX = w / 2 - BAND / 2;
  const cornerZ = d / 2 - BAND / 2;
  const lensGeos = [];
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const trim = solidMesh(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 16), getMaterial('aluminum'));
      trim.position.set(sx * cornerX, -DROP - 0.004, sz * cornerZ);
      meshes.push(trim);
      lensGeos.push(
        new THREE.CylinderGeometry(0.04, 0.04, 0.01, 16)
          .translate(sx * cornerX, -DROP - 0.009, sz * cornerZ)
      );
    }
  }
  const downlights = solidMesh(mergeGeometries(lensGeos), createToggleMaterial(mats.downlight ?? 'downlightLens'));
  downlights.name = 'downlights';
  meshes.push(downlights);

  return {
    meshes,
    meta: { indicatorPos: new THREE.Vector3(0.4, -0.21, d / 2 - BAND / 2) },
  };
});

// Ceiling Light — square LED slim panel (kitchen). Origin at ceiling plane,
// hangs downward.
registerGeometry('ceilingLightSquare', (mats) => {
  const frame = solidMesh(new RoundedBoxGeometry(0.48, 0.045, 0.48, 2, 0.012), getMaterial('aluminum'));
  frame.position.y = -0.0225;

  // Glowing diffuser panel — single named mesh for the emissive toggle
  const panel = solidMesh(new RoundedBoxGeometry(0.42, 0.02, 0.42, 2, 0.006), createToggleMaterial(mats.panel ?? 'ceilingWarm'));
  panel.position.y = -0.048;
  panel.name = 'panel';

  return {
    meshes: [frame, panel],
    meta: { indicatorPos: new THREE.Vector3(0.22, -0.03, 0.22) },
  };
});

// Ceiling Light — round flush-mount dome (bedrooms, bath). Origin at ceiling
// plane, hangs downward.
registerGeometry('ceilingLightRound', (mats) => {
  const trim = solidMesh(new THREE.CylinderGeometry(0.20, 0.195, 0.035, 24), getMaterial('aluminum'));
  trim.position.y = -0.0175;

  // Squashed glass dome — single named mesh for the emissive toggle
  const dome = solidMesh(
    new THREE.SphereGeometry(0.185, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    createToggleMaterial(mats.panel ?? 'ceilingNeutral')
  );
  dome.scale.y = 0.6;
  dome.position.y = -0.03;
  dome.name = 'panel';

  return {
    meshes: [trim, dome],
    meta: { indicatorPos: new THREE.Vector3(0.20, -0.035, 0) },
  };
});
