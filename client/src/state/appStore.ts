import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Socket } from 'socket.io-client';
import type { AccountSummary, PlayerAccount, AuthResponse } from '../types';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type ThemePreference = 'system' | 'light' | 'dark';

interface SessionSlice {
  player: PlayerAccount | null;
  account: AccountSummary | null;
  token: string | null;
  socket: Socket | null;
  connectionState: ConnectionState;
  lastSyncedAt: number | null;
  setSession: (payload: AuthResponse) => void;
  clearSession: () => void;
  setPlayer: (player: PlayerAccount | null) => void;
  setAccount: (account: AccountSummary | null) => void;
  setToken: (token: string | null) => void;
  setSocket: (socket: Socket | null) => void;
  setConnectionState: (state: ConnectionState) => void;
  setLastSyncedAt: (timestamp: number | null) => void;
}

interface UISlice {
  theme: ThemePreference;
  navCollapsed: boolean;
  setTheme: (theme: ThemePreference) => void;
  setNavCollapsed: (collapsed: boolean) => void;
}

type AppState = SessionSlice & UISlice;

const createStorage = () => {
  if (typeof window === 'undefined') {
    const memoryStorage: Storage = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0
    };
    return memoryStorage;
  }
  return window.sessionStorage;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      player: null,
      account: null,
      token: null,
      socket: null,
      connectionState: 'disconnected',
      lastSyncedAt: null,
      setSession: ({ player, account, token }) =>
        set({ player, account, token, lastSyncedAt: Date.now() }),
      clearSession: () =>
        set({ player: null, account: null, token: null, socket: null, connectionState: 'disconnected', lastSyncedAt: null }),
      setPlayer: (player) => set({ player }),
      setAccount: (account) => set({ account }),
      setToken: (token) => set({ token }),
      setSocket: (socket) => set({ socket }),
      setConnectionState: (state) => set({ connectionState: state }),
      setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
      theme: 'system',
      navCollapsed: false,
      setTheme: (theme) => set({ theme }),
      setNavCollapsed: (collapsed) => set({ navCollapsed: collapsed })
    }),
    {
      name: 'floppyduck-app',
      storage: createJSONStorage(createStorage),
      partialize: (state) => ({
        player: state.player,
        account: state.account,
        token: state.token,
        theme: state.theme,
        lastSyncedAt: state.lastSyncedAt
      })
    }
  )
);

export const useSessionStore = useAppStore;
