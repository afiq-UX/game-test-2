// nerdStats.js — debug overlay for hunting frame drops: FPS + frame-time
// sparkline, draw calls, triangles, shader program count, scene/light counts.
//
// Toggle: F3 (desktop), `?stats` in the URL (works on phones), or
// `nerdStats.toggle()` from the console.
//
// frame() must be called right AFTER renderer.render() — renderer.info holds
// the numbers of the frame that just rendered and resets on the next one.
// Per-frame cost while visible is one ring-buffer push + a ~140px canvas
// blit; DOM text and the scene traversal only refresh every 250 ms, and when
// the panel is hidden frame() is just the ring-buffer push.

const SAMPLES = 140;   // one bar per frame, also the sparkline width in px
const GRAPH_H = 36;
const SCALE_MS = 40;   // sparkline vertical range: 0..40 ms

export function createNerdStats(renderer, scene, { tier = '?' } = {}) {
  const root = document.createElement('div');
  root.id = 'nerdStats';
  root.style.cssText = [
    'position:fixed',
    'top:calc(118px + env(safe-area-inset-top))',
    'left:calc(12px + env(safe-area-inset-left))',
    'z-index:640',
    'pointer-events:none',
    'background:rgba(5,8,18,0.72)',
    'border:1px solid rgba(255,255,255,0.12)',
    'border-radius:8px',
    'padding:8px 10px',
    'font:11px/1.5 ui-monospace,Menlo,monospace',
    'color:#cfe0ff',
    'white-space:pre',
    'text-shadow:0 1px 2px rgba(0,0,0,0.8)',
  ].join(';');

  const text = document.createElement('div');
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLES;
  canvas.height = GRAPH_H;
  canvas.style.cssText = `display:block;margin-top:6px;width:${SAMPLES}px;height:${GRAPH_H}px`;
  const ctx = canvas.getContext('2d');
  root.append(text, canvas);
  document.body.appendChild(root);

  let visible = new URLSearchParams(location.search).has('stats');
  root.style.display = visible ? 'block' : 'none';
  function toggle() {
    visible = !visible;
    root.style.display = visible ? 'block' : 'none';
  }
  addEventListener('keydown', (e) => {
    if (e.code === 'F3') { e.preventDefault(); toggle(); }
  });
  // Console escape hatch — also the only toggle on touch devices without ?stats.
  window.nerdStats = { toggle };

  // Ring buffer of frame durations (ms). Filled even while hidden so the
  // graph is already meaningful the moment the panel opens.
  const times = new Float32Array(SAMPLES);
  let head = 0;
  let last = performance.now();
  let lastTextAt = 0;

  function fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
    return String(n);
  }

  function drawSpark() {
    ctx.clearRect(0, 0, SAMPLES, GRAPH_H);
    // 60 fps (16.7 ms) reference line
    const refY = GRAPH_H - (16.7 / SCALE_MS) * GRAPH_H;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, refY, SAMPLES, 1);
    for (let i = 0; i < SAMPLES; i++) {
      const ms = times[(head + i) % SAMPLES]; // oldest → newest, left → right
      if (!ms) continue;
      const h = Math.min(ms / SCALE_MS, 1) * GRAPH_H;
      ctx.fillStyle = ms < 17 ? '#5dd486' : ms < 34 ? '#f0b452' : '#f2606a';
      ctx.fillRect(i, GRAPH_H - h, 1, h);
    }
  }

  // Counting via traverse is cheap at 4×/s for a scene this size, and it runs
  // only while the panel is open.
  function sceneCounts() {
    let meshes = 0, visMeshes = 0, lights = 0, lit = 0, shadows = 0;
    scene.traverse((o) => {
      if (o.isMesh) { meshes++; if (o.visible) visMeshes++; }
      else if (o.isLight) {
        lights++;
        if (o.intensity > 0) lit++;
        if (o.castShadow) shadows++;
      }
    });
    return { meshes, visMeshes, lights, lit, shadows };
  }

  function updateText() {
    let sum = 0, worst = 0, n = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const ms = times[i];
      if (!ms) continue;
      sum += ms; n++;
      if (ms > worst) worst = ms;
    }
    const avg = n ? sum / n : 0;
    const fps = avg ? 1000 / avg : 0;

    const r = renderer.info.render;
    const m = renderer.info.memory;
    const sc = sceneCounts();
    const dpr = renderer.getPixelRatio();
    const buf = renderer.domElement; // .width/.height = drawing buffer (CSS px × DPR)
    const heap = performance.memory
      ? (performance.memory.usedJSHeapSize / 1048576).toFixed(0) + ' MB'
      : 'n/a';

    text.textContent =
      `FPS ${fps.toFixed(0).padStart(3)}  avg ${avg.toFixed(1)}ms  worst ${worst.toFixed(0)}ms\n` +
      `draws ${r.calls}  tris ${fmt(r.triangles)}\n` +
      `progs ${renderer.info.programs.length}  geo ${m.geometries}  tex ${m.textures}\n` +
      `mesh ${sc.visMeshes}/${sc.meshes} vis  light ${sc.lit}/${sc.lights} lit ${sc.shadows} shdw\n` +
      `${buf.width}×${buf.height} @${dpr.toFixed(1)}x  tier ${tier}\n` +
      `heap ${heap}`;
  }

  function frame() {
    const now = performance.now();
    times[head] = now - last;
    head = (head + 1) % SAMPLES;
    last = now;
    if (!visible) return;
    drawSpark();
    if (now - lastTextAt > 250) {
      lastTextAt = now;
      updateText();
    }
  }

  return { frame, toggle };
}
