const state = {
  rows: [],
  fileTypeRules: [],
  keywordRules: [],
  overrides: [],
  editingOverrideId: null,
  operations: {
    projects: [],
    selectedProjectId: null,
    selectedProject: null,
    departments: [],
    users: [],
    templates: [],
    openJobs: [],
    auditEvents: [],
  },
};

const folderInput = document.getElementById("folderInput");
const scanButton = document.getElementById("scanButton");
const statusText = document.getElementById("statusText");
const stats = document.getElementById("stats");
const searchInput = document.getElementById("searchInput");
const resultsBody = document.getElementById("resultsBody");
const fileTypeRulesBody = document.getElementById("fileTypeRulesBody");
const keywordRulesBody = document.getElementById("keywordRulesBody");
const overrideRulesBody = document.getElementById("overrideRulesBody");
const overrideForm = document.getElementById("overrideForm");
const overrideMatchMode = document.getElementById("overrideMatchMode");
const overridePartCode = document.getElementById("overridePartCode");
const overrideFileName = document.getElementById("overrideFileName");
const overrideProcess = document.getElementById("overrideProcess");
const overrideServiceType = document.getElementById("overrideServiceType");
const overrideNote = document.getElementById("overrideNote");

const operationsStatusText = document.getElementById("operationsStatusText");
const projectList = document.getElementById("projectList");
const projectCountText = document.getElementById("projectCountText");
const operationsSummary = document.getElementById("operationsSummary");
const selectedProjectPanel = document.getElementById("selectedProjectPanel");
const openJobsList = document.getElementById("openJobsList");
const auditEventList = document.getElementById("auditEventList");
const refreshOperationsButton = document.getElementById("refreshOperationsButton");
const projectCreateForm = document.getElementById("projectCreateForm");
const projectCodeInput = document.getElementById("projectCodeInput");
const projectNameInput = document.getElementById("projectNameInput");
const projectDescriptionInput = document.getElementById("projectDescriptionInput");
const projectFolderInput = document.getElementById("projectFolderInput");
const userCreateForm = document.getElementById("userCreateForm");
const userFullNameInput = document.getElementById("userFullNameInput");
const userEmailInput = document.getElementById("userEmailInput");
const userDepartmentSelect = document.getElementById("userDepartmentSelect");
const userDirectory = document.getElementById("userDirectory");

function switchTab(tabName) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });

  if (tabName === "operations") {
    loadOperationsData();
  }

  if (tabName === "file-types") {
    loadFileTypeRules();
  }

  if (tabName === "keywords") {
    loadKeywordRules();
  }

  if (tabName === "overrides") {
    loadOverrides();
  }
}

function setOperationsStatus(message) {
  operationsStatusText.textContent = message;
}

