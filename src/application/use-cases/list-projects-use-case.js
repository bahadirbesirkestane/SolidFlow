class ListProjectsUseCase {
  constructor({ projectRepository, workflowInstanceRepository }) {
    this.projectRepository = projectRepository;
    this.workflowInstanceRepository = workflowInstanceRepository;
  }

  async execute() {
    const projects = await this.projectRepository.listAll();
    const enriched = [];

    for (const project of projects) {
      const progress = await this.workflowInstanceRepository.getProjectProgress(project.id);
      enriched.push({
        ...project,
        progress,
      });
    }

    return enriched;
  }
}

module.exports = {
  ListProjectsUseCase,
};
