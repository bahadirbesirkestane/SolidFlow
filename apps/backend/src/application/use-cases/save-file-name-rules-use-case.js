class SaveFileNameRulesUseCase {
  constructor({ fileNameRuleRepository }) {
    this.fileNameRuleRepository = fileNameRuleRepository;
  }

  async execute(rules) {
    const sanitizedRules = rules.map((rule, index) => ({
      id: String(rule.id || `file-name-rule-${index + 1}`),
      name: String(rule.name || `Dosya Adı Kuralı ${index + 1}`).trim(),
      patternMode: sanitizePatternMode(rule.patternMode),
      patternValue: String(rule.patternValue || "").trim(),
      replacementValue: String(rule.replacementValue || "").trim(),
      process: String(rule.process || "").trim(),
      serviceType: String(rule.serviceType || "").trim(),
      priority: Number.isFinite(Number(rule.priority)) ? Number(rule.priority) : 0,
      applyTo: rule.applyTo === "baseName" ? "baseName" : "fileName",
      note: String(rule.note || "").trim(),
      isActive: Boolean(rule.isActive),
    }));

    return this.fileNameRuleRepository.saveAll(sanitizedRules);
  }
}

function sanitizePatternMode(value) {
  const supportedModes = new Set(["prefix", "suffix", "contains", "template", "regex"]);
  return supportedModes.has(value) ? value : "prefix";
}

module.exports = {
  SaveFileNameRulesUseCase,
};
