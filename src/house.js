import * as THREE from 'three';

const THICK = 0.2;
const WALL_H = 3.0;
const RAIL_H = 1.0; // balcony parapet height

// Layout (top-down, matches the floor plan; north = -Z):
//   X: -15 .. +15   Z: -12 .. +12
//
//   Top row:    LIVING (open, -15..-6) | BR3 (-6..-0.5) | BR2 (-0.5..5) | BALCONY (5..15)
//   Balcony NE corner is a quarter-circle parapet (open-air, under the roof).
//   Right side: MASTER BATH (7.5..15, z -3.5..2.5) ensuite of MASTER BEDROOM (4.5..15, z 2.5..12)
//   Middle:     open hall; BATH 2 (-1.5..4.5, z 5.5..12)
//   Left:       DINING (open), KITCHEN walled (-15..-7.5, z 5..12)
//   Front door on the south wall at x -5.5..-3.5.

// Balcony corner arc (quarter circle bulging toward the NE corner)
const ARC = { cx: 10.5, cz: -7.5, r: 4.5 };

export const ROOMS = {
  BR3:   { name: 'Bilik Tidur 3',    cx: -3.25, cz: -7.75, xMin: -6,   xMax: -0.5, zMin: -12,  zMax: -3.5 },
  BR2:   { name: 'Bilik Tidur 2',    cx: 2.25,  cz: -7.75, xMin: -0.5, xMax: 5,    zMin: -12,  zMax: -3.5 },
  MBATH: { name: 'Bilik Air Utama',  cx: 11.25, cz: -0.5,  xMin: 7.5,  xMax: 15,   zMin: -3.5, zMax: 2.5 },
  MBR:   { name: 'Bilik Tidur Utama',cx: 9.75,  cz: 7.25,  xMin: 4.5,  xMax: 15,   zMin: 2.5,  zMax: 12 },
  BATH2: { name: 'Bilik Air 2',      cx: 1.5,   cz: 8.75,  xMin: -1.5, xMax: 4.5,  zMin: 5.5,  zMax: 12 },
  KIT:   { name: 'Dapur',            cx: -11.25,cz: 8.5,   xMin: -15,  xMax: -7.5, zMin: 5,    zMax: 12 },
  BALC:  { name: 'Balkoni',          cx: 10,    cz: -7.75, xMin: 5,    xMax: 15,   zMin: -12,  zMax: -3.5 },
  LIV:   { name: 'Ruang Tamu',       cx: -10.5, cz: -6,    xMin: -15,  xMax: -6,   zMin: -12,  zMax: 0 },
  DIN:   { name: 'Ruang Makan',      cx: -10.5, cz: 2.5,   xMin: -15,  xMax: -6,   zMin: 0,    zMax: 5 },
  // Open hall, split into non-overlapping rectangles (all one "room" to the HUD)
  HALL1: { name: 'Ruang Legar',      cx: 0.75,  cz: -0.5,  xMin: -6,   xMax: 7.5,  zMin: -3.5, zMax: 2.5 },
  HALL2: { name: 'Ruang Legar',      cx: -0.75, cz: 4,     xMin: -6,   xMax: 4.5,  zMin: 2.5,  zMax: 5.5 },
  HALL3: { name: 'Ruang Legar',      cx: -3.75, cz: 8.75,  xMin: -6,   xMax: -1.5, zMin: 5.5,  zMax: 12 },
  HALL4: { name: 'Ruang Legar',      cx: -6.75, cz: 8.5,   xMin: -7.5, xMax: -6,   zMin: 5,    zMax: 12 },
};

