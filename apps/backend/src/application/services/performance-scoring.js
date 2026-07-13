const BLOCK_REASON_LABELS = {
  MALZEME_BEKLIYOR: "Malzeme bekliyor",
  DIS_ONAY_BEKLIYOR: "Dis onay bekliyor",
  TEKNIK_BELIRSIZLIK: "Teknik belirsizlik",
  BASKA_DEPARTMAN_BEKLENIYOR: "Baska departman bekleniyor",
  SISTEMSEL_ENGEL: "Sistemsel engel",
  GENEL: "Genel bekleme",
};

function calculatePerformanceProfile({ activeAssignments, completedAssignments, manualAdjustments, slaRules }) {
  const normalizedCompleted = (completedAssignments || [])
    .map((assignment) => normalizeCompletedAssignment(assignment, slaRules || []))
    .filter(Boolean);
  const normalizedActive = (activeAssignments || []).map((assignment) => ({
    ...assignment,
    blockedReason: parseBlockedReason(assignment.completionNote),
  }));
  const totalCompleted = normalizedCompleted.length;
  const completedThisWeek = normalizedCompleted.filter((assignment) => isWithinLastDays(assignment.completedAt, 7)).length;
  const averageCompletionHours = average(normalizedCompleted.map((assignment) => assignment.actualHours));
  const averageTargetHours = average(normalizedCompleted.map((assignment) => assignment.targetHours));
  const handoverCount = normalizedCompleted.filter((assignment) => Boolean(String(assignment.handoverTo || "").trim())).length;
  const reworkCount = normalizedCompleted.filter((assignment) => assignment.actualHours > assignment.targetHours * 1.5).length;
  const blockedAssignments = normalizedActive.filter((assignment) => assignment.blockedReason);
  const blockedReasonSummary = summarizeBlockedReasons(blockedAssignments);
  const manualAdjustmentTotal = (manualAdjustments || []).reduce((total, adjustment) => total + Number(adjustment.delta || 0), 0);

  const speedScore = totalCompleted > 0
    ? clamp(Math.round(average(normalizedCompleted.map((assignment) => scoreSpeed(assignment.actualHours, assignment.targetHours)))), 55, 100)
    : 70;
  const qualityScore = clamp(100 - (reworkCount * 12) - (handoverCount * 4), 45, 100);
  const volumeScore = clamp(45 + (Math.min(totalCompleted, 20) * 2) + (Math.min(completedThisWeek, 10) * 3), 45, 100);
  const consistencyScore = clamp(100 - (blockedAssignments.length * 2), 70, 100);
  const baseScore = Math.round((speedScore * 0.4) + (qualityScore * 0.3) + (volumeScore * 0.2) + (consistencyScore * 0.1));
  const totalScore = clamp(baseScore + manualAdjustmentTotal, 0, 100);

  return {
    score: {
      total: totalScore,
      base: baseScore,
      manualAdjustmentTotal,
      breakdown: {
        speed: speedScore,
        quality: qualityScore,
        volume: volumeScore,
        consistency: consistencyScore,
      },
      positiveReasons: buildPositiveReasons({
        speedScore,
        qualityScore,
        volumeScore,
        completedThisWeek,
        manualAdjustmentTotal,
      }),
      cautionReasons: buildCautionReasons({
        speedScore,
        qualityScore,
        handoverCount,
        reworkCount,
        blockedAssignments,
        manualAdjustmentTotal,
      }),
    },
    metrics: {
      totalCompleted,
      completedThisWeek,
      averageCompletionHours: roundToOne(averageCompletionHours),
      averageTargetHours: roundToOne(averageTargetHours),
      handoverCount,
      reworkCount,
      blockedActiveCount: blockedAssignments.length,
      blockedReasonSummary,
    },
  };
}

function buildDepartmentBenchmark({ selectedUserId, selectedDepartmentName, entries, selectedScore }) {
  const validEntries = (entries || []).filter((entry) => Number.isFinite(entry.score));
  const sortedEntries = [...validEntries].sort((left, right) => right.score - left.score);
  const rank = sortedEntries.findIndex((entry) => entry.userId === selectedUserId) + 1;
  const departmentAverageScore = average(validEntries.map((entry) => entry.score));
  const departmentAverageCompletionHours = average(validEntries.map((entry) => entry.averageCompletionHours).filter(Number.isFinite));

  return {
    departmentName: selectedDepartmentName || "Departman yok",
    userCount: validEntries.length,
    userRank: rank > 0 ? rank : null,
    departmentAverageScore: roundToOne(departmentAverageScore),
    departmentAverageCompletionHours: roundToOne(departmentAverageCompletionHours),
    scoreGapFromAverage: roundToOne((Number(selectedScore) || 0) - departmentAverageScore),
  };
}

function summarizeBlockedReasons(assignments) {
  const counts = new Map();
  assignments.forEach((assignment) => {
    const code = assignment.blockedReason?.code || "GENEL";
    counts.set(code, (counts.get(code) || 0) + 1);
  });

  return Array.from(counts.entries()).map(([code, count]) => ({
    code,
    label: BLOCK_REASON_LABELS[code] || BLOCK_REASON_LABELS.GENEL,
    count,
  }));
}

