import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // Silent while resolving stored token

  return isAuthenticated ? <Navigate to="/feed" replace /> : <Outlet />;
}
