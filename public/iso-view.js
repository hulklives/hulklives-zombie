window.ISO_VIEW_ENABLED = true;

const ISO_SCALE = 0.72;

function applyIsoWorldTransform(ctx, camera, shake = { x: 0, y: 0 }) {
  const cx = camera.x;
  const cy = camera.y;
  const ox = ISO_SCALE * (cy - cx) + (shake.x || 0);
  const oy = (-ISO_SCALE * 0.5 * (cx + cy)) + (shake.y || 0);
  ctx.setTransform(ISO_SCALE, ISO_SCALE * 0.5, -ISO_SCALE, ISO_SCALE * 0.5, ox, oy);
}

function isoScreenToWorld(sx, sy, camera, shake = { x: 0, y: 0 }) {
  const cx = camera.x;
  const cy = camera.y;
  const ox = ISO_SCALE * (cy - cx) + (shake.x || 0);
  const oy = (-ISO_SCALE * 0.5 * (cx + cy)) + (shake.y || 0);
  const a = (sx - ox) / ISO_SCALE;
  const b = (2 * (sy - oy)) / ISO_SCALE;
  return { x: (a + b) * 0.5, y: (b - a) * 0.5 };
}

function getIsoSortDepth(wx, wy) {
  return wx + wy;
}

function getIsoSpriteAngle(angle) {
  const segments = 8;
  const tau = Math.PI * 2;
  const normalized = ((angle || 0) % tau + tau) % tau;
  const step = tau / segments;
  return Math.round(normalized / step) * step * 0.65;
}

function getIsoSpriteLift(size) {
  return size * 0.1;
}

function drawIsoEntityBase(cx, cy, size, tint = "rgba(70,110,82,0.28)") {
  const hw = size * 0.38;
  const hh = size * 0.19;
  const baseY = cy + size * 0.12;

  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(cx, baseY + hh * 0.15, hw * 1.05, hh * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.moveTo(cx, baseY - hh * 0.55);
  ctx.lineTo(cx + hw, baseY);
  ctx.lineTo(cx, baseY + hh * 0.75);
  ctx.lineTo(cx - hw, baseY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(130,200,150,0.22)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function fillIsoBackdrop(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#0a2214");
  gradient.addColorStop(0.45, "#0c2e1a");
  gradient.addColorStop(1, "#06180e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

window.applyIsoWorldTransform = applyIsoWorldTransform;
window.isoScreenToWorld = isoScreenToWorld;
window.getIsoSortDepth = getIsoSortDepth;
window.getIsoSpriteAngle = getIsoSpriteAngle;
window.getIsoSpriteLift = getIsoSpriteLift;
window.drawIsoEntityBase = drawIsoEntityBase;
window.fillIsoBackdrop = fillIsoBackdrop;
