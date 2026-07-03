class GetKeywordRulesUseCase {
  constructor({ keywordRuleRepository }) {
    this.keywordRuleRepository = keywordRuleRepository;
  }

  async execute() {
    return this.keywordRuleRepository.getAll();
  }
}

module.exports = {
  GetKeywordRulesUseCase,
};
