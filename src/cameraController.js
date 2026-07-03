// cameraController.js — third-person follow camera: owns yaw/pitch/zoom state and
// runs the per-frame follow with raycast occlusion (GTA/RDR2 style pull-in).
import * as THREE from 'three';
import { clampCameraInside } from './collision.js';

const CAM_DIST_MIN = 2.5;
const CAM_DIST_MAX = 11;   // shared by wheel (desktop) and pinch (mobile)

export function createCameraController(camera, occluders, walls) {
  const raycaster = new THREE.Raycaster();
  const head = new THREE.Vector3();
  const dir = new THREE.Vector3();

  return {
    yaw: 0,            // 0 = looking north (-Z)
    pitch: 0.45,
    distDesired: 5.5,
    distCurrent: 5.5,

    // Apply look deltas (already scaled by the caller's sensitivity) with pitch clamp.
    applyLook(dYaw, dPitch) {
      this.yaw += dYaw;
      this.pitch += dPitch;
      this.pitch = Math.max(0.12, Math.min(1.25, this.pitch));
    },

    zoomBy(delta) { this.setDist(this.distDesired + delta); },
    setDist(v) { this.distDesired = Math.max(CAM_DIST_MIN, Math.min(CAM_DIST_MAX, v)); },

    update(dt, playerPos) {
      head.copy(playerPos);
      head.y += 1.15; // eye level of the 1.30 m kid character
      dir.set(
        Math.cos(this.pitch) * Math.sin(this.yaw),
        Math.sin(this.pitch),
        Math.cos(this.pitch) * Math.cos(this.yaw),
      );
      let dist = this.distDesired;
      raycaster.set(head, dir);
      raycaster.far = dist + 0.5;
      // Occlude against walls AND roof: tilting up / backing into a wall pulls the
      // camera in toward the player instead of clipping through (GTA/RDR2 style).
      // Low floor + bigger buffer so it stays IN FRONT of a near wall rather than
      // being forced past it.
      const hits = raycaster.intersectObjects(occluders, false);
      if (hits.length && hits[0].distance < dist) {
        dist = Math.max(0.4, hits[0].distance - 0.3);
      }
      this.distCurrent += (dist - this.distCurrent) * Math.min(1, dt * 12);
      camera.position.copy(head).addScaledVector(dir, this.distCurrent);
      clampCameraInside(walls, camera.position, playerPos); // never leave the house
      camera.lookAt(head);
    },
  };
}