export function buildHouse(scene) {
  const walls = [];      // structural wall collision AABBs (also drawn on the minimap)
  const wallMeshes = []; // meshes for camera occlusion raycast
  const furniture = [];  // furniture collision AABBs (empty for now — furniture pass comes later)

  const matOuter = new THREE.MeshStandardMaterial({ color: 0xe8d5b7, roughness: 0.92 });
  const matInner = new THREE.MeshStandardMaterial({ color: 0xc4ad8b, roughness: 0.92 });

  // ---- Outer walls ----
  // North: full height over the bedrooms/living, parapet across the balcony
  buildWallAlongX(scene, walls, wallMeshes, matOuter, -12, -15, 5, []);
  buildWallAlongX(scene, walls, wallMeshes, matOuter, -12, 5, ARC.cx, [], RAIL_H);        // balcony parapet
  buildArcParapet(scene, walls, wallMeshes, matOuter, RAIL_H);                            // curved corner
  // East: parapet beside the balcony, full height along master bath/bedroom
  buildWallAlongZ(scene, walls, wallMeshes, matOuter, 15, ARC.cz, -3.5, [], RAIL_H);      // balcony parapet
  buildWallAlongZ(scene, walls, wallMeshes, matOuter, 15, -3.5, 12, []);
  // South (front door gap) and west
  buildWallAlongX(scene, walls, wallMeshes, matOuter, 12, -15, 15, [[-5.5, -3.5]]);
  buildWallAlongZ(scene, walls, wallMeshes, matOuter, -15, -12, 12, []);

  // ---- Interior walls ----
  // Bedroom dividers
  buildWallAlongZ(scene, walls, wallMeshes, matInner, -6,   -12, -3.5, []);   // living | BR3
  buildWallAlongZ(scene, walls, wallMeshes, matInner, -0.5, -12, -3.5, []);   // BR3 | BR2
  buildWallAlongZ(scene, walls, wallMeshes, matInner,  5,   -12, -3.5, []);   // BR2 | balcony
  // South wall of the bedroom/balcony row: BR3 door, BR2 door, balcony door
  buildWallAlongX(scene, walls, wallMeshes, matInner, -3.5, -6, 15, [[-4.5, -2.5], [1, 3], [5.3, 7.3]]);
  // Master bath west wall
  buildWallAlongZ(scene, walls, wallMeshes, matInner, 7.5, -3.5, 2.5, []);
  // Master row divider: MBR entry (from hall) + ensuite door (from bedroom)
  buildWallAlongX(scene, walls, wallMeshes, matInner, 2.5, 4.5, 15, [[5.2, 7.2], [10, 12]]);
  // Master bedroom west wall (also bath 2's east wall)
  buildWallAlongZ(scene, walls, wallMeshes, matInner, 4.5, 2.5, 12, []);
  // Bath 2
  buildWallAlongX(scene, walls, wallMeshes, matInner, 5.5, -1.5, 4.5, [[0.8, 2.8]]);
  buildWallAlongZ(scene, walls, wallMeshes, matInner, -1.5, 5.5, 12, []);
  // Kitchen (enclosed; open pass-through counter on the north wall facing the
  // dining area — see buildKitchenCounter — instead of a solid wall there)
  buildWallAlongX(scene, walls, wallMeshes, matInner, 5, -15, -7.5, [[-13.125, -9.375]]);
  // Door gap shortened from [6,8] to [6,7.5] — the kitchen cabinet model's
  // east edge sits almost flush with this wall (x≈-7.62) and its footprint
  // now runs from z≈7.49 to the south wall, overlapping the lower half of
  // the old gap. Shrinking the gap lengthens the solid wall to back the
  // cabinet instead of the cabinet overhanging into open doorway space.
  buildWallAlongZ(scene, walls, wallMeshes, matInner, -7.5, 5, 12, [[6, 7.5]]);
  const { stoolSpots } = buildKitchenCounter(scene, furniture);

  // ---- Per-room floors (non-overlapping rectangles) ----
  const floors = [
    { c: 0xb89978, r: ROOMS.BR3 },
    { c: 0xb89978, r: ROOMS.BR2 },
    { c: 0xc8c8d0, r: ROOMS.MBATH }, // tile
    { c: 0xa98d68, r: ROOMS.MBR },
    { c: 0xc8c8d0, r: ROOMS.BATH2 }, // tile
    { c: 0x7d6650, r: ROOMS.KIT },
    { c: 0xa68b5b, r: ROOMS.LIV },
    { c: 0x977c52, r: ROOMS.DIN },
    { c: 0x9c8760, r: ROOMS.HALL1 },
    { c: 0x9c8760, r: ROOMS.HALL2 },
    { c: 0x9c8760, r: ROOMS.HALL3 },
    { c: 0x9c8760, r: ROOMS.HALL4 },
  ];
  for (const { c, r } of floors) {
    const w = r.xMax - r.xMin, d = r.zMax - r.zMin;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set((r.xMin + r.xMax) / 2, 0.01, (r.zMin + r.zMax) / 2);
    m.receiveShadow = true;
    scene.add(m);
  }
  buildBalconyFloor(scene);

  // Outer ground apron (in front of front door)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 50),
    new THREE.MeshStandardMaterial({ color: 0x1a2218, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.02, 12);
  ground.receiveShadow = true;
  scene.add(ground);

  // A "doormat" so the front door is obvious
  const mat = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 1),
    new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 1 })
  );
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(-4.5, 0.02, 13);
  scene.add(mat);

  // Interior ceiling just under wall height: seals the top of every room so you
  // can't see over the walls into adjacent rooms — only through doorways. Casts
  // no shadow, so moonlight still reaches the interior. Covers the balcony too
  // (it reads as the roof soffit of a covered veranda).
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 24),
    new THREE.MeshStandardMaterial({ color: 0xcfc7b6, roughness: 0.95, side: THREE.DoubleSide })
  );
  ceiling.rotation.x = Math.PI / 2; // face downward into the rooms
  ceiling.position.set(0, WALL_H - 0.03, 0);
  ceiling.castShadow = false;
  ceiling.receiveShadow = false;
  scene.add(ceiling);

  const doors = buildDoors(scene);
  const roof = buildRoof(scene);

  return { walls, wallMeshes, furniture, roof, doors, ceiling, stoolSpots };
}

