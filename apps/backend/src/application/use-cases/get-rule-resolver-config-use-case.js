const { buildRuleResolverModel } = require("../../domain/services/rule-resolver");

class GetRuleResolverConfigUseCase {
  constructor({
    fileTypeRuleRepository,
    keywordRuleRepository,
    fileNameRuleRepository,
    partOverrideRepository,
  }) {
    this.fileTypeRuleRepository = fileTypeRuleRepository;
    this.keywordRuleRepository = keywordRuleRepository;
    this.fileNameRuleRepository = fileNameRuleRepository;
    this.partOverrideRepository = partOverrideRepository;
  }

  async execute() {
    const [fileTypeRules, keywordRules, fileNameRules, partOverrides] = await Promise.all([
      this.fileTypeRuleRepository.getAll(),
      this.keywordRuleRepository.getAll(),
      this.fileNameRuleRepository.getAll(),
      this.partOverrideRepository.getAll(),
    ]);

    return buildRuleResolverModel({
      fileTypeRules,
      keywordRules,
      fileNameRules,
      partOverrides,
    });
  }
}

module.exports = {
  GetRuleResolverConfigUseCase,
};
