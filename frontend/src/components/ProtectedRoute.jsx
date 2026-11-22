import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui';

// Protected page: must be logged in; optional role restriction (RBAC on the client).
// The real enforcement is on the server; this only gives a better experience.
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Restoring your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return <Outlet />;
}
