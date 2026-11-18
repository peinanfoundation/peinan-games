import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import { DishArt } from './dishArt';
import { IngredientArt, hasIngredientArt } from './ingredientArt';
import { ingredientById, recipeById, type Ingredient } from './ingredients';

const fronts = new Map<string, Texture>();
const backs = new Map<string, Texture>();
const rings = new Map<string, Texture>();
let back: Texture | null = null;
let wood: Texture | null = null;
let floor: Texture | null = null;
let wall: Texture | null = null;
let cloth: Texture | null = null;

function textureFrom(canvas: HTMLCanvasElement, repeat = 1) {
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;
  if (repeat > 1) {
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    map.repeat.set(repeat, repeat);
  }
  map.needsUpdate = true;
  return map;
}

function canvasOf(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  return { canvas, ctx };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function ingredientSvgMarkup(ingredientId: string) {
  if (!hasIngredientArt(ingredientId)) return null;
  const markup = renderToStaticMarkup(createElement(IngredientArt, { id: ingredientId }));
  if (!markup) return null;
  return markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"');
}

function paintFrontShell(ctx: CanvasRenderingContext2D, ingredient: Ingredient) {
  roundRect(ctx, 16, 16, 480, 560, 48);
  ctx.fillStyle = '#f4e7d2';
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#c6a15a';
  ctx.stroke();
  roundRect(ctx, 40, 40, 432, 512, 34);
  ctx.fillStyle = '#fffaf3';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = ingredient.color;
  ctx.stroke();

  ctx.fillStyle = ingredient.color;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.ellipse(256, 248, 132, 108, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fffdf8';
  ctx.beginPath();
  ctx.ellipse(256, 252, 108, 86, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#eadccb';
  ctx.lineWidth = 6;
  ctx.stroke();
}

function paintFrontLabel(ctx: CanvasRenderingContext2D, ingredient: Ingredient) {
  ctx.strokeStyle = ingredient.color;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(92, 430);
  ctx.lineTo(420, 430);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#3a2418';
  ctx.font = 'bold 68px "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ingredient.name, 256, 488);
}

function paintFront(ingredient: Ingredient) {
  const { canvas, ctx } = canvasOf(512, 592);
  paintFrontShell(ctx, ingredient);

  const svg = ingredientSvgMarkup(ingredient.id);
  if (svg) {
    const map = textureFrom(canvas);
    paintFrontLabel(ctx, ingredient);
    map.needsUpdate = true;
    const image = new Image();
    image.onload = () => {
      paintFrontShell(ctx, ingredient);
      ctx.drawImage(image, 96, 90, 320, 320);
      paintFrontLabel(ctx, ingredient);
      map.needsUpdate = true;
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return map;
  }

  ctx.font = '210px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ingredient.emoji, 256, 250);
  paintFrontLabel(ctx, ingredient);
  return textureFrom(canvas);
}

function paintBackShell(ctx: CanvasRenderingContext2D) {
  roundRect(ctx, 16, 16, 480, 560, 48);
  ctx.fillStyle = '#1b4636';
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#e2b15a';
  ctx.stroke();
  roundRect(ctx, 42, 42, 428, 508, 32);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(226, 177, 90, 0.85)';
  ctx.stroke();
  ctx.save();
  roundRect(ctx, 56, 56, 400, 480, 24);
  ctx.clip();
  ctx.strokeStyle = 'rgba(226, 177, 90, 0.22)';
  ctx.lineWidth = 3;
  for (let i = -8; i < 16; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-40, i * 48);
    ctx.lineTo(560, i * 48 + 280);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(560, i * 48);
    ctx.lineTo(-40, i * 48 + 280);
    ctx.stroke();
  }
  ctx.restore();
}

function paintBack() {
  const { canvas, ctx } = canvasOf(512, 592);
  paintBackShell(ctx);
  ctx.fillStyle = '#f6eadc';
  ctx.beginPath();
  ctx.ellipse(256, 300, 78, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b4636';
  ctx.beginPath();
  ctx.ellipse(256, 292, 54, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e2b15a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(214, 236, 28, Math.PI * 0.15, Math.PI * 1.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(298, 236, 28, Math.PI * 1.85, Math.PI * 0.85, true);
  ctx.stroke();
  ctx.fillStyle = '#e2b15a';
  ctx.fillRect(246, 214, 20, 8);
  return textureFrom(canvas);
}

function dishSvgMarkup(recipeId: string) {
  const markup = renderToStaticMarkup(createElement(DishArt, { id: recipeId }));
  if (!markup) return null;
  return markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"');
}

function paintDishBack(recipeId: string) {
  const recipe = recipeById(recipeId);
  const { canvas, ctx } = canvasOf(512, 592);
  paintBackShell(ctx);
  ctx.fillStyle = '#fff8ee';
  ctx.beginPath();
  ctx.ellipse(256, 250, 150, 150, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(226, 177, 90, 0.7)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = '#f6eadc';
  ctx.font = 'bold 42px "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(recipe.name, 256, 500);
  const map = textureFrom(canvas);
  const svg = dishSvgMarkup(recipeId);
  if (!svg) return map;
  const image = new Image();
  image.onload = () => {
    paintBackShell(ctx);
    ctx.fillStyle = '#fff8ee';
    ctx.beginPath();
    ctx.ellipse(256, 250, 150, 150, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(image, 96, 90, 320, 320);
    ctx.fillStyle = '#f6eadc';
    ctx.font = 'bold 42px "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(recipe.name, 256, 500);
    map.needsUpdate = true;
  };
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return map;
}

function paintWood() {
  const { canvas, ctx } = canvasOf(512, 512);
  ctx.fillStyle = '#c9844a';
  ctx.fillRect(0, 0, 512, 512);
  const planks = [0, 168, 340];
  const colors = ['#d39255', '#c07a40', '#cc8750'];
  planks.forEach((y, index) => {
    const height = index === planks.length - 1 ? 512 - y : planks[index + 1]! - y - 6;
    ctx.fillStyle = colors[index]!;
    ctx.fillRect(0, y, 512, height);
    ctx.strokeStyle = 'rgba(92, 48, 22, 0.28)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y + height * 0.35);
    ctx.bezierCurveTo(140, y + 20, 280, y + height * 0.7, 512, y + height * 0.4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(120, 64, 28, 0.28)';
    ctx.beginPath();
    ctx.ellipse(80 + index * 140, y + height * 0.55, 18, 10, 0.4, 0, Math.PI * 2);
    ctx.fill();
  });
  return textureFrom(canvas, 2);
}

function paintFloor() {
  const { canvas, ctx } = canvasOf(256, 256);
  ctx.fillStyle = '#d5c3ad';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#f3e6d4';
  ctx.fillRect(6, 6, 244, 244);
  ctx.strokeStyle = 'rgba(255, 248, 238, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 220, 220);
  return textureFrom(canvas, 7);
}

function paintWall() {
  const { canvas, ctx } = canvasOf(512, 256);
  ctx.fillStyle = '#f7f0e6';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#e7d3b4';
  ctx.fillRect(0, 156, 512, 100);
  ctx.fillStyle = '#c6a15a';
  ctx.fillRect(0, 148, 512, 10);
  ctx.fillStyle = 'rgba(90, 52, 28, 0.08)';
  for (let x = 24; x < 512; x += 64) ctx.fillRect(x, 168, 2, 88);
  return textureFrom(canvas);
}

function paintCloth() {
  const { canvas, ctx } = canvasOf(512, 512);
  ctx.fillStyle = '#fbf6ee';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(198, 161, 90, 0.18)';
  ctx.lineWidth = 2;
  for (let i = 16; i < 512; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }
  return textureFrom(canvas);
}

function paintRing(color: string) {
  const { canvas, ctx } = canvasOf(256, 294);
  roundRect(ctx, 18, 18, 220, 258, 36);
  ctx.lineWidth = 22;
  ctx.strokeStyle = color;
  ctx.stroke();
  return textureFrom(canvas);
}

export function frontTexture(id: string) {
  const cached = fronts.get(id);
  if (cached) return cached;
  const map = paintFront(ingredientById(id));
  fronts.set(id, map);
  return map;
}

export function backTexture(recipeId?: string) {
  if (recipeId) {
    const cached = backs.get(recipeId);
    if (cached) return cached;
    const map = paintDishBack(recipeId);
    backs.set(recipeId, map);
    return map;
  }
  if (!back) back = paintBack();
  return back;
}

export function woodTexture() {
  if (!wood) wood = paintWood();
  return wood;
}

export function floorTexture() {
  if (!floor) floor = paintFloor();
  return floor;
}

export function wallTexture() {
  if (!wall) wall = paintWall();
  return wall;
}

export function clothTexture() {
  if (!cloth) cloth = paintCloth();
  return cloth;
}

export function ringTexture(color: string) {
  const cached = rings.get(color);
  if (cached) return cached;
  const map = paintRing(color);
  rings.set(color, map);
  return map;
}
