import { useEffect, useState, useCallback } from 'react';
import type { MultiplayerFrame, MultiplayerSummary } from '../types';
import { useSessionStore } from '../state/sessionStore';
import type { Socket } from 'socket.io-client';

export interface MultiplayerState {
  status: 'idle' | 'queueing' | 'inMatch' | 'completed';
  frame: MultiplayerFrame | null;
  summary: MultiplayerSummary | null;
  seed: number | null;
}

function attachListeners(socket: Socket, handlers: {
  onStart: (payload: { seed: number; tickRate: number }) => void;
  onState: (frame: MultiplayerFrame) => void;
  onEnd: (summary: MultiplayerSummary) => void;
}) {
  socket.on('game:start', handlers.onStart);
  socket.on('game:state', handlers.onState);
  socket.on('game:end', handlers.onEnd);
  return () => {
    socket.off('game:start', handlers.onStart);
    socket.off('game:state', handlers.onState);
    socket.off('game:end', handlers.onEnd);
  };
}

export function useMultiplayerGame() {
  const socket = useSessionStore((state) => state.socket);
  const [state, setState] = useState<MultiplayerState>({
    status: 'idle',
    frame: null,
    summary: null,
    seed: null
  });

  useEffect(() => {
    if (!socket) return;

    const detach = attachListeners(socket, {
      onStart: (payload) => {
        setState({ status: 'inMatch', frame: null, summary: null, seed: payload.seed });
      },
      onState: (frame) => {
        setState((prev) => ({ ...prev, frame, status: 'inMatch' }));
      },
      onEnd: (summary) => {
        setState((prev) => ({ ...prev, summary, status: 'completed' }));
      }
    });

    return detach;
  }, [socket]);

  const joinQueue = useCallback(
    (queue: 'casual' | 'ranked' = 'casual') => {
      if (!socket) return;
      setState({ status: 'queueing', frame: null, summary: null, seed: null });
      socket.emit('queue:join', { queue });
    },
    [socket]
  );

  const leaveQueue = useCallback(
    (queue: 'casual' | 'ranked' = 'casual') => {
      if (!socket) return;
      setState({ status: 'idle', frame: null, summary: null, seed: null });
      socket.emit('queue:leave', { queue });
    },
    [socket]
  );

  const flap = useCallback(() => {
    if (!socket || state.status !== 'inMatch') return;
    socket.emit('game:flap', { tick: state.frame?.tick ?? 0, flap: true });
  }, [socket, state.frame?.tick, state.status]);

  return { state, joinQueue, leaveQueue, flap };
}
