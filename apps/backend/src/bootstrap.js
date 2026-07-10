const path = require("path");
const { WorkflowEngine } = require("./domain/services/workflow-engine");
const { ScanProjectUseCase } = require("./application/use-cases/scan-project-use-case");
const { GetFileTypeRulesUseCase } = require("./application/use-cases/get-file-type-rules-use-case");
const { SaveFileTypeRulesUseCase } = require("./application/use-cases/save-file-type-rules-use-case");
const { GetKeywordRulesUseCase } = require("./application/use-cases/get-keyword-rules-use-case");
const { SaveKeywordRulesUseCase } = require("./application/use-cases/save-keyword-rules-use-case");
const { GetFileNameRulesUseCase } = require("./application/use-cases/get-file-name-rules-use-case");
const { SaveFileNameRulesUseCase } = require("./application/use-cases/save-file-name-rules-use-case");
const { GetPartOverridesUseCase } = require("./application/use-cases/get-part-overrides-use-case");
const { SavePartOverridesUseCase } = require("./application/use-cases/save-part-overrides-use-case");
const { ExportWorkflowReportUseCase } = require("./application/use-cases/export-workflow-report-use-case");
const { ListWorkflowTemplatesUseCase } = require("./application/use-cases/list-workflow-templates-use-case");
const { CreateProjectUseCase } = require("./application/use-cases/create-project-use-case");
const { CreateBulkWorkOrdersUseCase } = require("./application/use-cases/create-bulk-work-orders-use-case");
const { DeleteProjectUseCase } = require("./application/use-cases/delete-project-use-case");
const { ListProjectsUseCase } = require("./application/use-cases/list-projects-use-case");
const { GetProjectDashboardUseCase } = require("./application/use-cases/get-project-dashboard-use-case");
const { CreateWorkflowInstancesUseCase } = require("./application/use-cases/create-workflow-instances-use-case");
const { DeleteWorkflowInstanceUseCase } = require("./application/use-cases/delete-workflow-instance-use-case");
const { AdvanceWorkflowInstanceUseCase } = require("./application/use-cases/advance-workflow-instance-use-case");
const { ListUsersUseCase } = require("./application/use-cases/list-users-use-case");
const { CreateUserUseCase } = require("./application/use-cases/create-user-use-case");
const { DeactivateUserUseCase } = require("./application/use-cases/deactivate-user-use-case");
const { ListOpenJobsUseCase } = require("./application/use-cases/list-open-jobs-use-case");
const { ListProjectAuditEventsUseCase } = require("./application/use-cases/list-project-audit-events-use-case");
const { UpdateWorkflowStepUseCase } = require("./application/use-cases/update-workflow-step-use-case");
const { AddWorkflowStepUseCase } = require("./application/use-cases/add-workflow-step-use-case");
const { RemoveWorkflowStepUseCase } = require("./application/use-cases/remove-workflow-step-use-case");
const { BootstrapProjectWorkflowsUseCase } = require("./application/use-cases/bootstrap-project-workflows-use-case");
const { AssignProjectWorkflowsUseCase } = require("./application/use-cases/assign-project-workflows-use-case");
const { SqliteClient } = require("./infrastructure/database/sqlite-client");
const { migrateAndSeedDatabase } = require("./infrastructure/database/migrate-and-seed");
const { SqliteFileTypeRuleRepository } = require("./infrastructure/repositories/sqlite-file-type-rule-repository");
const { SqliteKeywordRuleRepository } = require("./infrastructure/repositories/sqlite-keyword-rule-repository");
const { SqliteFileNameRuleRepository } = require("./infrastructure/repositories/sqlite-file-name-rule-repository");
const { SqlitePartOverrideRepository } = require("./infrastructure/repositories/sqlite-part-override-repository");
const { SqliteProjectRepository } = require("./infrastructure/repositories/sqlite-project-repository");
const { SqliteWorkflowTemplateRepository } = require("./infrastructure/repositories/sqlite-workflow-template-repository");
const { SqliteWorkflowInstanceRepository } = require("./infrastructure/repositories/sqlite-workflow-instance-repository");
const { SqliteUserRepository } = require("./infrastructure/repositories/sqlite-user-repository");
const { SqliteOpenJobRepository } = require("./infrastructure/repositories/sqlite-open-job-repository");
const { SqliteAuditLogRepository } = require("./infrastructure/repositories/sqlite-audit-log-repository");
const { LocalAssignmentRuleRepository } = require("./infrastructure/repositories/local-assignment-rule-repository");
const { LocalProjectScanner } = require("./infrastructure/services/local-project-scanner");
const { WorkflowReportExporter } = require("./infrastructure/reporting/workflow-report-exporter");
const { OperationsReportExporter } = require("./infrastructure/reporting/operations-report-exporter");
const { WorkflowAutoPlanner } = require("./application/services/workflow-auto-planner");
const { WorkflowAssignmentResolver } = require("./application/services/workflow-assignment-resolver");
const { ExportProjectOperationsReportUseCase } = require("./application/use-cases/export-project-operations-report-use-case");
const { JsonFileRepository } = require("./infrastructure/repositories/json-file-repository");
const { GetAssignmentRulesUseCase } = require("./application/use-cases/get-assignment-rules-use-case");
const { SaveAssignmentRulesUseCase } = require("./application/use-cases/save-assignment-rules-use-case");
const { LocalErpWorkOrderRepository } = require("./infrastructure/repositories/local-erp-work-order-repository");
const { ListErpWorkOrdersUseCase } = require("./application/use-cases/list-erp-work-orders-use-case");
const { GetErpWorkOrderDetailUseCase } = require("./application/use-cases/get-erp-work-order-detail-use-case");
const { ErpDispatchPlanner } = require("./application/services/erp-dispatch-planner");
const { StartErpWorkOrderUseCase } = require("./application/use-cases/start-erp-work-order-use-case");
const { SelectFolderUseCase } = require("./application/use-cases/select-folder-use-case");
const { GetProjectModelPreviewUseCase } = require("./application/use-cases/get-project-model-preview-use-case");
const { StreamProjectModelPreviewUseCase } = require("./application/use-cases/stream-project-model-preview-use-case");
const { GetScanModelPreviewUseCase } = require("./application/use-cases/get-scan-model-preview-use-case");
const { StreamScanModelPreviewUseCase } = require("./application/use-cases/stream-scan-model-preview-use-case");
const { createAppConfig } = require("./config/app-config");
const { createHttpServer } = require("./presentation/http/server-factory");
const { WindowsFolderPicker } = require("./infrastructure/services/windows-folder-picker");
const { GlbModelPreviewService } = require("./infrastructure/services/glb-model-preview-service");
const { CadConversionService } = require("./infrastructure/services/CadConversionService");

