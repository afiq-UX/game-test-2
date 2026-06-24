import * as THREE from 'three';

const THICK = 0.2;
const WALL_H = 3.0;

// Layout (top-down):
//   X: -15 .. +15   Z: -12 .. +12
//   z = -2 splits north (bedrooms+bath) from south (kitchen+living+dining)
//   x = -5 and x = +5 split the rows into three rooms each
//
//   North row (z: -12 .. -2): BR1 (-15..-5) | BATH (-5..5) | BR2 (5..15)
//   South row (z: -2  .. 12): KIT (-15..-5) | LIV  (-5..5) | DIN (5..15)

export const ROOMS = {
  BR1:  { name: 'Bilik Tidur 1', cx: -10, cz: -7,  xMin: -15, xMax: -5, zMin: -12, zMax: -2 },
  BATH: { name: 'Bilik Air',     cx: 0,   cz: -7,  xMin: -5,  xMax: 5,  zMin: -12, zMax: -2 },
  BR2:  { name: 'Bilik Tidur 2', cx: 10,  cz: -7,  xMin: 5,   xMax: 15, zMin: -12, zMax: -2 },
  KIT:  { name: 'Dapur',         cx: -10, cz: 5,   xMin: -15, xMax: -5, zMin: -2,  zMax: 12 },
  LIV:  { name: 'Ruang Tamu',    cx: 0,   cz: 5,   xMin: -5,  xMax: 5,  zMin: -2,  zMax: 12 },
  DIN:  { name: 'Ruang Makan',   cx: 10,  cz: 5,   xMin: 5,   xMax: 15, zMin: -2,  zMax: 12 },
};

export function buildHouse(scene) {
  const walls = [];      // structural wall collision AABBs (also drawn on the minimap)
  const wallMeshes = []; // meshes for camera occlusion raycast
  const furniture = [];  // furniture collision AABBs (collision only, not on the minimap)

  const matOuter = new THREE.MeshStandardMaterial({ color: 0xe8d5b7, roughness: 0.92 });
  const matInner = new THREE.MeshStandardMaterial({ color: 0xc4ad8b, roughness: 0.92 });

  // Outer walls
  buildWallAlongX(scene, walls, wallMeshes, matOuter, -12, -15, 15, []);                    // north
  buildWallAlongX(scene, walls, wallMeshes, matOuter,  12, -15, 15, [[-1.2, 1.2]]);          // south w/ front door
  buildWallAlongZ(scene, walls, wallMeshes, matOuter, -15, -12, 12, []);                    // west
  buildWallAlongZ(scene, walls, wallMeshes, matOuter,  15, -12, 12, []);                    // east

  // Interior horizontal divider (z = -2). Doorways to the two bedrooms only;
  // the centre is solid so the TV (at x=0) has a wall behind it.
  buildWallAlongX(scene, walls, wallMeshes, matInner, -2, -15, 15, [[-12, -10], [10, 12]]);

  // Interior verticals.
  // BR1|BATH and KIT|LIV share x=-5. Doors: BR1->BATH at z ∈ [-9,-7]; KIT->LIV at z ∈ [3,5].
  buildWallAlongZ(scene, walls, wallMeshes, matInner, -5, -12, 12, [[-9, -7], [3, 5]]);
  // BATH|BR2 and LIV|DIN share x=+5. Same gaps.
  buildWallAlongZ(scene, walls, wallMeshes, matInner,  5, -12, 12, [[-9, -7], [3, 5]]);

  // Per-room floors
  const floors = [
    { c: 0xb89978, ...ROOMS.BR1 },
    { c: 0xc8c8d0, ...ROOMS.BATH }, // tile
    { c: 0xb89978, ...ROOMS.BR2 },
    { c: 0x7d6650, ...ROOMS.KIT },
    { c: 0xa68b5b, ...ROOMS.LIV },
    { c: 0x977c52, ...ROOMS.DIN },
  ];
  for (const f of floors) {
    const w = f.xMax - f.xMin, d = f.zMax - f.zMin;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshStandardMaterial({ color: f.c, roughness: 0.95 })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set((f.xMin + f.xMax) / 2, 0.01, (f.zMin + f.zMax) / 2);
    m.receiveShadow = true;
    scene.add(m);
  }

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
  mat.position.set(0, 0.02, 13);
  scene.add(mat);

  // Collect furniture footprints as collision AABBs (separate from walls so the
  // minimap stays clean and camera occlusion is unchanged).
  furnitureColliders = furniture;
  buildFurniture(scene);
  furnitureColliders = null;

  // Interior ceiling just under wall height: seals the top of every room so you
  // can't see over the walls into adjacent rooms — only through doorways. Casts
  // no shadow, so moonlight still reaches the interior.
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 24),
    new THREE.MeshStandardMaterial({ color: 0xcfc7b6, roughness: 0.95, side: THREE.DoubleSide })
  );
  ceiling.rotation.x = Math.PI / 2; // face downward into the rooms
  ceiling.position.set(0, WALL_H - 0.03, 0);
  ceiling.castShadow = false;
  ceiling.receiveShadow = false;
  scene.add(ceiling);

  const doors = buildBedroomDoors(scene);
  const roof = buildRoof(scene);

  return { walls, wallMeshes, furniture, roof, doors, ceiling };
}

