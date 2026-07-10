class GetScanModelPreviewUseCase {
  constructor({ modelPreviewService }) {
    this.modelPreviewService = modelPreviewService;
  }

  async execute(folderPath, input = {}) {
    const preview = await this.modelPreviewService.resolveForFolder(folderPath, input);
    return {
      found: preview.found,
      modelUrl: preview.found
        ? `/api/scan/3d-model?folder=${encodeURIComponent(folderPath)}&partCode=${encodeURIComponent(input.partCode || "")}&fileName=${encodeURIComponent(input.fileName || "")}&effectiveFileName=${encodeURIComponent(input.effectiveFileName || "")}`
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
  GetScanModelPreviewUseCase,
};
