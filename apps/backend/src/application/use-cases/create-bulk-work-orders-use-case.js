const { pickTemplateId } = require("../services/workflow-auto-planner");

class CreateBulkWorkOrdersUseCase {
  constructor({ projectRepository, createWorkflowInstancesUseCase }) {
    this.projectRepository = projectRepository;
    this.createWorkflowInstancesUseCase = createWorkflowInstancesUseCase;
  }

  async execute(input) {
    const normalizedPartList = Array.isArray(input.partList) ? input.partList : [];
    const projectCode = String(input.code || "").trim();
    const projectName = String(input.name || "").trim();

    if (!projectCode || !projectName) {
      throw new Error("Toplu iş emri için proje kodu ve proje adı zorunludur.");
    }

    if (normalizedPartList.length === 0) {
      throw new Error("Toplu iş emri üretmek için en az bir parça kalemi gereklidir.");
    }

    const workflows = buildWorkflowRequests(normalizedPartList);
    if (workflows.length === 0) {
      throw new Error("Parça listesi üzerinden üretilebilecek workflow bulunamadı.");
    }

    const project = await this.projectRepository.create({
      code: projectCode,
      name: projectName,
      description: String(input.description || "").trim(),
      folderPath: String(input.folderPath || "").trim(),
    });

    const createdWorkflows = await this.createWorkflowInstancesUseCase.execute(project.id, { workflows });
    return {
      project,
      workflows: createdWorkflows,
      importedItemCount: normalizedPartList.length,
      createdWorkflowCount: createdWorkflows.length,
    };
  }
}

function buildWorkflowRequests(partList) {
  return partList.flatMap((item, index) => {
    const normalizedItem = {
      partCode: String(item.partCode || "").trim(),
      fileName: String(item.fileName || "").trim(),
      mainGroup: String(item.mainGroup || "").trim(),
      suggestedProcess: String(item.suggestedProcess || "Belirsiz").trim(),
      serviceType: String(item.serviceType || "Belirsiz").trim(),
      quantity: Number(item.quantity || 1),
      note: String(item.note || "").trim(),
      files: Array.isArray(item.files) ? item.files : [],
    };

    const templateId = pickTemplateId({
      suggestedProcess: normalizedItem.suggestedProcess,
      serviceType: normalizedItem.serviceType,
    });

    if (!templateId) {
      return [];
    }

    const labelSource = normalizedItem.partCode || normalizedItem.fileName || `Kalem ${index + 1}`;
    return [{
      templateId,
      instanceName: `${labelSource} - ${normalizedItem.suggestedProcess}`,
      itemLabel: normalizedItem.mainGroup || labelSource,
      itemCount: normalizedItem.quantity > 0 ? normalizedItem.quantity : 1,
      itemPayload: {
        source: "bulk-part-list",
        process: normalizedItem.suggestedProcess,
        serviceType: normalizedItem.serviceType,
        partCodes: normalizedItem.partCode ? [normalizedItem.partCode] : [],
        files: normalizedItem.files.length > 0 ? normalizedItem.files : [normalizedItem.fileName].filter(Boolean),
        partList: [{
          partCode: normalizedItem.partCode,
          fileName: normalizedItem.fileName,
          quantity: normalizedItem.quantity,
          mainGroup: normalizedItem.mainGroup,
          suggestedProcess: normalizedItem.suggestedProcess,
          serviceType: normalizedItem.serviceType,
          note: normalizedItem.note,
        }],
      },
      assignmentSignals: [
        normalizedItem.partCode,
        normalizedItem.fileName,
        normalizedItem.mainGroup,
        normalizedItem.suggestedProcess,
        normalizedItem.serviceType,
        normalizedItem.note,
      ].filter(Boolean),
      stepAssignments: [],
    }];
  });
}

module.exports = {
  CreateBulkWorkOrdersUseCase,
};
