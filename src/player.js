// player.js — builds the player character (a little kid) as a THREE.Group.
import * as THREE from 'three';

export const PLAYER_RADIUS = 0.32;

export function createPlayer() {
  const player = new THREE.Group();

  const playerBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 0.85, 16),
    new THREE.MeshStandardMaterial({ color: 0x2f5fa8, roughness: 0.8 })
  );
  playerBody.position.y = 0.5;
  playerBody.castShadow = true;

  const playerHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf4c39b, roughness: 0.7 })
  );
  playerHead.position.y = 1.12;
  playerHead.castShadow = true;

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.235, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.1),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
  );
  hair.position.y = 1.16;
  hair.castShadow = true;

  // Tiny "nose" so we can see which way the kid faces
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.08, 8),
    new THREE.MeshStandardMaterial({ color: 0xe8a878 })
  );
  nose.position.set(0, 1.1, 0.21);
  nose.rotation.x = Math.PI / 2;

  player.add(playerBody, playerHead, hair, nose);
  player.position.set(0, 0, 4);
  player.rotation.y = 0; // facing north (toward TV)

  // playerBody is returned separately so the loop can drive the walk bob.
  return { player, playerBody };
}
