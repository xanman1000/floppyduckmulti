import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ThemePreference, useAppStore } from '../../state/appStore';
import { ConnectionBanner } from '../components/ConnectionBanner';

const NAV_LINKS = [
  { to: '/lobby', label: 'Lobby' },
  { to: '/solo', label: 'Solo' },
  { to: '/multiplayer', label: 'Multiplayer' },
  { to: '/profile', label: 'Profile' },
  { to: '/store', label: 'Store' }
];

export function AppShell() {
  const player = useAppStore((state) => state.player);
  const account = useAppStore((state) => state.account);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const clearSession = useAppStore((state) => state.clearSession);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate('/auth');
  };

  return (
    <div className="app-frame">
      <header className="app-header">
        <div>
          <h1 className="app-title">FloppyDuck Arena</h1>
          <p className="app-subtitle">Race, flap, and flex your flock</p>
        </div>
        <div className="profile-summary">
          <div>
            <p className="profile-name">{player?.displayName}</p>
            <p className="profile-meta">Lvl {player?.level ?? 0} • {player?.mmr ?? 0} MMR</p>
            {account?.isGuest ? <p className="profile-guest">Guest account</p> : null}
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <ConnectionBanner />

      <div className="app-body">
        <nav className="app-nav" aria-label="Primary">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`} to={link.to}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="nav-footer">
            <label className="form-label" htmlFor="theme-select">
              Theme
            </label>
            <select
              id="theme-select"
              className="input"
              value={theme}
              onChange={(event) => setTheme(event.target.value as ThemePreference)}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </nav>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
