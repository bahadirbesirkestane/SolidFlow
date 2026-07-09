const state = window.appState;

const apiClient = window.apiClient || {
  buildApiUrl: (value) => value,
  apiFetch: (value, options) => fetch(value, options),
};
const appConfig = window.APP_CONFIG || {};

const workflowPageRefs = window.workflowPageRefs;
const operationsPageRefs = window.operationsPageRefs;
const rulesPageRefs = window.rulesPageRefs;
const userWorkspacePageRefs = window.userWorkspacePageRefs;
const erpPageRefs = window.erpPageRefs;
const dashboardPageRefs = window.dashboardPageRefs;

if (workflowPageRefs.folderInput && appConfig.defaultScanDir) {
  workflowPageRefs.folderInput.value = appConfig.defaultScanDir;
}

function switchPage(pageName) {
  document.querySelectorAll(".sidebar-link").forEach((button) => {
    const isActive = button.dataset.pageLink === pageName;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });

  document.querySelectorAll(".page-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.page === pageName);
  });

  const activeButton = document.querySelector(`.sidebar-link[data-page-link="${pageName}"]`);
  const activeGroup = activeButton ? activeButton.closest(".sidebar-group") : null;
  if (activeGroup && "open" in activeGroup) {
    activeGroup.open = true;
  }
}

function switchResultView(viewName) {
  state.resultView = viewName === "parts" ? "parts" : "workflow";

  document.querySelectorAll("[data-result-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.resultView === state.resultView);
  });

  document.querySelectorAll("[data-result-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.resultPanel === state.resultView);
  });
}

function setOperationsStatus(message) {
  if (operationsPageRefs.operationsStatusText) {
    operationsPageRefs.operationsStatusText.textContent = message;
  }
}

function setErpStatus(message) {
  if (erpPageRefs.erpStatusText) {
    erpPageRefs.erpStatusText.textContent = message;
  }
}

function setUserWorkspaceStatus(message) {
  if (userWorkspacePageRefs.userWorkspaceStatusText) {
    userWorkspacePageRefs.userWorkspaceStatusText.textContent = message;
  }
}

function setDashboardStatus(message) {
  if (dashboardPageRefs.dashboardStatusText) {
    dashboardPageRefs.dashboardStatusText.textContent = message;
  }
}

function setBulkWorkOrderStatus(message) {
  if (workflowPageRefs.bulkWorkOrderStatusText) {
    workflowPageRefs.bulkWorkOrderStatusText.textContent = message;
  }
}

async function pickFolderForInput(inputId, options = {}) {
  const input = document.getElementById(inputId);
  if (!input) {
    throw new Error("Klasor alanı bulunamadi.");
  }

  const result = await requestJson("/api/system/select-folder", {
    method: "POST",
    body: JSON.stringify({
      initialPath: input.value.trim() || workflowPageRefs.folderInput?.value.trim() || "",
      description: options.description || "Klasor secin",
    }),
  });

  input.value = result.selectedPath || "";

  if (inputId === "folderInput" && operationsPageRefs.projectFolderInput && !operationsPageRefs.projectFolderInput.value.trim()) {
    operationsPageRefs.projectFolderInput.value = input.value.trim();
  }

  return input.value.trim();
}

async function handleFolderPickerAction(actionTarget) {
  const inputId = actionTarget.dataset.targetInput;
  const description = actionTarget.dataset.pickerTitle || "Klasor secin";
  const statusTarget = actionTarget.dataset.statusTarget || "";

  try {
    if (statusTarget === "operations") {
      setOperationsStatus("Klasor secici aciliyor...");
    } else {
      if (workflowPageRefs.statusText) {
        workflowPageRefs.statusText.textContent = "Klasor secici aciliyor...";
      }
    }

    const selectedPath = await pickFolderForInput(inputId, { description });

    if (statusTarget === "operations") {
      setOperationsStatus(`Klasor secildi: ${selectedPath}`);
    } else {
      if (workflowPageRefs.statusText) {
        workflowPageRefs.statusText.textContent = `Klasor secildi: ${selectedPath}`;
      }
    }
  } catch (error) {
    const message = error.message === "Klasor secimi iptal edildi."
      ? "Klasor secimi iptal edildi."
      : `Klasor secilemedi: ${error.message}`;

    if (statusTarget === "operations") {
      setOperationsStatus(message);
    } else {
      if (workflowPageRefs.statusText) {
        workflowPageRefs.statusText.textContent = message;
      }
    }
  }
}

