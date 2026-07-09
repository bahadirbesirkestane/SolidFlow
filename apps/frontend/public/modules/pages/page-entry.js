const pageEntryWorkflowPageRefs = window.workflowPageRefs;
const pageEntryUserWorkspacePageRefs = window.userWorkspacePageRefs;

async function handlePageEntry(pageName) {
  state.viewState = state.viewState || { loadedPages: {} };
  const loadedPages = state.viewState.loadedPages;

  if (pageName === "dashboard") {
    await loadManagerDashboardData({ silent: true });
    loadedPages[pageName] = true;
    return;
  }

  if (pageName === "projects") {
    if (!loadedPages[pageName] || state.operations.projects.length === 0) {
      await loadOperationsData();
    }
    loadedPages[pageName] = true;
    return;
  }

  if (pageName === "workflow-builder") {
    if (!loadedPages[pageName] && pageEntryWorkflowPageRefs.folderInput?.value.trim() && state.rows.length === 0) {
      await scanFolder();
    }
    loadedPages[pageName] = true;
    return;
  }

  if (pageName === "erp-center") {
    if (!loadedPages[pageName] || state.erp.workOrders.length === 0) {
      await loadErpData();
    }
    loadedPages[pageName] = true;
    return;
  }

  if (pageName === "user-workspace") {
    try {
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

      loadedPages[pageName] = true;
    } catch (error) {
      setUserWorkspaceStatus(`Hata: ${error.message}`);
    }
    return;
  }

  if (pageName === "rule-file-types" && state.fileTypeRules.length === 0) {
    try {
      await loadFileTypeRules();
      loadedPages[pageName] = true;
    } catch (error) {
      if (pageEntryWorkflowPageRefs.statusText) {
        pageEntryWorkflowPageRefs.statusText.textContent = `Dosya tipi kurallari yuklenemedi: ${error.message}`;
      }
    }
    return;
  }

  if (pageName === "rule-keywords" && state.keywordRules.length === 0) {
    try {
      await loadKeywordRules();
      loadedPages[pageName] = true;
    } catch (error) {
      if (pageEntryWorkflowPageRefs.statusText) {
        pageEntryWorkflowPageRefs.statusText.textContent = `Keyword kurallari yuklenemedi: ${error.message}`;
      }
    }
    return;
  }

  if (pageName === "rule-file-names" && state.fileNameRules.length === 0) {
    try {
      await loadFileNameRules();
      loadedPages[pageName] = true;
    } catch (error) {
      if (pageEntryWorkflowPageRefs.statusText) {
        pageEntryWorkflowPageRefs.statusText.textContent = `Dosya adi kurallari yuklenemedi: ${error.message}`;
      }
    }
    return;
  }

  if (pageName === "rule-overrides" && state.overrides.length === 0) {
    try {
      await loadOverrides();
      loadedPages[pageName] = true;
    } catch (error) {
      if (pageEntryWorkflowPageRefs.statusText) {
        pageEntryWorkflowPageRefs.statusText.textContent = `Override kayitlari yuklenemedi: ${error.message}`;
      }
    }
  }
}

window.handlePageEntry = handlePageEntry;
