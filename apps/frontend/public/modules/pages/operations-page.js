const {
  projectList: operationsProjectList,
  projectCountText: operationsProjectCountText,
  operationsSummary: operationsSummaryPanel,
  selectedProjectPanel: operationsSelectedProjectPanel,
  openJobsList: operationsOpenJobsList,
  auditEventList: operationsAuditEventList,
  projectCreateForm: operationsProjectCreateForm,
  projectCodeInput: operationsProjectCodeInput,
  projectNameInput: operationsProjectNameInput,
  projectDescriptionInput: operationsProjectDescriptionInput,
  projectFolderInput: operationsProjectFolderInput,
  userCreateForm: operationsUserCreateForm,
  userFullNameInput: operationsUserFullNameInput,
  userEmailInput: operationsUserEmailInput,
  userDepartmentSelect: operationsUserDepartmentSelect,
  userDirectory: operationsUserDirectory,
} = window.operationsPageRefs;
const { folderInput: operationsWorkflowFolderInput } = window.workflowPageRefs;
const { userWorkspaceUserSelect: operationsUserWorkspaceUserSelect } = window.userWorkspacePageRefs;

function getCurrentFolderSuggestion() {
  return operationsWorkflowFolderInput.value.trim();
}

function syncProjectFolderInputFromWorkflow() {
  operationsProjectFolderInput.value = getCurrentFolderSuggestion();
}

function renderOperationsSummary() {
  const users = state.operations.users.filter((user) => user.isActive);
  const projects = state.operations.projects;
  const totalWorkflows = projects.reduce((accumulator, project) => accumulator + (project.progress?.totalInstances || 0), 0);
  const totalSteps = projects.reduce((accumulator, project) => accumulator + (project.progress?.totalSteps || 0), 0);
  const completedSteps = projects.reduce((accumulator, project) => accumulator + (project.progress?.completedSteps || 0), 0);
  const overallPercentage = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100);

  operationsSummaryPanel.innerHTML = [
    createStatCard("Aktif proje", String(projects.length)),
    createStatCard("Aktif kullanıcı", String(users.length)),
    createStatCard("Workflow", String(totalWorkflows)),
    createStatCard("Tamamlanan adım", `${completedSteps}/${totalSteps}`),
    createStatCard("Genel ilerleme", `%${overallPercentage}`, overallPercentage < 50 ? "warning" : ""),
    createStatCard("Açık iş", String(state.operations.openJobs.length), state.operations.openJobs.length > 0 ? "warning" : ""),
  ].join("");
}

function renderProjectList() {
  const selectedProjectId = state.operations.selectedProjectId;
  operationsProjectCountText.textContent = `${state.operations.projects.length} proje`;

  if (state.operations.projects.length === 0) {
    operationsProjectList.innerHTML = `<div class="empty-state">Henüz proje yok. Soldaki formdan ilk projeyi oluştur.</div>`;
    return;
  }

  operationsProjectList.innerHTML = state.operations.projects.map((project) => `
    <button class="project-card ${project.id === selectedProjectId ? "active" : ""}" data-action="select-project" data-project-id="${project.id}">
      <div class="cell-stack">
        <strong>${escapeHtml(project.code)} - ${escapeHtml(project.name)}</strong>
        <span class="muted">${escapeHtml(project.description || "Açıklama yok")}</span>
      </div>
      <div class="project-card-meta">
        <span class="badge ${project.progress?.completionPercentage >= 100 ? "good" : "warn"}">%${project.progress?.completionPercentage || 0}</span>
        <span class="muted">${project.progress?.totalInstances || 0} akış</span>
      </div>
    </button>
  `).join("");
}

