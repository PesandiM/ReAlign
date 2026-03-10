import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'patient' | 'staff' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const isAuthenticated = authService.isAuthenticated();
  const userRole = authService.getUserRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    // Admin can access staff routes
    const hasAccess = userRole === role || 
                      (role === 'staff' && userRole === 'admin');
    
    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;