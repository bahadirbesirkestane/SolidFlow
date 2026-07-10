class GetProjectModelPreviewUseCase {
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
      return {
        found: false,
        projectId,
        modelUrl: "",
        message: "Bu proje icin klasor yolu kayitli degil.",
        model: null,
      };
    }

    const preview = await this.modelPreviewService.resolveForFolder(project.folderPath, input);
    return {
      found: preview.found,
      projectId,
      modelUrl: preview.found
        ? `/api/operations/projects/${encodeURIComponent(projectId)}/3d-model?partCode=${encodeURIComponent(input.partCode || "")}&fileName=${encodeURIComponent(input.fileName || "")}&effectiveFileName=${encodeURIComponent(input.effectiveFileName || "")}`
        : "",
      message: preview.found ? "" : preview.reason,
      model: preview.found ? {
        fileName: preview.fileName,
        relativePath: preview.relativePath,
        matchedBy: preview.matchedBy,
      } : null,
    };
  }
}

module.exports = {
  GetProjectModelPreviewUseCase,
};
