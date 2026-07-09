const bootstrapWorkflowPageRefs = window.workflowPageRefs;
const bootstrapOperationsPageRefs = window.operationsPageRefs;
const bootstrapRulesPageRefs = window.rulesPageRefs;
const bootstrapUserWorkspacePageRefs = window.userWorkspacePageRefs;
const bootstrapErpPageRefs = window.erpPageRefs;

const {
  searchInput: bootstrapSearchInput,
  partListSearchInput: bootstrapPartListSearchInput,
  resultsBody: bootstrapResultsBody,
  folderInput: bootstrapFolderInput,
  statusText: bootstrapStatusText,
} = window.workflowPageRefs;
const {
  fileNameRulesBody: bootstrapFileNameRulesBody,
  overrideRulesBody: bootstrapOverrideRulesBody,
} = window.rulesPageRefs;
const {
  projectList: bootstrapProjectList,
  userDirectory: bootstrapUserDirectory,
  selectedProjectPanel: bootstrapSelectedProjectPanel,
  projectFolderInput: bootstrapProjectFolderInput,
} = window.operationsPageRefs;
const {
  userWorkspaceUserSelect: bootstrapUserWorkspaceUserSelect,
  userWorkspaceList: bootstrapUserWorkspaceList,
} = window.userWorkspacePageRefs;
const { erpWorkOrderList: bootstrapErpWorkOrderList } = window.erpPageRefs;

const clickHandlersById = {
  scanButton: async () => scanFolder(),
  resetPartListButton: async () => resetPartListEdits(),
  saveFileTypeRulesButton: async () => saveFileTypeRules(),
  saveKeywordRulesButton: async () => saveKeywordRules(),
  saveFileNameRulesButton: async () => saveFileNameRules(),
  saveOverridesButton: async () => saveOverrides(),
  addFileTypeRuleButton: async () => appendNewFileTypeRule(),
  addKeywordRuleButton: async () => appendKeywordRule(),
  addFileNameRuleButton: async () => appendFileNameRule(),
  refreshFileTypeRulesButton: async () => loadFileTypeRules(),
  refreshKeywordRulesButton: async () => loadKeywordRules(),
  refreshFileNameRulesButton: async () => loadFileNameRules(),
  clearOverrideFormButton: async () => clearOverrideForm(),
  refreshDashboardButton: async () => loadManagerDashboardData(),
  prefillBulkWorkOrderButton: async () => prefillBulkWorkOrderForm(),
  refreshOperationsButton: async () => loadOperationsData(),
  resetOperationsButton: async () => clearOperationsView(),
  loadUserWorkspaceButton: async () => loadUserWorkspaceData(),
  resetUserWorkspaceButton: async () => clearUserWorkspaceView(),
  refreshErpButton: async () => loadErpData(),
  resetErpButton: async () => clearErpView(),
  resetWorkflowButton: async () => clearWorkflowView(),
  resetFileTypeRulesButton: async () => clearFileTypeRulesView(),
  resetKeywordRulesButton: async () => clearKeywordRulesView(),
  resetFileNameRulesButton: async () => clearFileNameRulesView(),
  resetOverridesButton: async () => clearOverridesView(),
};

function isRuleTableTarget(target) {
  return Boolean(
    target.closest("#fileTypeRulesBody")
    || target.closest("#keywordRulesBody")
    || target.closest("#fileNameRulesBody"),
  );
}

function handleRuleTableChange(event) {
  if (isRuleTableTarget(event.target)) {
    handleTableInput(event);
    return true;
  }

  return false;
}

function handlePartListChange(event) {
  if (event.target.closest("#partListBody")) {
    handlePartListInput(event);
    return true;
  }

  return false;
}

syncPageButtonsWithRoutes();

