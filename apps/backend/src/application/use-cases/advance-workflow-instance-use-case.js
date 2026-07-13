class AdvanceWorkflowInstanceUseCase {
  constructor({ workflowInstanceRepository, projectRepository, auditLogRepository }) {
    this.workflowInstanceRepository = workflowInstanceRepository;
    this.projectRepository = projectRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(instanceId, input) {
    const updatedInstance = await this.workflowInstanceRepository.advanceCurrentStep(instanceId, {
      completedBy: String(input.completedBy || "").trim(),
      completedByUserId: String(input.completedByUserId || "").trim(),
      note: String(input.note || "").trim(),
      handoverTo: String(input.handoverTo || "").trim(),
      nextAssignee: String(input.nextAssignee || "").trim(),
      nextAssigneeIds: Array.isArray(input.nextAssigneeIds)
        ? input.nextAssigneeIds.map((value) => String(value).trim()).filter(Boolean)
        : [],
    });

    if (!updatedInstance) {
      throw new Error("Workflow instance bulunamadi.");
    }

    await this.projectRepository.touch(updatedInstance.projectId);
    await this.auditLogRepository.log({
      projectId: updatedInstance.projectId,
      actorUserId: String(input.completedByUserId || "").trim(),
      entityType: "workflow_instance",
      entityId: instanceId,
      action: "advanced",
      payload: input,
    });
    return updatedInstance;
  }
}

module.exports = {
  AdvanceWorkflowInstanceUseCase,
};
