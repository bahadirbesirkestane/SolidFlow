class LocalAssignmentRuleRepository {
  constructor(jsonFileRepository) {
    this.jsonFileRepository = jsonFileRepository;
  }

  async getConfig() {
    const payload = await this.jsonFileRepository.read();
    return {
      departmentMappings: Array.isArray(payload.departmentMappings) ? payload.departmentMappings : [],
    };
  }

  async saveConfig(input) {
    const payload = {
      departmentMappings: Array.isArray(input.departmentMappings) ? input.departmentMappings : [],
    };

    await this.jsonFileRepository.write(payload);
    return this.getConfig();
  }
}

module.exports = {
  LocalAssignmentRuleRepository,
};
