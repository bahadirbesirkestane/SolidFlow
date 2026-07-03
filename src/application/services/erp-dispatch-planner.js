const { normalizeText } = require("../../shared/text-utils");

class ErpDispatchPlanner {
  constructor({ userRepository, assignmentRuleRepository }) {
    this.userRepository = userRepository;
    this.assignmentRuleRepository = assignmentRuleRepository;
  }

  async build(workOrder) {
    const normalizedWorkOrder = workOrder || {};
    const [departments, users, assignmentConfig] = await Promise.all([
      this.userRepository.listDepartments(),
      this.userRepository.listUsers(),
      this.assignmentRuleRepository.getConfig(),
    ]);

    const activeDepartments = departments.filter((department) => department.isActive);
    const activeUsers = users.filter((user) => user.isActive);
    const departmentAliasMap = createDepartmentAliasMap(activeDepartments, assignmentConfig.departmentMappings || []);
    const usersByDepartmentId = createUsersByDepartmentId(activeUsers);
    const lineDispatches = (normalizedWorkOrder.lines || []).map((line) => {
      const match = resolveDepartmentForLine(line, departmentAliasMap, activeDepartments);
      const assignedUsers = match
        ? (usersByDepartmentId.get(match.departmentId) || [])
        : [];

      return {
        ...line,
        departmentId: match?.departmentId || null,
        departmentName: match?.departmentName || "Kural bekliyor",
        routeStatus: match ? "Hazır" : "Kural bekliyor",
        routeReason: match?.reason || "Eşleşme bulunamadı",
        assigneeIds: assignedUsers.map((user) => user.id),
        assignees: assignedUsers.map((user) => ({
          id: user.id,
          fullName: user.fullName,
          departmentName: user.departmentName,
        })),
      };
    });

    return {
      summary: buildDispatchSummary(lineDispatches),
      departments: buildDepartmentBuckets(lineDispatches),
      lines: lineDispatches,
      nextSteps: buildNextSteps(lineDispatches),
    };
  }
}

function createUsersByDepartmentId(users) {
  const map = new Map();

  for (const user of users) {
    if (!map.has(user.departmentId)) {
      map.set(user.departmentId, []);
    }

    map.get(user.departmentId).push(user);
  }

  return map;
}

function createDepartmentAliasMap(activeDepartments, configuredMappings) {
  const map = new Map();

  for (const department of activeDepartments) {
    const aliases = new Set([department.name]);
    const configuredMapping = configuredMappings.find((mapping) => (
      mapping.departmentId === department.id
      || normalizeText(mapping.departmentName || "") === normalizeText(department.name)
    ));

    for (const alias of configuredMapping?.aliases || []) {
      aliases.add(alias);
    }

    for (const alias of aliases) {
      map.set(normalizeText(alias), {
        departmentId: department.id,
        departmentName: department.name,
        token: alias,
      });
    }
  }

  return map;
}

function resolveDepartmentForLine(line, departmentAliasMap, departments) {
  const signals = [
    line.process,
    line.serviceType,
    line.partCode,
    line.partName,
    line.note,
  ]
    .filter(Boolean)
    .map((value) => normalizeText(value));

  for (const signal of signals) {
    for (const [alias, department] of departmentAliasMap.entries()) {
      if (alias && signal.includes(alias)) {
        return {
          departmentId: department.departmentId,
          departmentName: department.departmentName,
          reason: `${department.token} sinyali ile eşleşti`,
        };
      }
    }
  }

  const fallbackDepartment = departments.find((department) => normalizeText(department.name) === normalizeText("İç Hizmet"));
  if (fallbackDepartment) {
    return {
      departmentId: fallbackDepartment.id,
      departmentName: fallbackDepartment.name,
      reason: "Varsayılan iç hizmet yönlendirmesi uygulandı",
    };
  }

  return null;
}

function buildDispatchSummary(lines) {
  const readyLines = lines.filter((line) => line.routeStatus === "Hazır");
  const waitingLines = lines.length - readyLines.length;
  const totalQuantity = lines.reduce((total, line) => total + Number(line.quantity || 0), 0);

  return {
    totalLines: lines.length,
    readyLines: readyLines.length,
    waitingLines,
    totalQuantity,
  };
}

function buildDepartmentBuckets(lines) {
  const buckets = new Map();

  for (const line of lines) {
    const key = line.departmentId || "unassigned";
    if (!buckets.has(key)) {
      buckets.set(key, {
        departmentId: line.departmentId,
        departmentName: line.departmentName,
        lineCount: 0,
        totalQuantity: 0,
        assignees: [],
      });
    }

    const bucket = buckets.get(key);
    bucket.lineCount += 1;
    bucket.totalQuantity += Number(line.quantity || 0);
    bucket.assignees = mergeAssignees(bucket.assignees, line.assignees || []);
  }

  return Array.from(buckets.values()).sort((left, right) => right.totalQuantity - left.totalQuantity);
}

function mergeAssignees(existingAssignees, incomingAssignees) {
  const merged = new Map(existingAssignees.map((assignee) => [assignee.id, assignee]));

  for (const assignee of incomingAssignees) {
    merged.set(assignee.id, assignee);
  }

  return Array.from(merged.values());
}

function buildNextSteps(lines) {
  const waitingLines = lines.filter((line) => line.routeStatus !== "Hazır");
  const steps = [
    {
      key: "fetch",
      title: "ERP iş emri alındı",
      description: "İş emri satırları sisteme çekildi ve dağıtım önizlemesi üretildi.",
      status: "done",
    },
    {
      key: "dispatch",
      title: "Departman dağıtımı hazır",
      description: `${lines.length} satır için hedef departman ve sorumlu kullanıcı önerisi üretildi.`,
      status: "done",
    },
  ];

  steps.push({
    key: "execution",
    title: "Operasyon başlatma",
    description: waitingLines.length > 0
      ? `${waitingLines.length} satır için kural netleştirme sonrası gerçek iş emri açılmalı.`
      : "Tüm satırlar hazır; operasyon kaydı açma adımına geçilebilir.",
    status: waitingLines.length > 0 ? "attention" : "ready",
  });

  return steps;
}

module.exports = {
  ErpDispatchPlanner,
};
