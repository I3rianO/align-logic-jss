import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'driver' | 'admin' | 'master';
  requiredCompany?: string;
  requiredSite?: string;
}

/**
 * ProtectedRoute - Handles authentication and authorization for routes
 * Replaces the insecure localStorage-based authentication system
 */
export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredCompany, 
  requiredSite 
}: ProtectedRouteProps) {
  const location = useLocation();
  const { 
    isAuthenticated, 
    userRole, 
    companyId, 
    siteId, 
    isMasterAdmin,
    canAccessCompany,
    canAccessSite
  } = useAuthStore();

  // Not authenticated - redirect to appropriate login
  if (!isAuthenticated) {
    const loginPath = requiredRole === 'driver' ? '/driver-login' : '/admin-login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Role-based access control
  if (requiredRole) {
    // Master admin can access everything
    if (!isMasterAdmin()) {
      // Check specific role requirement
      if (userRole !== requiredRole) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  // Company access control
  if (requiredCompany && !canAccessCompany(requiredCompany)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Site access control  
  if (requiredCompany && requiredSite && !canAccessSite(requiredCompany, requiredSite)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // All checks passed - render the protected content
  return <>{children}</>;
}

/**
 * AdminRoute - Shorthand for admin-only routes
 */
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="admin" {...props}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * DriverRoute - Shorthand for driver-only routes  
 */
export function DriverRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="driver" {...props}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * MasterAdminRoute - Shorthand for master admin only routes
 */
export function MasterAdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole="master" {...props}>
      {children}
    </ProtectedRoute>
  );
}