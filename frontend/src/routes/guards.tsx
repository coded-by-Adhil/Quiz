import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import type { AuthRole } from "@/features/auth/types";

function homeForRole(role: AuthRole): string {
  return role === "admin" ? "/admin/quizzes" : "/superadmin";
}

function currentPath(location: ReturnType<typeof useLocation>): string {
  return `${location.pathname}${location.search}${location.hash}`;
}

export function RequireAuth() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status !== "authenticated" || !user) {
    return (
      <Navigate
        replace
        state={{ from: currentPath(location) }}
        to="/login"
      />
    );
  }

  return <Outlet />;
}

interface RequireRoleProps {
  role: AuthRole;
}

export function RequireRole({ role }: RequireRoleProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (user.role !== role) {
    return <Navigate replace to={homeForRole(user.role)} />;
  }

  return <Outlet />;
}

export function GuestOnly() {
  const { status, user } = useAuth();

  if (status === "authenticated" && user) {
    return <Navigate replace to={homeForRole(user.role)} />;
  }

  return <Outlet />;
}
