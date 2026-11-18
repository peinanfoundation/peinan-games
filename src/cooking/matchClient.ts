import { matchWsUrl, type ClientMessage, type ServerMessage } from './matchProtocol';

export type MatchStatus = 'idle' | 'connecting' | 'queued' | 'matched' | 'error';

export interface MatchClient {
  status: MatchStatus;
  error: string | null;
  connectAndQueue: () => void;
  cancel: () => void;
  send: (message: ClientMessage) => void;
  close: () => void;
}

export function createMatchClient(handlers: {
  onStatus: (status: MatchStatus, error?: string | null) => void;
  onMessage: (message: ServerMessage) => void;
}): MatchClient {
  let socket: WebSocket | null = null;
  let status: MatchStatus = 'idle';

  const setStatus = (next: MatchStatus, error: string | null = null) => {
    status = next;
    handlers.onStatus(next, error);
  };

  const send = (message: ClientMessage) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(message));
  };

  const close = () => {
    if (socket) {
      socket.close();
      socket = null;
    }
    setStatus('idle');
  };

  const connectAndQueue = () => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      send({ type: 'joinQueue' });
      return;
    }
    setStatus('connecting');
    const next = new WebSocket(matchWsUrl());
    socket = next;
    next.onopen = () => {
      setStatus('queued');
      send({ type: 'joinQueue' });
    };
    next.onmessage = (event) => {
      let message: ServerMessage;
      try {
        message = JSON.parse(String(event.data)) as ServerMessage;
      } catch {
        setStatus('error', '伺服器訊息無法讀取');
        return;
      }
      if (message.type === 'queued') setStatus('queued');
      if (message.type === 'leftQueue') setStatus('idle');
      if (message.type === 'matched') setStatus('matched');
      if (message.type === 'error') setStatus('error', message.message);
      handlers.onMessage(message);
    };
    next.onerror = () => {
      setStatus('error', '連不上對戰伺服器，請稍後再試或檢查連線');
    };
    next.onclose = () => {
      socket = null;
      if (status === 'matched' || status === 'queued' || status === 'connecting') {
        setStatus('idle');
      }
    };
  };

  const cancel = () => {
    if (status === 'queued' || status === 'connecting') {
      send({ type: 'leaveQueue' });
      close();
      return;
    }
    close();
  };

  return {
    get status() {
      return status;
    },
    error: null,
    connectAndQueue,
    cancel,
    send,
    close,
  };
}
