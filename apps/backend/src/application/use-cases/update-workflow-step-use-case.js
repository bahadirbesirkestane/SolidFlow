class UpdateWorkflowStepUseCase {
  constructor({ workflowInstanceRepository, auditLogRepository }) {
    this.workflowInstanceRepository = workflowInstanceRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(stepId, input) {
    const updatedInstance = await this.workflowInstanceRepository.updateStep(stepId, {
      name: input.name,
      description: input.description,
      assigneeIds: input.assigneeIds,
      assignee: input.assignee,
      status: input.status,
      isOptional: input.isOptional,
      note: input.note,
    });

    await this.auditLogRepository.log({
      projectId: updatedInstance.projectId,
      entityType: "workflow_step",
      entityId: stepId,
      action: "updated",
      payload: input,
    });

    return updatedInstance;
  }
}

module.exports = {
  UpdateWorkflowStepUseCase,
};