function buildWallAlongX(scene, walls, wallMeshes, mat, z, xStart, xEnd, gaps, h = WALL_H) {
  for (const [s, e] of subtractGaps(xStart, xEnd, gaps)) {
    const len = e - s;
    if (len <= 0.01) continue;
    const geo = new THREE.BoxGeometry(len, h, THICK);
    const m = new THREE.Mesh(geo, mat);
    m.position.set((s + e) / 2, h / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    walls.push({ minX: s, maxX: e, minZ: z - THICK / 2, maxZ: z + THICK / 2 });
    wallMeshes.push(m);
  }
}

function buildWallAlongZ(scene, walls, wallMeshes, mat, x, zStart, zEnd, gaps, h = WALL_H) {
  for (const [s, e] of subtractGaps(zStart, zEnd, gaps)) {
    const len = e - s;
    if (len <= 0.01) continue;
    const geo = new THREE.BoxGeometry(THICK, h, len);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, h / 2, (s + e) / 2);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    walls.push({ minX: x - THICK / 2, maxX: x + THICK / 2, minZ: s, maxZ: e });
    wallMeshes.push(m);
  }
}

// Quarter-circle parapet on the balcony's NE corner, built from short straight
// segments. Each segment registers its own (slightly padded) collision AABB.
function buildArcParapet(scene, walls, wallMeshes, mat, h) {
  const { cx, cz, r } = ARC;
  const N = 12;
  for (let i = 0; i < N; i++) {
    const t0 = (i / N) * (Math.PI / 2);
    const t1 = ((i + 1) / N) * (Math.PI / 2);
    const x0 = cx + r * Math.sin(t0), z0 = cz - r * Math.cos(t0);
    const x1 = cx + r * Math.sin(t1), z1 = cz - r * Math.cos(t1);
    const dx = x1 - x0, dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(THICK, h, len + 0.06), mat);
    m.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
    m.rotation.y = Math.atan2(dx, dz);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    walls.push({
      minX: Math.min(x0, x1) - THICK / 2, maxX: Math.max(x0, x1) + THICK / 2,
      minZ: Math.min(z0, z1) - THICK / 2, maxZ: Math.max(z0, z1) + THICK / 2,
    });
    wallMeshes.push(m);
  }
}

// Balcony floor: rectangle with the NE corner rounded off along the parapet arc.
function buildBalconyFloor(scene) {
  const { cx, cz, r } = ARC;
  const b = ROOMS.BALC;
  // ShapeGeometry lies in XY; after rotation.x = -PI/2, shape y maps to world -z.
  const shape = new THREE.Shape();
  shape.moveTo(b.xMin, -b.zMax);          // (5, 3.5)
  shape.lineTo(b.xMax, -b.zMax);          // (15, 3.5)
  shape.lineTo(b.xMax, -cz);              // (15, 7.5) — arc start
  shape.absarc(cx, -cz, r, 0, Math.PI / 2, false); // curve to (10.5, 12)
  shape.lineTo(b.xMin, -b.zMin);          // (5, 12)
  shape.closePath();
  const m = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 16),
    new THREE.MeshStandardMaterial({ color: 0x8f8f96, roughness: 0.98 }) // concrete
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.01;
  m.receiveShadow = true;
  scene.add(m);
}

