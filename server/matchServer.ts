import { createServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { ALL_INGREDIENT_IDS, RECIPES } from '../src/cooking/ingredients.ts';
import {
  dealDuelCards,
  emptySeat,
  pickDuelRecipes,
  revealSeat,
  rngFromSeed,
  type SeatState,
} from '../src/cooking/logic.ts';
import {
  MATCH_PORT,
  seatViewFrom,
  type ClientMessage,
  type RoomSnapshot,
  type SeatMotion,
  type SeatView,
  type ServerMessage,
} from '../src/cooking/matchProtocol.ts';

interface Client {
  id: string;
  socket: WebSocket;
  queue: boolean;
  roomId: string | null;
  seat: 0 | 1 | null;
}

interface RoomSeat {
  logic: SeatState;
  motion: SeatMotion;
  goalIndex: number | null;
  busy: boolean;
  clientId: string | null;
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

const clients = new Map<string, Client>();
const queue: string[] = [];
const rooms = new Map<string, Room>();
let serial = 1;

function send(socket: WebSocket, message: ServerMessage) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message));
}

function snapshot(room: Room): RoomSnapshot {
  const seats = room.seats.map((seat) =>
    seatViewFrom(seat.logic, {
      motion: seat.motion,
      goalIndex: seat.goalIndex,
      busy: seat.busy,
    }),
  ) as [SeatView, SeatView];
  return {
    roomId: room.id,
    recipeIds: room.recipeIds,
    cards: room.cards,
    phase: room.phase,
    previewEndsAt: room.previewEndsAt,
    startedAt: room.startedAt,
    seats,
    lastMatch: room.lastMatch,
    disconnected: [room.seats[0].clientId === null, room.seats[1].clientId === null],
  };
}

function broadcastRoom(room: Room) {
  const message: ServerMessage = { type: 'room', room: snapshot(room) };
  for (const seat of room.seats) {
    if (!seat.clientId) continue;
    const client = clients.get(seat.clientId);
    if (client) send(client.socket, message);
  }
}

function leaveQueue(client: Client) {
  const index = queue.indexOf(client.id);
  if (index >= 0) queue.splice(index, 1);
  client.queue = false;
  send(client.socket, { type: 'leftQueue' });
}

function createRoom(a: Client, b: Client) {
  const seed = (Date.now() ^ (serial * 9973)) >>> 0;
  const rng = rngFromSeed(seed);
  const [recipeA, recipeB] = pickDuelRecipes(RECIPES, rng);
  const roomId = `r${serial}`;
  serial += 1;
  const room: Room = {
    id: roomId,
    recipeIds: [recipeA.id, recipeB.id],
    cards: dealDuelCards(recipeA.ingredientIds, recipeB.ingredientIds, ALL_INGREDIENT_IDS, rng),
    phase: 'preview',
    previewEndsAt: Date.now() + 10_000,
    startedAt: null,
    seats: [
      {
        logic: emptySeat(),
        motion: 'idle',
        goalIndex: null,
        busy: false,
        clientId: a.id,
      },
      {
        logic: emptySeat(),
        motion: 'idle',
        goalIndex: null,
        busy: false,
        clientId: b.id,
      },
    ],
    lastMatch: null,
    turn: 0,
    previewTimer: null,
  };
  rooms.set(roomId, room);
  a.queue = false;
  b.queue = false;
  a.roomId = roomId;
  b.roomId = roomId;
  a.seat = 0;
  b.seat = 1;
  const snap = snapshot(room);
  send(a.socket, { type: 'matched', seat: 0, room: snap });
  send(b.socket, { type: 'matched', seat: 1, room: snap });
  room.previewTimer = setTimeout(() => {
    if (!rooms.has(roomId)) return;
    room.phase = 'play';
    room.previewEndsAt = null;
    room.startedAt = Date.now();
    broadcastRoom(room);
  }, 10_000);
}

function tryMatch() {
  while (queue.length >= 2) {
    const firstId = queue.shift()!;
    const secondId = queue.shift()!;
    const first = clients.get(firstId);
    const second = clients.get(secondId);
    if (!first || first.socket.readyState !== first.socket.OPEN) {
      if (second) queue.unshift(secondId);
      continue;
    }
    if (!second || second.socket.readyState !== second.socket.OPEN) {
      queue.unshift(firstId);
      continue;
    }
    createRoom(first, second);
  }
}

