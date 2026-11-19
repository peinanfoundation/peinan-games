import { Peer, type DataConnection, type PeerError } from 'peerjs';
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

const OPEN_TIMEOUT_MS = 12_000;
const MAX_HOST_ATTEMPTS = 3;

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

function peerOptions() {
  const host = (import.meta.env.VITE_PEER_HOST as string | undefined)?.trim();
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];
  if (host) {
    return {
      host,
      port: Number(import.meta.env.VITE_PEER_PORT ?? 443),
      path: (import.meta.env.VITE_PEER_PATH as string | undefined)?.trim() || '/',
      secure: import.meta.env.VITE_PEER_SECURE !== 'false',
      debug: 1 as const,
      config: { iceServers },
    };
  }
  return {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    key: 'peerjs',
    debug: 1 as const,
    config: { iceServers },
  };
}

function errorLabel(err: unknown, fallback: string) {
  const type = (err as PeerError<string> | undefined)?.type;
  if (type === 'unavailable-id') return '房間碼剛被佔用，正在換一組…';
  if (type === 'network' || type === 'socket-error' || type === 'server-error') {
    return '配對服務連不上，請再試一次';
  }
  if (type === 'peer-unavailable') return '找不到房間，請確認房間碼';
  if (type === 'browser-incompatible') return '此瀏覽器不支援連線對戰';
  return fallback;
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
  let generation = 0;
  let openTimer: ReturnType<typeof setTimeout> | null = null;

  const setStatus = (next: MatchStatus, error: string | null = null) => {
    status = next;
    handlers.onStatus(next, error);
  };

  const emit = (message: ServerMessage) => {
    handlers.onMessage(message);
  };

  const clearOpenTimer = () => {
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = null;
    }
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
    generation += 1;
    clearOpenTimer();
    if (room?.previewTimer) clearTimeout(room.previewTimer);
    room = null;
    guestConn?.close();
    hostConn?.close();
    guestConn = null;
    hostConn = null;
    const old = peer;
    peer = null;
    role = null;
    roomCode = null;
    try {
      old?.destroy();
    } catch {
      // ignore teardown races from PeerJS cloud
    }
  };

  const attachHostConnection = (gen: number, conn: DataConnection) => {
    if (guestConn) {
      conn.close();
      return;
    }
    guestConn = conn;
    conn.on('open', () => {
      if (gen !== generation) return;
      startRoom();
    });
    conn.on('data', (data) => {
      if (gen !== generation) return;
      try {
        handleHostMessage(1, data as ClientMessage);
      } catch {
        // ignore malformed guest packets
      }
    });
    conn.on('close', () => {
      if (gen !== generation || !room) return;
      room.seats[1]!.online = false;
      broadcast();
    });
  };

  const beginHostPeer = (attempt: number) => {
    clearOpenTimer();
    const previous = peer;
    peer = null;
    try {
      previous?.destroy();
    } catch {
      /* ignore */
    }

    generation += 1;
    const gen = generation;
    const code = randomRoomCode();
    roomCode = code;
    handlers.onRoomCode?.(code);
    setStatus('connecting');

    const next = new Peer(peerIdForRoom(code), peerOptions());
    peer = next;

    openTimer = setTimeout(() => {
      if (gen !== generation || status !== 'connecting') return;
      if (attempt + 1 < MAX_HOST_ATTEMPTS) {
        beginHostPeer(attempt + 1);
        return;
      }
      setStatus('error', '建立房間逾時，請再試一次');
    }, OPEN_TIMEOUT_MS);

    next.on('open', () => {
      if (gen !== generation) return;
      clearOpenTimer();
      setStatus('queued');
      emit({ type: 'queued' });
    });

    next.on('connection', (conn) => {
      if (gen !== generation) {
        conn.close();
        return;
      }
      attachHostConnection(gen, conn);
    });

    next.on('error', (err) => {
      if (gen !== generation) return;
      const type = (err as PeerError<string> | undefined)?.type;
      const retryable = type === 'unavailable-id' || type === 'network' || type === 'socket-error' || type === 'server-error';
      if (retryable && attempt + 1 < MAX_HOST_ATTEMPTS) {
        clearOpenTimer();
        window.setTimeout(() => {
          if (gen !== generation) return;
          beginHostPeer(attempt + 1);
        }, 400);
        return;
      }
      clearOpenTimer();
      setStatus('error', errorLabel(err, '無法建立房間，請再試一次'));
    });
  };

  const createRoom = () => {
    destroyPeer();
    role = 'host';
    beginHostPeer(0);
  };

  const joinRoom = (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalized)) {
      setStatus('error', '房間碼須為 6 位英數');
      return;
    }
    destroyPeer();
    const gen = generation;
    role = 'guest';
    roomCode = normalized;
    handlers.onRoomCode?.(normalized);
    setStatus('connecting');

    const next = new Peer(peerOptions());
    peer = next;

    clearOpenTimer();
    openTimer = setTimeout(() => {
      if (gen !== generation || status !== 'connecting') return;
      setStatus('error', '加入房間逾時，請確認房間碼後再試');
    }, OPEN_TIMEOUT_MS);

    next.on('open', () => {
      if (gen !== generation) return;
      const conn = next.connect(peerIdForRoom(normalized), { reliable: true });
      hostConn = conn;
      conn.on('open', () => {
        if (gen !== generation) return;
        clearOpenTimer();
        setStatus('queued');
      });
      conn.on('data', (data) => {
        if (gen !== generation) return;
        const message = data as ServerMessage;
        if (message.type === 'matched') setStatus('matched');
        if (message.type === 'error') setStatus('error', message.message);
        emit(message);
      });
      conn.on('close', () => {
        if (gen !== generation) return;
        if (status === 'matched' || status === 'queued' || status === 'connecting') {
          setStatus('idle');
        }
      });
      conn.on('error', (err) => {
        if (gen !== generation) return;
        clearOpenTimer();
        setStatus('error', errorLabel(err, '找不到房間，請確認房間碼'));
      });
    });

    next.on('error', (err) => {
      if (gen !== generation) return;
      clearOpenTimer();
      setStatus('error', errorLabel(err, '連線失敗，請再試一次'));
    });
  };

  return {
    get status() {
      return status;
    },
    error: null,
    get roomCode() {
      return roomCode;
    },
    createRoom,
    joinRoom,
    connectAndQueue: () => {
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
