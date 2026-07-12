// factory/ApplianceFactory.js
import * as THREE from 'three';
import { createGeometry } from '../systems/GeometrySystem.js';
import { Behaviors } from '../systems/BehaviorSystem.js';

// Shared across all appliances
const INDICATOR_GEO = new THREE.SphereGeometry(0.055, 8, 8);
const INDICATOR_MAT = new THREE.MeshBasicMaterial({ color: 0xff2a2a });

/**
 * Create a single appliance from a config object.
 * @param {object} config — entry from ApplianceConfigs
 * @returns {object} state — { id, name, room, kind, group, indicator, light, on, behaviors }
 */
export function createAppliance(config) {
  const { meshes, meta } = createGeometry(config.geometry, config.materials, config);

  const group = new THREE.Group();
  const scale = config.scale ?? 1;

  // Scale only the model geometry (in its own subgroup) so the LED indicator
  // below keeps its normal size. Behavior targets (e.g. 'rotor') are found by
  // name, so wrapping the meshes in a subgroup doesn't break traversal.
  if (scale !== 1) {
    const modelGroup = new THREE.Group();
    for (const m of meshes) modelGroup.add(m);
    modelGroup.scale.setScalar(scale);
    group.add(modelGroup);
  } else {
    for (const m of meshes) group.add(m);
  }

  // Indicator LED — position scales with the model, size stays constant
  const indicator = new THREE.Mesh(INDICATOR_GEO, INDICATOR_MAT);
  const indPos = (meta.indicatorPos || new THREE.Vector3(0, 1.5, 0)).clone().multiplyScalar(scale);
  indicator.position.copy(indPos);
  group.add(indicator);

  // Lights (optional) — config.light (single) and/or config.lights (array,
  // e.g. cove corner downlights). Offsets scale with the model. Plain
  // omnidirectional PointLights only — no spotlight cones, no realtime shadow
  // casting (reverted per feedback: too heavy for what it added).
  const lightDefs = [];
  if (config.light) lightDefs.push(config.light);
  if (config.lights) lightDefs.push(...config.lights);
  const lights = lightDefs.map(({ color, intensity, distance, decay, offset }) => {
    const light = new THREE.PointLight(color ?? 0xffeebb, intensity ?? 1.0, distance ?? 8, decay ?? 1.5);
    if (offset) light.position.set(offset[0] * scale, offset[1] * scale, offset[2] * scale);
    group.add(light);
    return light;
  });

  // Position and rotation
  group.position.set(config.position[0], config.position[1], config.position[2]);
  if (config.rotation) group.rotation.y = config.rotation;

  // State object
  const state = {
    id: config.id,
    name: config.name,
    room: config.room,
    kind: config.kind,
    group,
    indicator,
    lights,
    on: true,
    _behaviors: [],
  };

  // Wire behaviors
  for (const bCfg of (config.behaviors || [])) {
    const factory = Behaviors[bCfg.type];
    if (!factory) {
      console.warn(`Unknown behavior type: "${bCfg.type}"`);
      continue;
    }
    const behavior = factory(bCfg);
    behavior.setup(group, state);
    state._behaviors.push(behavior);
  }

  return state;
}

/**
 * Create all appliances from an array of configs.
 */
export function createAllAppliances(scene, configs) {
  const list = [];
  for (const config of configs) {
    const appliance = createAppliance(config);
    scene.add(appliance.group);
    list.push(appliance);
  }
  return list;
}

/**
 * Call each frame to update appliance behaviors (fan spin, etc).
 */
export function tickAppliances(appliances, dt) {
  for (const a of appliances) {
    if (!a.on) continue;
    for (const b of a._behaviors) b.tick(a, dt);
  }
}

/**
 * Turn off an appliance — hides indicator, kills lights, runs behavior turnOff.
 *
 * Lights are killed by zeroing intensity, NOT by setting `visible = false`:
 * an invisible light changes three.js's per-type light COUNT, which is a
 * shader compile-time define, so hiding a light forces every material in the
 * scene to recompile — a multi-hundred-ms freeze on every appliance toggle
 * (the core game loop). Zero intensity is a uniform change, so the count
 * stays constant and nothing recompiles. enforceLightBudget keeps it dimmed
 * while `a.on` is false.
 */
export function turnOffAppliance(a) {
  a.on = false;
  a.indicator.visible = false;
  for (const l of a.lights) l.intensity = 0;
  for (const b of a._behaviors) b.turnOff(a);
}