function createStatCard(label, value, tone = "") {
  return `
    <article class="stat-card ${tone}">
      <span class="muted">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function renderStats(summary) {
  const topProcesses = Object.entries(summary.byProcess)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ");

  const topServices = Object.entries(summary.byServiceType)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ");

  stats.innerHTML = [
    createStatCard("Toplam dosya", summary.totalFiles),
    createStatCard("Surec atanmis", summary.assignedFiles),
    createStatCard("Belirsiz", summary.uncertainFiles, "warning"),
    createStatCard("Surecler", topProcesses || "-"),
    createStatCard("Hizmetler", topServices || "-"),
  ].join("");
}

function renderRows(rows) {
  resultsBody.innerHTML = rows.map((row) => {
    const badgeClass = row.confidence === "Belirsiz" ? "warn" : "good";
    return `
      <tr>
        <td>${escapeHtml(row.partCode || "-")}</td>
        <td>
          <div class="cell-stack">
            <strong>${escapeHtml(row.fileName)}</strong>
            <span class="muted">${escapeHtml(row.folder)}</span>
          </div>
        </td>
        <td>${escapeHtml(row.fileType)}</td>
        <td>${escapeHtml(row.mainGroup || "-")}</td>
        <td>${escapeHtml(row.suggestedProcess)}</td>
        <td>${escapeHtml(row.serviceType)}</td>
        <td><span class="badge ${badgeClass}">${escapeHtml(row.confidence)}</span></td>
        <td>
          <button class="link-button" data-action="prefill-override" data-part-code="${escapeAttribute(row.partCode || "")}" data-file-name="${escapeAttribute(row.fileName)}" data-process="${escapeAttribute(row.suggestedProcess)}" data-service-type="${escapeAttribute(row.serviceType)}">
            Override
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function filteredRows() {
  const query = searchInput.value.trim().toLocaleLowerCase("tr");
  if (!query) {
    return state.rows;
  }

  return state.rows.filter((row) => {
    const haystack = [
      row.partCode,
      row.fileName,
      row.fileType,
      row.mainGroup,
      row.suggestedProcess,
      row.serviceType,
      row.folder,
    ].join(" ").toLocaleLowerCase("tr");

    return haystack.includes(query);
  });
}

function renderFileTypeRules() {
  if (state.fileTypeRules.length === 0) {
    fileTypeRulesBody.innerHTML = `
      <tr>
        <td colspan="5" class="muted">Dosya tipi kurali yuklenemedi veya bos geldi. Kaydetmeden once Yenile icin sayfayi tekrar ac ya da sunucuyu kontrol et.</td>
      </tr>
    `;
    return;
  }

  fileTypeRulesBody.innerHTML = state.fileTypeRules.map((rule, index) => `
    <tr>
      <td><input class="inline-input" data-entity="fileTypeRule" data-index="${index}" data-field="extension" value="${escapeAttribute(rule.extension)}" /></td>
      <td><input class="inline-input" data-entity="fileTypeRule" data-index="${index}" data-field="displayName" value="${escapeAttribute(rule.displayName)}" /></td>
      <td><input class="inline-input" data-entity="fileTypeRule" data-index="${index}" data-field="defaultProcess" value="${escapeAttribute(rule.defaultProcess)}" /></td>
      <td><input class="inline-input" data-entity="fileTypeRule" data-index="${index}" data-field="defaultServiceType" value="${escapeAttribute(rule.defaultServiceType)}" /></td>
      <td class="boolean-cell"><input type="checkbox" data-entity="fileTypeRule" data-index="${index}" data-field="isActive" ${rule.isActive ? "checked" : ""} /></td>
    </tr>
  `).join("");
}

function renderKeywordRules() {
  if (state.keywordRules.length === 0) {
    keywordRulesBody.innerHTML = `
      <tr>
        <td colspan="5" class="muted">Keyword kurali yuklenemedi veya bos geldi.</td>
      </tr>
    `;
    return;
  }

  keywordRulesBody.innerHTML = state.keywordRules.map((rule, index) => `
    <tr>
      <td><input class="inline-input" data-entity="keywordRule" data-index="${index}" data-field="keyword" value="${escapeAttribute(rule.keyword)}" /></td>
      <td><input class="inline-input" data-entity="keywordRule" data-index="${index}" data-field="process" value="${escapeAttribute(rule.process)}" /></td>
      <td><input class="inline-input" data-entity="keywordRule" data-index="${index}" data-field="serviceType" value="${escapeAttribute(rule.serviceType)}" /></td>
      <td>
        <select class="inline-input" data-entity="keywordRule" data-index="${index}" data-field="matchTarget">
          <option value="fileName" ${rule.matchTarget === "fileName" ? "selected" : ""}>Dosya Adi</option>
          <option value="path" ${rule.matchTarget === "path" ? "selected" : ""}>Yol</option>
        </select>
      </td>
      <td class="boolean-cell"><input type="checkbox" data-entity="keywordRule" data-index="${index}" data-field="isActive" ${rule.isActive ? "checked" : ""} /></td>
    </tr>
  `).join("");
}

function renderOverrides() {
  if (state.overrides.length === 0) {
    overrideRulesBody.innerHTML = `
      <tr>
        <td colspan="8" class="muted">Kayitli override yok.</td>
      </tr>
    `;
    return;
  }

  overrideRulesBody.innerHTML = state.overrides.map((override, index) => `
    <tr>
      <td>${escapeHtml(override.matchMode === "fileName" ? "Dosya Adi" : "Parca Kodu")}</td>
      <td>${escapeHtml(override.matchMode === "fileName" ? override.fileName : override.partCode)}</td>
      <td>${escapeHtml(override.process)}</td>
      <td>${escapeHtml(override.serviceType)}</td>
      <td>${escapeHtml(override.note || "-")}</td>
      <td class="boolean-cell"><input type="checkbox" data-entity="override" data-index="${index}" data-field="isActive" ${override.isActive ? "checked" : ""} /></td>
      <td><button class="secondary link-button" data-action="edit-override" data-index="${index}">Duzenle</button></td>
      <td><button class="secondary link-button" data-action="delete-override" data-index="${index}">Sil</button></td>
    </tr>
  `).join("");
}

function renderOperationsSummary() {
  const users = state.operations.users.filter((user) => user.isActive);
  const projects = state.operations.projects;
  const totalWorkflows = projects.reduce((accumulator, project) => accumulator + (project.progress?.totalInstances || 0), 0);
  const totalSteps = projects.reduce((accumulator, project) => accumulator + (project.progress?.totalSteps || 0), 0);
  const completedSteps = projects.reduce((accumulator, project) => accumulator + (project.progress?.completedSteps || 0), 0);
  const overallPercentage = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

  operationsSummary.innerHTML = [
    createStatCard("Aktif proje", String(projects.length)),
    createStatCard("Aktif kullanici", String(users.length)),
    createStatCard("Workflow", String(totalWorkflows)),
    createStatCard("Tamamlanan adim", `${completedSteps}/${totalSteps}`),
    createStatCard("Genel ilerleme", `%${overallPercentage}`, overallPercentage < 50 ? "warning" : ""),
    createStatCard("Acik is", String(state.operations.openJobs.length), state.operations.openJobs.length > 0 ? "warning" : ""),
  ].join("");
}

function renderProjectList() {
  const selectedProjectId = state.operations.selectedProjectId;
  projectCountText.textContent = `${state.operations.projects.length} proje`;

  if (state.operations.projects.length === 0) {
    projectList.innerHTML = `<div class="empty-state">Henuz proje yok. Soldaki formdan ilk projeyi olustur.</div>`;
    return;
  }

  projectList.innerHTML = state.operations.projects.map((project) => `
    <button class="project-card ${project.id === selectedProjectId ? "active" : ""}" data-action="select-project" data-project-id="${project.id}">
      <div class="cell-stack">
        <strong>${escapeHtml(project.code)} - ${escapeHtml(project.name)}</strong>
        <span class="muted">${escapeHtml(project.description || "Aciklama yok")}</span>
      </div>
      <div class="project-card-meta">
        <span class="badge ${project.progress?.completionPercentage >= 100 ? "good" : "warn"}">%${project.progress?.completionPercentage || 0}</span>
        <span class="muted">${project.progress?.totalInstances || 0} akis</span>
      </div>
    </button>
  `).join("");
}

function renderUserManagement() {
  const departmentOptions = state.operations.departments.map((department) => `
    <option value="${escapeAttribute(department.id)}">${escapeHtml(department.name)}</option>
  `).join("");

  userDepartmentSelect.innerHTML = departmentOptions || `<option value="">Departman bulunamadi</option>`;

  if (state.operations.departments.length === 0) {
    userDirectory.innerHTML = `<div class="empty-state">Departman verisi bulunamadi.</div>`;
    return;
  }

  userDirectory.innerHTML = state.operations.departments.map((department) => {
    const users = state.operations.users.filter((user) => user.departmentId === department.id);
    return `
      <section class="dept-card">
        <div class="table-header">
          <strong>${escapeHtml(department.name)}</strong>
          <span class="muted">${users.length} kisi</span>
        </div>
        ${users.length === 0 ? `<p class="muted">Bu departmanda kullanici yok.</p>` : users.map((user) => `
          <div class="user-row">
            <div class="cell-stack">
              <strong>${escapeHtml(user.fullName)}</strong>
              <span class="muted">${escapeHtml(user.email || "E-posta yok")}</span>
            </div>
            <div class="inline-actions">
              <span class="badge ${user.isActive ? "good" : "warn"}">${user.isActive ? "Aktif" : "Pasif"}</span>
              ${user.isActive ? `<button class="secondary link-button" data-action="deactivate-user" data-user-id="${user.id}">Sil</button>` : ""}
            </div>
          </div>
        `).join("")}
      </section>
    `;
  }).join("");
}

function renderOpenJobs() {
  const selectedProjectId = state.operations.selectedProjectId;
  const jobs = selectedProjectId
    ? state.operations.openJobs.filter((job) => job.projectId === selectedProjectId)
    : state.operations.openJobs;

  if (jobs.length === 0) {
    openJobsList.innerHTML = `<div class="empty-state">Acik is bulunmuyor.</div>`;
    return;
  }

  openJobsList.innerHTML = jobs.map((job) => `
    <article class="feed-card">
      <div class="table-header">
        <strong>${escapeHtml(job.title)}</strong>
        <span class="badge warn">${escapeHtml(job.status)}</span>
      </div>
      <p>${escapeHtml(job.description || "Aciklama yok")}</p>
      <p class="muted">Kaynak: ${escapeHtml(job.sourceType)} | Sira: ${escapeHtml(job.payload?.sequenceNo || "-")}</p>
      <p class="muted">Olusturulma: ${formatDate(job.createdAt)}</p>
    </article>
  `).join("");
}

function renderAuditEvents() {
  if (!state.operations.selectedProjectId) {
    auditEventList.innerHTML = `<div class="empty-state">Audit akisini gormek icin bir proje sec.</div>`;
    return;
  }

  if (state.operations.auditEvents.length === 0) {
    auditEventList.innerHTML = `<div class="empty-state">Secili proje icin audit kaydi yok.</div>`;
    return;
  }

  auditEventList.innerHTML = state.operations.auditEvents.slice(0, 6).map((event) => `
    <article class="feed-card">
      <div class="table-header">
        <strong>${escapeHtml(event.action)}</strong>
        <span class="muted">${escapeHtml(event.entityType)}</span>
      </div>
      <p class="muted">${formatDate(event.createdAt)}</p>
      <p>${escapeHtml(summarizeAuditPayload(event.payload))}</p>
    </article>
  `).join("");
}

function renderSelectedProject() {
  const dashboard = state.operations.selectedProject;
  if (!dashboard) {
    selectedProjectPanel.innerHTML = `Yonetim ekranini acmak icin soldan bir proje sec.`;
    return;
  }

  const project = dashboard.project;
  const progress = dashboard.progress;
  const currentFolderSuggestion = folderInput.value.trim();

  selectedProjectPanel.innerHTML = `
    <div class="selected-project-header">
      <div>
        <p class="eyebrow">${escapeHtml(project.code)}</p>
        <h3>${escapeHtml(project.name)}</h3>
        <p class="muted">${escapeHtml(project.description || "Aciklama girilmemis")}</p>
      </div>
      <div class="project-progress-card">
        <strong>%${progress.completionPercentage}</strong>
        <span class="muted">${progress.completedSteps}/${progress.totalSteps} adim tamamlandi</span>
      </div>
    </div>

    <div class="inline-actions top-export-actions">
      <span class="muted">Raporlar: workflow, adim, acik is ve audit kayitlari tek dosyada.</span>
      <div class="inline-actions">
        <button class="secondary" data-action="download-operations-report" data-format="xlsx">Excel Indir</button>
        <button class="secondary" data-action="download-operations-report" data-format="csv">CSV Indir</button>
        <button class="secondary" data-action="download-operations-report" data-format="pdf">PDF Indir</button>
      </div>
    </div>

    <div class="progress-rail">
      <div class="progress-rail-fill" style="width:${progress.completionPercentage}%"></div>
    </div>

    <div class="project-actions-grid">
      <form id="workflowCreateForm" class="embedded-form">
        <h4>Template ile workflow ekle</h4>
        <div class="inline-grid">
          <select id="workflowTemplateSelect" required>${renderTemplateOptions()}</select>
          <input id="workflowInstanceNameInput" type="text" placeholder="Workflow adi" />
          <input id="workflowItemLabelInput" type="text" placeholder="Kalem / Parca grubu" />
          <input id="workflowItemCountInput" type="number" min="1" value="1" />
        </div>
        <button type="submit">Workflow Olustur</button>
      </form>

      <form id="projectBootstrapForm" class="embedded-form">
        <h4>Klasorden otomatik workflow uret</h4>
        <div class="inline-grid">
          <input id="bootstrapFolderPathInput" type="text" value="${escapeAttribute(currentFolderSuggestion)}" placeholder="Proje klasor yolu" />
        </div>
        <button type="submit" class="secondary">Klasorden Uret</button>
      </form>
    </div>

    <div class="workflow-stack">
      ${dashboard.workflows.length === 0 ? `<div class="empty-state">Bu projede henuz workflow yok. Template secip ekleyebilir ya da klasorden otomatik uretebilirsin.</div>` : dashboard.workflows.map(renderWorkflowCard).join("")}
    </div>
  `;
}

function renderWorkflowCard(instance) {
  const canAdvance = Boolean(instance.currentStep);

  return `
    <article class="workflow-card">
      <div class="table-header">
        <div>
          <h4>${escapeHtml(instance.name)}</h4>
          <p class="muted">${escapeHtml(instance.itemLabel || instance.templateName || "Genel akis")} | ${instance.steps.length} adim</p>
        </div>
        <div class="workflow-meta">
          <span class="badge ${instance.status === "completed" ? "good" : "warn"}">${escapeHtml(instance.status)}</span>
          <strong>%${instance.progressPercent}</strong>
        </div>
      </div>

      <div class="progress-rail slim">
        <div class="progress-rail-fill" style="width:${instance.progressPercent}%"></div>
      </div>

      <div class="advance-panel">
        <div class="cell-stack">
          <strong>Siradaki aktif adim</strong>
          <span class="muted">${escapeHtml(instance.currentStep ? `${instance.currentStep.sequenceNo}. ${instance.currentStep.name}` : "Tum adimlar tamamlandi")}</span>
        </div>
        <div class="advance-grid" data-instance-id="${instance.id}">
          <select data-role="completed-by">
            <option value="">Tamamlayan kisi</option>
            ${renderUserOptions()}
          </select>
          <select data-role="next-assignees" multiple size="3">
            ${renderUserOptions(true)}
          </select>
          <input data-role="advance-note" type="text" placeholder="Not veya devir aciklamasi" />
          <button ${canAdvance ? "" : "disabled"} data-action="advance-instance" data-instance-id="${instance.id}">Siradaki Adima Gec</button>
        </div>
      </div>

      <div class="table-wrap">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Sira</th>
              <th>Adim</th>
              <th>Atananlar</th>
              <th>Durum</th>
              <th>Opsiyonel</th>
              <th>Not</th>
              <th>Kaydet</th>
              <th>Sil</th>
            </tr>
          </thead>
          <tbody>
            ${instance.steps.map((step) => renderStepRow(instance, step)).join("")}
          </tbody>
        </table>
      </div>

      <form class="add-step-form" data-instance-id="${instance.id}">
        <h5>Yeni adim ekle</h5>
        <div class="inline-grid">
          <input data-role="new-step-name" type="text" placeholder="Adim adi" required />
          <input data-role="new-step-description" type="text" placeholder="Aciklama" />
          <input data-role="new-step-sequence" type="number" min="1" value="${instance.steps.length + 1}" />
          <select data-role="new-step-status">
            ${renderStatusOptions("pending")}
          </select>
          <select data-role="new-step-assignees" multiple size="3">
            ${renderUserOptions(true)}
          </select>
          <label class="checkbox-inline">
            <input data-role="new-step-optional" type="checkbox" />
            Opsiyonel
          </label>
        </div>
        <button type="submit" class="secondary">Adim Ekle</button>
      </form>
    </article>
  `;
}

function renderStepRow(instance, step) {
  return `
    <tr data-step-id="${step.id}" data-instance-id="${instance.id}">
      <td>${step.sequenceNo}</td>
      <td>
        <div class="cell-stack">
          <input class="inline-input" data-role="step-name" value="${escapeAttribute(step.name)}" />
          <input class="inline-input" data-role="step-description" value="${escapeAttribute(step.description || "")}" placeholder="Aciklama" />
        </div>
      </td>
      <td>
        <div class="cell-stack">
          <select class="inline-input multi" data-role="step-assignees" multiple size="3">
            ${renderUserOptions(true, step.assigneeIds)}
          </select>
          <span class="muted">${escapeHtml(formatAssigneeNames(step.assigneeIds, step.assignee))}</span>
        </div>
      </td>
      <td>
        <select class="inline-input" data-role="step-status">
          ${renderStatusOptions(step.status)}
        </select>
      </td>
      <td class="boolean-cell">
        <label class="checkbox-inline">
          <input data-role="step-optional" type="checkbox" ${step.isOptional ? "checked" : ""} />
          Evet
        </label>
      </td>
      <td>
        <div class="cell-stack">
          <input class="inline-input" data-role="step-note" value="${escapeAttribute(step.completionNote || "")}" placeholder="Not" />
          <span class="muted">${escapeHtml(step.approvedBy ? `Onay: ${step.approvedBy}` : step.completedAt ? "Tamamlandi" : "-")}</span>
        </div>
      </td>
      <td><button class="secondary link-button" data-action="save-step" data-step-id="${step.id}">Kaydet</button></td>
      <td><button class="secondary link-button" data-action="delete-step" data-step-id="${step.id}">Sil</button></td>
    </tr>
  `;
}

function renderTemplateOptions() {
  if (state.operations.templates.length === 0) {
    return `<option value="">Template bulunamadi</option>`;
  }

  return state.operations.templates.map((template) => `
    <option value="${escapeAttribute(template.id)}">${escapeHtml(template.name)}</option>
  `).join("");
}

function renderUserOptions(includeInactive = false, selectedIds = []) {
  const selectedIdSet = new Set(Array.isArray(selectedIds) ? selectedIds : []);
  return state.operations.users
    .filter((user) => includeInactive || user.isActive)
    .map((user) => `
      <option value="${escapeAttribute(user.id)}" ${selectedIdSet.has(user.id) ? "selected" : ""}>
        ${escapeHtml(user.fullName)}${user.departmentName ? ` - ${escapeHtml(user.departmentName)}` : ""}
      </option>
    `)
    .join("");
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
    summary.push(`Adim: ${payload.name}`);
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

async function loadInitialData() {
  const results = await Promise.allSettled([
    loadFileTypeRules(),
    loadKeywordRules(),
    loadOverrides(),
    loadOperationsData(),
  ]);

  const labels = ["Dosya tipleri", "Keyword kurallari", "Parca kurallari", "Operasyon verileri"];
  const failedLoads = results
    .map((result, index) => ({ result, index }))
    .filter(({ result }) => result.status === "rejected")
    .map(({ index }) => labels[index]);

  if (failedLoads.length > 0) {
    statusText.textContent = `${failedLoads.join(", ")} yuklenemedi. Sunucuyu kontrol edip sayfayi yenileyebilirsin.`;
  }
}

async function loadFileTypeRules() {
  state.fileTypeRules = await requestJson("/api/config/file-types");
  renderFileTypeRules();
  return state.fileTypeRules;
}

async function loadKeywordRules() {
  state.keywordRules = await requestJson("/api/config/keyword-rules");
  renderKeywordRules();
  return state.keywordRules;
}

async function loadOverrides() {
  state.overrides = await requestJson("/api/config/part-overrides");
  renderOverrides();
  return state.overrides;
}

async function loadOperationsData() {
  setOperationsStatus("Operasyon verileri yukleniyor...");

  const [projects, userData, templates, openJobs] = await Promise.all([
    requestJson("/api/operations/projects"),
    requestJson("/api/operations/users"),
    requestJson("/api/operations/workflow-templates"),
    requestJson("/api/operations/open-jobs"),
  ]);

  state.operations.projects = projects;
  state.operations.departments = userData.departments;
  state.operations.users = userData.users;
  state.operations.templates = templates;
  state.operations.openJobs = openJobs;

  const stillExists = state.operations.projects.some((project) => project.id === state.operations.selectedProjectId);
  if (!stillExists) {
    state.operations.selectedProjectId = state.operations.projects[0]?.id || null;
  }

  renderOperationsSummary();
  renderProjectList();
  renderUserManagement();
  renderOpenJobs();

  if (state.operations.selectedProjectId) {
    await loadSelectedProject(state.operations.selectedProjectId, { silent: true });
  } else {
    state.operations.selectedProject = null;
    state.operations.auditEvents = [];
    renderSelectedProject();
    renderAuditEvents();
  }

  setOperationsStatus("Operasyon merkezi guncel.");
}

async function loadSelectedProject(projectId, options = {}) {
  state.operations.selectedProjectId = projectId;
  renderProjectList();

  if (!options.silent) {
    setOperationsStatus("Proje paneli yukleniyor...");
  }

  const [dashboard, auditEvents] = await Promise.all([
    requestJson(`/api/operations/projects/${encodeURIComponent(projectId)}`),
    requestJson(`/api/operations/projects/${encodeURIComponent(projectId)}/audit-events`),
  ]);

  state.operations.selectedProject = dashboard;
  state.operations.auditEvents = auditEvents;
  renderSelectedProject();
  renderAuditEvents();
  renderOpenJobs();

  if (!options.silent) {
    setOperationsStatus(`${dashboard.project.code} operasyon paneli acildi.`);
  }
}

async function scanFolder() {
  if (window.location.protocol === "file:") {
    statusText.textContent = "Bu ekran dogrudan dosya olarak acilmis. Lutfen BASLAT.bat veya npm start ile sunucuyu baslat.";
    return;
  }

  scanButton.disabled = true;
  statusText.textContent = "Tarama baslatildi...";

  try {
    const folder = folderInput.value.trim();
    const response = await requestJson(`/api/scan?folder=${encodeURIComponent(folder)}`);
    state.rows = response.rows;
    renderStats(response.summary);
    renderRows(filteredRows());
    statusText.textContent = `${response.scannedFolder} klasoru tarandi. ${response.rows.length} dosya bulundu.`;
  } catch (error) {
    stats.innerHTML = "";
    resultsBody.innerHTML = "";
    statusText.textContent = `Hata: ${error.message}. Sunucunun http://127.0.0.1:3000 uzerinde calistigindan emin ol.`;
  } finally {
    scanButton.disabled = false;
  }
}

async function saveFileTypeRules() {
  state.fileTypeRules = await requestJson("/api/config/file-types", {
    method: "PUT",
    body: JSON.stringify(state.fileTypeRules),
  });

  renderFileTypeRules();
  await scanFolder();
  statusText.textContent = "Dosya tipi kurallari kaydedildi ve tarama yenilendi.";
}

async function saveKeywordRules() {
  state.keywordRules = await requestJson("/api/config/keyword-rules", {
    method: "PUT",
    body: JSON.stringify(state.keywordRules),
  });

  renderKeywordRules();
  statusText.textContent = "Keyword kurallari kaydedildi.";
  await scanFolder();
}

async function saveOverrides() {
  const draftConsumed = maybePersistDraftOverride();
  if (draftConsumed === null) {
    return;
  }

  state.overrides = await requestJson("/api/config/part-overrides", {
    method: "PUT",
    body: JSON.stringify(state.overrides),
  });

  renderOverrides();
  clearOverrideForm();
  await scanFolder();
  statusText.textContent = draftConsumed
    ? "Parca override kurallari kaydedildi. Formdaki taslak da uygulandi ve tarama yenilendi."
    : "Parca override kurallari kaydedildi ve tarama yenilendi.";
}

function appendNewFileTypeRule() {
  state.fileTypeRules.push({
    extension: ".NEW",
    displayName: "Yeni Tip",
    defaultProcess: "Belirsiz",
    defaultServiceType: "Belirsiz",
    isActive: true,
  });

  renderFileTypeRules();
}

function clearOverrideForm() {
  state.editingOverrideId = null;
  overrideMatchMode.value = "partCode";
  overridePartCode.value = "";
  overrideFileName.value = "";
  overrideProcess.value = "";
  overrideServiceType.value = "";
  overrideNote.value = "";
}

function prefillOverrideForm(payload) {
  switchTab("overrides");
  state.editingOverrideId = payload.id || null;
  overrideMatchMode.value = payload.partCode ? "partCode" : "fileName";
  overridePartCode.value = payload.partCode || "";
  overrideFileName.value = payload.fileName || "";
  overrideProcess.value = payload.process || "";
  overrideServiceType.value = payload.serviceType || "";
  overrideNote.value = payload.note || "";
  overridePartCode.focus();
}

function createOverrideFromForm() {
  const matchMode = overrideMatchMode.value;
  return {
    id: state.editingOverrideId,
    matchMode,
    partCode: overridePartCode.value.trim(),
    fileName: overrideFileName.value.trim(),
    process: overrideProcess.value.trim(),
    serviceType: overrideServiceType.value.trim(),
    note: overrideNote.value.trim(),
    isActive: true,
  };
}

function upsertOverrideFromForm() {
  const nextOverride = createOverrideFromForm();

  if (!nextOverride.process || !nextOverride.serviceType) {
    statusText.textContent = "Override kaydi icin surec ve hizmet alanlari gerekli.";
    return false;
  }

  if (nextOverride.matchMode === "partCode" && !nextOverride.partCode) {
    statusText.textContent = "Parca kodu eslesmesi icin parca kodu gir.";
    return false;
  }

  if (nextOverride.matchMode === "fileName" && !nextOverride.fileName) {
    statusText.textContent = "Dosya adi eslesmesi icin dosya adi gir.";
    return false;
  }

  const existingIndex = state.overrides.findIndex((item) => item.id && item.id === state.editingOverrideId);
  if (existingIndex >= 0) {
    state.overrides[existingIndex] = { ...state.overrides[existingIndex], ...nextOverride };
  } else {
    state.overrides.unshift(nextOverride);
  }

  renderOverrides();
  clearOverrideForm();
  statusText.textContent = "Override kaydi listeye eklendi. Kalici olmasi icin Override Kaydet butonuna bas.";
  return true;
}

function hasDraftOverride() {
  return Boolean(
    overridePartCode.value.trim()
    || overrideFileName.value.trim()
    || overrideProcess.value.trim()
    || overrideServiceType.value.trim()
    || overrideNote.value.trim(),
  );
}

function maybePersistDraftOverride() {
  if (!hasDraftOverride()) {
    return false;
  }

  return upsertOverrideFromForm() ? true : null;
}

function handleTableInput(event) {
  const { entity, index, field } = event.target.dataset;
  if (entity !== "fileTypeRule" && entity !== "keywordRule") {
    return;
  }

  const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
  const collection = entity === "fileTypeRule" ? state.fileTypeRules : state.keywordRules;
  collection[Number(index)][field] = value;
}

function handleOverrideTableInput(event) {
  const { entity, index, field } = event.target.dataset;
  if (entity !== "override") {
    return;
  }

  const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
  state.overrides[Number(index)][field] = value;
}

function handleBodyClick(event) {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    return;
  }

  const { action } = actionTarget.dataset;

  if (action === "delete-override") {
    state.overrides.splice(Number(actionTarget.dataset.index), 1);
    renderOverrides();
    return;
  }

  if (action === "edit-override") {
    const selectedOverride = state.overrides[Number(actionTarget.dataset.index)];
    prefillOverrideForm(selectedOverride);
    return;
  }

  if (action === "prefill-override") {
    prefillOverrideForm({
      partCode: actionTarget.dataset.partCode,
      fileName: actionTarget.dataset.fileName,
      process: actionTarget.dataset.process,
      serviceType: actionTarget.dataset.serviceType,
    });
  }
}

async function handleOperationsClick(event) {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    return;
  }

  const { action } = actionTarget.dataset;

  try {
    if (action === "select-project") {
      await loadSelectedProject(actionTarget.dataset.projectId);
      return;
    }

    if (action === "deactivate-user") {
      await requestJson(`/api/operations/users/${encodeURIComponent(actionTarget.dataset.userId)}`, {
        method: "DELETE",
      });
      await loadOperationsData();
      setOperationsStatus("Kullanici pasife alindi.");
      return;
    }

    if (action === "save-step") {
      await saveStepFromRow(actionTarget.closest("tr"));
      return;
    }

    if (action === "delete-step") {
      await requestJson(`/api/operations/workflow-instance-steps/${encodeURIComponent(actionTarget.dataset.stepId)}`, {
        method: "DELETE",
      });
      await refreshSelectedProject();
      setOperationsStatus("Adim silindi ve Acik Isler alanina aktarildi.");
      return;
    }

    if (action === "advance-instance") {
      const container = actionTarget.closest(".advance-grid");
      await advanceInstance(container, actionTarget.dataset.instanceId);
      return;
    }

    if (action === "download-operations-report") {
      await downloadOperationsReport(actionTarget.dataset.format);
    }
  } catch (error) {
    setOperationsStatus(`Islem hatasi: ${error.message}`);
  }
}

