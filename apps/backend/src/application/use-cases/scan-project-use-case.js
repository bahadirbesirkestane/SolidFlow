const { inferMainGroup } = require("../../domain/services/workflow-engine");
const { parseSolidFileDescriptor } = require("../../domain/services/solid-file-name-parser");
const { resolveFileNameStrategy } = require("../../domain/services/file-name-strategy-engine");

class ScanProjectUseCase {
  constructor({
    projectScanner,
    workflowEngine,
    fileTypeRuleRepository,
    keywordRuleRepository,
    fileNameRuleRepository,
    partOverrideRepository,
    cadConversionService,
  }) {
    this.projectScanner = projectScanner;
    this.workflowEngine = workflowEngine;
    this.fileTypeRuleRepository = fileTypeRuleRepository;
    this.keywordRuleRepository = keywordRuleRepository;
    this.fileNameRuleRepository = fileNameRuleRepository;
    this.partOverrideRepository = partOverrideRepository;
    this.cadConversionService = cadConversionService;
  }

  async execute(rootPath) {
    const [fileTypeRules, keywordRules, fileNameRules, partOverrides] = await Promise.all([
      this.fileTypeRuleRepository.getAll(),
      this.keywordRuleRepository.getAll(),
      this.fileNameRuleRepository.getAll(),
      this.partOverrideRepository.getAll(),
    ]);

    const scannedFiles = await this.projectScanner.scan(rootPath, fileTypeRules);
    this.scheduleCadConversions(rootPath, scannedFiles);
    const rows = scannedFiles.map((fileDescriptor) => {
      const fileNameRuleMatch = resolveFileNameStrategy(fileDescriptor, fileNameRules);
      const effectiveDescriptor = {
        ...fileDescriptor,
        fileName: fileNameRuleMatch.effectiveFileName || fileDescriptor.fileName,
      };
      const parsedName = parseSolidFileDescriptor(effectiveDescriptor);
      const enrichedDescriptor = {
        ...fileDescriptor,
        effectiveFileName: effectiveDescriptor.fileName,
        partCode: parsedName.partCode,
        parsedName,
        fileNameRuleMatch,
      };

      const classification = this.workflowEngine.resolve(enrichedDescriptor, {
        fileTypeRules,
        keywordRules,
        partOverrides,
      });

      return {
        partCode: enrichedDescriptor.partCode,
        fileName: fileDescriptor.fileName,
        fileType: classification.fileType,
        extension: fileDescriptor.extension,
        folder: fileDescriptor.folder,
        mainGroup: inferMainGroup(fileDescriptor.relativePath),
        suggestedProcess: classification.process,
        serviceType: classification.serviceType,
        confidence: classification.confidence,
        matchedBy: classification.matchedBy,
        relativePath: fileDescriptor.relativePath,
        absolutePath: fileDescriptor.absolutePath,
        effectiveFileName: effectiveDescriptor.fileName,
        quantity: parsedName.quantity,
        revision: parsedName.revision,
        variant: parsedName.variant,
        isMirrored: parsedName.isMirrored,
        materialHints: parsedName.materialHints,
        processHints: parsedName.processHints,
        routingRule: fileNameRuleMatch.routingRule ? {
          name: fileNameRuleMatch.routingRule.name,
          workflowTemplateId: fileNameRuleMatch.routingRule.workflowTemplateId,
          flowGroupMode: fileNameRuleMatch.routingRule.flowGroupMode,
          flowGroupValue: fileNameRuleMatch.routingRule.flowGroupValue,
          itemLabelTemplate: fileNameRuleMatch.routingRule.itemLabelTemplate,
        } : null,
        fileNameRule: fileNameRuleMatch.matched ? {
          name: fileNameRuleMatch.rule.name,
          explanation: fileNameRuleMatch.explanation,
          transformedValue: fileNameRuleMatch.transformedValue,
          effectiveFileName: fileNameRuleMatch.effectiveFileName,
          matchedRuleCount: fileNameRuleMatch.matchedRules.length,
        } : null,
      };
    });

    return {
      scannedFolder: rootPath,
      summary: buildSummary(rows),
      insights: buildInsights(rows),
      partList: buildPartList(rows),
      rows,
    };
  }

  scheduleCadConversions(rootPath, scannedFiles) {
    if (!this.cadConversionService) {
      return;
    }

    try {
      this.cadConversionService.scheduleMissingConversions(rootPath, scannedFiles);
    } catch (error) {}
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

    if (row.routingRule?.name) {
      routingRuleHits[row.routingRule.name] = (routingRuleHits[row.routingRule.name] || 0) + 1;
    }
  }

  return {
    quality: {
      totalFiles: rows.length,
      uncertainFiles: rows.filter((row) => row.confidence === "Belirsiz").length,
      transformedFiles: rows.filter((row) => Boolean(row.fileNameRule)).length,
      manualOverrides: rows.filter((row) => row.matchedBy.startsWith("Parca Override")).length,
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
