import type { ReactNode } from "react";
import type { AuthRole } from "@/entities/auth/api/auth-api";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { OperationsCenterPage } from "@/pages/operations-center/OperationsCenterPage";
import { RulesOverviewPage } from "@/pages/rules/RulesOverviewPage";
import { ErpCenterPage } from "@/pages/erp/ErpCenterPage";
import { UserWorkspacePage } from "@/pages/user-workspace/UserWorkspacePage";
import { WorkflowBuilderPage } from "@/pages/workflow-builder/WorkflowBuilderPage";

export type AppRouteDefinition = {
  key: string;
  path: string;
  title: string;
  section: string;
  description: string;
  element: ReactNode;
  allowedRoles?: AuthRole[];
};

export const appRoutes: AppRouteDefinition[] = [
  {
    key: "dashboard",
    path: "/dashboard",
    title: "Genel Bakis",
    section: "Ana Ekranlar",
    description: "Yonetici ozeti ve kritik metrikler",
    element: <DashboardPage />,
    allowedRoles: ["admin", "manager"],
  },
  {
    key: "operations-center",
    path: "/operations-center",
    title: "Operasyon Merkezi",
    section: "Ana Ekranlar",
    description: "Proje, workflow ve audit yonetimi",
    element: <OperationsCenterPage />,
    allowedRoles: ["admin", "manager"],
  },
  {
    key: "user-workspace",
    path: "/user-workspace",
    title: "Kullanici Is Alani",
    section: "Ana Ekranlar",
    description: "Kisi bazli is takibi",
    element: <UserWorkspacePage />,
    allowedRoles: ["admin", "manager", "worker"],
  },
  {
    key: "erp-center",
    path: "/erp-center",
    title: "ERP Merkezi",
    section: "Ana Ekranlar",
    description: "ERP ve operasyon aktarimlari",
    element: <ErpCenterPage />,
    allowedRoles: ["admin", "manager"],
  },
  {
    key: "workflow-builder",
    path: "/workflow-builder",
    title: "Tarama ve Is Akisi",
    section: "Tarama ve Kural Motoru",
    description: "Klasor tarama, parca listesi ve toplu operasyon aktarimi",
    element: <WorkflowBuilderPage />,
    allowedRoles: ["admin", "manager"],
  },
  {
    key: "rules",
    path: "/rules",
    title: "Kural Merkezi",
    section: "Tarama ve Kural Motoru",
    description: "Dosya adi, tip ve yonlendirme kurallari",
    element: <RulesOverviewPage />,
    allowedRoles: ["admin"],
  },
];