// While set (during buildFurniture), every box() registers a collision AABB here.
let furnitureColliders = null;

function buildWallAlongX(scene, walls, wallMeshes, mat, z, xStart, xEnd, gaps) {
  for (const [s, e] of subtractGaps(xStart, xEnd, gaps)) {
    const len = e - s;
    if (len <= 0.01) continue;
    const geo = new THREE.BoxGeometry(len, WALL_H, THICK);
    const m = new THREE.Mesh(geo, mat);
    m.position.set((s + e) / 2, WALL_H / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    walls.push({ minX: s, maxX: e, minZ: z - THICK / 2, maxZ: z + THICK / 2 });
    wallMeshes.push(m);
  }
}

function buildWallAlongZ(scene, walls, wallMeshes, mat, x, zStart, zEnd, gaps) {
  for (const [s, e] of subtractGaps(zStart, zEnd, gaps)) {
    const len = e - s;
    if (len <= 0.01) continue;
    const geo = new THREE.BoxGeometry(THICK, WALL_H, len);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, WALL_H / 2, (s + e) / 2);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    walls.push({ minX: x - THICK / 2, maxX: x + THICK / 2, minZ: s, maxZ: e });
    wallMeshes.push(m);
  }
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

function box(scene, x, y, z, w, h, d, color, roughness = 0.85) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness })
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  if (furnitureColliders) {
    furnitureColliders.push({
      minX: x - w / 2, maxX: x + w / 2,
      minZ: z - d / 2, maxZ: z + d / 2,
    });
  }
  return m;
}

