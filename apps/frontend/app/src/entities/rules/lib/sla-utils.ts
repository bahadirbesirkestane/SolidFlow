import type { WorkflowStep, WorkflowInstance } from "@/entities/operations/api/operations-api";
import type { WorkflowSlaRule } from "@/entities/rules/api/rules-api";

export type SlaWarningState = {
  targetHours: number;
  warningHours: number;
  elapsedHours: number;
  remainingHours: number;
  isWarning: boolean;
  matchedRuleLabel: string;
};

export function resolveWorkflowStepWarning(
  workflow: Pick<WorkflowInstance, "name" | "templateName">,
  step: Pick<WorkflowStep, "name" | "createdAt" | "updatedAt">,
  slaRules: WorkflowSlaRule[],
): SlaWarningState {
  const matchedRule = [...(slaRules || [])]
    .filter((rule) => rule.isActive)
    .sort((left, right) => Number(right.priority || 0) - Number(left.priority || 0))
    .find((rule) => {
      const workflowMatches = !rule.workflowNamePattern || includesNormalized(workflow.name, rule.workflowNamePattern);
      const stepMatches = !rule.stepNamePattern || includesNormalized(step.name, rule.stepNamePattern);
      return workflowMatches && stepMatches;
    });

  const targetHours = Number(matchedRule?.targetHours || resolveDefaultTargetHours(step.name || workflow.name));
  const warningHours = Number(matchedRule?.warningHours || Math.max(targetHours * 1.25, targetHours));
  const elapsedHours = calculateElapsedHours(step.updatedAt || step.createdAt);

  return {
    targetHours,
    warningHours,
    elapsedHours,
    remainingHours: roundToOne(warningHours - elapsedHours),
    isWarning: elapsedHours >= warningHours,
    matchedRuleLabel: matchedRule?.note || matchedRule?.stepNamePattern || matchedRule?.workflowNamePattern || "Varsayilan SLA",
  };
}

function resolveDefaultTargetHours(value: string) {
  const normalized = String(value || "").toLocaleLowerCase("tr-TR");
  if (normalized.includes("kalite")) {
    return 6;
  }
  if (normalized.includes("kontrol")) {
    return 5;
  }
  if (normalized.includes("liste")) {
    return 4;
  }
  if (normalized.includes("dis hizmet")) {
    return 10;
  }
  if (normalized.includes("teknik")) {
    return 8;
  }

  return 8;
}

function includesNormalized(left: string, right: string) {
  return String(left || "").toLocaleLowerCase("tr-TR").includes(String(right || "").toLocaleLowerCase("tr-TR"));
}

function calculateElapsedHours(value?: string) {
  if (!value) {
    return 0;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return roundToOne(Math.max((Date.now() - date.getTime()) / (1000 * 60 * 60), 0));
}

function roundToOne(value: number) {
  return Math.round((Number(value) || 0) * 10) / 10;
}
