const pageEntryWorkflowPageRefs = window.workflowPageRefs;
const pageEntryUserWorkspacePageRefs = window.userWorkspacePageRefs;

const pageEntryHandlers = {
  dashboard: async (loadedPages) => {
    await loadManagerDashboardData({ silent: true });
    loadedPages.dashboard = true;
  },
  projects: async (loadedPages) => {
    if (!loadedPages.projects || state.operations.projects.length === 0) {
      await loadOperationsData();
    }
    loadedPages.projects = true;
  },
  "workflow-builder": async (loadedPages) => {
    if (!loadedPages["workflow-builder"] && pageEntryWorkflowPageRefs.folderInput?.value.trim() && state.rows.length === 0) {
      await scanFolder();
    }
    loadedPages["workflow-builder"] = true;
  },
  "erp-center": async (loadedPages) => {
    if (!loadedPages["erp-center"] || state.erp.workOrders.length === 0) {
      await loadErpData();
    }
    loadedPages["erp-center"] = true;
  },
  "user-workspace": async (loadedPages) => {
    if (state.operations.users.length === 0 || state.operations.projects.length === 0) {
      await prepareUserWorkspacePage();
    }

    if (!state.operations.selectedUserId) {
      const firstActiveUser = state.operations.users.find((user) => user.isActive);
      if (firstActiveUser) {
        state.operations.selectedUserId = firstActiveUser.id;
        if (pageEntryUserWorkspacePageRefs.userWorkspaceUserSelect) {
          pageEntryUserWorkspacePageRefs.userWorkspaceUserSelect.value = firstActiveUser.id;
        }
      }
    }

    if (state.operations.selectedUserId) {
      await loadUserWorkspaceData({ silent: true });
    }

    loadedPages["user-workspace"] = true;
  },
  "rule-file-types": async (loadedPages) => {
    if (state.fileTypeRules.length > 0) {
      loadedPages["rule-file-types"] = true;
      return;
    }

    await loadFileTypeRules();
    loadedPages["rule-file-types"] = true;
  },
  "rule-keywords": async (loadedPages) => {
    if (state.keywordRules.length > 0) {
      loadedPages["rule-keywords"] = true;
      return;
    }

    await loadKeywordRules();
    loadedPages["rule-keywords"] = true;
  },
  "rule-file-names": async (loadedPages) => {
    if (state.fileNameRules.length > 0) {
      loadedPages["rule-file-names"] = true;
      return;
    }

    await loadFileNameRules();
    loadedPages["rule-file-names"] = true;
  },
  "rule-overrides": async (loadedPages) => {
    if (state.overrides.length > 0) {
      loadedPages["rule-overrides"] = true;
      return;
    }

    await loadOverrides();
    loadedPages["rule-overrides"] = true;
  },
};

async function handlePageEntry(pageName) {
  state.viewState = state.viewState || { loadedPages: {} };
  const loadedPages = state.viewState.loadedPages;
  const pageHandler = pageEntryHandlers[pageName];

  if (!pageHandler) {
    loadedPages[pageName] = true;
    return;
  }

  try {
    await pageHandler(loadedPages);
  } catch (error) {
    if (pageName.startsWith("rule-") && pageEntryWorkflowPageRefs.statusText) {
      pageEntryWorkflowPageRefs.statusText.textContent = `${getPageMeta(pageName).title} yuklenemedi: ${error.message}`;
      return;
    }

    if (pageName === "user-workspace") {
      setUserWorkspaceStatus(`Hata: ${error.message}`);
      return;
    }

    throw error;
  }
}

window.handlePageEntry = handlePageEntry;