function clearWorkflowView() {
  state.rows = [];
  state.partList = [];
  state.partListBase = [];
  state.scanInsights = null;
  if (workflowPageRefs.searchInput) {
    workflowPageRefs.searchInput.value = "";
  }
  if (workflowPageRefs.partListSearchInput) {
    workflowPageRefs.partListSearchInput.value = "";
  }
  if (workflowPageRefs.stats) {
    workflowPageRefs.stats.innerHTML = "";
  }
  if (workflowPageRefs.resultsBody) {
    workflowPageRefs.resultsBody.innerHTML = "";
  }
  if (workflowPageRefs.partListStats) {
    workflowPageRefs.partListStats.innerHTML = "";
  }
  if (workflowPageRefs.partListCountText) {
    workflowPageRefs.partListCountText.textContent = "0 kalem";
  }
  renderRows([]);
  renderPartList([]);
  renderScanInsights(null);
  renderBulkUploadPreview();
  setBulkWorkOrderStatus("Henüz toplu iş emri oluşturulmadı.");
  if (workflowPageRefs.statusText) {
    workflowPageRefs.statusText.textContent = "Tarama sonuçları sıfırlandı. Yeniden ölçüm için Tara butonunu kullan.";
  }
}

function clearOperationsView() {
  state.operations.projects = [];
  state.operations.selectedProjectId = null;
  state.operations.selectedProject = null;
  state.operations.selectedUserId = null;
  state.operations.departments = [];
  state.operations.users = [];
  state.operations.templates = [];
  state.operations.openJobs = [];
  state.operations.auditEvents = [];
  state.operations.userWorkItems = [];
  state.managerDashboard.dashboards = [];
  renderOperationsSummary();
  renderProjectList();
  renderUserManagement();
  renderOpenJobs();
  renderSelectedProject();
  renderAuditEvents();
  renderUserWorkspace();
  renderManagerDashboard();
  setOperationsStatus("Operasyon görünümü temizlendi. Sayfa açıldığında veriler otomatik gelir.");
}

function clearUserWorkspaceView() {
  state.operations.selectedUserId = "";
  state.operations.userWorkItems = [];
  if (userWorkspacePageRefs.userWorkspaceUserSelect) {
    userWorkspacePageRefs.userWorkspaceUserSelect.value = "";
  }
  renderUserWorkspace();
  setUserWorkspaceStatus("Kullanıcı seçimi temizlendi. Yeni kullanıcı seçildiğinde işler otomatik yüklenir.");
}

function clearErpView() {
  state.erp.workOrders = [];
  state.erp.selectedWorkOrderId = null;
  state.erp.selectedWorkOrder = null;
  state.erp.dispatch = null;
  renderErpSummary();
  renderErpWorkOrderList();
  renderErpDetail();
  setErpStatus("ERP görünümü temizlendi. Sayfa açıldığında veriler otomatik gelir.");
}

function clearFileTypeRulesView() {
  state.fileTypeRules = [];
  renderFileTypeRules();
}

function clearKeywordRulesView() {
  state.keywordRules = [];
  renderKeywordRules();
}

function clearFileNameRulesView() {
  state.fileNameRules = [];
  renderFileNameRules();
}

function clearOverridesView() {
  state.overrides = [];
  state.editingOverrideId = null;
  clearOverrideForm();
  renderOverrides();
}

