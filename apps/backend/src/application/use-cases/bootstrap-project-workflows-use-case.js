class BootstrapProjectWorkflowsUseCase {
  constructor({ workflowAutoPlanner, createWorkflowInstancesUseCase }) {
    this.workflowAutoPlanner = workflowAutoPlanner;
    this.createWorkflowInstancesUseCase = createWorkflowInstancesUseCase;
  }

  async execute(projectId, folderPath) {
    const requests = await this.workflowAutoPlanner.buildRequests(folderPath);
    if (requests.length === 0) {
      return [];
    }

    return this.createWorkflowInstancesUseCase.execute(projectId, { workflows: requests });
  }
}

module.exports = {
  BootstrapProjectWorkflowsUseCase,
};
