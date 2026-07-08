class GetProjectDashboardUseCase {
  constructor({ projectRepository, workflowInstanceRepository }) {
    this.projectRepository = projectRepository;
    this.workflowInstanceRepository = workflowInstanceRepository;
  }

  async execute(projectId) {
    const project = await this.projectRepository.getById(projectId);
    if (!project) {
      throw new Error("Proje bulunamadi.");
    }

    const [instances, progress] = await Promise.all([
      this.workflowInstanceRepository.listByProjectId(projectId),
      this.workflowInstanceRepository.getProjectProgress(projectId),
    ]);

    return {
      project,
      progress,
      workflows: instances,
    };
  }
}

module.exports = {
  GetProjectDashboardUseCase,
};
