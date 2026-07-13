import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { appRoutes } from "@/app/routes/page-config";
import { AppLayout } from "@/widgets/layout/AppLayout";
import { LoginPage } from "@/pages/auth/LoginPage";
import { useAuthSession } from "@/entities/auth/hooks/useAuthSession";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedAppLayout />}>
        {appRoutes.map((route) => (
          <Route
            key={route.key}
            path={route.path}
            element={<RoleGuard allowedRoles={route.allowedRoles}>{route.element}</RoleGuard>}
          />
        ))}
      </Route>
      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  );
}

function ProtectedAppLayout() {
  const location = useLocation();
  const authQuery = useAuthSession();

  if (authQuery.isLoading) {
    return <div className="auth-loading">Oturum kontrol ediliyor...</div>;
  }

  if (!authQuery.data) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AppLayout />;
}

function RoleGuard({ allowedRoles, children }: { allowedRoles?: string[]; children: ReactNode }) {
  const authQuery = useAuthSession();

  if (authQuery.isLoading) {
    return <div className="auth-loading">Yetki kontrol ediliyor...</div>;
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  if (authQuery.data && allowedRoles.includes(authQuery.data.role)) {
    return <>{children}</>;
  }

  return <Navigate to={resolveDefaultPath(authQuery.data?.role)} replace />;
}

function FallbackRedirect() {
  const authQuery = useAuthSession();

  if (authQuery.isLoading) {
    return <div className="auth-loading">Yonlendirme hazirlaniyor...</div>;
  }

  if (!authQuery.data) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={resolveDefaultPath(authQuery.data.role)} replace />;
}

function resolveDefaultPath(role?: string) {
  if (role === "admin") {
    return "/dashboard";
  }

  if (role === "manager") {
    return "/operations-center";
  }

  return "/user-workspace";
}
