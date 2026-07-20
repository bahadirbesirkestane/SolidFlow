const { AppError } = require("../../shared/app-error");

class PreviewFileDistributionUseCase {
  constructor({ scanProjectCore, fileDistributionConfigRepository, distributionPlanBuilder }) {
    this.scanProjectCore = scanProjectCore;
    this.fileDistributionConfigRepository = fileDistributionConfigRepository;
    this.distributionPlanBuilder = distributionPlanBuilder;
  }

  async execute(input = {}) {
    const sourceFolder = String(input.sourceFolder || "").trim();
    if (!sourceFolder) {
      throw new AppError("Dagitim onizlemesi icin kaynak klasor zorunludur.", {
        code: "FILE_DISTRIBUTION_SOURCE_REQUIRED",
        statusCode: 400,
      });
    }

    const targetRootPath = String(input.targetRootPath || "").trim();
    const config = await this.fileDistributionConfigRepository.get();
    const scanResult = await this.scanProjectCore.execute(sourceFolder);
    const plan = this.distributionPlanBuilder.build(scanResult.rows, config, { targetRootPath });

    return {
      scannedFolder: scanResult.scannedFolder,
      targetRootPath,
      config: {
        segmentPriority: config.segmentPriority,
      },
      summary: plan.summary,
      groups: plan.groups,
      renameSuggestions: plan.renameSuggestions,
      rows: plan.rows,
    };
  }
}

module.exports = {
  PreviewFileDistributionUseCase,
};