document.addEventListener("click", async (event) => {
  const pageLink = event.target.closest("[data-page-link]");
  if (pageLink) {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) {
      return;
    }

    event.preventDefault();
    const pageName = navigateToPage(pageLink.dataset.pageLink);
    if (window.syncSidebarGroupState) {
      window.syncSidebarGroupState(pageName);
    }
    await window.handlePageEntry(pageName);
    return;
  }

  const resultViewButton = event.target.closest("[data-result-view]");
  if (resultViewButton) {
    event.preventDefault();
    switchResultView(resultViewButton.dataset.resultView);
    return;
  }

  const actionTarget = event.target.closest("[data-action]");
  if (actionTarget) {
    const action = actionTarget.dataset.action;

    if (action === "pick-folder") {
      event.preventDefault();
      await handleFolderPickerAction(actionTarget);
      return;
    }

    if (action === "export-workflow-excel") {
      event.preventDefault();
      await exportCurrentRowsToExcel();
      return;
    }

    if (action === "export-workflow-csv") {
      event.preventDefault();
      exportCurrentRowsToCsv();
      return;
    }

    if (action === "export-part-list-excel") {
      event.preventDefault();
      await exportPartListToExcel();
      return;
    }
  }

  const buttonId = event.target.closest("[id]")?.id;
  if (!buttonId) {
    return;
  }

  const clickHandler = clickHandlersById[buttonId];
  if (clickHandler) {
    event.preventDefault();
    await clickHandler();
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  if (form.id === "bulkWorkOrderForm") {
    await handleBulkWorkOrderSubmit(event);
    return;
  }

  if (form.id === "projectCreateForm") {
    await handleProjectCreateSubmit(event);
    return;
  }

  if (form.id === "userCreateForm") {
    await handleUserCreateSubmit(event);
    return;
  }

  if (form.id === "overrideForm") {
    event.preventDefault();
    upsertOverrideFromForm();
    return;
  }

  if (form.closest("#selectedProjectPanel")) {
    await handleSelectedProjectPanelSubmit(event);
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;

  if (target === bootstrapWorkflowPageRefs.searchInput) {
    renderRows(filteredRows());
    return;
  }

  if (target === bootstrapWorkflowPageRefs.partListSearchInput) {
    renderPartList(filteredPartList());
    return;
  }

  if (handleRuleTableChange(event)) {
    return;
  }

  if (target.closest("#overrideRulesBody")) {
    handleOverrideTableInput(event);
    return;
  }

  handlePartListChange(event);
});

document.addEventListener("change", async (event) => {
  const target = event.target;

  if (target === bootstrapUserWorkspacePageRefs.userWorkspaceUserSelect) {
    state.operations.selectedUserId = bootstrapUserWorkspacePageRefs.userWorkspaceUserSelect.value;
    state.operations.userWorkItems = [];
    renderUserWorkspace();

    if (!bootstrapUserWorkspacePageRefs.userWorkspaceUserSelect.value) {
      setUserWorkspaceStatus("Kullanıcı seçimi temizlendi.");
      return;
    }

    setUserWorkspaceStatus("Kullanıcı işleri otomatik yükleniyor...");

    try {
      await loadUserWorkspaceData({ silent: true });
      const selectedUser = state.operations.users.find((user) => user.id === bootstrapUserWorkspacePageRefs.userWorkspaceUserSelect.value);
      const userLabel = selectedUser ? selectedUser.fullName : "Seçili kullanıcı";
      setUserWorkspaceStatus(`${userLabel} için işler otomatik yüklendi.`);
    } catch (error) {
      setUserWorkspaceStatus(`Kullanıcı işleri yüklenemedi: ${error.message}`);
    }
    return;
  }

  if (handleRuleTableChange(event)) {
    return;
  }

  if (target.closest("#overrideRulesBody")) {
    handleOverrideTableInput(event);
    return;
  }

  handlePartListChange(event);
});

if (bootstrapWorkflowPageRefs.resultsBody) {
  bootstrapWorkflowPageRefs.resultsBody.addEventListener("click", handleBodyClick);
}

if (bootstrapRulesPageRefs.fileNameRulesBody) {
  bootstrapRulesPageRefs.fileNameRulesBody.addEventListener("click", handleBodyClick);
}

if (bootstrapRulesPageRefs.overrideRulesBody) {
  bootstrapRulesPageRefs.overrideRulesBody.addEventListener("click", handleBodyClick);
}

if (bootstrapOperationsPageRefs.projectList) {
  bootstrapOperationsPageRefs.projectList.addEventListener("click", handleOperationsClick);
}

if (bootstrapOperationsPageRefs.userDirectory) {
  bootstrapOperationsPageRefs.userDirectory.addEventListener("click", handleOperationsClick);
}

if (bootstrapOperationsPageRefs.selectedProjectPanel) {
  bootstrapOperationsPageRefs.selectedProjectPanel.addEventListener("click", handleOperationsClick);
}

if (bootstrapUserWorkspacePageRefs.userWorkspaceList) {
  bootstrapUserWorkspacePageRefs.userWorkspaceList.addEventListener("click", handleUserWorkspaceClick);
}

if (bootstrapErpPageRefs.erpWorkOrderList) {
  bootstrapErpPageRefs.erpWorkOrderList.addEventListener("click", handleErpClick);
}

window.addEventListener("popstate", async () => {
  const pageName = getPageForPath(window.location.pathname || "/");
  switchPage(pageName);
  syncPageChrome(pageName);
  if (window.syncSidebarGroupState) {
    window.syncSidebarGroupState(pageName);
  }
  await window.handlePageEntry(pageName);
});

window.addEventListener("load", async () => {
  try {
    switchResultView(state.resultView);
    if (bootstrapOperationsPageRefs.projectFolderInput && bootstrapWorkflowPageRefs.folderInput) {
      bootstrapOperationsPageRefs.projectFolderInput.value = bootstrapWorkflowPageRefs.folderInput.value.trim();
    }
    clearWorkflowView();
    clearOperationsView();
    clearErpView();
    clearFileTypeRulesView();
    clearKeywordRulesView();
    clearFileNameRulesView();
    clearOverridesView();
    clearUserWorkspaceView();

    const legacyPage = getPageFromLegacyHash(window.location.hash || "");
    const initialPage = legacyPage || getPageForPath(window.location.pathname || "/");
    navigateToPage(initialPage, { replace: true });
    if (window.syncSidebarGroupState) {
      window.syncSidebarGroupState(initialPage);
    }
    await window.handlePageEntry(initialPage);
  } catch (error) {
    if (bootstrapWorkflowPageRefs.statusText) {
      bootstrapWorkflowPageRefs.statusText.textContent = `Hata: ${error.message}`;
    }
    setOperationsStatus(`Hata: ${error.message}`);
    setDashboardStatus(`Hata: ${error.message}`);
  }
});
