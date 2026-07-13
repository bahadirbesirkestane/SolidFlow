import { apiRequest } from "@/shared/api/client";

export type FrontendShellConfig = {
  apiBaseUrl: string;
  defaultScanDir: string;
  legacyPath: string;
  reactBasePath: string;
  shellMode: "legacy-and-react" | "react-primary-with-legacy-tools" | "react-only";
  buildReady: boolean;
};

export function getFrontendShellConfig() {
  return apiRequest<FrontendShellConfig>("/api/system/frontend-shell");
}
