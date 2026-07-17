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

// Inset an axis-aligned (rectilinear) polygon inward by `margin`. Every edge
// is either horizontal or vertical, so at each vertex exactly one adjacent
// edge shifts its x and the other shifts its z — this walks the perimeter
// once and works for any orthogonal outline (convex rect or a staircase of
// notches), which is what lets one cove-light span an irregular open-plan
// room shape instead of just a rectangle.
function insetRectPolygon(pts, margin) {
  const n = pts.length;
  const normalOf = (a, b) => {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    return [-dz / len, dx / len]; // edge direction rotated +90°, points inward
  };
  return pts.map((cur, i) => {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const nPrev = normalOf(prev, cur);
    const nNext = normalOf(cur, next);
    const [dx, dz] = Math.abs(nPrev[0]) > 0.5
      ? [nPrev[0] * margin, nNext[1] * margin]
      : [nNext[0] * margin, nPrev[1] * margin];
    return [cur[0] + dx, cur[1] + dz];
  });
}

// Build a flat (x,z) THREE.Shape, optionally with a hole, from point rings.
// THREE.Shape requires a hole's winding to run opposite the outer contour (or
// the earcut triangulator misreads it, leaving stray/missing faces) — since
// `innerPts` here is always an inward inset of the same ring (same winding as
// the outer), it's reversed before building the hole path.
function ringShape(outerPts, innerPts) {
  const shape = new THREE.Shape();
  outerPts.forEach(([x, z], i) => (i === 0 ? shape.moveTo(x, -z) : shape.lineTo(x, -z)));
  shape.closePath();
  if (innerPts) {
    const hole = new THREE.Path();
    const rev = [...innerPts].reverse();
    rev.forEach(([x, z], i) => (i === 0 ? hole.moveTo(x, -z) : hole.lineTo(x, -z)));
    hole.closePath();
    shape.holes.push(hole);
  }
  return shape;
}

// Extrude a flat (x,z) shape into a solid of the given height, then lay it
// flat so the shape's plane becomes the XZ plane and the extrusion becomes Y.
// Beveled by default (small radius) so the drop's edges read as soft plaster
// coving rather than a hard 90° cut, like the reference tray ceiling.
function extrudeFlat(shape, height, { bevel = true } = {}) {
  const bevelSize = Math.min(0.02, height / 2);
  const geo = new THREE.ExtrudeGeometry(shape, bevel
    ? { depth: height - bevelSize, bevelEnabled: true, bevelThickness: bevelSize, bevelSize, bevelSegments: 3 }
    : { depth: height, bevelEnabled: false });
  geo.rotateX(-Math.PI / 2);
  // MeshStandardMaterial defaults to FrontSide; a custom extruded ring's face
  // winding after the rotateX above isn't guaranteed to face the room's
  // interior (unlike an authored BoxGeometry), so callers set the material to
  // DoubleSide to avoid faces disappearing ("transparent ceiling") from below.
  return geo;
}

