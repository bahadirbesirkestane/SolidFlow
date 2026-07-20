const { inferMainGroup } = require("../../domain/services/rule-resolver");
const { parseSolidFileDescriptor } = require("../../domain/services/solid-file-name-parser");
const { resolveFileNameStrategy } = require("../../domain/services/file-name-strategy-engine");

class ScanProjectCore {
  constructor({
    projectScanner,
    ruleResolver,
    fileTypeRuleRepository,
    keywordRuleRepository,
    fileNameRuleRepository,
    partOverrideRepository,
    cadConversionService,
  }) {
    this.projectScanner = projectScanner;
    this.ruleResolver = ruleResolver;
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

    const rows = scannedFiles.map((fileDescriptor) => buildScanRow({
      fileDescriptor,
      ruleResolver: this.ruleResolver,
      fileTypeRules,
      keywordRules,
      fileNameRules,
      partOverrides,
    }));

    return {
      scannedFolder: rootPath,
      rows,
      configuration: {
        fileTypeRules,
        keywordRules,
        fileNameRules,
        partOverrides,
      },
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

function buildScanRow({
  fileDescriptor,
  ruleResolver,
  fileTypeRules,
  keywordRules,
  fileNameRules,
  partOverrides,
}) {
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

  const classification = ruleResolver.resolve(enrichedDescriptor, {
    fileTypeRules,
    fileNameRules,
    keywordRules,
    partOverrides,
  });

  return {
    partCode: classification.partCode,
    fileName: fileDescriptor.fileName,
    fileType: classification.fileType,
    extension: fileDescriptor.extension,
    folder: fileDescriptor.folder,
    mainGroup: inferMainGroup(fileDescriptor.relativePath),
    suggestedProcess: classification.process,
    serviceType: classification.serviceType,
    confidence: classification.confidence,
    matchedBy: classification.matchedBy,
    matchedRuleId: classification.matchedRuleId,
    matchedRuleSource: classification.matchedRuleSource,
    reason: classification.reason,
    routingKey: classification.routingKey,
    relativePath: fileDescriptor.relativePath,
    absolutePath: fileDescriptor.absolutePath,
    effectiveFileName: classification.effectiveFileName,
    quantity: classification.parsedName.quantity,
    revision: classification.parsedName.revision,
    variant: classification.parsedName.variant,
    isMirrored: classification.parsedName.isMirrored,
    materialHints: classification.parsedName.materialHints,
    processHints: classification.parsedName.processHints,
    parsedName: classification.parsedName,
    routingRule: classification.routingDecision.workflowTemplateId ? {
      name: fileNameRuleMatch.routingRule?.name || fileNameRuleMatch.routingRule?.id || "",
      workflowTemplateId: classification.routingDecision.workflowTemplateId,
      flowGroupMode: classification.routingDecision.flowGroupMode,
      flowGroupValue: classification.routingDecision.flowGroupValue,
      itemLabelTemplate: classification.routingDecision.itemLabelTemplate,
      routingKey: classification.routingDecision.routingKey,
    } : null,
    routingDecision: classification.routingDecision,
    fileNameRule: fileNameRuleMatch.matched ? {
      name: fileNameRuleMatch.rule.name,
      id: fileNameRuleMatch.rule.id,
      explanation: fileNameRuleMatch.explanation,
      transformedValue: fileNameRuleMatch.transformedValue,
      effectiveFileName: fileNameRuleMatch.effectiveFileName,
      matchedRuleCount: fileNameRuleMatch.matchedRules.length,
    } : null,
  };
}

module.exports = {
  ScanProjectCore,
};
