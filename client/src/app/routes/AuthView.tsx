import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createGuest, loginAccount, registerAccount } from '../../api/client';
import { useAppStore } from '../../state/appStore';

const AUTH_TABS: Array<{ id: 'login' | 'register' | 'guest'; label: string }> = [
  { id: 'login', label: 'Sign in' },
  { id: 'register', label: 'Create account' },
  { id: 'guest', label: 'Play as guest' }
];

export function AuthView() {
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAppStore((state) => state.setSession);
  const token = useAppStore((state) => state.token);
  const account = useAppStore((state) => state.account);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token && account) {
      const state = location.state as { from?: { pathname: string } } | undefined;
      const next = state?.from?.pathname ?? '/lobby';
      navigate(next, { replace: true });
    }
  }, [token, account, navigate, location.state]);

  const title = useMemo(() => {
    switch (mode) {
      case 'login':
        return 'Welcome back';
      case 'register':
        return 'Create your arena identity';
      default:
        return 'Jump in as a guest';
    }
  }, [mode]);

  const subtitle = useMemo(() => {
    switch (mode) {
      case 'login':
        return 'Sign in to sync your progress, cosmetics, and rank.';
      case 'register':
        return 'Secure your feathers with an email login and start progressing.';
      default:
        return 'Try the arena instantly. You can upgrade to a full account later!';
    }
  }, [mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      if (mode === 'guest') {
        const response = await createGuest(displayName || undefined);
        setSession(response);
        navigate('/lobby');
        return;
      }
      if (mode === 'register') {
        if (!email || password.length < 8) {
          setError('Enter a valid email and a password with at least 8 characters.');
          return;
        }
        const response = await registerAccount(email, password, displayName || 'NewDuck');
        setSession(response);
        navigate('/lobby');
        return;
      }
      if (!email || password.length < 8) {
        setError('Enter your email and password (minimum 8 characters).');
        return;
      }
      const response = await loginAccount(email, password);
      setSession(response);
      navigate('/lobby');
    } catch (err) {
      console.error(err);
      if (mode === 'login') {
        setError('Unable to sign in. Check your credentials or try again later.');
      } else if (mode === 'register') {
        setError('Registration failed. Try a different email or try again later.');
      } else {
        setError('Could not create a guest profile. Please retry.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <header>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        <div className="tab-group" role="tablist">
          {AUTH_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab${mode === tab.id ? ' is-active' : ''}`}
              type="button"
              role="tab"
              aria-selected={mode === tab.id}
              onClick={() => {
                setMode(tab.id);
                setError(null);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <form className="form-stack" onSubmit={handleSubmit}>
          {(mode === 'guest' || mode === 'register') && (
            <label className="form-field">
              <span className="form-label">Display name</span>
              <input
                className="input"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Feathered legend"
                maxLength={32}
              />
            </label>
          )}
          {mode !== 'guest' && (
            <>
              <label className="form-field">
                <span className="form-label">Email</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required={mode !== 'guest'}
                />
              </label>
              <label className="form-field">
                <span className="form-label">Password</span>
                <input
                  className="input"
                  type="password"
                  value={password}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required={mode !== 'guest'}
                />
              </label>
            </>
          )}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="btn btn-primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Loading…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Play as guest'}
          </button>
        </form>
      </div>
      <footer className="auth-footer">
        <p>
          By continuing you agree to the FloppyDuck Arena terms of service and privacy policy. Multiplayer features require a
          stable network connection.
        </p>
      </footer>
    </div>
  );
}
