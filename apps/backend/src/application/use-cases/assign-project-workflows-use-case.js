class AssignProjectWorkflowsUseCase {
  constructor({
    projectRepository,
    workflowTemplateRepository,
    workflowInstanceRepository,
    workflowAssignmentResolver,
    auditLogRepository,
  }) {
    this.projectRepository = projectRepository;
    this.workflowTemplateRepository = workflowTemplateRepository;
    this.workflowInstanceRepository = workflowInstanceRepository;
    this.workflowAssignmentResolver = workflowAssignmentResolver;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(projectId) {
    const project = await this.projectRepository.getById(projectId);
    if (!project) {
      throw new Error("Proje bulunamadi.");
    }

    const instances = await this.workflowInstanceRepository.listByProjectId(projectId);
    if (instances.length === 0) {
      return {
        project,
        updatedInstances: [],
        updatedStepCount: 0,
      };
    }

    const updatedInstances = [];
    let updatedStepCount = 0;

    for (const instance of instances) {
      if (!instance.templateId) {
        continue;
      }

      const template = await this.workflowTemplateRepository.getById(instance.templateId);
      if (!template) {
        continue;
      }

      const resolvedAssignments = await this.workflowAssignmentResolver.resolveTemplateAssignments(
        template.steps,
        {},
        {
          instanceName: instance.name,
          itemLabel: instance.itemLabel,
          process: instance.itemPayload?.process,
          serviceType: instance.itemPayload?.serviceType,
          files: instance.itemPayload?.files,
          partCodes: instance.itemPayload?.partCodes,
          partList: instance.itemPayload?.partList,
          assignmentSignals: buildAssignmentSignals(instance),
        },
      );

      let instanceChanged = false;

      for (const step of instance.steps) {
        const stepKey = String(step.sequenceNo);
        const nextAssigneeIds = Array.isArray(resolvedAssignments[stepKey])
          ? resolvedAssignments[stepKey].filter(Boolean)
          : [];

        if (nextAssigneeIds.length === 0) {
          continue;
        }

        if (Array.isArray(step.assigneeIds) && step.assigneeIds.length > 0) {
          continue;
        }

        await this.workflowInstanceRepository.updateStep(step.id, {
          assigneeIds: nextAssigneeIds,
        });

        await this.auditLogRepository.log({
          projectId,
          entityType: "workflow_step",
          entityId: step.id,
          action: "assigned",
          payload: {
            source: "default-project-assignment",
            sequenceNo: step.sequenceNo,
            assigneeIds: nextAssigneeIds,
          },
        });

        instanceChanged = true;
        updatedStepCount += 1;
      }

      if (instanceChanged) {
        updatedInstances.push(instance.id);
      }
    }

    return {
      project,
      updatedInstances,
      updatedStepCount,
    };
  }
}

function buildAssignmentSignals(instance) {
  return [
    instance.templateName,
    instance.itemLabel,
    instance.name,
    ...(Array.isArray(instance.steps) ? instance.steps.map((step) => step.name) : []),
  ].filter(Boolean);
}

module.exports = {
  AssignProjectWorkflowsUseCase,
};
