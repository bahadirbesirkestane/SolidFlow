window.appState = window.appState || {
  rows: [],
  partList: [],
  partListBase: [],
  resultView: "workflow",
  fileTypeRules: [],
  keywordRules: [],
  fileNameRules: [],
  overrides: [],
  editingOverrideId: null,
  scanInsights: null,
  operations: {
    projects: [],
    selectedProjectId: null,
    selectedProject: null,
    selectedUserId: null,
    departments: [],
    users: [],
    templates: [],
    openJobs: [],
    auditEvents: [],
    userWorkItems: [],
  },
  erp: {
    workOrders: [],
    selectedWorkOrderId: null,
    selectedWorkOrder: null,
    dispatch: null,
  },
  managerDashboard: {
    dashboards: [],
  },
  viewState: {
    loadedPages: {},
    pagination: {
      workflow: { page: 1, pageSize: 12 },
      parts: { page: 1, pageSize: 10 },
    },
    operationsDrawer: {
      isOpen: false,
      activePanel: "open-jobs",
    },
    nav: {
      collapsed: false,
      mobileOpen: false,
    },
  },
};
