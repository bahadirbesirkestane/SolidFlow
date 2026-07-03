class AddWorkflowStepUseCase {
  constructor({ workflowInstanceRepository, auditLogRepository }) {
    this.workflowInstanceRepository = workflowInstanceRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(instanceId, input) {
    if (!input.name) {
      throw new Error("Eklenecek adim icin isim zorunludur.");
    }

    const updatedInstance = await this.workflowInstanceRepository.addStep(instanceId, {
      templateStepId: input.templateStepId,
      sequenceNo: input.sequenceNo,
      name: String(input.name).trim(),
      description: String(input.description || "").trim(),
      assigneeIds: Array.isArray(input.assigneeIds) ? input.assigneeIds.map((value) => String(value).trim()) : [],
      status: input.status || "pending",
      isOptional: Boolean(input.isOptional),
    });

    await this.auditLogRepository.log({
      projectId: updatedInstance.projectId,
      entityType: "workflow_instance",
      entityId: instanceId,
      action: "step_added",
      payload: input,
    });

    return updatedInstance;
  }
}

module.exports = {
  AddWorkflowStepUseCase,
};
