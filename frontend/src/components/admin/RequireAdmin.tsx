import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSession } from "../../services/authService";

// Frontend guard for the admin pages. The real check is on the backend
// (require_role("admin")); this only keeps non-admins away from the screens.
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation();
  const session = getSession();

  if (!session || session.role !== "admin") {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
