class SaveKeywordRulesUseCase {
  constructor({ keywordRuleRepository }) {
    this.keywordRuleRepository = keywordRuleRepository;
  }

  async execute(rules) {
    const sanitizedRules = rules.map((rule, index) => ({
      id: String(rule.id || `keyword-rule-${index + 1}`),
      keyword: String(rule.keyword || "").trim(),
      process: String(rule.process || "").trim(),
      serviceType: String(rule.serviceType || "").trim(),
      matchTarget: rule.matchTarget === "path" ? "path" : "fileName",
      isActive: Boolean(rule.isActive),
    }));

    return this.keywordRuleRepository.saveAll(sanitizedRules);
  }
}

module.exports = {
  SaveKeywordRulesUseCase,
};
