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
  const { meshes, meta } = createGeometry(config.geometry, config.materials);

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

  // Point light (optional) — offset scales with the model
  let pointLight = null;
  if (config.light) {
    const { color, intensity, distance, decay, offset } = config.light;
    pointLight = new THREE.PointLight(
      color ?? 0xffeebb,
      intensity ?? 1.0,
      distance ?? 8,
      decay ?? 1.5
    );
    if (offset) pointLight.position.set(offset[0] * scale, offset[1] * scale, offset[2] * scale);
    group.add(pointLight);
  }

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
    light: pointLight,
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
 * Turn off an appliance — hides indicator, kills light, runs behavior turnOff.
 */
export function turnOffAppliance(a) {
  a.on = false;
  a.indicator.visible = false;
  if (a.light) a.light.visible = false;
  for (const b of a._behaviors) b.turnOff(a);
}