function createStatCard(label, value, tone = "") {
  return `
    <article class="stat-card ${tone}">
      <span class="muted">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function renderStatusOptions(selectedStatus) {
  return ["pending", "ready", "in_progress", "completed", "skipped"]
    .map((status) => `<option value="${status}" ${status === selectedStatus ? "selected" : ""}>${status}</option>`)
    .join("");
}

function formatAssigneeNames(assigneeIds, fallbackAssignee) {
  const names = assigneeIds
    .map((id) => state.operations.users.find((user) => user.id === id))
    .filter(Boolean)
    .map((user) => user.fullName);

  if (names.length > 0) {
    return names.join(", ");
  }

  return fallbackAssignee || "Atama yok";
}

function summarizeAuditPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return "Ek veri yok.";
  }

  const summary = [];
  if (payload.name) {
    summary.push(`Adım: ${payload.name}`);
  }
  if (payload.status) {
    summary.push(`Durum: ${payload.status}`);
  }
  if (payload.note) {
    summary.push(`Not: ${payload.note}`);
  }
  if (payload.completedBy) {
    summary.push(`Tamamlayan: ${payload.completedBy}`);
  }
  if (payload.handoverTo) {
    summary.push(`Devir: ${payload.handoverTo}`);
  }
  if (payload.reassignmentReason) {
    summary.push(`Düzeltme nedeni: ${payload.reassignmentReason}`);
  }
  if (Array.isArray(payload.previousAssigneeIds) && payload.previousAssigneeIds.length > 0) {
    summary.push(`Önceki sorumlular: ${payload.previousAssigneeIds.length} kişi`);
  }
  if (Array.isArray(payload.updatedAssigneeIds) && payload.updatedAssigneeIds.length > 0) {
    summary.push(`Yeni sorumlular: ${payload.updatedAssigneeIds.length} kişi`);
  }
  if (summary.length === 0) {
    return JSON.stringify(payload).slice(0, 180);
  }
  return summary.join(" | ");
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("tr-TR");
}

function formatTaskStatus(status) {
  if (status === "ready") {
    return "Hazır";
  }

  if (status === "in_progress") {
    return "İşlemde";
  }

  if (status === "completed") {
    return "Tamamlandı";
  }

  if (status === "pending") {
    return "Bekliyor";
  }

  if (status === "skipped") {
    return "Atlandı";
  }

  return status || "-";
}

async function requestJson(url, options = {}) {
  const response = await apiClient.apiFetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const rawText = await response.text();
  const data = tryParseJson(rawText);
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, rawText));
  }

  return data ?? [];
}

async function readErrorResponse(response) {
  const rawText = await response.text();
  const data = tryParseJson(rawText);
  return extractErrorMessage(data, rawText);
}

function tryParseJson(rawText) {
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    return null;
  }
}

function extractErrorMessage(data, rawText) {
  if (data && typeof data === "object") {
    return data.detail || data.error || JSON.stringify(data);
  }

  if (rawText && rawText.trim()) {
    return rawText.trim();
  }

  return "Bilinmeyen hata";
}

function buildSummaryFromRows(rows) {
  const summary = {
    totalFiles: rows.length,
    assignedFiles: rows.filter((row) => row.confidence !== "Belirsiz").length,
    uncertainFiles: rows.filter((row) => row.confidence === "Belirsiz").length,
    byProcess: {},
    byFileType: {},
    byServiceType: {},
  };

  for (const row of rows) {
    summary.byProcess[row.suggestedProcess] = (summary.byProcess[row.suggestedProcess] || 0) + 1;
    summary.byFileType[row.fileType] = (summary.byFileType[row.fileType] || 0) + 1;
    summary.byServiceType[row.serviceType] = (summary.byServiceType[row.serviceType] || 0) + 1;
  }

  return summary;
}

function canCreateWorkflowFromPart(item) {
  const process = String(item?.suggestedProcess || "").trim();
  const serviceType = String(item?.serviceType || "").trim();

  if (!process || process === "Belirsiz") {
    return false;
  }

  if (process === "Satin Alma" || serviceType.includes("Tedarigi")) {
    return true;
  }

  if (process === "Dis Hizmet" || serviceType.includes("Dis Hizmet") || serviceType.includes("Kesim")) {
    return true;
  }

  if (["Imalat", "Bukum", "Profil", "Torna/Freze", "Montaj", "Elektrik"].includes(process)) {
    return true;
  }

  return false;
}

function clonePartList(partList) {
  return JSON.parse(JSON.stringify(Array.isArray(partList) ? partList : []));
}

function getSelectedValues(select) {
  return Array.from(select.selectedOptions).map((option) => option.value).filter(Boolean);
}

function getUserNameById(userId) {
  return state.operations.users.find((user) => user.id === userId)?.fullName || "";
}

function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function escapeCsvCell(value) {
  const text = String(value || "");
  if (/[;"\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}
