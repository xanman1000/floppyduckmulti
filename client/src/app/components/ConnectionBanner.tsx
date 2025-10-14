import { useMemo } from 'react';
import { useAppStore } from '../../state/appStore';

export function ConnectionBanner() {
  const connectionState = useAppStore((state) => state.connectionState);

  const { label, tone } = useMemo(() => {
    switch (connectionState) {
      case 'connecting':
        return { label: 'Connecting to arena servers…', tone: 'info' };
      case 'connected':
        return { label: 'Connected', tone: 'success' };
      case 'error':
        return { label: 'Connection issue — attempting to reconnect', tone: 'warning' };
      default:
        return { label: 'Offline — login required', tone: 'muted' };
    }
  }, [connectionState]);

  if (connectionState === 'connected') {
    return (
      <div className={`banner banner-${tone}`} aria-live="polite">
        <span className="dot" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className={`banner banner-${tone}`} role="status">
      <span className="dot" />
      <span>{label}</span>
    </div>
  );
}
