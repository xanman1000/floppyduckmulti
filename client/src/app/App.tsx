import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { fetchSession } from '../api/client';
import { useAppStore } from '../state/appStore';
import { useSocketManager } from '../hooks/useSocketManager';
import { AuthView } from './routes/AuthView';
import { LobbyView } from './routes/LobbyView';
import { SoloView } from './routes/SoloView';
import { MultiplayerView } from './routes/MultiplayerView';
import { ProfileView } from './routes/ProfileView';
import { StoreView } from './routes/StoreView';
import { AppShell } from './layouts/AppShell';
import { ProtectedRoute } from './ProtectedRoute';

function SessionBootstrap() {
  const token = useAppStore((state) => state.token);
  const player = useAppStore((state) => state.player);
  const lastSyncedAt = useAppStore((state) => state.lastSyncedAt);
  const setSession = useAppStore((state) => state.setSession);
  const clearSession = useAppStore((state) => state.clearSession);

  useEffect(() => {
    if (!token) return;
    const shouldRefresh = !player || !lastSyncedAt || Date.now() - lastSyncedAt > 60_000;
    if (!shouldRefresh) return;

    let cancelled = false;
    fetchSession(token)
      .then((session) => {
        if (!cancelled) {
          setSession(session);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          clearSession();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, player, lastSyncedAt, setSession, clearSession]);

  return null;
}

function ThemeManager() {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.theme = theme;
  }, [theme]);

  return null;
}

export function App() {
  useSocketManager();

  return (
    <BrowserRouter>
      <ThemeManager />
      <SessionBootstrap />
      <Routes>
        <Route path="/auth" element={<AuthView />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/lobby" replace />} />
            <Route path="/lobby" element={<LobbyView />} />
            <Route path="/solo" element={<SoloView />} />
            <Route path="/multiplayer" element={<MultiplayerView />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/store" element={<StoreView />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/lobby" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