// Cove Light ("siling kapur") — Malaysian plaster-ceiling cove lighting: a
// perimeter soffit band dropped below the ceiling with a hidden warm LED strip
// washing a raised central panel (see reference: recessed tray + warm rim glow).
// Origin at the ceiling-plane centre of the room, hangs downward. Two ways to
// size it:
//   config.size  = [innerWidth, innerDepth] — simple rectangular room.
//   config.shape = [[x,z], ...]             — wall-face polygon (world XZ,
//     rectilinear/orthogonal only) for an open-plan room that isn't a plain
//     rectangle; a downlight is placed at every vertex.
registerGeometry('coveLight', (mats, config) => {
  const BAND = 0.45;      // soffit band width in from each wall
  const PANEL_Y = -0.06;  // central panel level below the structural ceiling
  const DROP = 0.20;      // soffit underside below the structural ceiling
  const soffitH = DROP + PANEL_Y; // vertical extent -DROP..PANEL_Y → 0.14

  // DoubleSide: the extruded polygon ring's face winding isn't guaranteed to
  // face the room interior (unlike an authored BoxGeometry), so without this
  // some faces disappear from below — the "transparent ceiling" bug.
  const trayMat = getMaterial(mats.tray ?? 'whitePlastic', { side: 'DoubleSide' });
  const panelMat = createToggleMaterial(mats.panel ?? 'plasterGlow', { side: 'DoubleSide' });
  const stripMat = createToggleMaterial(mats.strip ?? 'ledStrip', { side: 'DoubleSide' });
  const downlightMat = createToggleMaterial(mats.downlight ?? 'downlightLens');
  const meshes = [];
  let indicatorPos;

  if (config?.shape) {
    const wallFace = config.shape;
    const opening = insetRectPolygon(wallFace, BAND);
    const panelRing = insetRectPolygon(wallFace, BAND - 0.05);   // +0.1 overlap hides the seam
    const stripOuter = insetRectPolygon(wallFace, BAND - 0.02);
    const stripInner = insetRectPolygon(wallFace, BAND + 0.03);  // ~0.05-wide glow ring
    const corners = insetRectPolygon(wallFace, BAND / 2);        // downlight position per vertex

    // Perimeter soffit ring (wallFace outer, opening as a hole), dropped below
    // the structural ceiling. Flagged as a camera occluder like the box path.
    const soffit = solidMesh(extrudeFlat(ringShape(wallFace, opening), soffitH), trayMat);
    soffit.position.y = -DROP;
    soffit.userData.occludeCamera = true;
    meshes.push(soffit);

    // Raised central panel spanning the opening.
    const panel = solidMesh(extrudeFlat(ringShape(panelRing), 0.02), panelMat);
    panel.position.y = PANEL_Y - 0.02;
    panel.name = 'panel';
    meshes.push(panel);

    // Hidden LED strip hugging the opening's inner edge — kept crisp (no
    // bevel) so the bright line doesn't blur into a bulge.
    const strip = solidMesh(extrudeFlat(ringShape(stripOuter, stripInner), 0.035, { bevel: false }), stripMat);
    strip.position.y = -0.088 - 0.0175;
    strip.name = 'strip';
    meshes.push(strip);

    // Recessed downlight at every corner of the perimeter (see reference:
    // small round spots in the plaster band). Offset well past -DROP: the
    // soffit's beveled edge (see extrudeFlat) extends its actual bottom face
    // roughly bevelSize (~0.02) below the nominal -DROP, so the old -0.004/
    // -0.009 clearance was inside that overhang — buried in the plaster
    // instead of hanging visibly below it.
    const lensGeos = [];
    for (const [cx, cz] of corners) {
      const trim = solidMesh(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 16), getMaterial('aluminum'));
      trim.position.set(cx, -DROP - 0.03, cz);
      meshes.push(trim);
      lensGeos.push(new THREE.CylinderGeometry(0.04, 0.04, 0.01, 16).translate(cx, -DROP - 0.035, cz));
    }
    const downlights = solidMesh(mergeGeometries(lensGeos), downlightMat);
    downlights.name = 'downlights';
    meshes.push(downlights);

    indicatorPos = new THREE.Vector3(corners[0][0] + 0.4, -0.21, corners[0][1] + 0.3);
  } else {
    const [w, d] = config?.size ?? [6, 6];
    const ow = w / 2 - BAND; // central opening half-width
    const od = d / 2 - BAND; // central opening half-depth

    // Perimeter soffit: four slabs from PANEL_Y down to DROP. Flagged as camera
    // occluders — the follow camera's indoor height clamp sits inside this band,
    // so main.js adds these to the occlusion set to keep the camera out of them.
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
    const panel = solidMesh(new THREE.BoxGeometry(2 * ow + 0.1, 0.02, 2 * od + 0.1), panelMat);
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
    const strip = solidMesh(mergeGeometries(stripGeos), stripMat);
    strip.name = 'strip';
    meshes.push(strip);

    // Recessed downlights in the four soffit corners. Aluminum trim ring per
    // corner + one merged glowing-lens mesh so a single emissive behavior
    // toggles all four.
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
    const downlights = solidMesh(mergeGeometries(lensGeos), downlightMat);
    downlights.name = 'downlights';
    meshes.push(downlights);

    indicatorPos = new THREE.Vector3(0.4, -0.21, d / 2 - BAND / 2);
  }

  return { meshes, meta: { indicatorPos } };
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

// Recessed Downlight — the small flush spot seen tucked in a cove corner
// (see coveLight's per-corner trim+lens), but standalone so it can be mounted
// anywhere on a flat ceiling, not just at a cove's inset corners.
registerGeometry('downlight', (mats) => {
  const trim = solidMesh(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 16), getMaterial(mats.trim ?? 'aluminum'));
  trim.position.y = -0.006;

  const lens = solidMesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.01, 16),
    createToggleMaterial(mats.panel ?? 'downlightLens')
  );
  lens.position.y = -0.013;
  lens.name = 'panel';

  return {
    meshes: [trim, lens],
    meta: { indicatorPos: new THREE.Vector3(0.08, -0.02, 0) },
  };
});
