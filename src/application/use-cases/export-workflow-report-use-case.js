class ExportWorkflowReportUseCase {
  constructor({ scanProjectUseCase, reportExporter }) {
    this.scanProjectUseCase = scanProjectUseCase;
    this.reportExporter = reportExporter;
  }

  async execute(rootPath, reportDataOverride) {
    const reportData = reportDataOverride || await this.scanProjectUseCase.execute(rootPath);
    return this.reportExporter.exportWorkbook(reportData);
  }
}

module.exports = {
  ExportWorkflowReportUseCase,
};
