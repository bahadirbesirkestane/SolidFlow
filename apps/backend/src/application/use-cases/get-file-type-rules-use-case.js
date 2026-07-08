class GetFileTypeRulesUseCase {
  constructor({ fileTypeRuleRepository }) {
    this.fileTypeRuleRepository = fileTypeRuleRepository;
  }

  async execute() {
    return this.fileTypeRuleRepository.getAll();
  }
}

module.exports = {
  GetFileTypeRulesUseCase,
};
