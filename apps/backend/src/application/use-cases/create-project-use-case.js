class CreateProjectUseCase {
  constructor({ projectRepository, bootstrapProjectWorkflowsUseCase }) {
    this.projectRepository = projectRepository;
    this.bootstrapProjectWorkflowsUseCase = bootstrapProjectWorkflowsUseCase;
  }

  async execute(input) {
    if (!input.code || !input.name) {
      throw new Error("Proje kodu ve proje adi zorunludur.");
    }

    const project = await this.projectRepository.create({
      code: String(input.code).trim(),
      name: String(input.name).trim(),
      description: String(input.description || "").trim(),
      folderPath: String(input.autoGenerateFromFolder || "").trim(),
    });

    if (input.autoGenerateFromFolder) {
      await this.bootstrapProjectWorkflowsUseCase.execute(project.id, String(input.autoGenerateFromFolder).trim());
    }

    return project;
  }
}

module.exports = {
  CreateProjectUseCase,
};
