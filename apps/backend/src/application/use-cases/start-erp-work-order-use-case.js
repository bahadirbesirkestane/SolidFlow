const { nowIso } = require("../../shared/time-utils");

class StartErpWorkOrderUseCase {
  constructor({
    erpWorkOrderRepository,
    projectRepository,
    workflowTemplateRepository,
    createWorkflowInstancesUseCase,
    auditLogRepository,
  }) {
    this.erpWorkOrderRepository = erpWorkOrderRepository;
    this.projectRepository = projectRepository;
    this.workflowTemplateRepository = workflowTemplateRepository;
    this.createWorkflowInstancesUseCase = createWorkflowInstancesUseCase;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(workOrderId) {
    const workOrder = await this.erpWorkOrderRepository.getById(workOrderId);
    if (!workOrder) {
      throw new Error("ERP iş emri bulunamadı.");
    }

    if (workOrder.linkedProjectId) {
      throw new Error("Bu ERP iş emri daha önce operasyona aktarılmış.");
    }

    const workflowRequests = await this.buildWorkflowRequests(workOrder);
    if (workflowRequests.length === 0) {
      throw new Error("ERP iş emrinden üretilebilecek workflow bulunamadı.");
    }

    const project = await this.projectRepository.create({
      code: await this.buildUniqueProjectCode(workOrder),
      name: buildProjectName(workOrder),
      description: buildProjectDescription(workOrder),
    });

    const workflows = await this.createWorkflowInstancesUseCase.execute(project.id, {
      workflows: workflowRequests,
    });

    const updatedWorkOrder = await this.erpWorkOrderRepository.update(workOrderId, (currentWorkOrder) => ({
      ...currentWorkOrder,
      status: "Operasyona Aktarıldı",
      linkedProjectId: project.id,
      linkedProjectCode: project.code,
      startedAt: nowIso(),
    }));

    await this.auditLogRepository.log({
      projectId: project.id,
      entityType: "erp_work_order",
      entityId: workOrderId,
      action: "erp_started",
      payload: {
        erpNo: workOrder.erpNo,
        projectCode: project.code,
        workflowCount: workflows.length,
      },
    });

    return {
      project,
      workflows,
      workOrder: updatedWorkOrder,
    };
  }

  async buildWorkflowRequests(workOrder) {
    const templates = await this.workflowTemplateRepository.listAll();
    const templateMap = new Map(templates.map((template) => [template.id, template]));
    const grouped = new Map();

    for (const line of workOrder.lines || []) {
      const templateId = pickTemplateId(line);
      const template = templateMap.get(templateId);
      if (!template) {
        continue;
      }

      const groupingLabel = normalizeGroupingLabel(line);
      const groupKey = `${templateId}::${groupingLabel}`;
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          templateId,
          instanceName: `${groupingLabel} - ${template.name}`,
          itemLabel: groupingLabel,
          itemCount: 0,
          itemPayload: {
            erpNo: workOrder.erpNo,
            process: line.process || "",
            serviceType: line.serviceType || "",
            files: [],
            partCodes: [],
            partList: [],
            erpLines: [],
          },
          assignmentSignals: [
            workOrder.erpNo,
            workOrder.projectCode,
            workOrder.customerName,
            groupingLabel,
          ].filter(Boolean),
          stepAssignments: [],
        });
      }

      const group = grouped.get(groupKey);
      group.itemCount += Number(line.quantity || 1);
      if (line.partCode) {
        group.itemPayload.partCodes.push(line.partCode);
      }
      group.itemPayload.partList.push({
        partCode: line.partCode || "",
        fileName: line.partName || line.partCode || "",
        quantity: Number(line.quantity || 1),
        mainGroup: groupingLabel,
        suggestedProcess: line.process || "",
        serviceType: line.serviceType || "",
        note: line.note || "",
      });
      group.itemPayload.erpLines.push({
        lineNo: line.lineNo,
        partCode: line.partCode || "",
        partName: line.partName || "",
        quantity: Number(line.quantity || 1),
        process: line.process || "",
        serviceType: line.serviceType || "",
        priority: line.priority || "",
        note: line.note || "",
      });
      group.assignmentSignals.push(
        line.partCode,
        line.partName,
        line.process,
        line.serviceType,
        line.note,
      );
    }

    return Array.from(grouped.values());
  }

  async buildUniqueProjectCode(workOrder) {
    const existingProjects = await this.projectRepository.listAll();
    const existingCodes = new Set(existingProjects.map((project) => project.code));
    const baseCode = `${String(workOrder.projectCode || "ERP").trim()}-${String(workOrder.erpNo || "IS").trim().replace(/[^A-Za-z0-9]+/g, "-")}`;

    if (!existingCodes.has(baseCode)) {
      return baseCode;
    }

    let suffix = 2;
    while (existingCodes.has(`${baseCode}-${suffix}`)) {
      suffix += 1;
    }

    return `${baseCode}-${suffix}`;
  }
}

function buildProjectName(workOrder) {
  return `${String(workOrder.projectCode || "ERP Projesi").trim()} - ${String(workOrder.customerName || workOrder.erpNo || "Operasyon").trim()}`;
}

function buildProjectDescription(workOrder) {
  const details = [
    `Kaynak ERP No: ${String(workOrder.erpNo || "").trim()}`,
    workOrder.note ? `Not: ${String(workOrder.note).trim()}` : "",
  ].filter(Boolean);

  return details.join(" | ");
}

function normalizeGroupingLabel(line) {
  return String(line.process || line.serviceType || line.partName || "Genel İş Akışı").trim();
}

function pickTemplateId(line) {
  const process = String(line.process || "");
  const serviceType = String(line.serviceType || "");

  if (process === "Satın Alma" || serviceType.includes("Tedarik")) {
    return "template-procurement-flow";
  }

  if (
    process === "Dış Hizmet"
    || process === "Lojistik"
    || process === "Montaj"
    || process === "İç Hizmet"
    || process === "Kalite Kontrol"
    || serviceType.includes("Kesim")
    || serviceType.includes("Montaj")
    || serviceType.includes("Sevkiyat")
  ) {
    return "template-outsource-part-flow";
  }

  return "template-procurement-flow";
}

module.exports = {
  StartErpWorkOrderUseCase,
};
