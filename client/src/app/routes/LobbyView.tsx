import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../state/appStore';

export function LobbyView() {
  const player = useAppStore((state) => state.player);
  const navigate = useNavigate();

  const currencies = useMemo(() => Object.entries(player?.currencies ?? {}), [player?.currencies]);

  return (
    <div className="page-stack">
      <section className="surface">
        <header className="section-header">
          <div>
            <h2>Ready up</h2>
            <p>Choose your mode and chase new high scores.</p>
          </div>
          <div className="cta-group">
            <button className="btn btn-primary" onClick={() => navigate('/solo')}>
              Solo run
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/multiplayer')}>
              Multiplayer queue
            </button>
          </div>
        </header>
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-label">Best solo score</span>
            <strong>{player?.stats.bestSoloScore ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Best multiplayer score</span>
            <strong>{player?.stats.bestMultiplayerScore ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Matches played</span>
            <strong>{player?.stats.totalMatches ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Win rate</span>
            <strong>
              {player && player.stats.totalMatches > 0
                ? `${Math.round((player.stats.wins / player.stats.totalMatches) * 100)}%`
                : '—'}
            </strong>
          </div>
        </div>
      </section>

      <section className="surface">
        <header className="section-header">
          <div>
            <h2>Progression</h2>
            <p>Level up and claim rewards as you flap through the arena.</p>
          </div>
        </header>
        <div className="progress-card">
          <div className="progress-header">
            <span>Level {player?.level ?? 0}</span>
            <span>{player?.xp ?? 0} XP</span>
          </div>
          <div className="progress-bar" role="progressbar" aria-valuenow={(player?.xp ?? 0) % 1000} aria-valuemin={0} aria-valuemax={1000}>
            <div style={{ width: `${((player?.xp ?? 0) % 1000) / 10}%` }} />
          </div>
          <p className="progress-caption">Every 1,000 XP grants a new cosmetic drop and Feather bonus.</p>
        </div>
      </section>

      <section className="surface">
        <header className="section-header">
          <div>
            <h2>Wallet</h2>
            <p>Spend Feathers and Golden Eggs on cosmetics in the store.</p>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('/store')}>
            Go to store
          </button>
        </header>
        <ul className="list-inline">
          {currencies.map(([currency, amount]) => (
            <li key={currency}>
              <span className="currency-tag">
                <strong>{amount}</strong>
                <span>{currency}</span>
              </span>
            </li>
          ))}
          {currencies.length === 0 ? <li>No currencies yet — play matches to earn rewards.</li> : null}
        </ul>
      </section>
    </div>
  );
}
