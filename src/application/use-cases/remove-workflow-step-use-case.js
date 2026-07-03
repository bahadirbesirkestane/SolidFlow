class RemoveWorkflowStepUseCase {
  constructor({ workflowInstanceRepository, openJobRepository, auditLogRepository }) {
    this.workflowInstanceRepository = workflowInstanceRepository;
    this.openJobRepository = openJobRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(stepId) {
    const snapshot = await this.workflowInstanceRepository.removeStep(stepId);
    await this.openJobRepository.create({
      projectId: snapshot.projectId,
      sourceType: "workflow_step",
      sourceId: snapshot.stepId,
      title: `Silinen is adimi: ${snapshot.name}`,
      description: "Workflow icinden silinen adim otomatik olarak acik isler alanina aktarildi.",
      payload: snapshot,
      status: "open",
    });
    await this.auditLogRepository.log({
      projectId: snapshot.projectId,
      entityType: "workflow_step",
      entityId: snapshot.stepId,
      action: "deleted_to_open_jobs",
      payload: snapshot,
    });

    return { success: true };
  }
}

module.exports = {
  RemoveWorkflowStepUseCase,
};
