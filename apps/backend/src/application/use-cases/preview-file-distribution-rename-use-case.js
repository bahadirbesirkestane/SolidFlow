const { AppError } = require("../../shared/app-error");
const { buildFileDistributionRenamePreview } = require("../services/file-distribution-rename-core");

class PreviewFileDistributionRenameUseCase {
  constructor({ previewFileDistributionUseCase, fileRenameAdapter }) {
    this.previewFileDistributionUseCase = previewFileDistributionUseCase;
    this.fileRenameAdapter = fileRenameAdapter;
  }

  async execute(input = {}) {
    const sourceFolder = String(input.sourceFolder || "").trim();
    if (!sourceFolder) {
      throw new AppError("Yeniden adlandirma onizlemesi icin kaynak klasor zorunludur.", {
        code: "FILE_DISTRIBUTION_RENAME_SOURCE_REQUIRED",
        statusCode: 400,
      });
    }

    const preview = await this.previewFileDistributionUseCase.execute({
      sourceFolder,
      targetRootPath: String(input.targetRootPath || "").trim(),
    });

    const renamePreview = await buildFileDistributionRenamePreview({
      sourceFolder,
      rows: preview.rows,
      selection: input.selection || {},
      operation: input.operation || {},
      fileRenameAdapter: this.fileRenameAdapter,
    });

    return {
      scannedFolder: preview.scannedFolder,
      totalFileCount: preview.rows.length,
      operation: renamePreview.operation,
      selection: renamePreview.selection,
      summary: renamePreview.summary,
      items: renamePreview.items,
    };
  }
}

module.exports = {
  PreviewFileDistributionRenameUseCase,
};
