class SaveFileNameRulesUseCase {
  constructor({ fileNameRuleRepository }) {
    this.fileNameRuleRepository = fileNameRuleRepository;
  }

  async execute(rules) {
    const sanitizedRules = rules.map((rule, index) => ({
      id: String(rule.id || `file-name-rule-${index + 1}`),
      name: String(rule.name || `Dosya Adi Kurali ${index + 1}`).trim(),
      strategyType: sanitizeStrategyType(rule.strategyType),
      patternMode: sanitizePatternMode(rule.patternMode),
      patternValue: String(rule.patternValue || "").trim(),
      replacementValue: String(rule.replacementValue || "").trim(),
      process: String(rule.process || "").trim(),
      serviceType: String(rule.serviceType || "").trim(),
      priority: Number.isFinite(Number(rule.priority)) ? Number(rule.priority) : 0,
      applyTo: rule.applyTo === "baseName" ? "baseName" : "fileName",
      note: String(rule.note || "").trim(),
      workflowTemplateId: String(rule.workflowTemplateId || "").trim(),
      flowGroupMode: sanitizeFlowGroupMode(rule.flowGroupMode),
      flowGroupValue: String(rule.flowGroupValue || "").trim(),
      itemLabelTemplate: String(rule.itemLabelTemplate || "").trim(),
      isActive: Boolean(rule.isActive),
    }));

    return this.fileNameRuleRepository.saveAll(sanitizedRules);
  }
}

function sanitizePatternMode(value) {
  const supportedModes = new Set(["prefix", "suffix", "contains", "template", "regex"]);
  return supportedModes.has(value) ? value : "prefix";
}

function sanitizeStrategyType(value) {
  const supportedTypes = new Set(["normalize", "classify", "route", "hybrid"]);
  return supportedTypes.has(value) ? value : "normalize";
}

function sanitizeFlowGroupMode(value) {
  const supportedModes = new Set(["auto", "mainGroup", "folder", "partCode", "fileName", "fixed"]);
  return supportedModes.has(value) ? value : "auto";
}

module.exports = {
  SaveFileNameRulesUseCase,
};
