import type { ReactNode } from "react";
import type { AuthRole } from "@/entities/auth/api/auth-api";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { OperationsCenterPage } from "@/pages/operations-center/OperationsCenterPage";
import { RulesOverviewPage } from "@/pages/rules/RulesOverviewPage";
import { ErpCenterPage } from "@/pages/erp/ErpCenterPage";
import { UserWorkspacePage } from "@/pages/user-workspace/UserWorkspacePage";
import { WorkflowBuilderPage } from "@/pages/workflow-builder/WorkflowBuilderPage";
import { UserManagementPage } from "@/pages/user-management/UserManagementPage";
import { ManualWorkboardsPage } from "@/pages/manual-workboards/ManualWorkboardsPage";
import { FileDistributionPage } from "@/pages/file-distribution/FileDistributionPage";
import { SegmentRulesPage } from "@/pages/segment-rules/SegmentRulesPage";

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
    key: "manual-workboards",
    path: "/manual-workboards",
    title: "Manuel Is Panosu",
    section: "Ana Ekranlar",
    description: "Kart agaci ile manuel is yonetimi",
    element: <ManualWorkboardsPage />,
    allowedRoles: ["admin", "manager"],
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
    key: "file-distribution",
    path: "/file-distribution",
    title: "Dosya Dagitim Merkezi",
    section: "Tarama ve Kural Motoru",
    description: "Hedef klasor plani, rename onizleme ve guvenli kopyalama akisi",
    element: <FileDistributionPage />,
    allowedRoles: ["admin", "manager"],
  },
  {
    key: "segment-rules",
    path: "/segment-rules",
    title: "Segment Kural Merkezi",
    section: "Tarama ve Kural Motoru",
    description: "Segment onceligi ve segment bazli dagitim kurallari",
    element: <SegmentRulesPage />,
    allowedRoles: ["admin", "manager"],
  },
  {
    key: "user-management",
    path: "/user-management",
    title: "Kullanici ve Yetki",
    section: "Yonetim",
    description: "Kullanici, rol ve departman yonetimi",
    element: <UserManagementPage />,
    allowedRoles: ["admin"],
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
