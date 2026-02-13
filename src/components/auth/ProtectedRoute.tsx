// src/components/auth/ProtectedRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  roles,
  redirectTo = "/",
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show loading state if authentication is still being checked
  if (loading) {
    return <div>Loading...</div>; // Replace with your loading component
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (roles && !roles.includes(user.role || "")) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
