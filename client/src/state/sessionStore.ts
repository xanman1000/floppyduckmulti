import { create } from 'zustand';
import type { AccountSummary, PlayerAccount } from '../types';
import type { Socket } from 'socket.io-client';

interface SessionState {
  player: PlayerAccount | null;
  account: AccountSummary | null;
  token: string | null;
  socket: Socket | null;
  setPlayer: (player: PlayerAccount | null) => void;
  setAccount: (account: AccountSummary | null) => void;
  setToken: (token: string | null) => void;
  setSocket: (socket: Socket | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  player: null,
  account: null,
  token: null,
  socket: null,
  setPlayer: (player) => set({ player }),
  setAccount: (account) => set({ account }),
  setToken: (token) => set({ token }),
  setSocket: (socket) => set({ socket })
}));
