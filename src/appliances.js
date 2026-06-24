import * as THREE from 'three';

// Factory helpers
const indMat = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
const indGeo = new THREE.SphereGeometry(0.055, 8, 8);
const sMat = (c, opts = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...opts });

function mesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function make({ name, room, kind, position, rotationY = 0, parts, indicatorPos, light, screen }) {
  const group = new THREE.Group();
  for (const p of parts) group.add(p);
  group.position.copy(position);
  group.rotation.y = rotationY;

  const ind = new THREE.Mesh(indGeo, indMat);
  ind.position.copy(indicatorPos || new THREE.Vector3(0, 1.5, 0));
  group.add(ind);

  let pointLight = null;
  if (light) {
    pointLight = new THREE.PointLight(
      light.color ?? 0xffeebb,
      light.intensity ?? 1.0,
      light.distance ?? 8,
      light.decay ?? 1.5
    );
    pointLight.position.copy(light.position || new THREE.Vector3(0, 0, 0));
    group.add(pointLight);
  }

  return {
    name, room, kind,
    group, indicator: ind, light: pointLight,
    screen: screen || null,
    on: true,
    spinTarget: null,
    spinSpeed: 0,
  };
}

export function createAppliances(scene) {
  const list = [];

  function fanRotor(bladeColor = 0xd4a574) {
    const rotor = new THREE.Group();
    const hub = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 12), sMat(0x222222));
    rotor.add(hub);
    for (let i = 0; i < 4; i++) {
      const b = mesh(new THREE.BoxGeometry(1.6, 0.04, 0.22), sMat(bladeColor));
      b.position.x = 0.8;
      const arm = new THREE.Group();
      arm.add(b);
      arm.rotation.y = (i * Math.PI) / 2;
      rotor.add(arm);
    }
    return rotor;
  }

  // ---------- LIVING ROOM ----------
  // 1. TV (north wall)
  {
    const frame = mesh(new THREE.BoxGeometry(2.6, 1.5, 0.1), sMat(0x111111));
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x224488, emissive: 0x4488cc, emissiveIntensity: 0.9, roughness: 0.4,
    });
    const screen = mesh(new THREE.BoxGeometry(2.4, 1.3, 0.04), screenMat);
    screen.position.z = 0.07;
    const stand = mesh(new THREE.BoxGeometry(0.6, 0.05, 0.4), sMat(0x222222));
    stand.position.y = -0.78;
    const a = make({
      name: 'TV', room: 'LIV', kind: 'screen',
      position: new THREE.Vector3(0, 1.6, -1.75),
      parts: [frame, screen, stand],
      indicatorPos: new THREE.Vector3(1.15, -0.65, 0.08),
      screen: screenMat,
    });
    list.push(a);
  }

  // 2. Ceiling Fan with Light (Living) — fan blades + downlight
  {
    const mount = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8), sMat(0x222222));
    mount.position.y = 0.1;
    const rotor = fanRotor(0xc99e6b);
    rotor.position.y = -0.05;
    const lampDome = mesh(new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffd97a, emissiveIntensity: 1.2, roughness: 0.3 }));
    lampDome.rotation.x = Math.PI;
    lampDome.position.y = -0.18;
    const a = make({
      name: 'Kipas Siling (Ruang Tamu)', room: 'LIV', kind: 'fan-light',
      position: new THREE.Vector3(0, 2.75, 5),
      parts: [mount, rotor, lampDome],
      indicatorPos: new THREE.Vector3(0, -0.35, 0.28),
      light: { color: 0xffe5b0, intensity: 1.4, distance: 9, position: new THREE.Vector3(0, -0.3, 0) },
      screen: lampDome.material,
    });
    a.spinTarget = rotor;
    a.spinSpeed = 7;
    list.push(a);
  }

  // 3. Standing Lamp (LIV corner)
  {
    const base = mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.06, 16), sMat(0x222222));
    const pole = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8), sMat(0x444444));
    pole.position.y = 0.73;
    const shade = mesh(new THREE.ConeGeometry(0.32, 0.4, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffd97a, emissiveIntensity: 1.3, side: THREE.DoubleSide, roughness: 0.4 }));
    shade.position.y = 1.5;
    shade.rotation.x = Math.PI; // open downward
    const a = make({
      name: 'Lampu Berdiri', room: 'LIV', kind: 'lamp',
      position: new THREE.Vector3(-4.2, 0.03, 1.5),
      parts: [base, pole, shade],
      indicatorPos: new THREE.Vector3(0.18, 0.05, 0),
      light: { color: 0xffd9a0, intensity: 1.6, distance: 6, position: new THREE.Vector3(0, 1.4, 0) },
      screen: shade.material,
    });
    list.push(a);
  }

  // 4. Wi-Fi Router
  {
    const body = mesh(new THREE.BoxGeometry(0.4, 0.06, 0.25), sMat(0x111111));
    const ant1 = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), sMat(0x111111));
    ant1.position.set(-0.13, 0.18, -0.08);
    const ant2 = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), sMat(0x111111));
    ant2.position.set(0.13, 0.18, -0.08);
    const a = make({
      name: 'Wi-Fi Router', room: 'LIV', kind: 'gadget',
      position: new THREE.Vector3(-4.2, 0.62, -1.4),
      parts: [body, ant1, ant2],
      indicatorPos: new THREE.Vector3(0.14, 0.05, 0.12),
    });
    list.push(a);
  }

  // 5. Speaker
  {
    const body = mesh(new THREE.BoxGeometry(0.35, 0.7, 0.3), sMat(0x222222));
    const cone1 = mesh(new THREE.CircleGeometry(0.1, 16), sMat(0x111111));
    cone1.position.set(0, 0.15, 0.16);
    const cone2 = mesh(new THREE.CircleGeometry(0.06, 16), sMat(0x111111));
    cone2.position.set(0, -0.15, 0.16);
    const a = make({
      name: 'Speaker', room: 'LIV', kind: 'gadget',
      position: new THREE.Vector3(4.2, 0.4, -1.5),
      parts: [body, cone1, cone2],
      indicatorPos: new THREE.Vector3(0.1, -0.3, 0.16),
    });
    list.push(a);
  }

  // 6. Console (PS5-ish)
  {
    const body = mesh(new THREE.BoxGeometry(0.4, 0.1, 0.3), sMat(0xfafafa));
    const a = make({
      name: 'PlayStation', room: 'LIV', kind: 'gadget',
      position: new THREE.Vector3(-0.7, 0.61, -1.5),
      parts: [body],
      indicatorPos: new THREE.Vector3(0.15, 0.07, 0.16),
    });
    list.push(a);
  }

  // ---------- KITCHEN ----------
  // 7. Fridge — tall, against north interior wall (z = -1.7)
  {
    const body = mesh(new THREE.BoxGeometry(1.0, 2.1, 0.75), sMat(0xeeeeee));
    body.position.y = 1.05;
    const seam = mesh(new THREE.BoxGeometry(1.02, 0.02, 0.76), sMat(0xb0b0b0));
    seam.position.y = 1.3;
    const handle1 = mesh(new THREE.BoxGeometry(0.05, 0.5, 0.04), sMat(0x666666));
    handle1.position.set(0.4, 1.7, 0.4);
    const handle2 = mesh(new THREE.BoxGeometry(0.05, 0.3, 0.04), sMat(0x666666));
    handle2.position.set(0.4, 0.7, 0.4);
    const a = make({
      name: 'Peti Sejuk', room: 'KIT', kind: 'big',
      position: new THREE.Vector3(-6.5, 0, 0.8),
      parts: [body, seam, handle1, handle2],
      indicatorPos: new THREE.Vector3(-0.4, 2.0, 0.4),
    });
    list.push(a);
  }

  // 8. Microwave (on counter)
  {
    const body = mesh(new THREE.BoxGeometry(0.6, 0.35, 0.4), sMat(0x222222));
    const door = mesh(new THREE.BoxGeometry(0.4, 0.28, 0.02), new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.3, metalness: 0.2 }));
    door.position.set(-0.05, 0, 0.21);
    const a = make({
      name: 'Microwave', room: 'KIT', kind: 'gadget',
      position: new THREE.Vector3(-13.6, 1.22, 8),
      parts: [body, door],
      indicatorPos: new THREE.Vector3(0.25, -0.08, 0.21),
    });
    list.push(a);
  }

  // 9. Rice Cooker (Periuk Nasi)
  {
    const body = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.28, 16), sMat(0xfafafa));
    const lid = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16), sMat(0xb0bec5));
    lid.position.y = 0.16;
    const a = make({
      name: 'Periuk Nasi', room: 'KIT', kind: 'gadget',
      position: new THREE.Vector3(-13.6, 1.16, 6),
      parts: [body, lid],
      indicatorPos: new THREE.Vector3(0.15, -0.1, 0.15),
    });
    list.push(a);
  }

  // 10. Kettle (Cerek)
  {
    const body = mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.25, 16), sMat(0xc0c0c0, { metalness: 0.6, roughness: 0.4 }));
    const spout = mesh(new THREE.ConeGeometry(0.04, 0.12, 8), sMat(0xc0c0c0, { metalness: 0.6, roughness: 0.4 }));
    spout.position.set(0.15, 0.05, 0);
    spout.rotation.z = -Math.PI / 3;
    const handle = mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 12, Math.PI), sMat(0x222222));
    handle.position.set(-0.15, 0.05, 0);
    handle.rotation.y = Math.PI / 2;
    const a = make({
      name: 'Cerek', room: 'KIT', kind: 'gadget',
      position: new THREE.Vector3(-13.6, 1.15, 4.4),
      parts: [body, spout, handle],
      indicatorPos: new THREE.Vector3(0.0, -0.1, 0.15),
    });
    list.push(a);
  }

  // 11. Toaster
  {
    const body = mesh(new THREE.BoxGeometry(0.35, 0.22, 0.22), sMat(0xeeeeee, { metalness: 0.4, roughness: 0.5 }));
    const slot = mesh(new THREE.BoxGeometry(0.25, 0.02, 0.08), sMat(0x111111));
    slot.position.y = 0.12;
    const a = make({
      name: 'Toaster', room: 'KIT', kind: 'gadget',
      position: new THREE.Vector3(-13.6, 1.13, 3),
      parts: [body, slot],
      indicatorPos: new THREE.Vector3(0.15, -0.08, 0.12),
    });
    list.push(a);
  }

  // 12. Ceiling Light (Kitchen) — flat panel
  {
    const panel = mesh(new THREE.BoxGeometry(0.9, 0.05, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xfff8e0, emissive: 0xfff0c0, emissiveIntensity: 1.3, roughness: 0.4 }));
    const a = make({
      name: 'Lampu Siling (Dapur)', room: 'KIT', kind: 'ceiling-light',
      position: new THREE.Vector3(-10, 2.92, 5),
      parts: [panel],
      indicatorPos: new THREE.Vector3(0.4, -0.05, 0.4),
      light: { color: 0xfff0c0, intensity: 1.5, distance: 10, position: new THREE.Vector3(0, -0.2, 0) },
      screen: panel.material,
    });
    list.push(a);
  }

  // ---------- DINING ----------
  // 13. Water Dispenser
  {
    const body = mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), sMat(0xeeeeee));
    body.position.y = 0.7;
    const tank = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xa3d8ff, transparent: true, opacity: 0.5, roughness: 0.1 }));
    tank.position.y = 1.6;
    const tap = mesh(new THREE.BoxGeometry(0.12, 0.12, 0.06), sMat(0x444444));
    tap.position.set(0, 0.8, 0.27);
    const a = make({
      name: 'Penyejuk Air', room: 'DIN', kind: 'big',
      position: new THREE.Vector3(14, 0, 11),
      parts: [body, tank, tap],
      indicatorPos: new THREE.Vector3(0.18, 1.0, 0.26),
    });
    list.push(a);
  }

  // 14. Ceiling Fan with Light (Dining)
  {
    const mount = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8), sMat(0x222222));
    mount.position.y = 0.1;
    const rotor = fanRotor(0xc99e6b);
    rotor.position.y = -0.05;
    const lampDome = mesh(new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffd97a, emissiveIntensity: 1.2, roughness: 0.3 }));
    lampDome.rotation.x = Math.PI;
    lampDome.position.y = -0.18;
    const a = make({
      name: 'Kipas Siling (Ruang Makan)', room: 'DIN', kind: 'fan-light',
      position: new THREE.Vector3(10, 2.75, 5),
      parts: [mount, rotor, lampDome],
      indicatorPos: new THREE.Vector3(0, -0.35, 0.28),
      light: { color: 0xffe5b0, intensity: 1.4, distance: 9, position: new THREE.Vector3(0, -0.3, 0) },
      screen: lampDome.material,
    });
    a.spinTarget = rotor;
    a.spinSpeed = 6.5;
    list.push(a);
  }

  // ---------- BR1 ----------
  // 15. Aircond (north wall, high)
  {
    const body = mesh(new THREE.BoxGeometry(2.0, 0.5, 0.4), sMat(0xfafafa));
    const vent = mesh(new THREE.BoxGeometry(1.8, 0.05, 0.08), sMat(0xcccccc));
    vent.position.y = -0.2;
    const a = make({
      name: 'Aircond (Bilik 1)', room: 'BR1', kind: 'big',
      position: new THREE.Vector3(-10, 2.4, -11.7),
      parts: [body, vent],
      indicatorPos: new THREE.Vector3(0.8, -0.1, 0.22),
    });
    list.push(a);
  }

  // 16. Bedside Lamp
  {
    const base = mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 12), sMat(0x444444));
    const pole = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), sMat(0x666666));
    pole.position.y = 0.2;
    const shade = mesh(new THREE.ConeGeometry(0.15, 0.2, 12, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffd97a, emissiveIntensity: 1.4, side: THREE.DoubleSide }));
    shade.position.y = 0.4;
    shade.rotation.x = Math.PI;
    const a = make({
      name: 'Lampu Tepi Katil', room: 'BR1', kind: 'lamp',
      position: new THREE.Vector3(-10, 0.83, -9.5),
      parts: [base, pole, shade],
      indicatorPos: new THREE.Vector3(0.1, 0.05, 0),
      light: { color: 0xffd9a0, intensity: 1.0, distance: 4, position: new THREE.Vector3(0, 0.3, 0) },
      screen: shade.material,
    });
    list.push(a);
  }

  // 17. Phone Charger
  {
    const block = mesh(new THREE.BoxGeometry(0.1, 0.05, 0.07), sMat(0xfafafa));
    const phone = mesh(new THREE.BoxGeometry(0.07, 0.005, 0.14), sMat(0x111111));
    phone.position.set(0.12, 0.0, 0);
    const a = make({
      name: 'Charger Telefon', room: 'BR1', kind: 'small',
      position: new THREE.Vector3(-10, 0.83, -9.7),
      parts: [block, phone],
      indicatorPos: new THREE.Vector3(0, 0.04, 0.04),
    });
    list.push(a);
  }

  // 18. Standing Fan
  {
    const base = mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.05, 16), sMat(0x222222));
    const pole = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8), sMat(0x555555));
    pole.position.y = 0.5;
    const cage = mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 24), sMat(0x666666));
    cage.position.y = 1.1;
    cage.rotation.y = Math.PI / 2;
    const rotor = fanRotor(0x9e9e9e);
    rotor.scale.set(0.32, 0.32, 0.32);
    rotor.position.y = 1.1;
    rotor.rotation.x = Math.PI / 2;
    const a = make({
      name: 'Kipas Berdiri', room: 'BR1', kind: 'fan',
      position: new THREE.Vector3(-7.2, 0.03, -4),
      parts: [base, pole, cage, rotor],
      indicatorPos: new THREE.Vector3(0.2, 0.6, 0),
    });
    a.spinTarget = rotor;
    a.spinSpeed = 10;
    list.push(a);
  }

  // 19. Ceiling Light (BR1)
  {
    const panel = mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 24),
      new THREE.MeshStandardMaterial({ color: 0xfff8e0, emissive: 0xfff0c0, emissiveIntensity: 1.1, roughness: 0.4 }));
    const a = make({
      name: 'Lampu Siling (Bilik 1)', room: 'BR1', kind: 'ceiling-light',
      position: new THREE.Vector3(-10, 2.92, -7),
      parts: [panel],
      indicatorPos: new THREE.Vector3(0.3, -0.05, 0.3),
      light: { color: 0xfff0c0, intensity: 1.2, distance: 8, position: new THREE.Vector3(0, -0.2, 0) },
      screen: panel.material,
    });
    list.push(a);
  }

  // ---------- BR2 ----------
  // 20. Aircond
  {
    const body = mesh(new THREE.BoxGeometry(2.0, 0.5, 0.4), sMat(0xfafafa));
    const vent = mesh(new THREE.BoxGeometry(1.8, 0.05, 0.08), sMat(0xcccccc));
    vent.position.y = -0.2;
    const a = make({
      name: 'Aircond (Bilik 2)', room: 'BR2', kind: 'big',
      position: new THREE.Vector3(10, 2.4, -11.7),
      parts: [body, vent],
      indicatorPos: new THREE.Vector3(0.8, -0.1, 0.22),
    });
    list.push(a);
  }

  // 21. Computer Monitor (on desk)
  {
    const stand = mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.25, 12), sMat(0x222222));
    const arm = mesh(new THREE.BoxGeometry(0.12, 0.02, 0.08), sMat(0x222222));
    arm.position.y = 0.13;
    const panel = mesh(new THREE.BoxGeometry(0.9, 0.55, 0.04), sMat(0x111111));
    panel.position.y = 0.4;
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x224477, emissive: 0x336699, emissiveIntensity: 0.8, roughness: 0.4,
    });
    const screen = mesh(new THREE.BoxGeometry(0.84, 0.49, 0.02), screenMat);
    screen.position.set(0, 0.4, 0.025);
    const a = make({
      name: 'Monitor Komputer', room: 'BR2', kind: 'screen',
      position: new THREE.Vector3(8, 1.05, -4),
      parts: [stand, arm, panel, screen],
      indicatorPos: new THREE.Vector3(0.36, 0.18, 0.03),
      screen: screenMat,
    });
    list.push(a);
  }

  // 22. Desk Lamp
  {
    const base = mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.03, 12), sMat(0x222222));
    const arm1 = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), sMat(0x444444));
    arm1.position.y = 0.16;
    const arm2 = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6), sMat(0x444444));
    arm2.position.set(0.1, 0.32, 0);
    arm2.rotation.z = Math.PI / 4;
    const head = mesh(new THREE.ConeGeometry(0.08, 0.16, 10, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xfff4d6, emissive: 0xffd97a, emissiveIntensity: 1.3, side: THREE.DoubleSide }));
    head.position.set(0.25, 0.4, 0);
    head.rotation.z = Math.PI / 2;
    const a = make({
      name: 'Lampu Meja', room: 'BR2', kind: 'lamp',
      position: new THREE.Vector3(7.4, 1.03, -4.2),
      parts: [base, arm1, arm2, head],
      indicatorPos: new THREE.Vector3(0.0, 0.05, 0.1),
      light: { color: 0xffd9a0, intensity: 0.9, distance: 4, position: new THREE.Vector3(0.25, 0.3, 0) },
      screen: head.material,
    });
    list.push(a);
  }

  // 23. Ceiling Light (BR2)
  {
    const panel = mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 24),
      new THREE.MeshStandardMaterial({ color: 0xfff8e0, emissive: 0xfff0c0, emissiveIntensity: 1.1, roughness: 0.4 }));
    const a = make({
      name: 'Lampu Siling (Bilik 2)', room: 'BR2', kind: 'ceiling-light',
      position: new THREE.Vector3(10, 2.92, -7),
      parts: [panel],
      indicatorPos: new THREE.Vector3(0.3, -0.05, 0.3),
      light: { color: 0xfff0c0, intensity: 1.2, distance: 8, position: new THREE.Vector3(0, -0.2, 0) },
      screen: panel.material,
    });
    list.push(a);
  }

  // ---------- BATH ----------
  // 24. Water Heater (Pemanas Air) — west wall, high
  {
    const body = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.7, 16), sMat(0xfafafa));
    body.rotation.z = Math.PI / 2;
    const pipe = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), sMat(0xb0bec5));
    pipe.position.set(0, -0.2, 0);
    const a = make({
      name: 'Pemanas Air', room: 'BATH', kind: 'big',
      position: new THREE.Vector3(-4.5, 2.4, -10),
      parts: [body, pipe],
      indicatorPos: new THREE.Vector3(0.3, 0.1, 0.25),
    });
    list.push(a);
  }

  // 25. Hair Dryer (on vanity)
  {
    const handle = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), sMat(0xff5577));
    const barrel = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 12), sMat(0xff5577));
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.0, 0.1, 0);
    const a = make({
      name: 'Pengering Rambut', room: 'BATH', kind: 'small',
      position: new THREE.Vector3(3.5, 1.05, -4),
      parts: [handle, barrel],
      indicatorPos: new THREE.Vector3(0.05, 0.15, 0.05),
    });
    list.push(a);
  }

  // 26. Ceiling Light (Bath)
  {
    const panel = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 24),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe6f0ff, emissiveIntensity: 1.3, roughness: 0.3 }));
    const a = make({
      name: 'Lampu Siling (Bilik Air)', room: 'BATH', kind: 'ceiling-light',
      position: new THREE.Vector3(0, 2.93, -7),
      parts: [panel],
      indicatorPos: new THREE.Vector3(0.25, -0.05, 0.25),
      light: { color: 0xe6f0ff, intensity: 1.0, distance: 8, position: new THREE.Vector3(0, -0.2, 0) },
      screen: panel.material,
    });
    list.push(a);
  }

  for (const a of list) scene.add(a.group);
  return list;
}
