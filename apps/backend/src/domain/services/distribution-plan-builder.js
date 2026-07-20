const path = require("path");

class DistributionPlanBuilder {
  constructor({ fileDistributionRuleEngine }) {
    this.fileDistributionRuleEngine = fileDistributionRuleEngine;
  }

  build(rows, config = {}, options = {}) {
    const targetRootPath = String(options.targetRootPath || "").trim();
    const planRows = rows.map((row) => buildPlanRow(
      row,
      this.fileDistributionRuleEngine.resolve(row, config),
      targetRootPath,
    ));

    return {
      rows: planRows,
      summary: buildSummary(planRows),
      groups: buildGroups(planRows),
      renameSuggestions: buildRenameSuggestions(planRows),
    };
  }
}

function buildPlanRow(row, decision, targetRootPath) {
  const safeFileName = String(row.effectiveFileName || row.fileName || "").trim();
  const targetSegments = [decision.category, decision.subcategory].filter(Boolean);
  const targetDirectory = targetRootPath
    ? path.join(targetRootPath, ...targetSegments)
    : targetSegments.join("\\");
  const targetFilePath = targetDirectory
    ? path.join(targetDirectory, safeFileName)
    : safeFileName;

  return {
    partCode: row.partCode || "",
    fileName: row.fileName,
    effectiveFileName: row.effectiveFileName || row.fileName,
    folder: row.folder,
    relativePath: row.relativePath,
    absolutePath: row.absolutePath,
    suggestedProcess: row.suggestedProcess,
    serviceType: row.serviceType,
    category: decision.category,
    subcategory: decision.subcategory,
    decisionConfidence: decision.confidence,
    decisionReason: decision.reason,
    isCopyCandidate: decision.isCopyCandidate,
    targetDirectory,
    targetFilePath,
    renamePreview: buildRenamePreview(row, decision),
    segmentValues: decision.parsedSegments.sourceValues,
    priorityValues: decision.priorityValues,
  };
}

function buildRenamePreview(row, decision) {
  const originalName = String(row.effectiveFileName || row.fileName || "");
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const normalizedPrefix = String(decision.renamePrefix || "").trim();
  if (!normalizedPrefix) {
    return {
      originalName,
      suggestedName: originalName,
      changed: false,
    };
  }

  const suggestedBase = baseName.startsWith(`${normalizedPrefix}_`)
    ? baseName
    : `${normalizedPrefix}_${baseName}`;

  return {
    originalName,
    suggestedName: `${suggestedBase}${extension}`,
    changed: suggestedBase !== baseName,
  };
}

function buildSummary(rows) {
  return {
    totalFiles: rows.length,
    copyCandidateCount: rows.filter((row) => row.isCopyCandidate).length,
    uncertainCount: rows.filter((row) => !row.isCopyCandidate).length,
    byCategory: aggregate(rows, "category"),
    bySubcategory: aggregate(rows, "subcategory"),
  };
}

function buildGroups(rows) {
  const groupMap = new Map();
  for (const row of rows) {
    const key = `${row.category}::${row.subcategory}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        category: row.category,
        subcategory: row.subcategory,
        fileCount: 0,
        sampleFiles: [],
      });
    }

    const group = groupMap.get(key);
    group.fileCount += 1;
    if (group.sampleFiles.length < 5) {
      group.sampleFiles.push(row.fileName);
    }
  }

  return Array.from(groupMap.values());
}

function buildRenameSuggestions(rows) {
  return rows
    .filter((row) => row.renamePreview.changed)
    .slice(0, 100)
    .map((row) => ({
      relativePath: row.relativePath,
      originalName: row.renamePreview.originalName,
      suggestedName: row.renamePreview.suggestedName,
      category: row.category,
      subcategory: row.subcategory,
    }));
}

function aggregate(rows, key) {
  return rows.reduce((collection, row) => {
    const label = String(row[key] || "Belirsiz");
    collection[label] = (collection[label] || 0) + 1;
    return collection;
  }, {});
}

module.exports = {
  DistributionPlanBuilder,
};