function buildApplication(rootPath, appConfig = createAppConfig({ rootPath })) {
  const sqliteClient = new SqliteClient(rootPath);
  const db = sqliteClient.getDb();
  migrateAndSeedDatabase({ db, rootPath });

  const fileTypeRuleRepository = new SqliteFileTypeRuleRepository(db);
  const keywordRuleRepository = new SqliteKeywordRuleRepository(db);
  const fileNameRuleRepository = new SqliteFileNameRuleRepository(db);
  const partOverrideRepository = new SqlitePartOverrideRepository(db);
  const projectRepository = new SqliteProjectRepository(db);
  const workflowTemplateRepository = new SqliteWorkflowTemplateRepository(db);
  const workflowInstanceRepository = new SqliteWorkflowInstanceRepository(db);
  const userRepository = new SqliteUserRepository(db);
  const openJobRepository = new SqliteOpenJobRepository(db);
  const auditLogRepository = new SqliteAuditLogRepository(db);
  const assignmentRuleRepository = new LocalAssignmentRuleRepository(
    new JsonFileRepository(
      path.join(rootPath, "data", "assignment-rules.json"),
      { departmentMappings: [] },
    ),
  );
  const erpWorkOrderRepository = new LocalErpWorkOrderRepository({
    jsonRepository: new JsonFileRepository(
      path.join(rootPath, "data", "erp-work-orders.json"),
      { workOrders: [] },
    ),
  });
  const projectScanner = new LocalProjectScanner();
  const folderPickerService = new WindowsFolderPicker();
  const modelPreviewService = new GlbModelPreviewService();
  const cadConversionService = new CadConversionService({
    rootPath,
    config: appConfig.cadConversion,
  });
  const workflowEngine = new WorkflowEngine();
  const reportExporter = new WorkflowReportExporter(rootPath);
  const operationsReportExporter = new OperationsReportExporter(rootPath);
  const workflowAssignmentResolver = new WorkflowAssignmentResolver({
    userRepository,
    assignmentRuleRepository,
  });
  const erpDispatchPlanner = new ErpDispatchPlanner({
    userRepository,
    assignmentRuleRepository,
  });

  const scanProjectUseCase = new ScanProjectUseCase({
    projectScanner,
    workflowEngine,
    fileTypeRuleRepository,
    keywordRuleRepository,
    fileNameRuleRepository,
    partOverrideRepository,
    cadConversionService,
  });
  const createWorkflowInstancesUseCase = new CreateWorkflowInstancesUseCase({
    projectRepository,
    workflowTemplateRepository,
    workflowInstanceRepository,
    workflowAssignmentResolver,
  });
  const workflowAutoPlanner = new WorkflowAutoPlanner({
    scanProjectUseCase,
    workflowTemplateRepository,
  });
  const bootstrapProjectWorkflowsUseCase = new BootstrapProjectWorkflowsUseCase({
    workflowAutoPlanner,
    createWorkflowInstancesUseCase,
  });

  const application = {
    scanProject: scanProjectUseCase,
    getFileTypeRules: new GetFileTypeRulesUseCase({ fileTypeRuleRepository }),
    saveFileTypeRules: new SaveFileTypeRulesUseCase({ fileTypeRuleRepository }),
    getKeywordRules: new GetKeywordRulesUseCase({ keywordRuleRepository }),
    saveKeywordRules: new SaveKeywordRulesUseCase({ keywordRuleRepository }),
    getFileNameRules: new GetFileNameRulesUseCase({ fileNameRuleRepository }),
    saveFileNameRules: new SaveFileNameRulesUseCase({ fileNameRuleRepository }),
    getPartOverrides: new GetPartOverridesUseCase({ partOverrideRepository }),
    savePartOverrides: new SavePartOverridesUseCase({ partOverrideRepository }),
    getAssignmentRules: new GetAssignmentRulesUseCase({ assignmentRuleRepository }),
    saveAssignmentRules: new SaveAssignmentRulesUseCase({ assignmentRuleRepository }),
    listErpWorkOrders: new ListErpWorkOrdersUseCase({ erpWorkOrderRepository }),
    getErpWorkOrderDetail: new GetErpWorkOrderDetailUseCase({
      erpWorkOrderRepository,
      erpDispatchPlanner,
    }),
    getProjectModelPreview: new GetProjectModelPreviewUseCase({
      projectRepository,
      modelPreviewService,
    }),
    streamProjectModelPreview: new StreamProjectModelPreviewUseCase({
      projectRepository,
      modelPreviewService,
    }),
    getScanModelPreview: new GetScanModelPreviewUseCase({
      modelPreviewService,
    }),
    streamScanModelPreview: new StreamScanModelPreviewUseCase({
      modelPreviewService,
    }),
    startErpWorkOrder: new StartErpWorkOrderUseCase({
      erpWorkOrderRepository,
      projectRepository,
      workflowTemplateRepository,
      createWorkflowInstancesUseCase,
      auditLogRepository,
    }),
    selectFolder: new SelectFolderUseCase({ folderPickerService }),
    exportWorkflowReport: new ExportWorkflowReportUseCase({
      scanProjectUseCase,
      reportExporter,
    }),
    exportProjectOperationsReport: new ExportProjectOperationsReportUseCase({
      projectRepository,
      workflowInstanceRepository,
      openJobRepository,
      auditLogRepository,
      operationsReportExporter,
    }),
    listWorkflowTemplates: new ListWorkflowTemplatesUseCase({ workflowTemplateRepository }),
    createProject: new CreateProjectUseCase({ projectRepository, bootstrapProjectWorkflowsUseCase }),
    createBulkWorkOrders: new CreateBulkWorkOrdersUseCase({
      projectRepository,
      createWorkflowInstancesUseCase,
    }),
    deleteProject: new DeleteProjectUseCase({ projectRepository }),
    listProjects: new ListProjectsUseCase({ projectRepository, workflowInstanceRepository }),
    getProjectDashboard: new GetProjectDashboardUseCase({ projectRepository, workflowInstanceRepository }),
    createWorkflowInstances: createWorkflowInstancesUseCase,
    deleteWorkflowInstance: new DeleteWorkflowInstanceUseCase({
      workflowInstanceRepository,
      projectRepository,
    }),
    advanceWorkflowInstance: new AdvanceWorkflowInstanceUseCase({
      workflowInstanceRepository,
      projectRepository,
      auditLogRepository,
    }),
    listUsers: new ListUsersUseCase({ userRepository }),
    createUser: new CreateUserUseCase({ userRepository }),
    deactivateUser: new DeactivateUserUseCase({ userRepository }),
    listOpenJobs: new ListOpenJobsUseCase({ openJobRepository }),
    listProjectAuditEvents: new ListProjectAuditEventsUseCase({ auditLogRepository }),
    updateWorkflowStep: new UpdateWorkflowStepUseCase({ workflowInstanceRepository, auditLogRepository }),
    addWorkflowStep: new AddWorkflowStepUseCase({ workflowInstanceRepository, auditLogRepository }),
    removeWorkflowStep: new RemoveWorkflowStepUseCase({
      workflowInstanceRepository,
      openJobRepository,
      auditLogRepository,
    }),
    bootstrapProjectWorkflows: bootstrapProjectWorkflowsUseCase,
    assignProjectWorkflows: new AssignProjectWorkflowsUseCase({
      projectRepository,
      workflowTemplateRepository,
      workflowInstanceRepository,
      workflowAssignmentResolver,
      auditLogRepository,
    }),
  };

  const defaultScanDir = appConfig.paths.defaultScanDir;
  const publicDir = appConfig.paths.publicDir;
  const server = createHttpServer({
    application,
    publicDir,
    defaultScanDir,
    frontendConfig: {
      ...appConfig.frontend,
      defaultScanDir,
    },
  });

  return {
    application,
    server,
    defaultScanDir,
    appConfig,
  };
}

module.exports = {
  buildApplication,
};
