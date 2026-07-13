import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { appRoutes } from "@/app/routes/page-config";
import { groupRoutesBySection } from "@/app/routes/route-groups";
import { logout } from "@/entities/auth/api/auth-api";
import { useAuthSession } from "@/entities/auth/hooks/useAuthSession";
import { useFrontendShellConfig } from "@/entities/system/hooks/useFrontendShellConfig";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authQuery = useAuthSession();
  const availableRoutes = appRoutes.filter((route) => {
    if (!authQuery.data?.role || !route.allowedRoles || route.allowedRoles.length === 0) {
      return true;
    }

    return route.allowedRoles.includes(authQuery.data.role);
  });
  const currentRoute = availableRoutes.find((route) => location.pathname === route.path) || availableRoutes[0] || appRoutes[0];
  const sections = groupRoutesBySection(availableRoutes);
  const shellConfigQuery = useFrontendShellConfig();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.setQueryData(["auth", "session"], null);
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      navigate("/login", { replace: true });
    },
  });
  const shellStateLabel = shellConfigQuery.isLoading
    ? "Shell config yukleniyor"
    : shellConfigQuery.isError
      ? "Shell config hatasi"
      : shellConfigQuery.data?.buildReady
        ? "React shell hazir"
        : "React shell build bekliyor";

  return (
    <div className="app-layout">
      <aside className="app-layout__sidebar">
        <div className="brand-block">
          <div className="brand-mark">SF</div>
          <div>
            <strong>SolidFlow</strong>
            <p>Guvenli yeni shell</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {sections.map(({ section, routes }) => (
            <section key={section} className="sidebar-section">
              <p className="sidebar-section__label">{section}</p>
              {routes.map((route) => (
                <NavLink
                  key={route.key}
                  to={route.path}
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? " is-active" : ""}`
                  }
                >
                  <span>{route.title}</span>
                  <small>{route.description}</small>
                </NavLink>
              ))}
            </section>
          ))}
        </nav>
      </aside>

      <main className="app-layout__main">
        <header className="topbar">
          <div>
            <p className="topbar__eyebrow">{currentRoute.section}</p>
            <strong>{currentRoute.title}</strong>
          </div>
          <div className="topbar__chips">
            <span>{authQuery.data?.fullName || "Oturum yok"}</span>
            <span>{authQuery.data?.role || "anonim"}</span>
            <span>{shellStateLabel}</span>
            <span>Base: {shellConfigQuery.data?.reactBasePath || "/app"}</span>
            <span>Route: {currentRoute.path}</span>
            <button type="button" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
              Cikis yap
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
