import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, HOME_BY_ROLE } from '../context/AuthContext';
import { Loading } from './ui';

// Any signed-in user
export function RequireAuth() {
  const { user, booting } = useAuth();
  const loc = useLocation();
  if (booting) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <Outlet />;
}

// Only the given role(s); others are sent to their own home
export function RequireRole({ roles }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  return <Outlet />;
}

// Signed-in users skip the public login/register pages
export function PublicOnly() {
  const { user, booting } = useAuth();
  if (booting) return <Loading />;
  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  return <Outlet />;
}
