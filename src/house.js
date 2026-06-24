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
  const walls = [];      // collision AABBs
  const wallMeshes = []; // meshes for camera occlusion raycast

  const matOuter = new THREE.MeshStandardMaterial({ color: 0xe8d5b7, roughness: 0.92 });
  const matInner = new THREE.MeshStandardMaterial({ color: 0xc4ad8b, roughness: 0.92 });

  // Outer walls
  buildWallAlongX(scene, walls, wallMeshes, matOuter, -12, -15, 15, []);                    // north
  buildWallAlongX(scene, walls, wallMeshes, matOuter,  12, -15, 15, [[-1.2, 1.2]]);          // south w/ front door
  buildWallAlongZ(scene, walls, wallMeshes, matOuter, -15, -12, 12, []);                    // west
  buildWallAlongZ(scene, walls, wallMeshes, matOuter,  15, -12, 12, []);                    // east

  // Interior horizontal divider (z = -2). Doorways one per north room.
  buildWallAlongX(scene, walls, wallMeshes, matInner, -2, -15, 15, [[-12, -10], [-1, 1], [10, 12]]);

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

  buildFurniture(scene);

  return { walls, wallMeshes };
}

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
