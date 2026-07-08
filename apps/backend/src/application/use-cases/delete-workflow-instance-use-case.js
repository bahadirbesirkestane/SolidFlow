class DeleteWorkflowInstanceUseCase {
  constructor({ workflowInstanceRepository, projectRepository }) {
    this.workflowInstanceRepository = workflowInstanceRepository;
    this.projectRepository = projectRepository;
  }

  async execute(instanceId) {
    const deletedInstance = await this.workflowInstanceRepository.deleteInstance(instanceId);
    if (!deletedInstance) {
      throw new Error("Silinecek workflow bulunamadi.");
    }

    await this.projectRepository.touch(deletedInstance.projectId);
    return deletedInstance;
  }
}

module.exports = {
  DeleteWorkflowInstanceUseCase,
};
