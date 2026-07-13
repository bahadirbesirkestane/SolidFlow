import { apiRequest } from "@/shared/api/client";

export type FileTypeRule = {
  extension: string;
  displayName: string;
  defaultProcess: string;
  defaultServiceType: string;
  isActive: boolean;
};

export type KeywordRule = {
  id: string;
  keyword: string;
  process: string;
  serviceType: string;
  matchTarget: "fileName" | "path";
  isActive: boolean;
};

export type FileNameRule = {
  id: string;
  name: string;
  strategyType: "normalize" | "classify" | "route" | "hybrid";
  patternMode: "prefix" | "suffix" | "contains" | "template" | "regex";
  patternValue: string;
  replacementValue: string;
  process: string;
  serviceType: string;
  priority: number;
  applyTo: "fileName" | "baseName";
  note: string;
  workflowTemplateId: string;
  flowGroupMode: "auto" | "mainGroup" | "folder" | "partCode" | "fileName" | "fixed";
  flowGroupValue: string;
  itemLabelTemplate: string;
  isActive: boolean;
};

export type PartOverride = {
  id: string;
  matchMode: "partCode" | "fileName";
  partCode: string;
  fileName: string;
  process: string;
  serviceType: string;
  note: string;
  isActive: boolean;
};

export type RuleResolverSource = {
  id: string;
  source: "override" | "fileName" | "keyword" | "fileType";
  label: string;
  matchValue?: string;
  process: string;
  serviceType: string;
  routingKey?: string;
  strategyType?: string;
  patternMode?: string;
  patternValue?: string;
  workflowTemplateId?: string;
  priority?: number;
  note?: string;
  displayName?: string;
  matchTarget?: string;
};

export type RuleResolverConfig = {
  precedence: string[];
  counts: {
    overrides: number;
    fileNameRules: number;
    keywordRules: number;
    fileTypeRules: number;
    totalActiveRules: number;
  };
  sources: {
    overrides: RuleResolverSource[];
    fileNameRules: RuleResolverSource[];
    keywordRules: RuleResolverSource[];
    fileTypeRules: RuleResolverSource[];
  };
};

export type DepartmentMappingRule = {
  departmentId: string;
  departmentName: string;
  aliases: string[];
};

export type WorkflowSlaRule = {
  id: string;
  workflowTemplateId: string;
  workflowNamePattern: string;
  stepNamePattern: string;
  targetHours: number;
  warningHours: number;
  priority: number;
  note: string;
  isActive: boolean;
};

export type AssignmentRulesConfig = {
  departmentMappings: DepartmentMappingRule[];
  workflowSlaRules: WorkflowSlaRule[];
};

export function listFileTypeRules() {
  return apiRequest<FileTypeRule[]>("/api/config/file-types");
}

export function saveFileTypeRules(payload: FileTypeRule[]) {
  return apiRequest<FileTypeRule[]>("/api/config/file-types", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listKeywordRules() {
  return apiRequest<KeywordRule[]>("/api/config/keyword-rules");
}

export function saveKeywordRules(payload: KeywordRule[]) {
  return apiRequest<KeywordRule[]>("/api/config/keyword-rules", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listFileNameRules() {
  return apiRequest<FileNameRule[]>("/api/config/file-name-rules");
}

export function saveFileNameRules(payload: FileNameRule[]) {
  return apiRequest<FileNameRule[]>("/api/config/file-name-rules", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listPartOverrides() {
  return apiRequest<PartOverride[]>("/api/config/part-overrides");
}

export function savePartOverrides(payload: PartOverride[]) {
  return apiRequest<PartOverride[]>("/api/config/part-overrides", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getRuleResolverConfig() {
  return apiRequest<RuleResolverConfig>("/api/config/rule-resolver");
}

export function getAssignmentRules() {
  return apiRequest<AssignmentRulesConfig>("/api/config/assignment-rules");
}

export function saveAssignmentRules(payload: AssignmentRulesConfig) {
  return apiRequest<AssignmentRulesConfig>("/api/config/assignment-rules", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
