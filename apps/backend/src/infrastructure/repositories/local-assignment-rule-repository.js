class LocalAssignmentRuleRepository {
  constructor(jsonFileRepository) {
    this.jsonFileRepository = jsonFileRepository;
  }

  async getConfig() {
    const payload = await this.jsonFileRepository.read();
    return {
      departmentMappings: Array.isArray(payload.departmentMappings) ? payload.departmentMappings : [],
      workflowSlaRules: Array.isArray(payload.workflowSlaRules) ? payload.workflowSlaRules : [],
    };
  }

  async saveConfig(input) {
    const payload = {
      departmentMappings: Array.isArray(input.departmentMappings) ? input.departmentMappings : [],
      workflowSlaRules: Array.isArray(input.workflowSlaRules) ? input.workflowSlaRules : [],
    };

    await this.jsonFileRepository.write(payload);
    return this.getConfig();
  }
}

module.exports = {
  LocalAssignmentRuleRepository,
};
