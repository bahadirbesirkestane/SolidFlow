import { apiRequest } from "@/shared/api/client";

export type FileDistributionPlanRow = {
  partCode: string;
  fileName: string;
  effectiveFileName: string;
  folder: string;
  relativePath: string;
  absolutePath: string;
  suggestedProcess: string;
  serviceType: string;
  category: string;
  subcategory: string;
  decisionConfidence: string;
  decisionReason: string;
  isCopyCandidate: boolean;
  targetDirectory: string;
  targetFilePath: string;
  renamePreview: {
    originalName: string;
    suggestedName: string;
    changed: boolean;
  };
  segmentValues: Record<string, string>;
  priorityValues: Array<{
    key: string;
    value: string;
    normalizedValue: string;
  }>;
};

export type FileDistributionCategoryRule = {
  id: string;
  name: string;
  matchMode: "any" | "all";
  keywords: string[];
  segmentMatchers: Array<{
    segmentKey: string;
    operator: "contains" | "equals" | "startsWith";
    value: string;
  }>;
  category: string;
  subcategory: string;
  renamePrefix: string;
  isCopyCandidate: boolean;
  confidence: string;
  priority: number;
  note: string;
  isActive: boolean;
};

export type FileDistributionConfig = {
  segmentPriority: string[];
  unresolvedFolderName: string;
  categoryRules: FileDistributionCategoryRule[];
};

export type FileDistributionPreviewResponse = {
  scannedFolder: string;
  targetRootPath: string;
  config: {
    segmentPriority: string[];
  };
  summary: {
    totalFiles: number;
    copyCandidateCount: number;
    uncertainCount: number;
    byCategory: Record<string, number>;
    bySubcategory: Record<string, number>;
  };
  groups: Array<{
    category: string;
    subcategory: string;
    fileCount: number;
    sampleFiles: string[];
  }>;
  renameSuggestions: Array<{
    relativePath: string;
    originalName: string;
    suggestedName: string;
    category: string;
    subcategory: string;
  }>;
  rows: FileDistributionPlanRow[];
};

export type FileDistributionRenamePreviewResponse = {
  scannedFolder: string;
  totalFileCount: number;
  operation: {
    mode: "prefix" | "suffix";
    text: string;
  };
  selection: {
    selectedFilePaths: string[];
    selectedFolderPaths: string[];
    includeSubfolders: boolean;
  };
  summary: {
    totalFileCount: number;
    selectedFileCount: number;
    selectedFolderCount: number;
    affectedFileCount: number;
    changedFileCount: number;
    validFileCount: number;
    invalidFileCount: number;
  };
  items: Array<{
    relativePath: string;
    folderPath: string;
    sourcePath: string;
    targetPath: string;
    originalName: string;
    suggestedName: string;
    changed: boolean;
    isValid: boolean;
    issues: Array<{
      code: string;
      message: string;
    }>;
  }>;
};

export type FileDistributionExecuteResponse = {
  scannedFolder: string;
  targetRootPath: string;
  dryRun: boolean;
  conflictPolicy: string;
  summary: {
    totalFiles: number;
    copied: number;
    planned: number;
    skipped: number;
    conflicted: number;
  };
  results: Array<{
    relativePath: string;
    sourcePath: string;
    targetPath: string;
    status: string;
    reason: string;
  }>;
};

export type FileDistributionRenameExecuteResponse = {
  scannedFolder: string;
  conflictPolicy: string;
  operation: {
    mode: string;
    text: string;
  };
  selection: {
    selectedFilePaths?: string[];
    selectedFolderPaths?: string[];
    includeSubfolders?: boolean;
  };
  summary: {
    totalCandidates: number;
    selectedCount: number;
    renamed: number;
    conflicted: number;
    unchanged: number;
    failed: number;
  };
  results: Array<{
    relativePath: string;
    sourcePath: string;
    targetPath: string;
    status: string;
    reason: string;
  }>;
};

export function previewFileDistribution(payload: {
  sourceFolder: string;
  targetRootPath?: string;
}) {
  return apiRequest<FileDistributionPreviewResponse>("/api/file-distribution/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function previewFileDistributionRename(payload: {
  sourceFolder: string;
  targetRootPath?: string;
  operation: {
    mode: "prefix" | "suffix";
    text: string;
  };
  selection: {
    selectedFilePaths?: string[];
    selectedFolderPaths?: string[];
    includeSubfolders?: boolean;
  };
}) {
  return apiRequest<FileDistributionRenamePreviewResponse>("/api/file-distribution/rename-preview", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function executeFileDistribution(payload: {
  sourceFolder: string;
  targetRootPath?: string;
  dryRun?: boolean;
  conflictPolicy?: "skip" | "suffix";
}) {
  return apiRequest<FileDistributionExecuteResponse>("/api/file-distribution/execute", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getFileDistributionConfig() {
  return apiRequest<FileDistributionConfig>("/api/config/file-distribution");
}

export function saveFileDistributionConfig(payload: FileDistributionConfig) {
  return apiRequest<FileDistributionConfig>("/api/config/file-distribution", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function executeFileDistributionRename(payload: {
  sourceFolder: string;
  targetRootPath?: string;
  conflictPolicy?: "skip" | "suffix";
  operation: {
    mode: "prefix" | "suffix";
    text: string;
  };
  selection: {
    selectedFilePaths?: string[];
    selectedFolderPaths?: string[];
    includeSubfolders?: boolean;
  };
}) {
  return apiRequest<FileDistributionRenameExecuteResponse>("/api/file-distribution/rename-execute", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
