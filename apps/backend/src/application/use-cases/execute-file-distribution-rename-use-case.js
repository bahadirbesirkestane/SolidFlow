const path = require("path");
const { AppError } = require("../../shared/app-error");

class ExecuteFileDistributionRenameUseCase {
  constructor({ previewFileDistributionRenameUseCase, fileRenameAdapter }) {
    this.previewFileDistributionRenameUseCase = previewFileDistributionRenameUseCase;
    this.fileRenameAdapter = fileRenameAdapter;
  }

  async execute(input = {}) {
    const sourceFolder = String(input.sourceFolder || "").trim();
    if (!sourceFolder) {
      throw new AppError("Rename islemi icin kaynak klasor zorunludur.", {
        code: "FILE_DISTRIBUTION_RENAME_SOURCE_REQUIRED",
        statusCode: 400,
      });
    }

    const conflictPolicy = normalizeConflictPolicy(input.conflictPolicy);
    const renamePreview = await this.previewFileDistributionRenameUseCase.execute({
      sourceFolder,
      targetRootPath: String(input.targetRootPath || "").trim(),
      operation: input.operation || {},
      selection: input.selection || {},
    });

    if (renamePreview.summary.affectedFileCount === 0) {
      throw new AppError("Rename islemi icin en az bir dosya veya klasor secilmelidir.", {
        code: "FILE_DISTRIBUTION_RENAME_SELECTION_REQUIRED",
        statusCode: 400,
      });
    }

    if (renamePreview.summary.invalidFileCount > 0) {
      throw new AppError("Secilen rename islemi gecersiz. Onizlemedeki hatalari duzeltmeden islem baslatilamaz.", {
        code: "FILE_DISTRIBUTION_RENAME_INVALID_PREVIEW",
        statusCode: 400,
      });
    }

    const results = [];

    for (const item of renamePreview.items) {
      if (item.sourcePath === item.targetPath) {
        results.push({
          relativePath: item.relativePath,
          sourcePath: item.sourcePath,
          targetPath: item.targetPath,
          status: "unchanged",
          reason: "Dosya adi zaten hedef isim ile ayni.",
        });
        continue;
      }

      let finalTargetPath = item.targetPath;
      const targetExists = await this.fileRenameAdapter.exists(finalTargetPath);
      if (targetExists) {
        if (conflictPolicy === "skip") {
          results.push({
            relativePath: item.relativePath,
            sourcePath: item.sourcePath,
            targetPath: finalTargetPath,
            status: "conflicted",
            reason: "Ayni isimde dosya zaten mevcut.",
          });
          continue;
        }

        finalTargetPath = appendConflictSuffix(finalTargetPath);
      }

      try {
        const sourceStillExists = await this.fileRenameAdapter.exists(item.sourcePath);
        if (!sourceStillExists) {
          results.push({
            relativePath: item.relativePath,
            sourcePath: item.sourcePath,
            targetPath: finalTargetPath,
            status: "failed",
            reason: "Kaynak dosya islem sirasinda bulunamadi.",
          });
          continue;
        }

        await this.fileRenameAdapter.rename(item.sourcePath, finalTargetPath);
        results.push({
          relativePath: item.relativePath,
          sourcePath: item.sourcePath,
          targetPath: finalTargetPath,
          status: "renamed",
          reason: "Dosya adi guncellendi.",
        });
      } catch (error) {
        results.push({
          relativePath: item.relativePath,
          sourcePath: item.sourcePath,
          targetPath: finalTargetPath,
          status: "failed",
          reason: error?.message || "Dosya yeniden adlandirilamadi.",
        });
      }
    }

    return {
      scannedFolder: sourceFolder,
      conflictPolicy,
      operation: renamePreview.operation,
      selection: renamePreview.selection,
      summary: {
        totalCandidates: renamePreview.totalFileCount,
        selectedCount: renamePreview.summary.affectedFileCount,
        renamed: results.filter((item) => item.status === "renamed").length,
        conflicted: results.filter((item) => item.status === "conflicted").length,
        unchanged: results.filter((item) => item.status === "unchanged").length,
        failed: results.filter((item) => item.status === "failed").length,
      },
      results,
    };
  }
}

function normalizeConflictPolicy(value) {
  const normalized = String(value || "suffix").trim().toLowerCase();
  return ["skip", "suffix"].includes(normalized) ? normalized : "suffix";
}

function appendConflictSuffix(filePath) {
  const extension = path.extname(filePath);
  const baseName = filePath.slice(0, filePath.length - extension.length);
  return `${baseName}_rename${extension}`;
}

module.exports = {
  ExecuteFileDistributionRenameUseCase,
};