// Breakfast-bar pass-through counter on the kitchen's north wall (x ∈
// [-13.125,-9.375], z=5), where the wall was opened up. Counter-height only
// (registered as furniture, not a wall), so the camera and sightlines stay
// open across it while it still blocks foot traffic between the two rooms.
// Returns the stool anchor points (dining side, z < counter z) so main.js can
// place the real cafe-stool model there once it's loaded — building the
// counter itself stays synchronous, but the stool asset loads async.
function buildKitchenCounter(scene, furniture) {
  const cx = -11.25, z = 5, len = 3.75;
  const baseH = 1.0, topH = 0.05, baseT = 0.6, topT = 0.9;
  const cabinetMat = new THREE.MeshStandardMaterial({ color: 0xd7ccc8, roughness: 0.85 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.35 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(len, baseH, baseT), cabinetMat);
  base.position.set(cx, baseH / 2, z);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);

  // Top matches the base's width exactly now (no more left/right overhang
  // past the cabinet ends, per feedback) — keeps only the front/back lip
  // (topT + 0.3) that the stools tuck under.
  const top = new THREE.Mesh(new THREE.BoxGeometry(len, topH, topT + 0.3), topMat);
  top.position.set(cx, baseH + topH / 2, z);
  top.castShadow = true;
  top.receiveShadow = true;
  scene.add(top);

  furniture.push({
    minX: cx - len / 2, maxX: cx + len / 2,
    minZ: z - topT / 2 - 0.15, maxZ: z + topT / 2 + 0.15,
  });

  return { stoolSpots: [[cx - 1.0, z - 0.7], [cx, z - 0.7], [cx + 1.0, z - 0.7]] };
}

function subtractGaps(start, end, gaps) {
  if (!gaps.length) return [[start, end]];
  const sorted = [...gaps].sort((a, b) => a[0] - b[0]);
  const out = [];
  let cur = start;
  for (const [gs, ge] of sorted) {
    if (gs > cur) out.push([cur, Math.min(gs, end)]);
    cur = Math.max(cur, ge);
    if (cur >= end) break;
  }
  if (cur < end) out.push([cur, end]);
  return out;
}

// ---------- Roof (gabled, ridge along X at z=0) ----------
// DoubleSide so it reads solid from any outside angle; main.js hides it when the
// camera climbs above the walls to look down into the house. No shadow casting,
// so when it's visible it never darkens the interior.
function roofQuad(a, b, c, d, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(
    [...a, ...b, ...c, ...a, ...c, ...d], 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
function roofTri(a, b, c, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
function buildRoof(scene) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a4b38, roughness: 0.88, side: THREE.DoubleSide });
  const OX = 15.8, OZ = 12.8, base = 3.0, peak = 5.0; // 0.8 overhang past the walls
  const NW = [-OX, base, -OZ], NE = [OX, base, -OZ];
  const SW = [-OX, base,  OZ], SE = [OX, base,  OZ];
  const RW = [-OX, peak, 0],   RE = [OX, peak, 0];
  const g = new THREE.Group();
  g.add(roofQuad(NW, NE, RE, RW, mat)); // north slope
  g.add(roofQuad(SE, SW, RW, RE, mat)); // south slope
  g.add(roofTri(NW, SW, RW, mat));      // west gable
  g.add(roofTri(NE, SE, RE, mat));      // east gable
  g.traverse((o) => { o.castShadow = false; o.receiveShadow = false; });
  // Always visible & solid; the camera is kept below it via occlusion (main.js).
  scene.add(g);
  return g;
}

