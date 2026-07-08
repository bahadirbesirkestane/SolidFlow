class ListProjectAuditEventsUseCase {
  constructor({ auditLogRepository }) {
    this.auditLogRepository = auditLogRepository;
  }

  async execute(projectId) {
    return this.auditLogRepository.listByProjectId(projectId);
  }
}

module.exports = {
  ListProjectAuditEventsUseCase,
};
