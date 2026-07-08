class DeleteProjectUseCase {
  constructor({ projectRepository }) {
    this.projectRepository = projectRepository;
  }

  async execute(projectId) {
    const deletedProject = await this.projectRepository.delete(projectId);
    if (!deletedProject) {
      throw new Error("Silinecek proje bulunamadi.");
    }

    return deletedProject;
  }
}

module.exports = {
  DeleteProjectUseCase,
};
