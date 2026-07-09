class UpdateWorkflowStepUseCase {
  constructor({ workflowInstanceRepository, auditLogRepository }) {
    this.workflowInstanceRepository = workflowInstanceRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(stepId, input) {
    const previousStep = await this.workflowInstanceRepository.getStepById(stepId);
    if (!previousStep) {
      throw new Error("Guncellenecek step bulunamadi.");
    }

    const updatedInstance = await this.workflowInstanceRepository.updateStep(stepId, {
      name: input.name,
      description: input.description,
      assigneeIds: input.assigneeIds,
      assignee: input.assignee,
      status: input.status,
      isOptional: input.isOptional,
      note: input.note,
    });

    const updatedStep = updatedInstance.steps.find((step) => step.id === stepId);
    const assigneeChanged = haveDifferentAssignees(previousStep.assigneeIds, updatedStep?.assigneeIds || []);
    const isHandoverCorrection = Boolean(input.reassignmentReason) || assigneeChanged;

    await this.auditLogRepository.log({
      projectId: previousStep.projectId,
      entityType: "workflow_step",
      entityId: stepId,
      action: isHandoverCorrection ? "handover_reassigned" : "updated",
      payload: {
        ...input,
        previousAssignee: previousStep.assignee,
        previousAssigneeIds: previousStep.assigneeIds,
        updatedAssignee: updatedStep?.assignee || "",
        updatedAssigneeIds: updatedStep?.assigneeIds || [],
      },
    });

    return updatedInstance;
  }
}

function haveDifferentAssignees(left, right) {
  const leftValues = Array.isArray(left) ? [...left].sort() : [];
  const rightValues = Array.isArray(right) ? [...right].sort() : [];

  if (leftValues.length !== rightValues.length) {
    return true;
  }

  return leftValues.some((value, index) => value !== rightValues[index]);
}

module.exports = {
  UpdateWorkflowStepUseCase,
};
