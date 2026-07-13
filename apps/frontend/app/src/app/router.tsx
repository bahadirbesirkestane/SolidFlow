import { Navigate, Route, Routes } from "react-router-dom";
import { appRoutes } from "@/app/routes/page-config";
import { AppLayout } from "@/widgets/layout/AppLayout";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {appRoutes.map((route) => (
          <Route key={route.key} path={route.path} element={route.element} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/operations-center" replace />} />
    </Routes>
  );
}
