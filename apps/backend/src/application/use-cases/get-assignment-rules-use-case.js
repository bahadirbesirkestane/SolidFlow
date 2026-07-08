class GetAssignmentRulesUseCase {
  constructor({ assignmentRuleRepository }) {
    this.assignmentRuleRepository = assignmentRuleRepository;
  }

  async execute() {
    return this.assignmentRuleRepository.getConfig();
  }
}

module.exports = {
  GetAssignmentRulesUseCase,
};