function buildFurniture(scene) {
  // ===== LIVING ROOM (LIV: x ∈ [-5,5], z ∈ [-2,12]) =====
  // TV on north wall: TV stand
  box(scene, 0, 0.3, -1.5, 2.6, 0.5, 0.4, 0x3e2723);
  // Sofa, facing north
  box(scene, 0, 0.4, 8, 3.0, 0.6, 1.2, 0x5d4037);
  box(scene, 0, 0.85, 8.55, 3.0, 0.6, 0.2, 0x6d5047);
  box(scene, -1.6, 0.65, 8, 0.25, 0.5, 1.2, 0x6d5047); // armrest L
  box(scene, 1.6, 0.65, 8, 0.25, 0.5, 1.2, 0x6d5047);  // armrest R
  // Coffee table
  box(scene, 0, 0.32, 5.5, 1.6, 0.05, 0.8, 0x3e2723);
  box(scene, -0.7, 0.17, 5.5, 0.08, 0.3, 0.08, 0x3e2723);
  box(scene, 0.7, 0.17, 5.5, 0.08, 0.3, 0.08, 0x3e2723);
  box(scene, -0.7, 0.17, 5.5 - 0.35, 0.08, 0.3, 0.08, 0x3e2723);
  box(scene, 0.7, 0.17, 5.5 + 0.35, 0.08, 0.3, 0.08, 0x3e2723);
  // Rug
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x6a3a3a, roughness: 1 })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.015, 6);
  scene.add(rug);

  // ===== KITCHEN (KIT: x ∈ [-15,-5], z ∈ [-2,12]) =====
  // Counter along west wall (x ≈ -14)
  box(scene, -13.7, 0.5, 5, 1.6, 1.0, 8, 0xd7ccc8);
  box(scene, -13.7, 1.02, 5, 1.7, 0.05, 8.05, 0x37474f); // counter top
  // Sink basin (just a dark inset visual)
  box(scene, -13.7, 1.06, 1.5, 0.9, 0.08, 0.7, 0x263238);
  // Cabinets up top
  box(scene, -13.9, 2.2, 5, 1.0, 0.7, 8, 0xa1887f);
  // Kitchen island
  box(scene, -8, 0.5, 6, 0.8, 1.0, 3, 0xefebe9);
  box(scene, -8, 1.02, 6, 0.9, 0.05, 3.1, 0x424242);

  // ===== DINING (DIN: x ∈ [5,15], z ∈ [-2,12]) =====
  // Table
  box(scene, 10, 0.5, 5, 2.6, 0.1, 1.4, 0x5d4037);
  for (const [lx, lz] of [[-1.1, -0.55], [1.1, -0.55], [-1.1, 0.55], [1.1, 0.55]]) {
    box(scene, 10 + lx, 0.25, 5 + lz, 0.12, 0.5, 0.12, 0x3e2723);
  }
  // Chairs
  for (const cz of [3.4, 6.6]) {
    box(scene, 10, 0.25, cz, 1.6, 0.5, 0.5, 0x4e342e);
    box(scene, 10, 0.7, cz + (cz > 5 ? 0.22 : -0.22), 1.6, 0.4, 0.06, 0x4e342e);
  }

  // ===== BR1 (x ∈ [-15,-5], z ∈ [-12,-2]) =====
  // Bed (head against west wall)
  box(scene, -12.5, 0.3, -8, 2, 0.4, 3.2, 0x6d4c41); // frame
  box(scene, -12.5, 0.62, -8, 2, 0.25, 3.2, 0xe8e8e8); // mattress
  box(scene, -12.5, 0.85, -9.2, 1.6, 0.18, 0.55, 0xfafafa); // pillow
  // Bedside table
  box(scene, -10, 0.4, -9.5, 0.6, 0.8, 0.5, 0x3e2723);
  // Wardrobe (east wall)
  box(scene, -6, 1.2, -10.5, 0.6, 2.4, 1.6, 0x4e342e);

  // ===== BR2 (x ∈ [5,15], z ∈ [-12,-2]) =====
  box(scene, 12.5, 0.3, -8, 2, 0.4, 3.2, 0x6d4c41);
  box(scene, 12.5, 0.62, -8, 2, 0.25, 3.2, 0xe8e8e8);
  box(scene, 12.5, 0.85, -9.2, 1.6, 0.18, 0.55, 0xfafafa);
  // Desk
  box(scene, 8, 0.5, -4, 1.4, 1.0, 0.7, 0x4e342e);
  // Desk chair
  box(scene, 8, 0.25, -5, 0.5, 0.5, 0.5, 0x212121);
  box(scene, 8, 0.7, -5.22, 0.5, 0.5, 0.06, 0x212121);

  // ===== BATH (x ∈ [-5,5], z ∈ [-12,-2]) =====
  // Bathtub
  box(scene, -3.5, 0.3, -10, 1.4, 0.5, 1.6, 0xfafafa);
  box(scene, -3.5, 0.4, -10, 1.2, 0.3, 1.4, 0xb0bec5); // inner inset
  // Toilet
  box(scene, 3.5, 0.25, -10.5, 0.5, 0.5, 0.6, 0xfafafa);
  box(scene, 3.5, 0.65, -10.85, 0.5, 0.5, 0.1, 0xfafafa);
  // Sink/vanity
  box(scene, 3.5, 0.5, -4, 1.2, 1.0, 0.5, 0xfafafa);
  // Bath mat
  const bathmat = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x5e9aa6, roughness: 1 })
  );
  bathmat.rotation.x = -Math.PI / 2;
  bathmat.position.set(0, 0.02, -7);
  scene.add(bathmat);
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

// ---------- Bedroom doors ----------
// Hinged leaves at the bedroom doorways. They start CLOSED with a collider
// blocking the opening; the player opens/closes them with E (handled in
// main.js), which animates the leaf and swaps the collider between the doorway
// (closed) and the swung-open leaf footprint (open). Returns door objects.
//   axis 'z' -> wall runs along Z at x=fixed, gap along Z from gapStart..+2
//   axis 'x' -> wall runs along X at z=fixed, gap along X from gapStart..+2
function buildBedroomDoors(scene) {
  return [
    makeDoor(scene, 'z', -5, -9, -Math.PI / 2, 'Pintu Bilik 1 (Bilik Air)'), // BR1 <-> bath
    makeDoor(scene, 'z',  5, -9,  Math.PI / 2, 'Pintu Bilik 2 (Bilik Air)'), // BR2 <-> bath
    makeDoor(scene, 'x', -2, -12, Math.PI / 2, 'Pintu Bilik 1 (Dapur)'),     // BR1 <-> kitchen
    makeDoor(scene, 'x', -2,  10, Math.PI / 2, 'Pintu Bilik 2 (Makan)'),     // BR2 <-> dining
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