async function saveStepFromRow(row) {
  const stepId = row.dataset.stepId;
  const payload = {
    name: row.querySelector('[data-role="step-name"]').value.trim(),
    description: row.querySelector('[data-role="step-description"]').value.trim(),
    assigneeIds: getSelectedValues(row.querySelector('[data-role="step-assignees"]')),
    status: row.querySelector('[data-role="step-status"]').value,
    isOptional: row.querySelector('[data-role="step-optional"]').checked,
    note: row.querySelector('[data-role="step-note"]').value.trim(),
  };

  await requestJson(`/api/operations/workflow-instance-steps/${encodeURIComponent(stepId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  await refreshSelectedProject();
  setOperationsStatus("Adim bilgisi guncellendi.");
}

async function advanceInstance(container, instanceId) {
  const completedById = container.querySelector('[data-role="completed-by"]').value;
  const nextAssigneeIds = getSelectedValues(container.querySelector('[data-role="next-assignees"]'));
  const note = container.querySelector('[data-role="advance-note"]').value.trim();
  const completedBy = getUserNameById(completedById);
  const handoverTo = nextAssigneeIds.map(getUserNameById).filter(Boolean).join(", ");

  await requestJson(`/api/operations/workflow-instances/${encodeURIComponent(instanceId)}/advance`, {
    method: "POST",
    body: JSON.stringify({
      completedBy,
      note,
      handoverTo,
      nextAssigneeIds,
    }),
  });

  await refreshSelectedProject();
  setOperationsStatus("Aktif adim tamamlandi ve bir sonraki adim devreye alindi.");
}

async function downloadOperationsReport(format) {
  const projectId = state.operations.selectedProjectId;
  if (!projectId) {
    setOperationsStatus("Rapor icin once bir proje sec.");
    return;
  }

  setOperationsStatus(`${format.toUpperCase()} raporu hazirlaniyor...`);

  const response = await fetch(`/api/operations/projects/${encodeURIComponent(projectId)}/report.${format}`);
  if (!response.ok) {
    throw new Error(await readErrorResponse(response));
  }

  const contentDisposition = response.headers.get("Content-Disposition") || "";
  const match = contentDisposition.match(/filename=\"([^\"]+)\"/);
  const fileName = match ? match[1] : `operations-report.${format}`;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  setOperationsStatus(`${format.toUpperCase()} raporu indirildi.`);
}

async function refreshSelectedProject() {
  await loadOperationsData();
  if (state.operations.selectedProjectId) {
    await loadSelectedProject(state.operations.selectedProjectId, { silent: true });
  }
}

function appendKeywordRule() {
  state.keywordRules.push({
    id: `keyword-rule-${state.keywordRules.length + 1}`,
    keyword: "YENI",
    process: "Belirsiz",
    serviceType: "Belirsiz",
    matchTarget: "fileName",
    isActive: true,
  });

  renderKeywordRules();
}

function exportCurrentRowsToCsv() {
  if (state.rows.length === 0) {
    statusText.textContent = "Aktarilacak veri yok. Once tarama yap.";
    return;
  }

  const rows = filteredRows();
  const headers = [
    "Parca Kodu",
    "Dosya Adi",
    "Dosya Tipi",
    "Ana Grup",
    "Surec",
    "Hizmet",
    "Guven",
    "Eslesme",
    "Klasor",
    "Goreli Yol",
  ];

  const csvLines = [
    headers.join(";"),
    ...rows.map((row) => [
      row.partCode,
      row.fileName,
      row.fileType,
      row.mainGroup,
      row.suggestedProcess,
      row.serviceType,
      row.confidence,
      row.matchedBy,
      row.folder,
      row.relativePath,
    ].map(escapeCsvCell).join(";")),
  ];

  const blob = new Blob([`\uFEFF${csvLines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "solid-workflow-raporu.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  statusText.textContent = `${rows.length} satirlik CSV raporu indirildi.`;
}

async function exportCurrentRowsToExcel() {
  const folder = folderInput.value.trim();
  if (!folder) {
    statusText.textContent = "Excel aktarimi icin once klasor yolu gerekli.";
    return;
  }

  statusText.textContent = "Excel raporu hazirlaniyor...";

  try {
    const response = await fetch(`/api/reports/workflow.xlsx?folder=${encodeURIComponent(folder)}`);
    if (!response.ok) {
      throw new Error(await readErrorResponse(response));
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "solid-workflow-report.xlsx";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    statusText.textContent = "Excel raporu indirildi.";
  } catch (error) {
    statusText.textContent = `Excel export hatasi: ${error.message}`;
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
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

function getSelectedValues(select) {
  return Array.from(select.selectedOptions).map((option) => option.value).filter(Boolean);
}

function getUserNameById(userId) {
  return state.operations.users.find((user) => user.id === userId)?.fullName || "";
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

async function handleProjectCreateSubmit(event) {
  event.preventDefault();

  try {
    const payload = {
      code: projectCodeInput.value.trim(),
      name: projectNameInput.value.trim(),
      description: projectDescriptionInput.value.trim(),
      autoGenerateFromFolder: projectFolderInput.value.trim() || undefined,
    };

    const project = await requestJson("/api/operations/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    projectCreateForm.reset();
    projectFolderInput.value = folderInput.value.trim();
    await loadOperationsData();
    await loadSelectedProject(project.id);
    setOperationsStatus("Yeni proje olusturuldu.");
  } catch (error) {
    setOperationsStatus(`Proje olusturma hatasi: ${error.message}`);
  }
}

async function handleUserCreateSubmit(event) {
  event.preventDefault();

  try {
    await requestJson("/api/operations/users", {
      method: "POST",
      body: JSON.stringify({
        departmentId: userDepartmentSelect.value,
        fullName: userFullNameInput.value.trim(),
        email: userEmailInput.value.trim(),
        isActive: true,
      }),
    });

    userCreateForm.reset();
    await loadOperationsData();
    setOperationsStatus("Yeni kullanici eklendi.");
  } catch (error) {
    setOperationsStatus(`Kullanici ekleme hatasi: ${error.message}`);
  }
}

async function handleSelectedProjectPanelSubmit(event) {
  const form = event.target.closest("form");
  if (!form) {
    return;
  }

  event.preventDefault();

  try {
    if (form.id === "workflowCreateForm") {
      await requestJson(`/api/operations/projects/${encodeURIComponent(state.operations.selectedProjectId)}/workflow-instances`, {
        method: "POST",
        body: JSON.stringify({
          workflows: [
            {
              templateId: document.getElementById("workflowTemplateSelect").value,
              instanceName: document.getElementById("workflowInstanceNameInput").value.trim(),
              itemLabel: document.getElementById("workflowItemLabelInput").value.trim(),
              itemCount: Number(document.getElementById("workflowItemCountInput").value || 1),
              stepAssignments: [],
            },
          ],
        }),
      });

      await refreshSelectedProject();
      setOperationsStatus("Template bazli workflow eklendi.");
      return;
    }

    if (form.id === "projectBootstrapForm") {
      await requestJson(`/api/operations/projects/${encodeURIComponent(state.operations.selectedProjectId)}/bootstrap-workflows`, {
        method: "POST",
        body: JSON.stringify({
          folderPath: document.getElementById("bootstrapFolderPathInput").value.trim(),
        }),
      });

      await refreshSelectedProject();
      setOperationsStatus("Klasor analizine gore otomatik workflow uretildi.");
      return;
    }

    if (form.classList.contains("add-step-form")) {
      const instanceId = form.dataset.instanceId;
      await requestJson(`/api/operations/workflow-instances/${encodeURIComponent(instanceId)}/steps`, {
        method: "POST",
        body: JSON.stringify({
          name: form.querySelector('[data-role="new-step-name"]').value.trim(),
          description: form.querySelector('[data-role="new-step-description"]').value.trim(),
          sequenceNo: Number(form.querySelector('[data-role="new-step-sequence"]').value || 1),
          status: form.querySelector('[data-role="new-step-status"]').value,
          assigneeIds: getSelectedValues(form.querySelector('[data-role="new-step-assignees"]')),
          isOptional: form.querySelector('[data-role="new-step-optional"]').checked,
        }),
      });

      await refreshSelectedProject();
      setOperationsStatus("Yeni adim eklendi.");
    }
  } catch (error) {
    setOperationsStatus(`Islem hatasi: ${error.message}`);
  }
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

scanButton.addEventListener("click", scanFolder);
searchInput.addEventListener("input", () => renderRows(filteredRows()));
document.getElementById("saveFileTypeRulesButton").addEventListener("click", saveFileTypeRules);
document.getElementById("saveKeywordRulesButton").addEventListener("click", saveKeywordRules);
document.getElementById("saveOverridesButton").addEventListener("click", saveOverrides);
document.getElementById("addFileTypeRuleButton").addEventListener("click", appendNewFileTypeRule);
document.getElementById("addKeywordRuleButton").addEventListener("click", appendKeywordRule);
document.getElementById("refreshFileTypeRulesButton").addEventListener("click", loadFileTypeRules);
document.getElementById("refreshKeywordRulesButton").addEventListener("click", loadKeywordRules);
document.getElementById("clearOverrideFormButton").addEventListener("click", clearOverrideForm);
document.getElementById("exportExcelButton").addEventListener("click", exportCurrentRowsToExcel);
document.getElementById("exportCsvButton").addEventListener("click", exportCurrentRowsToCsv);
fileTypeRulesBody.addEventListener("input", handleTableInput);
fileTypeRulesBody.addEventListener("change", handleTableInput);
keywordRulesBody.addEventListener("input", handleTableInput);
keywordRulesBody.addEventListener("change", handleTableInput);
overrideRulesBody.addEventListener("input", handleOverrideTableInput);
overrideRulesBody.addEventListener("change", handleOverrideTableInput);
resultsBody.addEventListener("click", handleBodyClick);
overrideRulesBody.addEventListener("click", handleBodyClick);
projectList.addEventListener("click", handleOperationsClick);
userDirectory.addEventListener("click", handleOperationsClick);
selectedProjectPanel.addEventListener("click", handleOperationsClick);
selectedProjectPanel.addEventListener("submit", handleSelectedProjectPanelSubmit);
refreshOperationsButton.addEventListener("click", loadOperationsData);
projectCreateForm.addEventListener("submit", handleProjectCreateSubmit);
userCreateForm.addEventListener("submit", handleUserCreateSubmit);
overrideForm.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertOverrideFromForm();
});

window.addEventListener("load", async () => {
  try {
    projectFolderInput.value = folderInput.value.trim();
    await loadInitialData();
    await scanFolder();
  } catch (error) {
    statusText.textContent = `Hata: ${error.message}`;
    setOperationsStatus(`Hata: ${error.message}`);
  }
});
