import type { AppRouteDefinition } from "@/app/routes/page-config";

export type AppRouteSection = AppRouteDefinition["section"];

export type AppRouteGroup = {
  section: AppRouteSection;
  routes: AppRouteDefinition[];
};

export function groupRoutesBySection(routes: AppRouteDefinition[]): AppRouteGroup[] {
  const grouped = routes.reduce((map, route) => {
    const bucket = map.get(route.section) || [];
    bucket.push(route);
    map.set(route.section, bucket);
    return map;
  }, new Map<AppRouteSection, AppRouteDefinition[]>());

  return Array.from(grouped.entries()).map(([section, groupedRoutes]) => ({
    section,
    routes: groupedRoutes,
  }));
}
