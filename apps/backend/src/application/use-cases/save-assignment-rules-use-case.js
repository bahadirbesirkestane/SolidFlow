class SaveAssignmentRulesUseCase {
  constructor({ assignmentRuleRepository }) {
    this.assignmentRuleRepository = assignmentRuleRepository;
  }

  async execute(input) {
    const mappings = Array.isArray(input.departmentMappings) ? input.departmentMappings : [];
    const workflowSlaRules = Array.isArray(input.workflowSlaRules) ? input.workflowSlaRules : [];
    const normalizedMappings = mappings.map((mapping) => ({
      departmentId: String(mapping.departmentId || "").trim(),
      departmentName: String(mapping.departmentName || "").trim(),
      aliases: Array.isArray(mapping.aliases)
        ? mapping.aliases.map((value) => String(value || "").trim()).filter(Boolean)
        : [],
    })).filter((mapping) => mapping.departmentId || mapping.departmentName);
    const normalizedSlaRules = workflowSlaRules.map((rule, index) => ({
      id: String(rule.id || `sla-rule-${index + 1}`).trim(),
      workflowTemplateId: String(rule.workflowTemplateId || "").trim(),
      workflowNamePattern: String(rule.workflowNamePattern || "").trim(),
      stepNamePattern: String(rule.stepNamePattern || "").trim(),
      targetHours: Math.max(Number(rule.targetHours || 0), 0),
      warningHours: Math.max(Number(rule.warningHours || 0), 0),
      priority: Number(rule.priority || 0),
      note: String(rule.note || "").trim(),
      isActive: Boolean(rule.isActive),
    })).filter((rule) => rule.workflowTemplateId || rule.workflowNamePattern || rule.stepNamePattern);

    return this.assignmentRuleRepository.saveConfig({
      departmentMappings: normalizedMappings,
      workflowSlaRules: normalizedSlaRules,
    });
  }
}

module.exports = {
  SaveAssignmentRulesUseCase,
};
