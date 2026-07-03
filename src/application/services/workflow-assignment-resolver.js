const { normalizeText } = require("../../shared/text-utils");

class WorkflowAssignmentResolver {
  constructor({ userRepository, assignmentRuleRepository }) {
    this.userRepository = userRepository;
    this.assignmentRuleRepository = assignmentRuleRepository;
  }

  async resolveTemplateAssignments(steps, explicitAssignments, workflowContext = {}) {
    const normalizedExplicitAssignments = explicitAssignments || {};
    const [departments, users, assignmentConfig] = await Promise.all([
      this.userRepository.listDepartments(),
      this.userRepository.listUsers(),
      this.assignmentRuleRepository.getConfig(),
    ]);

    const activeDepartments = departments.filter((department) => department.isActive);
    const activeUsers = users.filter((user) => user.isActive);
    const departmentMatcher = createDepartmentMatcher(activeDepartments, assignmentConfig.departmentMappings || []);
    const usersByDepartmentId = new Map();

    for (const user of activeUsers) {
      if (!usersByDepartmentId.has(user.departmentId)) {
        usersByDepartmentId.set(user.departmentId, []);
      }
      usersByDepartmentId.get(user.departmentId).push(user.id);
    }

    return steps.reduce((accumulator, step) => {
      const sequenceKey = String(step.sequenceNo);
      const explicitAssignees = Array.isArray(normalizedExplicitAssignments[sequenceKey])
        ? normalizedExplicitAssignments[sequenceKey].filter(Boolean)
        : [];

      if (explicitAssignees.length > 0) {
        accumulator[sequenceKey] = explicitAssignees;
        return accumulator;
      }

      const defaultAssignee = String(step.defaultAssignee || "").trim();
      if (!defaultAssignee) {
        const inferredDepartmentId = inferDepartmentIdFromContext(workflowContext, departmentMatcher);
        if (inferredDepartmentId) {
          const inferredUserIds = usersByDepartmentId.get(inferredDepartmentId) || [];
          if (inferredUserIds.length > 0) {
            accumulator[sequenceKey] = inferredUserIds;
          }
        }
        return accumulator;
      }

      const matchingDepartmentId = departmentMatcher.get(normalizeText(defaultAssignee));
      if (matchingDepartmentId) {
        const departmentUserIds = usersByDepartmentId.get(matchingDepartmentId) || [];
        if (departmentUserIds.length > 0) {
          accumulator[sequenceKey] = departmentUserIds;
          return accumulator;
        }
      }

      const inferredDepartmentId = inferDepartmentIdFromContext(workflowContext, departmentMatcher);
      if (inferredDepartmentId) {
        const inferredUserIds = usersByDepartmentId.get(inferredDepartmentId) || [];
        if (inferredUserIds.length > 0) {
          accumulator[sequenceKey] = inferredUserIds;
          return accumulator;
        }
      }

      const directUserIds = activeUsers
        .filter((user) => normalizeText(user.fullName) === normalizeText(defaultAssignee))
        .map((user) => user.id);

      if (directUserIds.length > 0) {
        accumulator[sequenceKey] = directUserIds;
      }

      return accumulator;
    }, {});
  }
}

function createDepartmentMatcher(activeDepartments, configuredMappings) {
  const matcher = new Map();

  for (const department of activeDepartments) {
    matcher.set(normalizeText(department.name), department.id);
  }

  for (const mapping of configuredMappings) {
    const departmentId = mapping.departmentId
      || activeDepartments.find((department) => normalizeText(department.name) === normalizeText(mapping.departmentName || ""))?.id;

    if (!departmentId) {
      continue;
    }

    matcher.set(normalizeText(mapping.departmentName || ""), departmentId);

    for (const alias of mapping.aliases || []) {
      matcher.set(normalizeText(alias), departmentId);
    }
  }

  return matcher;
}

function inferDepartmentIdFromContext(workflowContext, departmentMatcher) {
  const signals = collectSignals(workflowContext);
  for (const signal of signals) {
    for (const [token, departmentId] of departmentMatcher.entries()) {
      if (token && signal.includes(token)) {
        return departmentId;
      }
    }
  }

  return null;
}

function collectSignals(workflowContext) {
  const textValues = [
    workflowContext.instanceName,
    workflowContext.itemLabel,
    workflowContext.process,
    workflowContext.serviceType,
    ...(Array.isArray(workflowContext.files) ? workflowContext.files : []),
    ...(Array.isArray(workflowContext.partCodes) ? workflowContext.partCodes : []),
    ...(Array.isArray(workflowContext.assignmentSignals) ? workflowContext.assignmentSignals : []),
  ].filter(Boolean);

  return textValues.map((value) => normalizeText(value));
}

module.exports = {
  WorkflowAssignmentResolver,
};
