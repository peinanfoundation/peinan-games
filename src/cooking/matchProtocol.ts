import type { SeatState } from './logic';

export const MATCH_PORT = 5175;

export type SeatMotion = 'idle' | 'walk' | 'point';

export interface SeatView {
  found: string[];
  mistakes: number;
  cleared: number[];
  open: number[];
  finishedAt: number | null;
  motion: SeatMotion;
  goalIndex: number | null;
  busy: boolean;
}

export interface RoomSnapshot {
  roomId: string;
  recipeIds: [string, string];
  cards: string[];
  phase: 'preview' | 'play' | 'finished';
  previewEndsAt: number | null;
  startedAt: number | null;
  seats: [SeatView, SeatView];
  lastMatch: { seat: number; ingredientId: string; matched: number[]; turn: number } | null;
  disconnected: [boolean, boolean];
}

export type ClientMessage =
  | { type: 'joinQueue' }
  | { type: 'leaveQueue' }
  | { type: 'walkTo'; index: number }
  | { type: 'reveal'; index: number }
  | { type: 'motionDone' };

export type ServerMessage =
  | { type: 'queued' }
  | { type: 'leftQueue' }
  | { type: 'matched'; seat: 0 | 1; room: RoomSnapshot }
  | { type: 'room'; room: RoomSnapshot }
  | { type: 'error'; message: string };

export function seatViewFrom(state: SeatState, extra: Partial<SeatView> = {}): SeatView {
  return {
    found: state.found,
    mistakes: state.mistakes,
    cleared: state.cleared,
    open: state.open,
    finishedAt: state.finishedAt,
    motion: 'idle',
    goalIndex: null,
    busy: false,
    ...extra,
  };
}

export function matchWsUrl(host = typeof location !== 'undefined' ? location.hostname : '127.0.0.1') {
  const configured = import.meta.env.VITE_MATCH_WS_URL as string | undefined;
  if (configured?.trim()) {
    return configured.trim().replace(/\/$/, '');
  }

  const proto = typeof location !== 'undefined' && location.protocol === 'https:' ? 'wss' : 'ws';
  // Local Vite/dev: dedicated match server port.
  if (host === 'localhost' || host === '127.0.0.1') {
    return `${proto}://${host}:${MATCH_PORT}`;
  }
  // Production: same host, standard TLS port (requires reverse-proxy or dedicated WS host).
  return `${proto}://${host}`;
}
