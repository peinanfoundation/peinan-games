export const COLS = 4;
export const ROWS = 5;
export const CARD_W = 1.62 * 1.3;
export const CARD_D = 1.86 * 1.3;
export const GAP_X = 0.14;
export const GAP_Z = 0.14;
export const CHARACTER_HEIGHT = 1.48;

const PITCH_X = CARD_W + GAP_X;
const PITCH_Z = CARD_D + GAP_Z;

export const GRID_W = COLS * CARD_W + (COLS - 1) * GAP_X;
export const GRID_D = ROWS * CARD_D + (ROWS - 1) * GAP_Z;

/** Stand at the center of the card board so framing can stay tight. */
export const HOME_Z = 0;
export const TABLE_BACK = -GRID_D / 2 - 0.28;
export const TABLE_FRONT = GRID_D / 2 + 0.28;
export const TABLE_D = TABLE_FRONT - TABLE_BACK;
export const TABLE_Z = (TABLE_FRONT + TABLE_BACK) / 2;
export const TABLE_W = GRID_W + 0.55;

export function slotPosition(index: number) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return {
    x: (col - (COLS - 1) / 2) * PITCH_X,
    z: (row - (ROWS - 1) / 2) * PITCH_Z,
  };
}

export const HOME = { x: 0, z: HOME_Z };
export const HOME_P1 = { x: -0.85, z: HOME_Z };
export const HOME_P2 = { x: 0.85, z: HOME_Z };

export function frameZoom(width: number, height: number) {
  const spanX = GRID_W + 0.35;
  const spanY = GRID_D + CHARACTER_HEIGHT * 0.42 + 0.2;
  return Math.min(width / spanX, height / spanY);
}