// ---------- Doors ----------
// Hinged leaves in every doorway. They start CLOSED with a collider blocking
// the opening; the player opens/closes them with E (handled in main.js), which
// animates the leaf and swaps the collider between the doorway (closed) and the
// swung-open leaf footprint (open). Returns door objects.
//   axis 'z' -> wall runs along Z at x=fixed, gap along Z from gapStart..+2
//   axis 'x' -> wall runs along X at z=fixed, gap along X from gapStart..+2
function buildDoors(scene) {
  return [
    makeDoor(scene, 'x', -3.5, -4.5,  Math.PI / 2, 'Pintu Bilik Tidur 3'),   // hall -> BR3 (swings north)
    makeDoor(scene, 'x', -3.5,  1,    Math.PI / 2, 'Pintu Bilik Tidur 2'),   // hall -> BR2 (swings north)
    makeDoor(scene, 'x', -3.5,  5.3,  Math.PI / 2, 'Pintu Balkoni'),         // hall -> balcony (swings north)
    makeDoor(scene, 'x',  2.5,  5.2, -Math.PI / 2, 'Pintu Bilik Utama'),     // hall -> master BR (swings south)
    makeDoor(scene, 'x',  2.5,  10,   Math.PI / 2, 'Pintu Bilik Air Utama'), // master BR -> ensuite (swings north)
    makeDoor(scene, 'x',  5.5,  0.8, -Math.PI / 2, 'Pintu Bilik Air 2'),     // hall -> bath 2 (swings south)
    // hall -> kitchen doorway is left open (no door leaf) at x=-7.5, z ∈ [6,8].
    makeDoor(scene, 'x',  12,  -5.5,  Math.PI / 2, 'Pintu Depan'),           // outside -> hall (swings north)
  ];
}
function makeDoor(scene, axis, fixed, gapStart, openAngle, name) {
  const DOOR_H = 2.3, LEAF = 1.86, halfT = 0.12;
  const g0 = gapStart, g1 = gapStart + 2, gc = gapStart + 1;
  const along = axis === 'z'; // leaf/gap run along Z (else along X)
  const headerMat = new THREE.MeshStandardMaterial({ color: 0xc4ad8b, roughness: 0.92 });
  const frameMat  = new THREE.MeshStandardMaterial({ color: 0x5a4636, roughness: 0.8 });
  const woodMat   = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.7 });

  // Lintel above the opening (drops the doorway from the 3.0 wall to DOOR_H)
  const header = new THREE.Mesh(
    along ? new THREE.BoxGeometry(0.2, 3.0 - DOOR_H, 2.0)
          : new THREE.BoxGeometry(2.0, 3.0 - DOOR_H, 0.2), headerMat);
  header.position.set(along ? fixed : gc, (DOOR_H + 3.0) / 2, along ? gc : fixed);
  header.castShadow = true; header.receiveShadow = true;
  scene.add(header);

  // Jambs framing the opening
  for (const s of [g0, g1]) {
    const jamb = new THREE.Mesh(
      along ? new THREE.BoxGeometry(0.24, DOOR_H, 0.12)
            : new THREE.BoxGeometry(0.12, DOOR_H, 0.24), frameMat);
    jamb.position.set(along ? fixed : s, DOOR_H / 2, along ? s : fixed);
    jamb.castShadow = true; jamb.receiveShadow = true;
    scene.add(jamb);
  }

  // Hinged leaf (pivot at the gapStart jamb). rotation.y=0 -> closed.
  const group = new THREE.Group();
  group.position.set(along ? fixed : gapStart, 0, along ? gapStart : fixed);
  group.rotation.y = 0;
  const leaf = new THREE.Mesh(
    along ? new THREE.BoxGeometry(0.05, DOOR_H - 0.05, LEAF)
          : new THREE.BoxGeometry(LEAF, DOOR_H - 0.05, 0.05), woodMat);
  leaf.position.set(along ? 0 : LEAF / 2, DOOR_H / 2, along ? LEAF / 2 : 0);
  leaf.castShadow = true; leaf.receiveShadow = true;
  group.add(leaf);
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.14, 8),
    new THREE.MeshStandardMaterial({ color: 0xc9b037, metalness: 0.6, roughness: 0.4 }));
  if (along) { handle.rotation.x = Math.PI / 2; handle.position.set(0.07, DOOR_H / 2 - 0.1, LEAF - 0.2); }
  else       { handle.rotation.z = Math.PI / 2; handle.position.set(LEAF - 0.2, DOOR_H / 2 - 0.1, 0.07); }
  group.add(handle);
  scene.add(group);

  // Collision: closed = doorway AABB; open = swung-leaf footprint AABB.
  const hx = along ? fixed : gapStart, hz = along ? gapStart : fixed;
  const dir = along
    ? { x: Math.sin(openAngle), z: Math.cos(openAngle) }  // local +Z rotated by openAngle
    : { x: Math.cos(openAngle), z: -Math.sin(openAngle) }; // local +X rotated by openAngle
  const fx = hx + dir.x * LEAF, fz = hz + dir.z * LEAF;
  const closedBounds = along
    ? { minX: fixed - halfT, maxX: fixed + halfT, minZ: g0, maxZ: g1 }
    : { minX: g0, maxX: g1, minZ: fixed - halfT, maxZ: fixed + halfT };
  const openBounds = {
    minX: Math.min(hx, fx) - halfT, maxX: Math.max(hx, fx) + halfT,
    minZ: Math.min(hz, fz) - halfT, maxZ: Math.max(hz, fz) + halfT,
  };

  return {
    type: 'door', name, group, leaf,
    open: false, openAngle, closedAngle: 0,
    collider: { active: true, ...closedBounds },
    closedBounds, openBounds,
    ix: along ? fixed : gc, iz: along ? gc : fixed, // interaction anchor
  };
}
