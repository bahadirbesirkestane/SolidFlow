class StreamScanModelPreviewUseCase {
  constructor({ modelPreviewService }) {
    this.modelPreviewService = modelPreviewService;
  }

  async execute(folderPath, input = {}) {
    const preview = await this.modelPreviewService.resolveForFolder(folderPath, input);
    if (!preview.found) {
      throw new Error(preview.reason || "3D model bulunamadi.");
    }

    return preview;
  }
}

module.exports = {
  StreamScanModelPreviewUseCase,
};
