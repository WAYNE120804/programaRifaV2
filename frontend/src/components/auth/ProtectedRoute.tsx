import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import Loading from '../common/Loading';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: ReactElement;
  allowedRoles?: string[];
}) => {
  const { loading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading label="Validando sesion..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.rol || '')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
