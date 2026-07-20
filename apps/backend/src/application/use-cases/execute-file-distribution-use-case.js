const path = require("path");
const { AppError } = require("../../shared/app-error");

class ExecuteFileDistributionUseCase {
  constructor({ previewFileDistributionUseCase, fileCopyAdapter }) {
    this.previewFileDistributionUseCase = previewFileDistributionUseCase;
    this.fileCopyAdapter = fileCopyAdapter;
  }

  async execute(input = {}) {
    const sourceFolder = String(input.sourceFolder || "").trim();
    const targetRootPath = String(input.targetRootPath || "").trim();
    const dryRun = input.dryRun !== false;
    const conflictPolicy = normalizeConflictPolicy(input.conflictPolicy);

    if (!sourceFolder) {
      throw new AppError("Dagitim icrasi icin kaynak klasor zorunludur.", {
        code: "FILE_DISTRIBUTION_SOURCE_REQUIRED",
        statusCode: 400,
      });
    }

    if (!dryRun && !targetRootPath) {
      throw new AppError("Dagitim icrasi icin hedef kok klasor zorunludur.", {
        code: "FILE_DISTRIBUTION_TARGET_REQUIRED",
        statusCode: 400,
      });
    }

    const preview = await this.previewFileDistributionUseCase.execute({
      sourceFolder,
      targetRootPath,
    });

    const results = [];

    for (const row of preview.rows) {
      if (!row.isCopyCandidate) {
        results.push({
          relativePath: row.relativePath,
          sourcePath: row.absolutePath,
          targetPath: row.targetFilePath,
          status: "skipped",
          reason: "Belirsiz dagitim karari nedeniyle kopyalanmadi.",
        });
        continue;
      }

      let targetPath = row.targetFilePath;
      const exists = await this.fileCopyAdapter.exists(targetPath);
      if (exists) {
        if (conflictPolicy === "skip") {
          results.push({
            relativePath: row.relativePath,
            sourcePath: row.absolutePath,
            targetPath,
            status: "conflicted",
            reason: "Hedefte ayni dosya zaten mevcut.",
          });
          continue;
        }

        if (conflictPolicy === "suffix") {
          targetPath = appendConflictSuffix(targetPath);
        }
      }

      if (dryRun) {
        results.push({
          relativePath: row.relativePath,
          sourcePath: row.absolutePath,
          targetPath,
          status: "planned",
          reason: "Dry-run modunda planlandi.",
        });
        continue;
      }

      await this.fileCopyAdapter.copy(row.absolutePath, targetPath);
      results.push({
        relativePath: row.relativePath,
        sourcePath: row.absolutePath,
        targetPath,
        status: "copied",
        reason: "Dosya hedef klasore kopyalandi.",
      });
    }

    return {
      scannedFolder: preview.scannedFolder,
      targetRootPath,
      dryRun,
      conflictPolicy,
      summary: {
        totalFiles: results.length,
        copied: results.filter((item) => item.status === "copied").length,
        planned: results.filter((item) => item.status === "planned").length,
        skipped: results.filter((item) => item.status === "skipped").length,
        conflicted: results.filter((item) => item.status === "conflicted").length,
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
  return `${baseName}_copy${extension}`;
}

module.exports = {
  ExecuteFileDistributionUseCase,
};
