// controls.js — input wiring. Desktop (keyboard + mouse-look + wheel) and touch
// (joystick + drag-look + pinch + interact button). Both drive a shared
// CameraController and report movement intent via the returned `keys` / `joy`.

const LOOK_SENS = 0.0026;

export function setupDesktopControls(canvas, cam, { onInteract, isGameOver }) {
  const keys = {};
  addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code.startsWith('Arrow')) e.preventDefault(); // arrows drive the camera, not page scroll
    if (e.code === 'KeyE') onInteract();
  });
  addEventListener('keyup', e => { keys[e.code] = false; });

  // Mouse look: just MOVE the mouse to turn the camera — no dragging.
  // Clicking the scene captures the pointer (Pointer Lock) so you can keep
  // turning past the window edge; Esc releases it. movementX/Y is delta-based,
  // so look also works before/without a lock (until the cursor hits an edge).
  canvas.addEventListener('click', () => {
    if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
  });
  addEventListener('mousemove', e => {
    if (isGameOver()) return;
    const dx = e.movementX || 0;
    const dy = e.movementY || 0;
    // non-inverted: move mouse up -> look up
    cam.applyLook(-dx * LOOK_SENS, dy * LOOK_SENS);
  });
  canvas.addEventListener('wheel', e => {
    cam.zoomBy(Math.sign(e.deltaY) * 0.5);
    e.preventDefault();
  }, { passive: false });
  // avoid drag-selecting on the canvas
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  return { keys };
}

export function setupTouchControls(canvas, cam, { onInteract }) {
  const joy = { active: false, x: 0, y: 0 };
  const interactBtn = document.getElementById('interact');

  // Enable touch UI when the PRIMARY pointer is coarse (real phones/tablets) — not
  // merely when a touchscreen exists, which would wrongly show the joystick on
  // mouse-primary touch laptops. Also enable on the first real touchstart as a
  // fallback for devices that mis-report their pointer capabilities.
  function enableTouchUI() {
    if (document.body.classList.contains('touch')) return;
    document.body.classList.add('touch');
    cam.setDist(7); // start further out so the player fits a small screen
  }
  if (window.matchMedia('(pointer: coarse)').matches) enableTouchUI();
  addEventListener('touchstart', enableTouchUI, { once: true, passive: true });

  // --- Virtual joystick ---
  const joyEl = document.getElementById('joy');
  const joyNub = document.getElementById('joyNub');
  const JOY_R = 50; // px travel radius
  let joyId = null;

  function joySet(cx, cy, tx, ty) {
    let dx = tx - cx, dy = ty - cy;
    const d = Math.hypot(dx, dy);
    if (d > JOY_R) { dx *= JOY_R / d; dy *= JOY_R / d; }
    joyNub.style.transform = `translate(${dx}px, ${dy}px)`;
    joy.x = dx / JOY_R;
    joy.y = -dy / JOY_R; // screen up = forward
    joy.active = true;
  }
  function joyReset() {
    joy.active = false; joy.x = 0; joy.y = 0; joyId = null;
    joyNub.style.transform = 'translate(0,0)';
    joyNub.style.background = 'rgba(255,255,255,0.32)';
  }
  joyEl.addEventListener('touchstart', e => {
    e.preventDefault();
    if (joyId !== null) return; // first finger keeps ownership until it lifts
    const t = e.changedTouches[0];
    joyId = t.identifier;
    const r = joyEl.getBoundingClientRect();
    joySet(r.left + r.width / 2, r.top + r.height / 2, t.clientX, t.clientY);
    joyNub.style.background = 'rgba(255,255,255,0.5)';
  }, { passive: false });
  joyEl.addEventListener('touchmove', e => {
    e.preventDefault();
    const r = joyEl.getBoundingClientRect();
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) {
        joySet(r.left + r.width / 2, r.top + r.height / 2, t.clientX, t.clientY);
      }
    }
  }, { passive: false });
  joyEl.addEventListener('touchend', e => {
    for (const t of e.changedTouches) if (t.identifier === joyId) joyReset();
  }, { passive: false });
  joyEl.addEventListener('touchcancel', joyReset);

  // --- Interact button ---
  interactBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    onInteract();
  }, { passive: false });

  // --- Drag-to-look + pinch-to-zoom on the canvas ---
  // We track ONLY touches that started on the canvas (canvasTouches). Using the
  // global e.touches here would wrongly count a finger resting on the joystick or
  // interact button, so a one-finger look + held joystick was misread as a pinch.
  const cv = canvas;
  const canvasTouches = new Map(); // identifier -> { x, y }
  let lookId = null, lookX = 0, lookY = 0;
  let pinchStartDist = 0, pinchStartCam = 0;

  function pinchPair() {
    const ids = [...canvasTouches.keys()];
    if (ids.length < 2) return null;
    return [canvasTouches.get(ids[0]), canvasTouches.get(ids[1])];
  }
  function beginPinch() {
    const p = pinchPair();
    if (!p) return;
    pinchStartDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    pinchStartCam = cam.distDesired;
    lookId = null; // pinch suspends look
  }
  function beginLook(id) {
    const t = canvasTouches.get(id);
    if (!t) return;
    lookId = id; lookX = t.x; lookY = t.y;
  }

  cv.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const t of e.changedTouches) canvasTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
    if (canvasTouches.size >= 2) beginPinch();
    else if (lookId === null) beginLook(e.changedTouches[0].identifier);
  }, { passive: false });

  cv.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (canvasTouches.has(t.identifier)) canvasTouches.set(t.identifier, { x: t.clientX, y: t.clientY });
    }
    // Pinch: two canvas-owned fingers
    if (canvasTouches.size >= 2 && pinchStartDist > 0) {
      const p = pinchPair();
      const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      if (d > 0) cam.setDist(pinchStartCam * (pinchStartDist / d));
      return;
    }
    // Look: drag the tracked look finger
    if (lookId === null) return;
    for (const t of e.changedTouches) {
      if (t.identifier === lookId) {
        // non-inverted: drag up -> look up
        cam.applyLook(-(t.clientX - lookX) * 0.006, (t.clientY - lookY) * 0.006);
        lookX = t.clientX; lookY = t.clientY;
      }
    }
  }, { passive: false });

  function endCanvasTouch(e) {
    for (const t of e.changedTouches) canvasTouches.delete(t.identifier);
    if (canvasTouches.size < 2) {
      pinchStartDist = 0;
      // If a pinch (or a lifted look finger) degraded to one canvas finger,
      // hand that finger control of look so drag-to-look resumes without a re-tap.
      if (canvasTouches.size === 1) beginLook(canvasTouches.keys().next().value);
      else lookId = null;
    }
  }
  cv.addEventListener('touchend', endCanvasTouch, { passive: false });
  cv.addEventListener('touchcancel', endCanvasTouch, { passive: false });

  return { joy };
}
