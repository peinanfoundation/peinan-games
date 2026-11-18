import type { Mode } from './flow';
import type { FishKind } from './logic';
import { FISH_PHOTO_FACE, fishPhotoLength, fishSprite } from './photos';
import riverUrl from './art/river.jpg';

export interface SceneView {
  time: number;
  mode: Mode;
  fish: FishKind | null;
  fishX: number;
  phase: number;
  shake: number;
  tier: number;
}

const INK = '#243044';

const riverPhoto = new Image();
riverPhoto.src = riverUrl;

function drawRiverPhoto(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  if (!riverPhoto.complete || riverPhoto.naturalWidth === 0) return false;
  const scale = Math.max(w / riverPhoto.naturalWidth, h / riverPhoto.naturalHeight);
  const dw = riverPhoto.naturalWidth * scale;
  const dh = riverPhoto.naturalHeight * scale;
  ctx.drawImage(riverPhoto, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return true;
}

const SKIES: Array<[string, string, string]> = [
  ['#9ed4f6', '#f6e4c0', '#ffe9a8'],
  ['#7ec8ef', '#d7f0c4', '#fff2b8'],
  ['#6eb6e0', '#f3d7a4', '#ffd27a'],
  ['#f09a62', '#f7d2a4', '#ffb15a'],
  ['#5d6ea0', '#e7a07a', '#ffcf8a'],
];

export function drawWorld(ctx: CanvasRenderingContext2D, w: number, h: number, view: SceneView): void {
  const sky = SKIES[Math.min(SKIES.length - 1, Math.max(0, view.tier))];
  const waterY = h * 0.44;
  const bob = Math.sin(view.time * 1.35) * h * 0.008;
  const shake = Math.sin(view.time * 48) * view.shake;

  ctx.clearRect(0, 0, w, h);
  if (!drawRiverPhoto(ctx, w, h)) {
    drawSky(ctx, w, h, waterY, sky, view.time, view.tier);
    drawHills(ctx, w, waterY, view.tier);
    drawRiver(ctx, w, h, waterY, view.time, view.tier);
  }

  ctx.save();
  ctx.translate(shake, 0);
  const boatW = Math.min(w * 0.34, 420);
  const boatX = Math.min(w * 0.34, w * 0.5 - 40);
  const boatY = h * 0.61 + bob;
  drawBoat(ctx, boatX, boatY, boatW);
  const pose = view.mode === 'lift' ? 'lift' : 'sit';
  const fisher = drawFisher(ctx, boatX - boatW * 0.06, boatY - boatW * 0.02, boatW, pose);
  drawTackle(ctx, w, h, waterY, fisher, view);
  ctx.restore();
}

function drawSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  waterY: number,
  sky: [string, string, string],
  time: number,
  tier: number,
): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, waterY);
  gradient.addColorStop(0, sky[0]);
  gradient.addColorStop(0.72, sky[1]);
  gradient.addColorStop(1, sky[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  const sunX = w * (0.74 + tier * 0.02);
  const sunY = waterY * (0.62 - tier * 0.06);
  const sunR = Math.min(w, h) * 0.055;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3.2);
  glow.addColorStop(0, 'rgba(255,244,210,0.95)');
  glow.addColorStop(0.35, 'rgba(255,214,140,0.35)');
  glow.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = tier >= 3 ? '#ffb15a' : '#fff6d4';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  for (let index = 0; index < 3; index += 1) {
    const drift = ((time * 18 + index * 320) % (w + 280)) - 140;
    drawCloud(ctx, drift, h * (0.1 + index * 0.07), 0.8 + index * 0.15);
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.beginPath();
  ctx.ellipse(x, y, 46 * scale, 18 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 28 * scale, y + 4 * scale, 34 * scale, 16 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 30 * scale, y + 6 * scale, 28 * scale, 14 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHills(ctx: CanvasRenderingContext2D, w: number, waterY: number, tier: number): void {
  ctx.fillStyle = tier >= 3 ? '#35543d' : '#3e6b48';
  ctx.beginPath();
  ctx.moveTo(0, waterY);
  ctx.lineTo(0, waterY - 70);
  ctx.quadraticCurveTo(w * 0.16, waterY - 150, w * 0.32, waterY - 78);
  ctx.quadraticCurveTo(w * 0.48, waterY - 20, w * 0.62, waterY - 96);
  ctx.quadraticCurveTo(w * 0.78, waterY - 160, w, waterY - 70);
  ctx.lineTo(w, waterY);
  ctx.fill();

  ctx.fillStyle = tier >= 3 ? '#2a4634' : '#2f5a3e';
  ctx.beginPath();
  ctx.moveTo(0, waterY);
  ctx.lineTo(0, waterY - 36);
  ctx.quadraticCurveTo(w * 0.22, waterY - 88, w * 0.4, waterY - 30);
  ctx.quadraticCurveTo(w * 0.58, waterY + 10, w * 0.74, waterY - 64);
  ctx.quadraticCurveTo(w * 0.9, waterY - 110, w, waterY - 40);
  ctx.lineTo(w, waterY);
  ctx.fill();

  drawHut(ctx, w * 0.18, waterY - 58);
  drawTree(ctx, w * 0.58, waterY - 78, 1);
  drawTree(ctx, w * 0.66, waterY - 64, 0.75);
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  ctx.fillStyle = '#6b4630';
  ctx.fillRect(x - 4 * scale, y, 8 * scale, 28 * scale);
  ctx.fillStyle = '#2d6a45';
  ctx.beginPath();
  ctx.arc(x, y, 22 * scale, 0, Math.PI * 2);
  ctx.arc(x - 14 * scale, y + 8 * scale, 14 * scale, 0, Math.PI * 2);
  ctx.arc(x + 14 * scale, y + 6 * scale, 15 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawHut(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#d8c4a0';
  ctx.fillRect(x, y, 36, 24);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, 36, 24);
  ctx.fillStyle = '#8d4d3a';
  ctx.beginPath();
  ctx.moveTo(x - 6, y);
  ctx.lineTo(x + 18, y - 16);
  ctx.lineTo(x + 42, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawRiver(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  waterY: number,
  time: number,
  tier: number,
): void {
  const deep = tier >= 4 ? '#1a4c68' : '#1d6284';
  const shallow = tier >= 3 ? '#3c8e78' : '#3aa3c4';
  const gradient = ctx.createLinearGradient(0, waterY, 0, h);
  gradient.addColorStop(0, shallow);
  gradient.addColorStop(0.45, '#21779a');
  gradient.addColorStop(1, deep);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, waterY, w, h - waterY);

  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  for (let band = 0; band < 5; band += 1) {
    const y = waterY + 18 + band * ((h - waterY) * 0.11);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 12) {
      const wave = Math.sin(x * 0.02 + time * 1.6 + band) * (5 + band);
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(186, 230, 214, 0.45)';
  ctx.lineWidth = 3;
  for (let reed = 0; reed < 7; reed += 1) {
    const x = 24 + reed * 18;
    const lean = Math.sin(time * 1.8 + reed) * 6;
    ctx.beginPath();
    ctx.moveTo(x, waterY + 8);
    ctx.quadraticCurveTo(x + lean, waterY - 24, x + lean * 0.4, waterY - 48);
    ctx.stroke();
  }
}

function drawBoat(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  const hull = w * 0.22;
  ctx.fillStyle = 'rgba(12, 40, 58, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y + hull * 0.85, w * 0.42, hull * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, y);
  ctx.quadraticCurveTo(x - w * 0.46, y + hull, x, y + hull * 0.92);
  ctx.quadraticCurveTo(x + w * 0.46, y + hull, x + w * 0.5, y);
  ctx.quadraticCurveTo(x + w * 0.28, y + hull * 0.28, x, y + hull * 0.2);
  ctx.quadraticCurveTo(x - w * 0.28, y + hull * 0.28, x - w * 0.5, y);
  ctx.closePath();
  ctx.fillStyle = '#8d5a32';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - w * 0.36, y + 2);
  ctx.quadraticCurveTo(x, y + hull * 0.48, x + w * 0.36, y + 2);
  ctx.strokeStyle = '#6a3e22';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = '#e7c892';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w * 0.48, y);
  ctx.quadraticCurveTo(x, y - hull * 0.16, x + w * 0.48, y);
  ctx.stroke();

  ctx.fillStyle = '#c4925a';
  ctx.fillRect(x - w * 0.12, y - hull * 0.02, w * 0.22, 7);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - w * 0.12, y - hull * 0.02, w * 0.22, 7);
}

interface Anchor {
  handX: number;
  handY: number;
  headX: number;
  headY: number;
}

function drawFisher(ctx: CanvasRenderingContext2D, x: number, y: number, boatW: number, pose: 'sit' | 'lift'): Anchor {
  const s = boatW / 340;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.fillStyle = '#314e7a';
  rounded(ctx, 8, 18, 54, 16, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#3a2a22';
  ctx.beginPath();
  ctx.ellipse(62, 36, 9, 6, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e07a3d';
  rounded(ctx, -16, -52, 46, 58, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f3c7a5';
  ctx.beginPath();
  ctx.arc(6, -74, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e7c56a';
  ctx.beginPath();
  ctx.ellipse(6, -90, 26, 8, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(6, -98, 16, 10, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.beginPath();
  if (pose === 'lift') {
    ctx.arc(-2, -76, 2, 0, Math.PI * 2);
    ctx.arc(10, -76, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -66, 6, 0.15, Math.PI - 0.15);
    ctx.stroke();
  } else {
    ctx.arc(-1, -74, 2.1, 0, Math.PI * 2);
    ctx.arc(9, -74, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -66, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  ctx.fillStyle = '#f3c7a5';
  if (pose === 'lift') {
    limb(ctx, -8, -40, -28, -78);
    limb(ctx, 18, -40, 36, -78);
  } else {
    limb(ctx, 16, -34, 58, -58);
  }

  ctx.restore();
  return {
    handX: x + (pose === 'lift' ? 4 : 58) * s,
    handY: y + (pose === 'lift' ? -78 : -58) * s,
    headX: x + 6 * s,
    headY: y - 98 * s,
  };
}

function limb(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  ctx.strokeStyle = '#f3c7a5';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#f3c7a5';
  ctx.beginPath();
  ctx.arc(x2, y2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTackle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  waterY: number,
  fisher: Anchor,
  view: SceneView,
): void {
  const sway = Math.sin(view.time * 2.55) * Math.min(w * 0.055, 72);
  let tipX = fisher.handX + Math.min(w * 0.18, 200);
  let tipY = h * 0.24;
  let bobX = tipX + Math.min(w * 0.12, 130);
  let bobY = waterY + 10;
  let showBobber = true;
  let lineSlack = 0;

  if (view.mode === 'title' || view.mode === 'wait') {
    bobX += sway;
  } else if (view.mode === 'bite') {
    const dip = Math.min(1, view.phase / 0.18);
    bobX += sway * 0.35;
    bobY += 16 + dip * 18 + Math.sin(view.time * 28) * 3;
    drawBang(ctx, bobX, waterY - 28);
    drawRipple(ctx, bobX, waterY + 4, view.phase);
  } else if (view.mode === 'gauge') {
    bobX += sway * 0.2;
    bobY += 8;
  } else if (view.mode === 'tug') {
    bobX += view.fishX * Math.min(w * 0.1, 120);
    bobY += 22;
    tipY += 18;
    drawRipple(ctx, bobX, waterY + 4, view.time % 1.2);
  } else if (view.mode === 'lift') {
    showBobber = false;
    const k = ease(Math.min(1, view.phase / 0.7));
    const fromX = tipX + 40;
    const fromY = waterY + 8;
    const toX = fisher.headX + 8;
    const toY = fisher.headY - 24;
    const fishX = fromX + (toX - fromX) * k;
    const fishY = fromY + (toY - fromY) * k - Math.sin(k * Math.PI) * 30;
    if (view.fish) drawFishSprite(ctx, fishX, fishY, 1, view.fish, 1);
    tipX = fisher.handX + 30;
    tipY = fisher.handY;
    bobX = fishX;
    bobY = fishY + 10;
    lineSlack = (1 - k) * 30;
    if (k > 0.35) drawSparkles(ctx, toX, toY, view.time);
  } else if (view.mode === 'miss') {
    const k = Math.min(1, view.phase / 0.85);
    const dir = view.fishX >= 0 ? 1 : -1;
    bobX += sway * 0.2 + dir * k * Math.min(w * 0.28, 220);
    bobY += 10 + k * 36;
    lineSlack = 50 + k * 40;
    if (view.fish) drawFishSprite(ctx, bobX + dir * 36, bobY + 28, dir, view.fish, 0.9);
  }

  if (view.mode === 'tug' && view.fish) {
    const face = view.fishX >= 0 ? 1 : -1;
    drawFishSprite(ctx, bobX + face * 16, bobY + 34, face, view.fish, 0.66);
  }

  if (view.mode !== 'lift') {
    ctx.strokeStyle = '#6b4a30';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fisher.handX, fisher.handY);
    ctx.quadraticCurveTo((fisher.handX + tipX) / 2, tipY - 10, tipX, tipY);
    ctx.stroke();
    ctx.strokeStyle = '#c9a27a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(244, 250, 255, 0.92)';
  ctx.lineWidth = 1.7;
  ctx.beginPath();
  ctx.moveTo(view.mode === 'lift' ? fisher.handX : tipX, view.mode === 'lift' ? fisher.handY : tipY);
  ctx.quadraticCurveTo((tipX + bobX) / 2 - sway * 0.15, (tipY + bobY) / 2 + lineSlack, bobX, bobY);
  ctx.stroke();

  if (showBobber) drawBobber(ctx, bobX, bobY);
}

function drawBobber(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e23d3d';
  ctx.beginPath();
  ctx.arc(x, y, 8, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x, y - 14);
  ctx.stroke();
}

function drawRipple(ctx: CanvasRenderingContext2D, x: number, y: number, phase: number): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 1.5;
  for (let ring = 0; ring < 3; ring += 1) {
    const k = (phase + ring * 0.33) % 1;
    ctx.beginPath();
    ctx.ellipse(x, y, 10 + k * 34, 4 + k * 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBang(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#fffdf8';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-8, -36, 16, 26, 8);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSparkles(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  ctx.fillStyle = '#fff4c4';
  for (let index = 0; index < 7; index += 1) {
    const angle = time * 1.4 + index * 0.9;
    const dist = 28 + (index % 3) * 12;
    star(ctx, x + Math.cos(angle) * dist, y + Math.sin(angle) * dist * 0.6, 4 + (index % 2));
  }
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.35, y - r * 0.35);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.35, y + r * 0.35);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.35, y + r * 0.35);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.35, y - r * 0.35);
  ctx.closePath();
  ctx.fill();
}

function drawFishSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: number,
  fish: FishKind,
  scale: number,
): void {
  const sprite = fishSprite(fish.id);
  if (sprite) {
    const len = fishPhotoLength(fish.id) * scale;
    const drawH = len * (sprite.naturalHeight / sprite.naturalWidth);
    const face = FISH_PHOTO_FACE[fish.id] ?? 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale((dir || 1) * face, 1);
    ctx.drawImage(sprite, -len / 2, -drawH / 2, len, drawH);
    ctx.restore();
    return;
  }

  const long = fish.id === 'arowana' ? 118 : fish.id === 'catfish' ? 104 : fish.id === 'crucian' ? 74 : 92;
  const len = long * scale;
  const tall = len * (fish.id === 'catfish' ? 0.26 : fish.id === 'arowana' ? 0.3 : fish.id === 'carp' ? 0.42 : 0.36);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir || 1, 1);

  ctx.fillStyle = fish.fin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-len * 0.34, 0);
  ctx.lineTo(-len * 0.58, -tall * 0.85);
  ctx.quadraticCurveTo(-len * 0.42, 0, -len * 0.58, tall * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = fish.body;
  ctx.beginPath();
  ctx.ellipse(-len * 0.02, 0, len * 0.4, tall, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = fish.belly;
  ctx.beginPath();
  ctx.ellipse(0, tall * 0.28, len * 0.24, tall * 0.42, 0, 0, Math.PI);
  ctx.fill();

  if (fish.id === 'bass') {
    ctx.strokeStyle = fish.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-len * 0.16, -tall * 0.1);
    ctx.lineTo(len * 0.18, tall * 0.15);
    ctx.stroke();
  }

  ctx.fillStyle = fish.fin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-len * 0.08, -tall * 0.7);
  ctx.quadraticCurveTo(len * 0.08, -tall * 1.15, len * 0.16, -tall * 0.45);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(len * 0.2, -tall * 0.18, Math.max(3.5, tall * 0.22), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(len * 0.23, -tall * 0.18, Math.max(1.6, tall * 0.09), 0, Math.PI * 2);
  ctx.fill();

  if (fish.id === 'catfish' || fish.id === 'carp') {
    ctx.strokeStyle = fish.accent;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(len * 0.32, tall * 0.05);
    ctx.quadraticCurveTo(len * 0.48, tall * 0.35, len * 0.28, tall * 0.45);
    ctx.moveTo(len * 0.32, tall * 0.12);
    ctx.quadraticCurveTo(len * 0.5, tall * 0.15, len * 0.42, tall * 0.42);
    ctx.stroke();
  }

  if (fish.id === 'arowana') {
    ctx.fillStyle = fish.fin;
    ctx.beginPath();
    ctx.moveTo(len * 0.05, tall * 0.45);
    ctx.lineTo(-len * 0.15, tall * 0.95);
    ctx.lineTo(len * 0.12, tall * 0.5);
    ctx.fill();
  }

  ctx.restore();
}

function ease(k: number): number {
  return 1 - (1 - k) * (1 - k);
}
