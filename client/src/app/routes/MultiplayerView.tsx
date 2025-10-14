import { useEffect, useMemo } from 'react';
import { GameRenderer } from '../../components/GameRenderer';
import { fetchProfile } from '../../api/client';
import { useMultiplayerGame } from '../../game/useMultiplayerGame';
import { useAppStore } from '../../state/appStore';

export function MultiplayerView() {
  const player = useAppStore((state) => state.player);
  const token = useAppStore((state) => state.token);
  const setPlayer = useAppStore((state) => state.setPlayer);
  const { state, joinQueue, leaveQueue, flap } = useMultiplayerGame();

  useEffect(() => {
    if (!player || !token) return;
    if (state.status === 'completed') {
      fetchProfile(token, player.id)
        .then((updated) => setPlayer(updated))
        .catch((err) => console.error(err));
    }
  }, [state.status, player, token, setPlayer]);

  const handleQueue = () => {
    if (state.status === 'idle' || state.status === 'completed') {
      joinQueue('casual');
    } else if (state.status === 'queueing') {
      leaveQueue('casual');
    }
  };

  const statusLabel = useMemo(() => {
    switch (state.status) {
      case 'queueing':
        return 'Searching for an opponent…';
      case 'inMatch':
        return 'Survive longer than your rival! Tap or press space to flap.';
      case 'completed':
        return state.summary?.winnerId === player?.id ? 'Victory! Queue up again?' : 'Tough loss — queue again to climb.';
      default:
        return 'Join the queue to find a match.';
    }
  }, [state.status, state.summary?.winnerId, player?.id]);

  const localPlayer = useMemo(() => {
    if (!state.frame || !player) return null;
    return state.frame.players.find((p) => p.playerId === player.id) ?? null;
  }, [state.frame, player]);

  const opponentStatus = useMemo(() => {
    if (!state.frame || !player) return null;
    return state.frame.players.find((p) => p.playerId !== player.id) ?? null;
  }, [state.frame, player]);

  const opponentSprites = useMemo(() => {
    if (!state.frame || !player) return [];
    return state.frame.players
      .filter((p) => p.playerId !== player.id)
      .map((p) => ({ playerId: p.playerId, y: p.y, status: p.status }));
  }, [state.frame, player]);

  const currentScore = useMemo(() => {
    if (localPlayer) return localPlayer.score;
    const summaryScore = state.summary?.players.find((entry) => entry.playerId === player?.id)?.score;
    return summaryScore ?? 0;
  }, [localPlayer, state.summary?.players, player?.id]);

  return (
    <div className="page-stack">
      <section className="surface">
        <header className="section-header">
          <div>
            <h2>Head-to-head</h2>
            <p>{statusLabel}</p>
          </div>
          <button className={`btn ${state.status === 'queueing' ? 'btn-ghost' : 'btn-primary'}`} onClick={handleQueue}>
            {state.status === 'queueing' ? 'Leave queue' : 'Join casual queue'}
          </button>
        </header>
        <div className="game-wrapper">
          <GameRenderer
            pipes={state.frame?.pipes ?? []}
            playerY={localPlayer?.y ?? 0.5}
            theme={player?.loadout.theme ?? 'classic'}
            status={state.status === 'inMatch' ? 'running' : state.status === 'completed' ? 'ended' : 'idle'}
            score={currentScore}
            opponents={opponentSprites}
            onFlap={flap}
          />
        </div>
        <footer className="section-footer">
          <div className="match-meta">
            <div>
              <span className="meta-label">Opponent</span>
              <span className="meta-value">{opponentStatus ? `Score ${opponentStatus.score}` : '—'}</span>
            </div>
            <div>
              <span className="meta-label">Current score</span>
              <span className="meta-value">{currentScore}</span>
            </div>
            <div>
              <span className="meta-label">Match state</span>
              <span className="meta-value">{state.status}</span>
            </div>
          </div>
        </footer>
      </section>
      {state.summary ? (
        <section className="surface">
          <h3>Match summary</h3>
          <ul className="list-plain">
            {state.summary.players.map((entry) => (
              <li key={entry.playerId}>
                <span>{entry.playerId === player?.id ? 'You' : 'Opponent'}</span>
                <span>{entry.score} pts — {entry.status}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
