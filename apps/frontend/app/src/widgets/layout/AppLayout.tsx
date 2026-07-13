import { NavLink, Outlet, useLocation } from "react-router-dom";
import { appRoutes } from "@/app/routes/page-config";
import { groupRoutesBySection } from "@/app/routes/route-groups";
import { useFrontendShellConfig } from "@/entities/system/hooks/useFrontendShellConfig";

export function AppLayout() {
  const location = useLocation();
  const currentRoute = appRoutes.find((route) => location.pathname === route.path) || appRoutes[0];
  const sections = groupRoutesBySection(appRoutes);
  const shellConfigQuery = useFrontendShellConfig();
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
            <p>New architecture shell</p>
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
            <span>{shellStateLabel}</span>
            <span>Base: {shellConfigQuery.data?.reactBasePath || "/app"}</span>
            <span>Route: {currentRoute.path}</span>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