function renderUserManagement() {
  const departmentOptions = state.operations.departments.map((department) => `
    <option value="${escapeAttribute(department.id)}">${escapeHtml(department.name)}</option>
  `).join("");

  operationsUserDepartmentSelect.innerHTML = departmentOptions || `<option value="">Departman bulunamadı</option>`;

  if (state.operations.departments.length === 0) {
    operationsUserDirectory.innerHTML = `<div class="empty-state">Departman verisi bulunamadı.</div>`;
    return;
  }

  operationsUserDirectory.innerHTML = state.operations.departments.map((department) => {
    const users = state.operations.users.filter((user) => user.departmentId === department.id);
    return `
      <section class="dept-card">
        <div class="table-header">
          <strong>${escapeHtml(department.name)}</strong>
          <span class="muted">${users.length} kişi</span>
        </div>
        ${users.length === 0 ? `<p class="muted">Bu departmanda kullanıcı yok.</p>` : users.map((user) => `
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

  const activeUsers = state.operations.users.filter((user) => user.isActive);
  operationsUserWorkspaceUserSelect.innerHTML = `
    <option value="">Önce kullanıcı seç</option>
    ${activeUsers.map((user) => `
      <option value="${escapeAttribute(user.id)}" ${user.id === state.operations.selectedUserId ? "selected" : ""}>
        ${escapeHtml(user.fullName)}${user.departmentName ? ` - ${escapeHtml(user.departmentName)}` : ""}
      </option>
    `).join("")}
  `;
}

function renderOpenJobs() {
  const selectedProjectId = state.operations.selectedProjectId;
  const jobs = selectedProjectId
    ? state.operations.openJobs.filter((job) => job.projectId === selectedProjectId)
    : state.operations.openJobs;

  if (jobs.length === 0) {
    operationsOpenJobsList.innerHTML = `<div class="empty-state">Açık iş bulunmuyor.</div>`;
    return;
  }

  operationsOpenJobsList.innerHTML = jobs.map((job) => `
    <article class="feed-card">
      <div class="table-header">
        <strong>${escapeHtml(job.title)}</strong>
        <span class="badge warn">${escapeHtml(job.status)}</span>
      </div>
      <p>${escapeHtml(job.description || "Açıklama yok")}</p>
      <p class="muted">Kaynak: ${escapeHtml(job.sourceType)} | Sıra: ${escapeHtml(job.payload?.sequenceNo || "-")}</p>
      <p class="muted">Oluşturulma: ${formatDate(job.createdAt)}</p>
    </article>
  `).join("");
}

function renderAuditEvents() {
  if (state.operations.auditEvents.length === 0) {
    operationsAuditEventList.innerHTML = `<div class="empty-state">Seçili proje için audit kaydı bulunmuyor.</div>`;
    return;
  }

  operationsAuditEventList.innerHTML = state.operations.auditEvents.slice(0, 6).map((event) => `
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

function renderProjectRoutingSummary(dashboard) {
  const workflows = Array.isArray(dashboard.workflows) ? dashboard.workflows : [];
  const processCounts = new Map();
  const serviceCounts = new Map();
  const assigneeCounts = new Map();

  for (const workflow of workflows) {
    const process = workflow.itemPayload?.process || workflow.itemPayload?.partList?.[0]?.suggestedProcess || "Belirsiz";
    const service = workflow.itemPayload?.serviceType || workflow.itemPayload?.partList?.[0]?.serviceType || "Belirsiz";
    processCounts.set(process, (processCounts.get(process) || 0) + 1);
    serviceCounts.set(service, (serviceCounts.get(service) || 0) + 1);

    const currentStep = workflow.currentStep;
    if (currentStep) {
      const assigneeLabel = formatAssigneeNames(currentStep.assigneeIds, currentStep.assignee);
      assigneeCounts.set(assigneeLabel, (assigneeCounts.get(assigneeLabel) || 0) + 1);
    }
  }

  return `
    <section class="ops-block">
      <div class="table-header">
        <div>
          <h4>Yerleşim Özeti</h4>
          <p class="muted">Bu projedeki dosya ve parça kalemlerinin süreç, hizmet ve aktif sorumlu dağılımı.</p>
        </div>
      </div>
      <div class="quick-step-grid">
        <article class="quick-step-card">
          <strong>Süreç Dağılımı</strong>
          ${renderCountLines(processCounts)}
        </article>
        <article class="quick-step-card">
          <strong>Hizmet Dağılımı</strong>
          ${renderCountLines(serviceCounts)}
        </article>
        <article class="quick-step-card">
          <strong>Aktif Sorumlu / Departman</strong>
          ${renderCountLines(assigneeCounts)}
        </article>
      </div>
    </section>
  `;
}

function renderCountLines(countMap) {
  if (!countMap || countMap.size === 0) {
    return `<p class="muted">Henüz veri yok.</p>`;
  }

  return Array.from(countMap.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([label, count]) => `<p class="muted">${escapeHtml(label)}: <strong>${escapeHtml(String(count))}</strong></p>`)
    .join("");
}

function renderSelectedProject() {
  const dashboard = state.operations.selectedProject;
  if (!dashboard) {
    operationsSelectedProjectPanel.innerHTML = "Yönetim ekranını açmak için soldan bir proje seç.";
    return;
  }

  const project = dashboard.project;
  const progress = dashboard.progress;
  const currentFolderSuggestion = getCurrentFolderSuggestion();

  operationsSelectedProjectPanel.innerHTML = `
    <div class="selected-project-header">
      <div>
        <p class="eyebrow">${escapeHtml(project.code)}</p>
        <h3>${escapeHtml(project.name)}</h3>
        <p class="muted">${escapeHtml(project.description || "Açıklama girilmemiş")}</p>
      </div>
      <div class="project-progress-card">
        <strong>%${progress.completionPercentage}</strong>
        <span class="muted">${progress.completedSteps}/${progress.totalSteps} adım tamamlandı</span>
      </div>
    </div>

    <div class="inline-actions top-export-actions">
      <span class="muted">Raporlar: workflow, adım, açık iş ve audit kayıtları tek dosyada.</span>
      <div class="inline-actions">
        <button type="button" class="secondary" data-action="assign-project-workflows" data-project-id="${project.id}">İşleri Kullanıcılara Aktar</button>
        <button type="button" class="secondary danger-button" data-action="delete-project" data-project-id="${project.id}">Projeyi Sil</button>
        <button type="button" class="secondary" data-action="download-operations-report" data-format="xlsx">Excel İndir</button>
        <button type="button" class="secondary" data-action="download-operations-report" data-format="csv">CSV İndir</button>
        <button type="button" class="secondary" data-action="download-operations-report" data-format="pdf">PDF İndir</button>
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
          <input id="workflowInstanceNameInput" type="text" placeholder="Workflow adı" />
          <input id="workflowItemLabelInput" type="text" placeholder="Kalem / Parça grubu" />
          <input id="workflowItemCountInput" type="number" min="1" value="1" />
        </div>
        <button type="submit">Workflow Oluştur</button>
      </form>

      <form id="projectBootstrapForm" class="embedded-form">
        <h4>Klasörden otomatik workflow üret</h4>
        <div class="inline-grid">
          <div class="control-row">
            <input id="bootstrapFolderPathInput" type="text" value="${escapeAttribute(currentFolderSuggestion)}" placeholder="Proje klasör yolu" />
            <button
              type="button"
              class="secondary"
              data-action="pick-folder"
              data-target-input="bootstrapFolderPathInput"
              data-picker-title="Workflow üretilecek proje klasörünü seç"
              data-status-target="operations"
            >
              Klasör Seç
            </button>
          </div>
        </div>
        <button type="submit" class="secondary">Klasörden Üret</button>
      </form>
    </div>

    ${renderProjectRoutingSummary(dashboard)}

    <div class="workflow-stack">
      ${dashboard.workflows.length === 0 ? `<div class="empty-state">Bu projede henüz workflow yok. Template seçip ekleyebilir ya da klasörden otomatik üretebilirsin.</div>` : dashboard.workflows.map(renderWorkflowCard).join("")}
    </div>
  `;
}

function renderWorkflowCard(instance) {
  const canAdvance = Boolean(instance.currentStep);
  const itemCountText = Number(instance.itemCount || 0) > 0 ? ` | Toplam kalem: ${instance.itemCount}` : "";

  return `
    <article class="workflow-card">
      <div class="table-header">
        <div>
          <h4>${escapeHtml(instance.name)}</h4>
          <p class="muted">${escapeHtml(instance.itemLabel || instance.templateName || "Genel akış")} | ${instance.steps.length} adım${escapeHtml(itemCountText)}</p>
        </div>
        <div class="workflow-meta">
          <button class="secondary danger-button link-button" data-action="delete-workflow-instance" data-instance-id="${instance.id}">Akışı Sil</button>
          <span class="badge ${instance.status === "completed" ? "good" : "warn"}">${escapeHtml(instance.status)}</span>
          <strong>%${instance.progressPercent}</strong>
        </div>
      </div>

      <div class="progress-rail slim">
        <div class="progress-rail-fill" style="width:${instance.progressPercent}%"></div>
      </div>

      <div class="advance-panel">
        <div class="cell-stack">
          <strong>Sıradaki aktif adım</strong>
          <span class="muted">${escapeHtml(instance.currentStep ? `${instance.currentStep.sequenceNo}. ${instance.currentStep.name}` : "Tüm adımlar tamamlandı")}</span>
        </div>
        <div class="advance-grid" data-instance-id="${instance.id}">
          <select data-role="completed-by">
            <option value="">Tamamlayan kişi</option>
            ${renderUserOptions()}
          </select>
          <select data-role="next-assignees" multiple size="3">
            ${renderUserOptions(true)}
          </select>
          <input data-role="advance-note" type="text" placeholder="Not veya devir açıklaması" />
          <button ${canAdvance ? "" : "disabled"} data-action="advance-instance" data-instance-id="${instance.id}">Sıradaki Adıma Geç</button>
        </div>
        ${instance.currentStep ? `
          <div class="advance-grid" data-step-id="${instance.currentStep.id}">
            <select data-role="reassign-assignees" multiple size="3">
              ${renderUserOptions(true, instance.currentStep.assigneeIds)}
            </select>
            <input data-role="reassign-reason" type="text" placeholder="Yanlış devir düzeltme nedeni" />
            <button data-action="reassign-current-step" data-step-id="${instance.currentStep.id}">Devri Düzelt</button>
          </div>
        ` : ""}
      </div>

      <section class="quick-edit-shell">
        <div class="table-header">
          <div>
            <h5>Kolay Düzenleme</h5>
            <p class="muted">Aktif proje içinde adımları satır açmadan hızlıca güncelle.</p>
          </div>
        </div>
        <div class="quick-step-grid">
          ${instance.steps.map((step) => renderQuickStepCard(instance, step)).join("")}
        </div>
      </section>

      <div class="table-wrap">
        <table class="ops-table">
          <thead>
            <tr>
              <th>Sıra</th>
              <th>Adım</th>
              <th>Açıklama</th>
              <th>Sorumlular</th>
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
        <div class="inline-grid">
          <input data-role="new-step-name" type="text" placeholder="Yeni adım adı" required />
          <input data-role="new-step-description" type="text" placeholder="Açıklama" />
          <input data-role="new-step-sequence" type="number" min="1" value="${instance.steps.length + 1}" />
          <select data-role="new-step-status">${renderStatusOptions("pending")}</select>
          <select data-role="new-step-assignees" multiple size="3">${renderUserOptions(true)}</select>
          <label class="checkbox-inline">
            <input data-role="new-step-optional" type="checkbox" />
            Opsiyonel
          </label>
        </div>
        <button type="submit" class="secondary">Yeni Adım Ekle</button>
      </form>
    </article>
  `;
}

function renderQuickStepCard(instance, step) {
  return `
    <article class="quick-step-card" data-step-id="${step.id}">
      <strong>${escapeHtml(`${step.sequenceNo}. ${step.name}`)}</strong>
      <input data-role="step-name" value="${escapeAttribute(step.name)}" />
      <input data-role="step-description" value="${escapeAttribute(step.description || "")}" />
      <select data-role="step-status">${renderStatusOptions(step.status)}</select>
      <select data-role="step-assignees" multiple size="3">${renderUserOptions(true, step.assigneeIds)}</select>
      <label class="checkbox-inline">
        <input data-role="step-optional" type="checkbox" ${step.isOptional ? "checked" : ""} />
        Opsiyonel
      </label>
      <input data-role="step-note" value="${escapeAttribute(step.completionNote || "")}" placeholder="Not" />
      <button class="secondary" data-action="save-step-card">Kaydet</button>
    </article>
  `;
}

function renderStepRow(instance, step) {
  return `
    <tr data-step-id="${step.id}">
      <td>${escapeHtml(String(step.sequenceNo))}</td>
      <td><input data-role="step-name" value="${escapeAttribute(step.name)}" /></td>
      <td><input data-role="step-description" value="${escapeAttribute(step.description || "")}" /></td>
      <td><select data-role="step-assignees" multiple size="3">${renderUserOptions(true, step.assigneeIds)}</select></td>
      <td><select data-role="step-status">${renderStatusOptions(step.status)}</select></td>
      <td><input data-role="step-optional" type="checkbox" ${step.isOptional ? "checked" : ""} /></td>
      <td><input data-role="step-note" value="${escapeAttribute(step.completionNote || "")}" placeholder="Not" /></td>
      <td><button class="secondary link-button" data-action="save-step">Kaydet</button></td>
      <td><button class="secondary danger-button link-button" data-action="delete-step" data-step-id="${step.id}">Sil</button></td>
    </tr>
  `;
}

function renderTemplateOptions() {
  return state.operations.templates
    .map((template) => `<option value="${escapeAttribute(template.id)}">${escapeHtml(template.name)}</option>`)
    .join("");
}

function renderUserOptions(includeInactive = false, selectedIds = []) {
  return state.operations.users
    .filter((user) => includeInactive || user.isActive)
    .map((user) => `<option value="${escapeAttribute(user.id)}" ${selectedIds.includes(user.id) ? "selected" : ""}>${escapeHtml(user.fullName)}</option>`)
    .join("");
}

async function loadOperationsData() {
  setOperationsStatus("Operasyon verileri yükleniyor...");

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
  renderUserWorkspace();

  if (state.operations.selectedProjectId) {
    await loadSelectedProject(state.operations.selectedProjectId, { silent: true });
  } else {
    state.operations.selectedProject = null;
    state.operations.auditEvents = [];
    renderSelectedProject();
    renderAuditEvents();
  }

  setOperationsStatus("Operasyon merkezi güncel.");
}

async function loadSelectedProject(projectId, options = {}) {
  state.operations.selectedProjectId = projectId;
  renderProjectList();

  if (!options.silent) {
    setOperationsStatus("Proje paneli yükleniyor...");
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
    setOperationsStatus(`${dashboard.project.code} operasyon paneli açıldı.`);
  }
}

async function handleOperationsClick(event) {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    return;
  }

  try {
    const action = actionTarget.dataset.action;
    if (action === "select-project") {
      await loadSelectedProject(actionTarget.dataset.projectId);
      return;
    }

    if (action === "deactivate-user") {
      await requestJson(`/api/operations/users/${encodeURIComponent(actionTarget.dataset.userId)}`, {
        method: "DELETE",
      });
      await loadOperationsData();
      setOperationsStatus("Kullanıcı pasife alındı.");
      return;
    }

    if (action === "delete-project") {
      await deleteProject(actionTarget.dataset.projectId);
      return;
    }

    if (action === "delete-workflow-instance") {
      await deleteWorkflowInstance(actionTarget.dataset.instanceId);
      return;
    }

    if (action === "assign-project-workflows") {
      await assignProjectWorkflows(actionTarget.dataset.projectId);
      return;
    }

    if (action === "save-step") {
      await saveStepFromRow(actionTarget.closest("tr"));
      return;
    }

    if (action === "save-step-card") {
      await saveStepFromCard(actionTarget.closest(".quick-step-card"));
      return;
    }

    if (action === "delete-step") {
      await requestJson(`/api/operations/workflow-instance-steps/${encodeURIComponent(actionTarget.dataset.stepId)}`, {
        method: "DELETE",
      });
      await refreshSelectedProject();
      setOperationsStatus("Adım silindi ve Açık İşler alanına aktarıldı.");
      return;
    }

    if (action === "advance-instance") {
      const container = actionTarget.closest(".advance-grid");
      await advanceInstance(container, actionTarget.dataset.instanceId);
      return;
    }

    if (action === "reassign-current-step") {
      const container = actionTarget.closest(".advance-grid");
      await reassignCurrentStep(container, actionTarget.dataset.stepId);
      return;
    }

    if (action === "download-operations-report") {
      await downloadOperationsReport(actionTarget.dataset.format);
    }
  } catch (error) {
    setOperationsStatus(`İşlem hatası: ${error.message}`);
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
  setOperationsStatus("Adım bilgisi güncellendi.");
}

async function saveStepFromCard(card) {
  const stepId = card.dataset.stepId;
  const payload = {
    name: card.querySelector('[data-role="step-name"]').value.trim(),
    description: card.querySelector('[data-role="step-description"]').value.trim(),
    assigneeIds: getSelectedValues(card.querySelector('[data-role="step-assignees"]')),
    status: card.querySelector('[data-role="step-status"]').value,
    isOptional: card.querySelector('[data-role="step-optional"]').checked,
    note: card.querySelector('[data-role="step-note"]').value.trim(),
  };

  await requestJson(`/api/operations/workflow-instance-steps/${encodeURIComponent(stepId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  await refreshSelectedProject();
  setOperationsStatus("Adım kart görünümünden güncellendi.");
}

async function deleteProject(projectId) {
  const project = state.operations.projects.find((item) => item.id === projectId);
  const projectLabel = project ? `${project.code} - ${project.name}` : "seçili proje";
  if (!window.confirm(`${projectLabel} projesini silmek istediğine emin misin? Bu işlem geri alınamaz.`)) {
    return;
  }

  await requestJson(`/api/operations/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
  });

  await loadOperationsData();
  setOperationsStatus("Proje ve bağlı workflow verileri silindi.");
}

async function deleteWorkflowInstance(instanceId) {
  if (!window.confirm("Bu iş akışını silmek istediğine emin misin?")) {
    return;
  }

  await requestJson(`/api/operations/workflow-instances/${encodeURIComponent(instanceId)}`, {
    method: "DELETE",
  });

  await refreshSelectedProject();
  setOperationsStatus("İş akışı silindi.");
}

async function assignProjectWorkflows(projectId) {
  const result = await requestJson(`/api/operations/projects/${encodeURIComponent(projectId)}/assign-workflows`, {
    method: "POST",
  });

  await refreshSelectedProject();
  if (state.operations.selectedUserId) {
    await loadUserWorkspaceData({ silent: true });
  }

  const affectedWorkflowCount = Array.isArray(result.updatedInstances) ? result.updatedInstances.length : 0;
  const affectedStepCount = Number(result.updatedStepCount || 0);

  setOperationsStatus(
    affectedStepCount > 0
      ? `${result.project.code} projesinde ${affectedWorkflowCount} akış içindeki ${affectedStepCount} adım kullanıcılara aktarıldı.`
      : `${result.project.code} projesinde aktarılacak yeni kullanıcı ataması bulunamadı.`,
  );
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
  setOperationsStatus("Aktif adım tamamlandı ve bir sonraki adım devreye alındı.");
}

async function reassignCurrentStep(container, stepId) {
  const assigneeIds = getSelectedValues(container.querySelector('[data-role="reassign-assignees"]'));
  const reassignmentReason = container.querySelector('[data-role="reassign-reason"]').value.trim();

  if (assigneeIds.length === 0) {
    setOperationsStatus("Devir düzeltmek için en az bir sorumlu seç.");
    return;
  }

  if (!reassignmentReason) {
    setOperationsStatus("Devir düzeltme nedeni zorunludur.");
    return;
  }

  await requestJson(`/api/operations/workflow-instance-steps/${encodeURIComponent(stepId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      assigneeIds,
      reassignmentReason,
      note: reassignmentReason,
    }),
  });

  await refreshSelectedProject();
  setOperationsStatus("Yanlış iş aktarımı düzeltildi ve audit kaydı oluşturuldu.");
}

async function downloadOperationsReport(format) {
  const projectId = state.operations.selectedProjectId;
  if (!projectId) {
    setOperationsStatus("Rapor için önce bir proje seç.");
    return;
  }

  setOperationsStatus(`${format.toUpperCase()} raporu hazırlanıyor...`);

  const response = await apiClient.apiFetch(`/api/operations/projects/${encodeURIComponent(projectId)}/report.${format}`);
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

async function handleProjectCreateSubmit(event) {
  event.preventDefault();

  try {
    const payload = {
      code: operationsProjectCodeInput.value.trim(),
      name: operationsProjectNameInput.value.trim(),
      description: operationsProjectDescriptionInput.value.trim(),
      autoGenerateFromFolder: operationsProjectFolderInput.value.trim() || undefined,
    };

    const project = await requestJson("/api/operations/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    operationsProjectCreateForm.reset();
    syncProjectFolderInputFromWorkflow();
    await loadOperationsData();
    await loadSelectedProject(project.id);
    setOperationsStatus("Yeni proje oluşturuldu.");
  } catch (error) {
    setOperationsStatus(`Proje oluşturma hatası: ${error.message}`);
  }
}

async function handleUserCreateSubmit(event) {
  event.preventDefault();

  try {
    await requestJson("/api/operations/users", {
      method: "POST",
      body: JSON.stringify({
        departmentId: operationsUserDepartmentSelect.value,
        fullName: operationsUserFullNameInput.value.trim(),
        email: operationsUserEmailInput.value.trim(),
        isActive: true,
      }),
    });

    operationsUserCreateForm.reset();
    await loadOperationsData();
    setOperationsStatus("Yeni kullanıcı eklendi.");
  } catch (error) {
    setOperationsStatus(`Kullanıcı ekleme hatası: ${error.message}`);
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
      setOperationsStatus("Template bazlı workflow eklendi.");
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
      setOperationsStatus("Klasör analizine göre otomatik workflow üretildi.");
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
      setOperationsStatus("Yeni adım eklendi.");
    }
  } catch (error) {
    setOperationsStatus(`İşlem hatası: ${error.message}`);
  }
}
