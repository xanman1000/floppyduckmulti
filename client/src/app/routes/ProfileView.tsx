import { FormEvent, useState } from 'react';
import { fetchSession, upgradeGuest } from '../../api/client';
import { useAppStore } from '../../state/appStore';

export function ProfileView() {
  const player = useAppStore((state) => state.player);
  const account = useAppStore((state) => state.account);
  const token = useAppStore((state) => state.token);
  const setSession = useAppStore((state) => state.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshSession = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const session = await fetchSession(token);
      setSession(session);
      setStatus('Session refreshed');
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to refresh session.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    if (!email || password.length < 8) {
      setError('Enter a valid email and password (8+ characters).');
      return;
    }
    try {
      setLoading(true);
      const response = await upgradeGuest(token, email, password);
      setSession(response);
      setStatus('Account upgraded! Check your inbox to verify your email.');
      setError(null);
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error(err);
      setError('Upgrade failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="surface">
        <header className="section-header">
          <div>
            <h2>Player identity</h2>
            <p>Manage your account, presence, and platform links.</p>
          </div>
          <button className="btn btn-ghost" disabled={loading} onClick={refreshSession}>
            Refresh session
          </button>
        </header>
        <div className="profile-grid">
          <div>
            <span className="meta-label">Display name</span>
            <span className="meta-value">{player?.displayName}</span>
          </div>
          <div>
            <span className="meta-label">Account type</span>
            <span className="meta-value">{account?.isGuest ? 'Guest' : 'Registered'}</span>
          </div>
          <div>
            <span className="meta-label">Email</span>
            <span className="meta-value">{account?.email ?? 'Not set'}</span>
          </div>
          <div>
            <span className="meta-label">Last login</span>
            <span className="meta-value">
              {account?.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString() : 'Unknown'}
            </span>
          </div>
        </div>
        {status ? <p className="form-success">{status}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
      </section>

      {account?.isGuest ? (
        <section className="surface">
          <h3>Upgrade your account</h3>
          <p>Secure your progress with an email login. You can also use this to play on additional devices.</p>
          <form className="form-stack" onSubmit={handleUpgrade}>
            <label className="form-field">
              <span className="form-label">Email</span>
              <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="form-field">
              <span className="form-label">Password</span>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>
            <button className="btn btn-primary" disabled={loading} type="submit">
              {loading ? 'Upgrading…' : 'Upgrade account'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="surface">
        <h3>Career stats</h3>
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-label">Wins</span>
            <strong>{player?.stats.wins ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Losses</span>
            <strong>{player?.stats.losses ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Best solo</span>
            <strong>{player?.stats.bestSoloScore ?? 0}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Best multiplayer</span>
            <strong>{player?.stats.bestMultiplayerScore ?? 0}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
