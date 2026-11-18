import { Peer, type DataConnection } from 'peerjs';
import { ALL_INGREDIENT_IDS, RECIPES } from './ingredients';
import {
  dealDuelCards,
  emptySeat,
  pickDuelRecipes,
  revealSeat,
  rngFromSeed,
  type SeatState,
} from './logic';
import {
  seatViewFrom,
  type ClientMessage,
  type RoomSnapshot,
  type SeatMotion,
  type ServerMessage,
} from './matchProtocol';
import type { MatchClient, MatchStatus } from './matchClient';

interface RoomSeat {
  logic: SeatState;
  motion: SeatMotion;
  goalIndex: number | null;
  busy: boolean;
  online: boolean;
}

interface Room {
  id: string;
  recipeIds: [string, string];
  cards: string[];
  phase: 'preview' | 'play' | 'finished';
  previewEndsAt: number | null;
  startedAt: number | null;
  seats: [RoomSeat, RoomSeat];
  lastMatch: RoomSnapshot['lastMatch'];
  turn: number;
  previewTimer: ReturnType<typeof setTimeout> | null;
}

function randomRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return code;
}

export function peerIdForRoom(code: string) {
  return `peinan-cook-${code.toUpperCase()}`;
}

export function createPeerMatchClient(handlers: {
  onStatus: (status: MatchStatus, error?: string | null) => void;
  onMessage: (message: ServerMessage) => void;
  onRoomCode?: (code: string) => void;
}): MatchClient & { createRoom: () => void; joinRoom: (code: string) => void; roomCode: string | null } {
  let peer: Peer | null = null;
  let guestConn: DataConnection | null = null;
  let hostConn: DataConnection | null = null;
  let status: MatchStatus = 'idle';
  let roomCode: string | null = null;
  let role: 'host' | 'guest' | null = null;
  let room: Room | null = null;
  let serial = 1;

  const setStatus = (next: MatchStatus, error: string | null = null) => {
    status = next;
    handlers.onStatus(next, error);
  };

  const emit = (message: ServerMessage) => {
    handlers.onMessage(message);
  };

  const sendToGuest = (message: ServerMessage) => {
    if (guestConn?.open) guestConn.send(message);
  };

  const snapshot = (current: Room): RoomSnapshot => ({
    roomId: current.id,
    recipeIds: current.recipeIds,
    cards: current.cards,
    phase: current.phase,
    previewEndsAt: current.previewEndsAt,
    startedAt: current.startedAt,
    seats: [
      seatViewFrom(current.seats[0]!.logic, {
        motion: current.seats[0]!.motion,
        goalIndex: current.seats[0]!.goalIndex,
        busy: current.seats[0]!.busy,
      }),
      seatViewFrom(current.seats[1]!.logic, {
        motion: current.seats[1]!.motion,
        goalIndex: current.seats[1]!.goalIndex,
        busy: current.seats[1]!.busy,
      }),
    ],
    lastMatch: current.lastMatch,
    disconnected: [!current.seats[0]!.online, !current.seats[1]!.online],
  });

  const broadcast = () => {
    if (!room) return;
    const message: ServerMessage = { type: 'room', room: snapshot(room) };
    emit(message);
    sendToGuest(message);
  };

  const startRoom = () => {
    if (!roomCode) return;
    const seed = (Date.now() ^ (serial * 9973)) >>> 0;
    serial += 1;
    const rng = rngFromSeed(seed);
    const [recipeA, recipeB] = pickDuelRecipes(RECIPES, rng);
    room = {
      id: `r-${roomCode}`,
      recipeIds: [recipeA.id, recipeB.id],
      cards: dealDuelCards(recipeA.ingredientIds, recipeB.ingredientIds, ALL_INGREDIENT_IDS, rng),
      phase: 'preview',
      previewEndsAt: Date.now() + 10_000,
      startedAt: null,
      seats: [
        { logic: emptySeat(), motion: 'idle', goalIndex: null, busy: false, online: true },
        { logic: emptySeat(), motion: 'idle', goalIndex: null, busy: false, online: true },
      ],
      lastMatch: null,
      turn: 0,
      previewTimer: null,
    };
    const snap = snapshot(room);
    emit({ type: 'matched', seat: 0, room: snap });
    sendToGuest({ type: 'matched', seat: 1, room: snap });
    setStatus('matched');
    room.previewTimer = setTimeout(() => {
      if (!room) return;
      room.phase = 'play';
      room.previewEndsAt = null;
      room.startedAt = Date.now();
      broadcast();
    }, 10_000);
  };

  const handleHostMessage = (seatIndex: 0 | 1, message: ClientMessage) => {
    if (!room) return;
    const seat = room.seats[seatIndex]!;

    if (message.type === 'walkTo') {
      if (room.phase !== 'play') return;
      if (seat.busy || seat.logic.finishedAt !== null) return;
      if (message.index < 0 || message.index >= room.cards.length) return;
      if (seat.logic.cleared.includes(message.index) || seat.logic.open.includes(message.index)) return;
      seat.busy = true;
      seat.motion = 'walk';
      seat.goalIndex = message.index;
      broadcast();
      return;
    }

    if (message.type === 'reveal') {
      if (room.phase !== 'play') return;
      if (!seat.busy || seat.goalIndex !== message.index) return;
      const recipe = RECIPES.find((item) => item.id === room!.recipeIds[seatIndex]);
      if (!recipe) return;
      seat.motion = 'point';
      const result = revealSeat(room.cards, recipe.ingredientIds, seat.logic, message.index);
      if (result.outcome === 'ignore') {
        seat.busy = false;
        seat.motion = 'idle';
        seat.goalIndex = null;
        broadcast();
        return;
      }
      seat.logic = result.seat;
      if (result.outcome === 'match') {
        room.turn += 1;
        room.lastMatch = {
          seat: seatIndex,
          ingredientId: room.cards[message.index]!,
          matched: result.matched,
          turn: room.turn,
        };
        if (result.phase === 'won' && seat.logic.finishedAt === null) {
          seat.logic = { ...seat.logic, finishedAt: Date.now() - (room.startedAt ?? Date.now()) };
        }
      }
      broadcast();
      return;
    }

    if (message.type === 'motionDone') {
      seat.busy = false;
      seat.motion = 'idle';
      seat.goalIndex = null;
      if (room.seats.every((item) => item.logic.finishedAt !== null)) room.phase = 'finished';
      broadcast();
    }
  };

  const destroyPeer = () => {
    if (room?.previewTimer) clearTimeout(room.previewTimer);
    room = null;
    guestConn?.close();
    hostConn?.close();
    guestConn = null;
    hostConn = null;
    peer?.destroy();
    peer = null;
    role = null;
    roomCode = null;
  };

  const createRoom = () => {
    destroyPeer();
    role = 'host';
    roomCode = randomRoomCode();
    handlers.onRoomCode?.(roomCode);
    setStatus('connecting');
    const next = new Peer(peerIdForRoom(roomCode), {
      debug: 0,
    });
    peer = next;
    next.on('open', () => {
      setStatus('queued');
      emit({ type: 'queued' });
    });
    next.on('connection', (conn) => {
      if (guestConn) {
        conn.close();
        return;
      }
      guestConn = conn;
      conn.on('open', () => {
        startRoom();
      });
      conn.on('data', (data) => {
        try {
          handleHostMessage(1, data as ClientMessage);
        } catch {
          // ignore malformed guest packets
        }
      });
      conn.on('close', () => {
        if (room) {
          room.seats[1]!.online = false;
          broadcast();
        }
      });
    });
    next.on('error', () => {
      setStatus('error', '無法建立房間，請再試一次');
    });
  };

  const joinRoom = (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalized)) {
      setStatus('error', '房間碼須為 6 位英數');
      return;
    }
    destroyPeer();
    role = 'guest';
    roomCode = normalized;
    handlers.onRoomCode?.(normalized);
    setStatus('connecting');
    const next = new Peer({ debug: 0 });
    peer = next;
    next.on('open', () => {
      const conn = next.connect(peerIdForRoom(normalized), { reliable: true });
      hostConn = conn;
      conn.on('open', () => {
        setStatus('queued');
      });
      conn.on('data', (data) => {
        const message = data as ServerMessage;
        if (message.type === 'matched') setStatus('matched');
        if (message.type === 'error') setStatus('error', message.message);
        emit(message);
      });
      conn.on('close', () => {
        if (status === 'matched' || status === 'queued' || status === 'connecting') {
          setStatus('idle');
        }
      });
      conn.on('error', () => {
        setStatus('error', '找不到房間，請確認房間碼');
      });
    });
    next.on('error', () => {
      setStatus('error', '連線失敗，請再試一次');
    });
  };

  return {
    get status() {
      return status;
    },
    error: null,
    roomCode,
    createRoom,
    joinRoom,
    connectAndQueue: () => {
      // Kept for API compatibility; prefer createRoom/joinRoom.
      createRoom();
    },
    cancel: () => {
      destroyPeer();
      setStatus('idle');
      emit({ type: 'leftQueue' });
    },
    send: (message: ClientMessage) => {
      if (role === 'host') {
        handleHostMessage(0, message);
        return;
      }
      if (hostConn?.open) hostConn.send(message);
    },
    close: () => {
      destroyPeer();
      setStatus('idle');
    },
  };
}
