// collision.js — circle-vs-AABB player collision and camera containment.

// Slide a circle (pos, radius) out of any active AABB collider. Mutates pos.
export function collide(colliders, pos, radius) {
  for (const w of colliders) {
    if (w.active === false) continue; // open door — passable
    const cx = Math.max(w.minX, Math.min(pos.x, w.maxX));
    const cz = Math.max(w.minZ, Math.min(pos.z, w.maxZ));
    const dx = pos.x - cx;
    const dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < radius * radius) {
      const d = Math.sqrt(d2) || 0.0001;
      pos.x = cx + (dx / d) * radius;
      pos.z = cz + (dz / d) * radius;
    }
  }
}

// Keep the camera inside the building so it can never go through / see past a
// wall. Clamps to the outer envelope while indoors, then pushes it out of any
// structural wall it lands in (at wall height). Only walls — not low furniture,
// which the camera flies safely above.
const HOUSE_X = 15, HOUSE_Z = 12, WALL_TOP = 3.0, CAM_WALL_R = 0.3;

export function clampCameraInside(walls, cam, p) {
  if (p.x > -HOUSE_X && p.x < HOUSE_X && p.z > -HOUSE_Z && p.z < HOUSE_Z) {
    const m = 0.3;
    cam.x = Math.max(-HOUSE_X + m, Math.min(HOUSE_X - m, cam.x));
    cam.z = Math.max(-HOUSE_Z + m, Math.min(HOUSE_Z - m, cam.z));
    if (cam.y > 2.85) cam.y = 2.85; // stay under the ceiling (no peeking over walls)
  }
  if (cam.y < WALL_TOP) {
    for (const w of walls) {
      const cx = Math.max(w.minX, Math.min(cam.x, w.maxX));
      const cz = Math.max(w.minZ, Math.min(cam.z, w.maxZ));
      const dx = cam.x - cx, dz = cam.z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < CAM_WALL_R * CAM_WALL_R) {
        const d = Math.sqrt(d2) || 0.0001;
        cam.x = cx + (dx / d) * CAM_WALL_R;
        cam.z = cz + (dz / d) * CAM_WALL_R;
      }
    }
  }
}
