// systems/BehaviorSystem.js
// Composable behavior factories. Each returns { setup, tick, turnOff }.

export const Behaviors = {
  // Spins a named child mesh around Y axis
  spin: (config) => ({
    setup(group, state) {
      state._spinTarget = group.getObjectByName(config.target) || null;
      state._spinSpeed = config.speed || 5;
    },
    tick(state, dt) {
      if (state.on && state._spinTarget) {
        state._spinTarget.rotation.y += dt * state._spinSpeed;
      }
    },
    turnOff() {},
  }),

  // Toggles emissive intensity on a named child's material
  emissive: (config) => ({
    setup(group, state) {
      const mesh = group.getObjectByName(config.target);
      if (mesh && mesh.material) {
        if (!state._emissives) state._emissives = [];
        state._emissives.push({
          mat: mesh.material,
          onIntensity: mesh.material.emissiveIntensity,
          onColor: mesh.material.color.getHex(),
        });
      }
    },
    tick() {},
    turnOff(state) {
      if (!state._emissives) return;
      for (const e of state._emissives) {
        e.mat.emissiveIntensity = 0;
        e.mat.color.setHex(0x0a0a0a);
      }
    },
  }),

  // Point light visibility (light is created by factory, behavior just manages it)
  light: () => ({
    setup() {},
    tick() {},
    turnOff(state) {
      if (state.light) state.light.visible = false;
    },
  }),
};
