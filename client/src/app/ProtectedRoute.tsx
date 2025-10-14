import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../state/appStore';

export function ProtectedRoute() {
  const token = useAppStore((state) => state.token);
  const player = useAppStore((state) => state.player);
  const location = useLocation();

  if (!token || !player) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
