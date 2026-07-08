class GetFileNameRulesUseCase {
  constructor({ fileNameRuleRepository }) {
    this.fileNameRuleRepository = fileNameRuleRepository;
  }

  async execute() {
    return this.fileNameRuleRepository.getAll();
  }
}

module.exports = {
  GetFileNameRulesUseCase,
};
