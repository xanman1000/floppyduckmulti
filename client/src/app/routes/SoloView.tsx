import { useEffect, useMemo, useRef, useState } from 'react';
import { GameRenderer } from '../../components/GameRenderer';
import { submitSoloScore } from '../../api/client';
import { useSoloGame } from '../../game/useSoloGame';
import { useAppStore } from '../../state/appStore';

export function SoloView() {
  const player = useAppStore((state) => state.player);
  const token = useAppStore((state) => state.token);
  const setPlayer = useAppStore((state) => state.setPlayer);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [submitted, setSubmitted] = useState(false);
  const { state, start, flap } = useSoloGame(seed);
  const startRef = useRef(start);
  startRef.current = start;

  const handleInput = () => {
    if (state.status === 'idle') {
      setSubmitted(false);
      startRef.current();
    } else if (state.status === 'running') {
      flap();
    } else {
      setSubmitted(false);
      setSeed(Math.floor(Math.random() * 1_000_000));
      requestAnimationFrame(() => startRef.current());
    }
  };

  useEffect(() => {
    if (!player || !token) return;
    if (state.status === 'ended' && !submitted) {
      setSubmitted(true);
      submitSoloScore(token, player.id, state.score)
        .then((updated) => setPlayer(updated))
        .catch((err) => {
          console.error(err);
          setSubmitted(false);
        });
    }
  }, [state.status, state.score, submitted, player, token, setPlayer]);

  const statusLabel = useMemo(() => {
    switch (state.status) {
      case 'running':
        return 'Tap or press space to flap!';
      case 'ended':
        return 'Run over — tap to try a new seed.';
      default:
        return 'Tap to start your run.';
    }
  }, [state.status]);

  return (
    <div className="page-stack">
      <section className="surface">
        <header className="section-header">
          <div>
            <h2>Solo practice</h2>
            <p>Perfect your rhythm and chase personal records.</p>
          </div>
          <div className="solo-actions">
            <button className="btn btn-secondary" onClick={() => setSeed(Math.floor(Math.random() * 1_000_000))}>
              New seed
            </button>
            <span className="seed-label">Seed #{seed}</span>
          </div>
        </header>
        <div className="game-wrapper">
          <GameRenderer
            pipes={state.pipes}
            playerY={state.y}
            theme={player?.loadout.theme ?? 'classic'}
            status={state.status}
            score={state.score}
            onFlap={handleInput}
          />
        </div>
        <footer className="section-footer">
          <p>{statusLabel}</p>
          <p className="score-callout">Current score: {state.score}</p>
        </footer>
      </section>
    </div>
  );
}
