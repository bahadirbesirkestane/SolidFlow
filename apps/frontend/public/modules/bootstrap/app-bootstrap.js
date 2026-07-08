async function handlePageEntry(pageName) {
  if (pageName === "user-workspace" && state.operations.users.length === 0) {
    try {
      await prepareUserWorkspacePage();
    } catch (error) {
      setUserWorkspaceStatus(`Hata: ${error.message}`);
    }
  }

  if (pageName === "rule-file-names" && state.fileNameRules.length === 0) {
    try {
      await loadFileNameRules();
    } catch (error) {
      statusText.textContent = `Dosya adı kuralları yüklenemedi: ${error.message}`;
    }
  }
}

syncPageButtonsWithRoutes();

document.querySelectorAll(".sidebar-link").forEach((button) => {
  button.addEventListener("click", async () => {
    const pageName = navigateToPage(button.dataset.pageLink);
    await handlePageEntry(pageName);
  });
});

window.addEventListener("hashchange", async () => {
  const pageName = getPageForHash(window.location.hash || "");
  switchPage(pageName);
  await handlePageEntry(pageName);
});

scanButton.addEventListener("click", scanFolder);
searchInput.addEventListener("input", () => renderRows(filteredRows()));
partListSearchInput.addEventListener("input", () => renderPartList(filteredPartList()));
resetPartListButton.addEventListener("click", resetPartListEdits);
document.getElementById("saveFileTypeRulesButton").addEventListener("click", saveFileTypeRules);
document.getElementById("saveKeywordRulesButton").addEventListener("click", saveKeywordRules);
document.getElementById("saveFileNameRulesButton").addEventListener("click", saveFileNameRules);
document.getElementById("saveOverridesButton").addEventListener("click", saveOverrides);
document.getElementById("addFileTypeRuleButton").addEventListener("click", appendNewFileTypeRule);
document.getElementById("addKeywordRuleButton").addEventListener("click", appendKeywordRule);
document.getElementById("addFileNameRuleButton").addEventListener("click", appendFileNameRule);
document.getElementById("refreshFileTypeRulesButton").addEventListener("click", loadFileTypeRules);
document.getElementById("refreshKeywordRulesButton").addEventListener("click", loadKeywordRules);
document.getElementById("refreshFileNameRulesButton").addEventListener("click", loadFileNameRules);
document.getElementById("clearOverrideFormButton").addEventListener("click", clearOverrideForm);
document.getElementById("exportExcelButton").addEventListener("click", exportCurrentRowsToExcel);
document.getElementById("exportCsvButton").addEventListener("click", exportCurrentRowsToCsv);
exportPartListExcelButton.addEventListener("click", exportPartListToExcel);
resultViewTabs.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-result-view]");
  if (!actionTarget) {
    return;
  }

  switchResultView(actionTarget.dataset.resultView);
});
fileTypeRulesBody.addEventListener("input", handleTableInput);
fileTypeRulesBody.addEventListener("change", handleTableInput);
keywordRulesBody.addEventListener("input", handleTableInput);
keywordRulesBody.addEventListener("change", handleTableInput);
fileNameRulesBody.addEventListener("input", handleTableInput);
fileNameRulesBody.addEventListener("change", handleTableInput);
overrideRulesBody.addEventListener("input", handleOverrideTableInput);
overrideRulesBody.addEventListener("change", handleOverrideTableInput);
partListBody.addEventListener("input", handlePartListInput);
partListBody.addEventListener("change", handlePartListInput);
resultsBody.addEventListener("click", handleBodyClick);
fileNameRulesBody.addEventListener("click", handleBodyClick);
overrideRulesBody.addEventListener("click", handleBodyClick);
projectList.addEventListener("click", handleOperationsClick);
userDirectory.addEventListener("click", handleOperationsClick);
selectedProjectPanel.addEventListener("click", handleOperationsClick);
selectedProjectPanel.addEventListener("submit", handleSelectedProjectPanelSubmit);
userWorkspaceList.addEventListener("click", handleUserWorkspaceClick);
erpWorkOrderList.addEventListener("click", handleErpClick);
refreshOperationsButton.addEventListener("click", loadOperationsData);
resetOperationsButton.addEventListener("click", clearOperationsView);
loadUserWorkspaceButton.addEventListener("click", () => loadUserWorkspaceData());
resetUserWorkspaceButton.addEventListener("click", clearUserWorkspaceView);
userWorkspaceUserSelect.addEventListener("change", async () => {
  state.operations.selectedUserId = userWorkspaceUserSelect.value;
  state.operations.userWorkItems = [];
  renderUserWorkspace();

  if (!userWorkspaceUserSelect.value) {
    setUserWorkspaceStatus("Kullanıcı seçimi temizlendi.");
    return;
  }

  setUserWorkspaceStatus("Kullanıcı işleri otomatik yükleniyor...");

  try {
    await loadUserWorkspaceData({ silent: true });
    const selectedUser = state.operations.users.find((user) => user.id === userWorkspaceUserSelect.value);
    const userLabel = selectedUser ? selectedUser.fullName : "Seçili kullanıcı";
    setUserWorkspaceStatus(`${userLabel} için işler otomatik yüklendi.`);
  } catch (error) {
    setUserWorkspaceStatus(`Kullanıcı işleri yüklenemedi: ${error.message}`);
  }
});
refreshErpButton.addEventListener("click", loadErpData);
resetErpButton.addEventListener("click", clearErpView);
resetWorkflowButton.addEventListener("click", clearWorkflowView);
resetFileTypeRulesButton.addEventListener("click", clearFileTypeRulesView);
resetKeywordRulesButton.addEventListener("click", clearKeywordRulesView);
resetFileNameRulesButton.addEventListener("click", clearFileNameRulesView);
resetOverridesButton.addEventListener("click", clearOverridesView);
projectCreateForm.addEventListener("submit", handleProjectCreateSubmit);
userCreateForm.addEventListener("submit", handleUserCreateSubmit);
overrideForm.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertOverrideFromForm();
});

window.addEventListener("load", async () => {
  try {
    switchResultView(state.resultView);
    projectFolderInput.value = folderInput.value.trim();
    clearWorkflowView();
    clearOperationsView();
    clearErpView();
    clearFileTypeRulesView();
    clearKeywordRulesView();
    clearFileNameRulesView();
    clearOverridesView();
    clearUserWorkspaceView();

    const initialPage = getPageForHash(window.location.hash || "");
    navigateToPage(initialPage, { replace: true });
    await handlePageEntry(initialPage);
  } catch (error) {
    statusText.textContent = `Hata: ${error.message}`;
    setOperationsStatus(`Hata: ${error.message}`);
  }
});
