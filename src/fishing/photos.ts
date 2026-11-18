import arowana from './art/arowana.png';
import bass from './art/bass.png';
import carp from './art/carp.png';
import catfish from './art/catfish.png';
import crucian from './art/crucian.png';
import grouper from './art/grouper.png';
import lantern from './art/lantern.png';
import piranha from './art/piranha.png';
import seabream from './art/seabream.png';
import shark from './art/shark.png';

export const FISH_PHOTOS: Record<string, string> = {
  crucian,
  carp,
  catfish,
  bass,
  arowana,
  seabream,
  grouper,
  lantern,
  shark,
  piranha,
};

/** 照片裡魚頭的朝向。1 是朝右。 */
export const FISH_PHOTO_FACE: Record<string, 1 | -1> = {
  crucian: 1,
  carp: 1,
  catfish: -1,
  bass: 1,
  arowana: 1,
  seabream: 1,
  grouper: 1,
  lantern: 1,
  shark: 1,
  piranha: 1,
};

const FISH_PHOTO_LENGTH: Record<string, number> = {
  crucian: 78,
  carp: 108,
  catfish: 168,
  bass: 104,
  arowana: 136,
  seabream: 96,
  grouper: 118,
  lantern: 148,
  shark: 176,
  piranha: 96,
};

const sprites = new Map<string, HTMLImageElement>();

export function loadFishPhotos(): void {
  for (const [id, url] of Object.entries(FISH_PHOTOS)) {
    if (sprites.has(id)) continue;
    const image = new Image();
    image.onload = () => {
      sprites.set(id, image);
    };
    image.src = url;
  }
}

export function fishSprite(id: string): HTMLImageElement | null {
  return sprites.get(id) ?? null;
}

export function fishPhotoLength(id: string): number {
  return FISH_PHOTO_LENGTH[id] ?? 100;
}