function joinQueue(client: Client) {
  if (client.roomId) {
    send(client.socket, { type: 'error', message: '已在對戰中' });
    return;
  }
  if (client.queue) return;
  client.queue = true;
  queue.push(client.id);
  send(client.socket, { type: 'queued' });
  tryMatch();
}

function seatLogic(seat: RoomSeat): SeatState {
  return seat.logic;
}

function handleWalk(client: Client, index: number) {
  if (client.roomId === null || client.seat === null) return;
  const room = rooms.get(client.roomId);
  if (!room || room.phase !== 'play') return;
  const seat = room.seats[client.seat]!;
  if (seat.busy || seat.logic.finishedAt !== null) return;
  if (index < 0 || index >= room.cards.length) return;
  if (seat.logic.cleared.includes(index) || seat.logic.open.includes(index)) return;
  seat.busy = true;
  seat.motion = 'walk';
  seat.goalIndex = index;
  broadcastRoom(room);
}

function handleReveal(client: Client, index: number) {
  if (client.roomId === null || client.seat === null) return;
  const room = rooms.get(client.roomId);
  if (!room || room.phase !== 'play') return;
  const seat = room.seats[client.seat]!;
  if (!seat.busy || seat.goalIndex !== index) return;
  const recipe = RECIPES.find((item) => item.id === room.recipeIds[client.seat!]);
  if (!recipe) return;
  seat.motion = 'point';
  const result = revealSeat(room.cards, recipe.ingredientIds, seatLogic(seat), index);
  if (result.outcome === 'ignore') {
    seat.busy = false;
    seat.motion = 'idle';
    seat.goalIndex = null;
    broadcastRoom(room);
    return;
  }
  seat.logic = result.seat;
  if (result.outcome === 'match') {
    room.turn += 1;
    room.lastMatch = {
      seat: client.seat,
      ingredientId: room.cards[index]!,
      matched: result.matched,
      turn: room.turn,
    };
    if (result.phase === 'won' && seat.logic.finishedAt === null) {
      seat.logic = { ...seat.logic, finishedAt: Date.now() - (room.startedAt ?? Date.now()) };
    }
  }
  broadcastRoom(room);
}

function handleMotionDone(client: Client) {
  if (client.roomId === null || client.seat === null) return;
  const room = rooms.get(client.roomId);
  if (!room) return;
  const seat = room.seats[client.seat]!;
  seat.busy = false;
  seat.motion = 'idle';
  seat.goalIndex = null;
  if (room.seats.every((item) => item.logic.finishedAt !== null)) room.phase = 'finished';
  broadcastRoom(room);
}

function detachFromRoom(client: Client) {
  if (!client.roomId || client.seat === null) return;
  const room = rooms.get(client.roomId);
  const seatIndex = client.seat;
  client.roomId = null;
  client.seat = null;
  if (!room) return;
  room.seats[seatIndex]!.clientId = null;
  room.seats[seatIndex]!.busy = false;
  room.seats[seatIndex]!.motion = 'idle';
  room.seats[seatIndex]!.goalIndex = null;
  if (room.seats.every((seat) => seat.clientId === null)) {
    if (room.previewTimer) clearTimeout(room.previewTimer);
    rooms.delete(room.id);
    return;
  }
  broadcastRoom(room);
}

function onMessage(client: Client, raw: string) {
  let message: ClientMessage;
  try {
    message = JSON.parse(raw) as ClientMessage;
  } catch {
    send(client.socket, { type: 'error', message: '訊息格式錯誤' });
    return;
  }
  switch (message.type) {
    case 'joinQueue':
      joinQueue(client);
      break;
    case 'leaveQueue':
      leaveQueue(client);
      break;
    case 'walkTo':
      handleWalk(client, message.index);
      break;
    case 'reveal':
      handleReveal(client, message.index);
      break;
    case 'motionDone':
      handleMotionDone(client);
      break;
    default:
      send(client.socket, { type: 'error', message: '未知指令' });
  }
}

const port = Number(process.env.PORT) || MATCH_PORT;
const host = process.env.HOST || '0.0.0.0';
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('peinan cooking match ok');
});
const wss = new WebSocketServer({ server });
server.listen(port, host, () => {
  console.log(`match server on http://${host}:${port} (ws upgrade enabled)`);
});

wss.on('connection', (socket) => {
  const id = `c${serial}`;
  serial += 1;
  const client: Client = { id, socket, queue: false, roomId: null, seat: null };
  clients.set(id, client);
  socket.on('message', (data) => onMessage(client, String(data)));
  socket.on('close', () => {
    leaveQueue(client);
    detachFromRoom(client);
    clients.delete(id);
  });
});
