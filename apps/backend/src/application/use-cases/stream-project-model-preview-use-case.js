class StreamProjectModelPreviewUseCase {
  constructor({ projectRepository, modelPreviewService }) {
    this.projectRepository = projectRepository;
    this.modelPreviewService = modelPreviewService;
  }

  async execute(projectId, input = {}) {
    const project = await this.projectRepository.getById(projectId);
    if (!project) {
      throw new Error("Proje bulunamadi.");
    }

    if (!project.folderPath) {
      throw new Error("Bu proje icin klasor yolu kayitli degil.");
    }

    const preview = await this.modelPreviewService.resolveForFolder(project.folderPath, input);
    if (!preview.found) {
      throw new Error(preview.reason || "3D model bulunamadi.");
    }

    return preview;
  }
}

module.exports = {
  StreamProjectModelPreviewUseCase,
};
