const { ScanProjectCore } = require("../services/scan-project-core");

class ScanProjectUseCase {
  constructor({
    projectScanner,
    ruleResolver,
    fileTypeRuleRepository,
    keywordRuleRepository,
    fileNameRuleRepository,
    partOverrideRepository,
    cadConversionService,
  }) {
    this.scanProjectCore = new ScanProjectCore({
      projectScanner,
      ruleResolver,
      fileTypeRuleRepository,
      keywordRuleRepository,
      fileNameRuleRepository,
      partOverrideRepository,
      cadConversionService,
    });
  }

  async execute(rootPath) {
    const { rows } = await this.scanProjectCore.execute(rootPath);

    return {
      scannedFolder: rootPath,
      summary: buildSummary(rows),
      insights: buildInsights(rows),
      partList: buildPartList(rows),
      rows,
    };
  }
}

function buildSummary(rows) {
  const summary = {
    totalFiles: rows.length,
    assignedFiles: rows.filter((row) => row.confidence !== "Belirsiz").length,
    uncertainFiles: rows.filter((row) => row.confidence === "Belirsiz").length,
    byProcess: {},
    byFileType: {},
    byServiceType: {},
  };

  for (const row of rows) {
    summary.byProcess[row.suggestedProcess] = (summary.byProcess[row.suggestedProcess] || 0) + 1;
    summary.byFileType[row.fileType] = (summary.byFileType[row.fileType] || 0) + 1;
    summary.byServiceType[row.serviceType] = (summary.byServiceType[row.serviceType] || 0) + 1;
  }

  return summary;
}

function buildInsights(rows) {
  const matchedBy = {};
  const fileNameRuleHits = {};
  const routingRuleHits = {};
  const confidenceCounts = {};

  for (const row of rows) {
    matchedBy[row.matchedBy] = (matchedBy[row.matchedBy] || 0) + 1;
    confidenceCounts[row.confidence] = (confidenceCounts[row.confidence] || 0) + 1;

    if (row.fileNameRule?.name) {
      fileNameRuleHits[row.fileNameRule.name] = (fileNameRuleHits[row.fileNameRule.name] || 0) + 1;
    }

    const routingLabel = row.routingRule?.name || row.routingKey;
    if (routingLabel) {
      routingRuleHits[routingLabel] = (routingRuleHits[routingLabel] || 0) + 1;
    }
  }

  return {
    quality: {
      totalFiles: rows.length,
      uncertainFiles: rows.filter((row) => row.confidence === "Belirsiz").length,
      transformedFiles: rows.filter((row) => Boolean(row.fileNameRule)).length,
      manualOverrides: rows.filter((row) => row.matchedRuleSource === "override").length,
      exactMatches: rows.filter((row) => row.confidence === "Kesin").length,
      estimatedMatches: rows.filter((row) => row.confidence === "Tahmini").length,
    },
    matchedBy,
    confidenceCounts,
    fileNameRuleHits,
    routingRuleHits,
    uncertainRows: rows
      .filter((row) => row.confidence === "Belirsiz")
      .slice(0, 25)
      .map((row) => ({
        fileName: row.fileName,
        folder: row.folder,
        matchedBy: row.matchedBy,
      })),
  };
}

function buildPartList(rows) {
  const partMap = new Map();

  for (const row of rows) {
    const key = row.partCode || row.fileName;
    if (!partMap.has(key)) {
      partMap.set(key, {
        partCode: row.partCode || "",
        fileName: row.fileName,
        mainGroup: row.mainGroup || row.folder || "",
        suggestedProcess: row.suggestedProcess,
        serviceType: row.serviceType,
        routingKey: row.routingKey || "",
        matchedBy: row.matchedBy || "",
        matchedRuleSource: row.matchedRuleSource || "",
        quantity: 0,
        fileCount: 0,
        files: [],
      });
    }

    const item = partMap.get(key);
    item.quantity += Number(row.quantity || 1);
    item.fileCount += 1;
    item.files.push(row.fileName);

    if (!item.partCode && row.partCode) {
      item.partCode = row.partCode;
    }
  }

  return Array.from(partMap.values())
    .sort((left, right) => {
      const leftKey = left.partCode || left.fileName;
      const rightKey = right.partCode || right.fileName;
      return String(leftKey).localeCompare(String(rightKey), "tr");
    });
}

module.exports = {
  ScanProjectUseCase,
};
