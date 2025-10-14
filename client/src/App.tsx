import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import {
  createGuest,
  fetchProfile,
  submitSoloScore,
  updateLoadout,
  registerAccount,
  loginAccount,
  upgradeGuest
} from './api/client';
import { useSessionStore } from './state/sessionStore';
import { GameRenderer } from './components/GameRenderer';
import { useSoloGame } from './game/useSoloGame';
import { useMultiplayerGame } from './game/useMultiplayerGame';
import type { AuthResponse } from './types';

function useSocketConnection() {
  const token = useSessionStore((state) => state.token);
  const socket = useSessionStore((state) => state.socket);
  const setSocket = useSessionStore((state) => state.setSocket);

  useEffect(() => {
    if (!token) return;
    if (socket) return;
    const url = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';
    const instance = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      auth: { token }
    });
    setSocket(instance);
    return () => {
      instance.disconnect();
      setSocket(null);
    };
  }, [token, socket, setSocket]);
}

export function App() {
  const player = useSessionStore((state) => state.player);
  const account = useSessionStore((state) => state.account);
  const token = useSessionStore((state) => state.token);
  const setPlayer = useSessionStore((state) => state.setPlayer);
  const setAccount = useSessionStore((state) => state.setAccount);
  const setToken = useSessionStore((state) => state.setToken);
  useSocketConnection();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<'guest' | 'login' | 'register'>('guest');
  const [soloSeed, setSoloSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [soloSubmitted, setSoloSubmitted] = useState(false);

  const { state: soloState, start: startSolo, flap: flapSolo } = useSoloGame(soloSeed);
  const { state: mpState, joinQueue, leaveQueue, flap: flapMp } = useMultiplayerGame();

  const startSoloRef = useRef(startSolo);
  startSoloRef.current = startSolo;

  const handleAuthSuccess = (response: AuthResponse) => {
    setPlayer(response.player);
    setAccount(response.account);
    setToken(response.token);
    setAuthError(null);
    setEmail('');
    setPassword('');
  };

  const handleGuest = async () => {
    try {
      setIsSubmitting(true);
      const response = await createGuest(displayName || undefined);
      handleAuthSuccess(response);
    } catch (err) {
      console.error(err);
      setAuthError('Unable to create guest profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!email || password.length < 8) {
      setAuthError('Provide a valid email and an 8+ character password.');
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await registerAccount(email, password, displayName || 'NewDuck');
      handleAuthSuccess(response);
    } catch (err) {
      console.error(err);
      setAuthError('Registration failed. Please try a different email or try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!email || password.length < 8) {
      setAuthError('Enter your email and password (8+ characters).');
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await loginAccount(email, password);
      handleAuthSuccess(response);
    } catch (err) {
      console.error(err);
      setAuthError('Login failed. Check your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpgrade = async () => {
    if (!token) return;
    if (!email || password.length < 8) {
      setAuthError('Enter a valid email and an 8+ character password to upgrade.');
      return;
    }
    try {
      setIsSubmitting(true);
      const response = await upgradeGuest(token, email, password);
      handleAuthSuccess(response);
    } catch (err) {
      console.error(err);
      setAuthError('Upgrade failed. Email may already be in use.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoloInput = () => {
    if (soloState.status === 'idle') {
      setSoloSubmitted(false);
      startSoloRef.current();
    } else if (soloState.status === 'running') {
      flapSolo();
    } else {
      setSoloSubmitted(false);
      setSoloSeed(Math.floor(Math.random() * 1_000_000));
      requestAnimationFrame(() => startSoloRef.current());
    }
  };

  useEffect(() => {
    if (!player || !token) return;
    if (soloState.status === 'ended' && !soloSubmitted) {
      setSoloSubmitted(true);
      submitSoloScore(token, player.id, soloState.score)
        .then((updated) => setPlayer(updated))
        .catch((err) => {
          console.error(err);
          setSoloSubmitted(false);
        });
    }
  }, [player, soloState.status, soloState.score, soloSubmitted, setPlayer]);

  useEffect(() => {
    if (!player || !token) return;
    if (mpState.status === 'completed') {
      fetchProfile(token, player.id)
        .then((updated) => setPlayer(updated))
        .catch((err) => console.error(err));
    }
  }, [mpState.status, player, token, setPlayer]);

  const handleQueueToggle = () => {
    if (mpState.status === 'idle' || mpState.status === 'completed') {
      joinQueue('casual');
    } else if (mpState.status === 'queueing') {
      leaveQueue('casual');
    }
  };

  const mpPlayerState = useMemo(() => {
    if (!player || !mpState.frame) return null;
    return mpState.frame.players.find((p) => p.playerId === player.id) ?? null;
  }, [player, mpState.frame]);

  if (!player || !token || !account) {
    return (
      <div className="app-shell">
        <div className="card">
          <h1>FloppyDuck Arena</h1>
          <p>Compete in head-to-head duck duels or master the classic solo run.</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              className="button-secondary"
              style={{ flex: 1, background: authMode === 'guest' ? 'rgba(37,99,235,0.12)' : undefined }}
              onClick={() => {
                setAuthMode('guest');
                setAuthError(null);
              }}
            >
              Guest
            </button>
            <button
              className="button-secondary"
              style={{ flex: 1, background: authMode === 'login' ? 'rgba(37,99,235,0.12)' : undefined }}
              onClick={() => {
                setAuthMode('login');
                setAuthError(null);
              }}
            >
              Login
            </button>
            <button
              className="button-secondary"
              style={{ flex: 1, background: authMode === 'register' ? 'rgba(37,99,235,0.12)' : undefined }}
              onClick={() => {
                setAuthMode('register');
                setAuthError(null);
              }}
            >
              Register
            </button>
          </div>

          {(authMode === 'guest' || authMode === 'register') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="displayName">Call sign</label>
              <input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Duckinator"
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(15,23,42,0.1)',
                  width: '100%'
                }}
              />
            </div>
          )}

          {authMode !== 'guest' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="duck@example.com"
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(15,23,42,0.1)',
                  width: '100%'
                }}
              />
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(15,23,42,0.1)',
                  width: '100%'
                }}
              />
            </div>
          )}

          <button
            className="button-primary"
            disabled={isSubmitting}
            onClick={() => {
              if (authMode === 'guest') return handleGuest();
              if (authMode === 'login') return handleLogin();
              return handleRegister();
            }}
          >
            {isSubmitting ? 'Working...' : authMode === 'guest' ? 'Enter as Guest' : authMode === 'login' ? 'Log In' : 'Create Account'}
          </button>
          {authError ? <p style={{ color: '#dc2626' }}>{authError}</p> : null}
        </div>
      </div>
    );
  }

  const handleThemeChange = async (theme: string) => {
    if (!token) return;
    try {
      const updated = await updateLoadout(token, player.id, { ...player.loadout, theme });
      setPlayer(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-shell">
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2>Welcome, {player.displayName}</h2>
        <p>Level {player.level} • {player.xp} XP • {player.currencies.feathers} Feathers</p>
        <p style={{ fontSize: 12, color: 'rgba(15,23,42,0.6)' }}>
          {account.email ? `Signed in as ${account.email}` : 'Guest account — upgrade to secure your progress.'}
        </p>
        {!account.email && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="duck@example.com"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(15,23,42,0.12)'
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create password"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(15,23,42,0.12)'
              }}
            />
            <button className="button-secondary" disabled={isSubmitting} onClick={handleUpgrade}>
              {isSubmitting ? 'Upgrading...' : 'Upgrade & Secure Progress'}
            </button>
            {authError ? <span style={{ color: '#dc2626', fontSize: 12 }}>{authError}</span> : null}
          </div>
        )}
        <div className="stat-grid">
          <div className="stat-card">
            <strong>{player.stats.bestSoloScore}</strong>
            <span>Best Solo</span>
          </div>
          <div className="stat-card">
            <strong>{player.stats.bestMultiplayerScore}</strong>
            <span>Best Multiplayer</span>
          </div>
          <div className="stat-card">
            <strong>{player.stats.wins}</strong>
            <span>Wins</span>
          </div>
          <div className="stat-card">
            <strong>{player.mmr}</strong>
            <span>MMR</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3>Legacy Solo Run</h3>
        <div className="game-container">
          <GameRenderer
            pipes={soloState.pipes}
            playerY={soloState.y}
            score={soloState.score}
            status={soloState.status}
            onFlap={handleSoloInput}
            theme={player.loadout.theme}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Tap to flap. Avoid pipes. Break your record!</span>
          <button className="button-secondary" onClick={() => handleSoloInput()}>
            {soloState.status === 'running' ? 'Flap!' : 'Play'}
          </button>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3>Head-to-Head Arena</h3>
        <div className="game-container">
          <GameRenderer
            pipes={mpState.frame?.pipes ?? []}
            playerY={mpPlayerState?.y ?? 0.5}
            score={mpPlayerState?.score ?? 0}
            status={mpState.status === 'inMatch' ? 'running' : 'idle'}
            onFlap={() => {
              if (mpState.status === 'inMatch') {
                flapMp();
              }
            }}
            theme={player.loadout.theme}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span>
            {mpState.status === 'queueing'
              ? 'Searching for challenger...'
              : mpState.status === 'inMatch'
              ? 'Battle live! Tap or press space to flap.'
              : mpState.status === 'completed'
              ? `Match complete! ${mpState.summary?.winnerId === player.id ? 'Victory!' : 'We will get them next time.'}`
              : 'Queue up for a duel against another Duck.'}
          </span>
          <button className="button-primary" onClick={handleQueueToggle}>
            {mpState.status === 'queueing'
              ? 'Leave Queue'
              : mpState.status === 'completed'
              ? 'Queue Again'
              : 'Queue for Match'}
          </button>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3>Theme Presets</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {player.cosmetics.themes.map((theme) => (
            <button
              key={theme}
              className="button-secondary"
              style={{
                flex: 1,
                borderColor: player.loadout.theme === theme ? '#1d4ed8' : undefined,
                background:
                  player.loadout.theme === theme ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.8)'
              }}
              onClick={() => handleThemeChange(theme)}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
