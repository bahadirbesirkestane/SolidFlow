class CreateWorkflowInstancesUseCase {
  constructor({
    projectRepository,
    workflowTemplateRepository,
    workflowInstanceRepository,
    workflowAssignmentResolver,
  }) {
    this.projectRepository = projectRepository;
    this.workflowTemplateRepository = workflowTemplateRepository;
    this.workflowInstanceRepository = workflowInstanceRepository;
    this.workflowAssignmentResolver = workflowAssignmentResolver;
  }

  async execute(projectId, input) {
    const project = await this.projectRepository.getById(projectId);
    if (!project) {
      throw new Error("Proje bulunamadi.");
    }

    const requests = Array.isArray(input.workflows) ? input.workflows : [];
    if (requests.length === 0) {
      throw new Error("Olusturulacak en az bir is akisi gereklidir.");
    }

    const templates = await this.workflowTemplateRepository.listAll();
    const templateMap = new Map(templates.map((template) => [template.id, template]));

    const normalizedRequests = await Promise.all(requests.map(async (request) => {
      const template = templateMap.get(request.templateId);
      if (!template) {
        throw new Error(`Workflow template bulunamadi: ${request.templateId}`);
      }

      const stepAssignments = await this.workflowAssignmentResolver.resolveTemplateAssignments(
        template.steps,
        normalizeStepAssignments(request.stepAssignments),
        {
          instanceName: request.instanceName,
          itemLabel: request.itemLabel,
          process: request.itemPayload?.process,
          serviceType: request.itemPayload?.serviceType,
          files: request.itemPayload?.files,
          partCodes: request.itemPayload?.partCodes,
          partList: request.itemPayload?.partList,
          assignmentSignals: request.assignmentSignals,
        },
      );

      return {
        templateId: template.id,
        instanceName: String(request.instanceName || template.name).trim(),
        itemLabel: String(request.itemLabel || "").trim(),
        itemCount: Number(request.itemCount || 1),
        itemPayload: request.itemPayload || {},
        assignmentSignals: Array.isArray(request.assignmentSignals) ? request.assignmentSignals : [],
        stepAssignments,
        steps: template.steps,
      };
    }));

    return this.workflowInstanceRepository.createFromTemplates(projectId, normalizedRequests);
  }
}

function normalizeStepAssignments(stepAssignments) {
  if (!Array.isArray(stepAssignments)) {
    return {};
  }

  return stepAssignments.reduce((accumulator, item) => {
    if (item && item.sequenceNo) {
      const explicitIds = Array.isArray(item.assigneeIds)
        ? item.assigneeIds.map((value) => String(value).trim()).filter(Boolean)
        : [];
      const singleId = item.assigneeId ? [String(item.assigneeId).trim()] : [];
      const fallbackName = item.assignee ? [String(item.assignee).trim()] : [];
      accumulator[String(item.sequenceNo)] = [...explicitIds, ...singleId, ...fallbackName].filter(Boolean);
    }
    return accumulator;
  }, {});
}

module.exports = {
  CreateWorkflowInstancesUseCase,
};
