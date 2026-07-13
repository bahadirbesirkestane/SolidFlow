import { apiRequest } from "@/shared/api/client";

export type ScanRow = {
  partCode: string;
  fileName: string;
  fileType: string;
  extension: string;
  folder: string;
  mainGroup: string;
  suggestedProcess: string;
  serviceType: string;
  confidence: string;
  matchedBy: string;
  matchedRuleId?: string;
  matchedRuleSource?: string;
  reason?: string;
  routingKey?: string;
  relativePath: string;
  absolutePath: string;
  effectiveFileName?: string;
  quantity?: number;
  routingDecision?: {
    candidateGroup?: string;
  };
  fileNameRule?: {
    name: string;
    id: string;
    effectiveFileName: string;
  } | null;
};

export type ScanPartListItem = {
  partCode: string;
  fileName: string;
  mainGroup: string;
  suggestedProcess: string;
  serviceType: string;
  routingKey?: string;
  matchedBy?: string;
  matchedRuleSource?: string;
  quantity: number;
  fileCount: number;
  files: string[];
  note?: string;
};

export type ScanSummary = {
  totalFiles: number;
  assignedFiles: number;
  uncertainFiles: number;
  byProcess: Record<string, number>;
  byFileType: Record<string, number>;
  byServiceType: Record<string, number>;
};

export type ScanInsights = {
  quality: {
    totalFiles: number;
    uncertainFiles: number;
    transformedFiles: number;
    manualOverrides: number;
    exactMatches: number;
    estimatedMatches: number;
  };
  matchedBy: Record<string, number>;
  confidenceCounts: Record<string, number>;
  fileNameRuleHits: Record<string, number>;
  routingRuleHits: Record<string, number>;
  uncertainRows: Array<{
    fileName: string;
    folder: string;
    matchedBy: string;
  }>;
};

export type ScanProjectResponse = {
  scannedFolder: string;
  summary: ScanSummary;
  insights: ScanInsights;
  partList: ScanPartListItem[];
  rows: ScanRow[];
};

export type SelectFolderResponse = {
  selectedPath: string;
};

export function scanProject(folderPath: string) {
  return apiRequest<ScanProjectResponse>(`/api/scan?folder=${encodeURIComponent(folderPath)}`);
}

export function selectFolder(payload: {
  initialPath?: string;
  description?: string;
}) {
  return apiRequest<SelectFolderResponse>("/api/system/select-folder", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createBulkWorkOrders(payload: {
  code: string;
  name: string;
  description: string;
  folderPath: string;
  partList: ScanPartListItem[];
}) {
  return apiRequest<{
    project: {
      id: string;
      code: string;
      name: string;
    };
    workflows: unknown[];
    importedItemCount: number;
    createdWorkflowCount: number;
  }>("/api/operations/projects/bulk-work-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
