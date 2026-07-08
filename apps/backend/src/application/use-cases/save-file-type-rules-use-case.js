class SaveFileTypeRulesUseCase {
  constructor({ fileTypeRuleRepository }) {
    this.fileTypeRuleRepository = fileTypeRuleRepository;
  }

  async execute(rules) {
    const sanitizedRules = rules.map((rule) => ({
      extension: String(rule.extension || "").trim().toUpperCase(),
      displayName: String(rule.displayName || "").trim(),
      defaultProcess: String(rule.defaultProcess || "").trim(),
      defaultServiceType: String(rule.defaultServiceType || "").trim(),
      isActive: Boolean(rule.isActive),
    }));

    return this.fileTypeRuleRepository.saveAll(sanitizedRules);
  }
}

module.exports = {
  SaveFileTypeRulesUseCase,
};
