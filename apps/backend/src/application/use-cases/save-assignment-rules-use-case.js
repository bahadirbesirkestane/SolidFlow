class SaveAssignmentRulesUseCase {
  constructor({ assignmentRuleRepository }) {
    this.assignmentRuleRepository = assignmentRuleRepository;
  }

  async execute(input) {
    const mappings = Array.isArray(input.departmentMappings) ? input.departmentMappings : [];
    const normalizedMappings = mappings.map((mapping) => ({
      departmentId: String(mapping.departmentId || "").trim(),
      departmentName: String(mapping.departmentName || "").trim(),
      aliases: Array.isArray(mapping.aliases)
        ? mapping.aliases.map((value) => String(value || "").trim()).filter(Boolean)
        : [],
    })).filter((mapping) => mapping.departmentId || mapping.departmentName);

    return this.assignmentRuleRepository.saveConfig({
      departmentMappings: normalizedMappings,
    });
  }
}

module.exports = {
  SaveAssignmentRulesUseCase,
};
