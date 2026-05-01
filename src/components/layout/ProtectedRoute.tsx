import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "@/lib/queries";
import { tokenStore } from "@/lib/auth-store";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const me = useMe();
  const hasToken = !!tokenStore.access();

  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (me.isLoading) {
    return (
      <div className="container-edge py-32 text-center text-muted-foreground text-sm uppercase tracking-[0.2em]">
        Verifying…
      </div>
    );
  }

  if (me.isError) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
