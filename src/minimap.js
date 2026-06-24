import { ROOMS } from './house.js';

// Top-down room fill colours (muted, so the live dots pop)
const ROOM_COLORS = {
  BR1:  '#3a3326',
  BATH: '#2c363d',
  BR2:  '#3a3326',
  KIT:  '#2a241c',
  LIV:  '#352c20',
  DIN:  '#2f2719',
};

// World footprint (matches house.js layout)
const X0 = -15, X1 = 15, Z0 = -12, Z1 = 12;
const PAD = 6;

function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createMinimap({ walls, appliances }) {
  const canvas = document.getElementById('map');
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(devicePixelRatio || 1, 2);

  let CSS_W = 0, CSS_H = 0, drawW = 0, drawH = 0;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    CSS_W = rect.width || 160;
    CSS_H = rect.height || 128;
    canvas.width = Math.round(CSS_W * DPR);
    canvas.height = Math.round(CSS_H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    drawW = CSS_W - PAD * 2;
    drawH = CSS_H - PAD * 2;
  }
  resize();
  addEventListener('resize', resize);

  const sx = (x) => PAD + ((x - X0) / (X1 - X0)) * drawW;       // world X -> px (east = right)
  const sy = (z) => PAD + ((z - Z0) / (Z1 - Z0)) * drawH;       // world Z -> px (north/-Z = top)

  function update(player, camYaw) {
    if (!CSS_W) resize();
    ctx.clearRect(0, 0, CSS_W, CSS_H);

    // Panel background
    ctx.fillStyle = 'rgba(7,9,18,0.82)';
    roundRect(ctx, 0, 0, CSS_W, CSS_H, 8);
    ctx.fill();

    // Clip to the rounded panel so nothing bleeds past the corners
    ctx.save();
    roundRect(ctx, 0, 0, CSS_W, CSS_H, 8);
    ctx.clip();

    // Room floors
    for (const k in ROOMS) {
      const r = ROOMS[k];
      ctx.fillStyle = ROOM_COLORS[k] || '#2a2a30';
      ctx.fillRect(sx(r.xMin), sy(r.zMin), sx(r.xMax) - sx(r.xMin), sy(r.zMax) - sy(r.zMin));
    }

    // Walls
    ctx.fillStyle = 'rgba(196,205,225,0.5)';
    for (const w of walls) {
      const x = sx(w.minX), y = sy(w.minZ);
      ctx.fillRect(x, y, Math.max(1, sx(w.maxX) - x), Math.max(1, sy(w.maxZ) - y));
    }

    // Exit (front door) marker at south wall, x=0
    ctx.fillStyle = '#46d17a';
    ctx.fillRect(sx(-1.2), sy(12) - 2, sx(1.2) - sx(-1.2), 3);

    // Appliance dots: red+glow if still ON, dim green if OFF
    for (const a of appliances) {
      const p = a.group.position;
      const x = sx(p.x), y = sy(p.z);
      if (a.on) {
        ctx.beginPath();
        ctx.arc(x, y, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,90,60,0.25)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff5a3c';
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(90,210,120,0.6)';
        ctx.fill();
      }
    }

    // Player: view cone + facing triangle
    const px = sx(player.position.x), py = sy(player.position.z);

    // Camera view direction in world (x,z) = -(sin camYaw, cos camYaw); screen Y maps from Z
    const cdx = -Math.sin(camYaw), cdy = -Math.cos(camYaw);
    const coneAng = Math.atan2(cdy, cdx);
    const coneHalf = 0.5, coneR = Math.min(drawW, drawH) * 0.42;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, coneR, coneAng - coneHalf, coneAng + coneHalf);
    ctx.closePath();
    ctx.fillStyle = 'rgba(124,196,255,0.16)';
    ctx.fill();

    // Facing triangle (player.rotation.y: world facing = (sinθ, cosθ))
    const th = player.rotation.y;
    const fx = Math.sin(th), fy = Math.cos(th);
    const perpx = -fy, perpy = fx;
    const S = 5.5, B = 2.5, Wd = 3.2;
    ctx.beginPath();
    ctx.moveTo(px + fx * S, py + fy * S);
    ctx.lineTo(px - fx * B + perpx * Wd, py - fy * B + perpy * Wd);
    ctx.lineTo(px - fx * B - perpx * Wd, py - fy * B - perpy * Wd);
    ctx.closePath();
    ctx.fillStyle = '#7cc4ff';
    ctx.fill();
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.stroke();

    ctx.restore();

    // Panel border (outside the clip)
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, 0.5, 0.5, CSS_W - 1, CSS_H - 1, 8);
    ctx.stroke();
  }

  return { update, resize };
}