function normalizeCompletedAssignment(assignment, slaRules) {
  if (!assignment?.createdAt || !assignment?.completedAt) {
    return null;
  }

  const targetHours = resolveTargetHours({
    workflowTemplateId: assignment.workflowTemplateId,
    workflowName: assignment.workflowName || "",
    stepName: assignment.stepName || "",
    slaRules,
  });
  const actualHours = diffHours(assignment.createdAt, assignment.completedAt);

  return {
    ...assignment,
    targetHours,
    actualHours,
  };
}

function buildPositiveReasons({ speedScore, qualityScore, volumeScore, completedThisWeek, manualAdjustmentTotal }) {
  const reasons = [];

  if (speedScore >= 90) {
    reasons.push("Isler hedef sureye yakin tamamlandi.");
  }
  if (qualityScore >= 90) {
    reasons.push("Devir ve yeniden is ihtiyaci dusuk kaldi.");
  }
  if (volumeScore >= 75) {
    reasons.push(`${completedThisWeek} is bu hafta tamamlandi ve is hacmi dengeli ilerledi.`);
  }
  if (manualAdjustmentTotal > 0) {
    reasons.push(`Admin tarafindan +${manualAdjustmentTotal} puan duzeltmesi uygulandi.`);
  }

  return reasons;
}

function buildCautionReasons({ speedScore, qualityScore, handoverCount, reworkCount, blockedAssignments, manualAdjustmentTotal }) {
  const reasons = [];

  if (speedScore < 75) {
    reasons.push("Ortalama tamamlama suresi hedefin uzerinde kaldi.");
  }
  if (qualityScore < 80 && handoverCount > 0) {
    reasons.push(`Toplam ${handoverCount} devir kaydi kalite puanini etkiledi.`);
  }
  if (reworkCount > 0) {
    reasons.push(`${reworkCount} is hedef suresinin belirgin uzerine cikti.`);
  }
  if (blockedAssignments.length > 0) {
    reasons.push(`${blockedAssignments.length} aktif is bloke kategorisinde izleniyor. Bu kayitlar dogrudan ceza olarak yazilmaz.`);
  }
  if (manualAdjustmentTotal < 0) {
    reasons.push(`Admin tarafindan ${manualAdjustmentTotal} puan duzeltmesi uygulandi.`);
  }

  return reasons;
}

function parseBlockedReason(note) {
  const normalized = String(note || "").trim();
  const match = normalized.match(/^\[BLOKE(?::([A-Z_]+))?\]\s*(.*)$/i);
  if (!match) {
    return null;
  }

  const code = String(match[1] || "GENEL").toUpperCase();
  return {
    code,
    label: BLOCK_REASON_LABELS[code] || BLOCK_REASON_LABELS.GENEL,
    note: String(match[2] || "").trim(),
  };
}

function resolveTargetHours({ workflowTemplateId, workflowName, stepName, slaRules }) {
  const matchedRule = [...(slaRules || [])]
    .filter((rule) => rule.isActive !== false)
    .sort((left, right) => Number(right.priority || 0) - Number(left.priority || 0))
    .find((rule) => {
      const templateMatches = !rule.workflowTemplateId || rule.workflowTemplateId === workflowTemplateId;
      const workflowMatches = !rule.workflowNamePattern || includesNormalized(workflowName, rule.workflowNamePattern);
      const stepMatches = !rule.stepNamePattern || includesNormalized(stepName, rule.stepNamePattern);
      return templateMatches && workflowMatches && stepMatches;
    });
  if (matchedRule?.targetHours) {
    return Number(matchedRule.targetHours);
  }

  const normalized = String(stepName || workflowName || "").toLocaleLowerCase("tr-TR");
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

function includesNormalized(left, right) {
  return String(left || "").toLocaleLowerCase("tr-TR").includes(String(right || "").toLocaleLowerCase("tr-TR"));
}

function scoreSpeed(actualHours, targetHours) {
  const safeActual = Math.max(Number(actualHours) || 0, 0.25);
  const safeTarget = Math.max(Number(targetHours) || 0, 0.25);
  const ratio = safeActual / safeTarget;

  if (ratio <= 1) {
    return 95 + ((1 - ratio) * 5);
  }

  if (ratio <= 1.5) {
    return 95 - ((ratio - 1) * 40);
  }

  return 75 - Math.min((ratio - 1.5) * 20, 30);
}

function diffHours(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }

  return Math.max((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60), 0);
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) {
    return 0;
  }

  return valid.reduce((total, value) => total + value, 0) / valid.length;
}

function roundToOne(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isWithinLastDays(value, dayCount) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const threshold = Date.now() - (dayCount * 24 * 60 * 60 * 1000);
  return date.getTime() >= threshold;
}

module.exports = {
  BLOCK_REASON_LABELS,
  buildDepartmentBenchmark,
  calculatePerformanceProfile,
  parseBlockedReason,
};
