const { inferMainGroup } = require("../../domain/services/workflow-engine");
const { parseSolidFileDescriptor } = require("../../domain/services/solid-file-name-parser");

class ScanProjectUseCase {
  constructor({ projectScanner, workflowEngine, fileTypeRuleRepository, keywordRuleRepository, partOverrideRepository }) {
    this.projectScanner = projectScanner;
    this.workflowEngine = workflowEngine;
    this.fileTypeRuleRepository = fileTypeRuleRepository;
    this.keywordRuleRepository = keywordRuleRepository;
    this.partOverrideRepository = partOverrideRepository;
  }

  async execute(rootPath) {
    const [fileTypeRules, keywordRules, partOverrides] = await Promise.all([
      this.fileTypeRuleRepository.getAll(),
      this.keywordRuleRepository.getAll(),
      this.partOverrideRepository.getAll(),
    ]);

    const scannedFiles = await this.projectScanner.scan(rootPath, fileTypeRules);
    const rows = scannedFiles.map((fileDescriptor) => {
      const parsedName = parseSolidFileDescriptor(fileDescriptor);
      const enrichedDescriptor = {
        ...fileDescriptor,
        partCode: parsedName.partCode,
        parsedName,
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
        quantity: parsedName.quantity,
        revision: parsedName.revision,
        variant: parsedName.variant,
        isMirrored: parsedName.isMirrored,
        materialHints: parsedName.materialHints,
        processHints: parsedName.processHints,
      };
    });

    return {
      scannedFolder: rootPath,
      summary: buildSummary(rows),
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
