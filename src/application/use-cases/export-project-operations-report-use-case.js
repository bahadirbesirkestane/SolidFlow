const { nowIso } = require("../../shared/time-utils");

class ExportProjectOperationsReportUseCase {
  constructor({
    projectRepository,
    workflowInstanceRepository,
    openJobRepository,
    auditLogRepository,
    operationsReportExporter,
  }) {
    this.projectRepository = projectRepository;
    this.workflowInstanceRepository = workflowInstanceRepository;
    this.openJobRepository = openJobRepository;
    this.auditLogRepository = auditLogRepository;
    this.operationsReportExporter = operationsReportExporter;
  }

  async execute(projectId, format) {
    const project = await this.projectRepository.getById(projectId);
    if (!project) {
      throw new Error("Proje bulunamadi.");
    }

    const [workflows, progress, openJobs, auditEvents] = await Promise.all([
      this.workflowInstanceRepository.listByProjectId(projectId),
      this.workflowInstanceRepository.getProjectProgress(projectId),
      this.openJobRepository.listAll(),
      this.auditLogRepository.listByProjectId(projectId),
    ]);

    const payload = {
      generatedAt: nowIso(),
      project,
      progress,
      workflows,
      openJobs: openJobs.filter((job) => job.projectId === projectId),
      auditEvents,
    };

    if (format === "csv") {
      return this.operationsReportExporter.exportCsv(payload);
    }

    if (format === "pdf") {
      return this.operationsReportExporter.exportPdf(payload);
    }

    return this.operationsReportExporter.exportWorkbook(payload);
  }
}

module.exports = {
  ExportProjectOperationsReportUseCase,
};
