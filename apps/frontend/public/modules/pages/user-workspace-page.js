const {
  userWorkspaceUserSelect: workspaceUserSelect,
  userWorkspaceSummary: workspaceSummary,
  userWorkspaceList: workspaceList,
} = window.userWorkspacePageRefs;

function renderUserWorkspace() {
  const selectedUserId = state.operations.selectedUserId || "";
  const selectedUser = state.operations.users.find((user) => user.id === selectedUserId) || null;
  const items = Array.isArray(state.operations.userWorkItems) ? state.operations.userWorkItems : [];

  if (workspaceUserSelect.value !== selectedUserId) {
    workspaceUserSelect.value = selectedUserId;
  }

  if (!selectedUser) {
    workspaceSummary.innerHTML = [
      createStatCard("Seçili kullanıcı", "0"),
      createStatCard("Aktif iş", "0"),
      createStatCard("Devre hazır", "0"),
      createStatCard("Tamamlanacak akış", "0"),
    ].join("");
    workspaceList.innerHTML = `<div class="empty-state">Kullanıcı seçildiğinde işleri burada otomatik göreceksin.</div>`;
    return;
  }

  const readyCount = items.filter((item) => item.currentStep.status === "ready").length;
  const inProgressCount = items.filter((item) => item.currentStep.status === "in_progress").length;
  const handoverCount = items.filter((item) => item.nextStep).length;
  const lastUpdated = items
    .map((item) => item.currentStep.updatedAt || item.workflow.updatedAt || "")
    .filter(Boolean)
    .sort()
    .at(-1);

  workspaceSummary.innerHTML = [
    createStatCard("Seçili kullanıcı", selectedUser.fullName),
    createStatCard("Aktif iş", String(items.length), items.length > 0 ? "" : "warning"),
    createStatCard("Hazır iş", String(readyCount)),
    createStatCard("İşlemde", String(inProgressCount)),
    createStatCard("Devir bekleyen", String(handoverCount), handoverCount > 0 ? "" : "warning"),
    createStatCard("Son hareket", lastUpdated ? formatDate(lastUpdated) : "-"),
  ].join("");

  if (items.length === 0) {
    workspaceList.innerHTML = `<div class="empty-state">${escapeHtml(selectedUser.fullName)} için atanmış aktif iş bulunmuyor.</div>`;
    return;
  }

  workspaceList.innerHTML = items.map((item) => renderUserTaskCard(item, selectedUser)).join("");
}

function renderUserTaskCard(item, selectedUser) {
  const nextAssigneeIds = item.nextStep?.assigneeIds || [];
  const nextAssigneeNames = item.nextStep
    ? formatAssigneeNames(item.nextStep.assigneeIds, item.nextStep.assignee)
    : "Bu akışın sonraki adımı yok";
  const actionOptions = [
    "Onaylandı",
    "İç hizmete alındı",
    "Dış hizmete gönderildi",
    "Liste kontrol tamamlandı",
    "Kalite kontrol tamamlandı",
    "Bir sonraki adıma devredildi",
  ];

  return `
    <article class="user-task-card" data-instance-id="${escapeAttribute(item.workflow.id)}">
      <div class="table-header">
        <div class="cell-stack">
          <p class="eyebrow">${escapeHtml(item.project.code)}</p>
          <h3>${escapeHtml(item.workflow.name)}</h3>
          <span class="muted">${escapeHtml(item.project.name)} | ${escapeHtml(item.workflow.itemLabel || item.workflow.templateName || "Genel iş akışı")}</span>
        </div>
        <div class="workflow-meta">
          <span class="badge ${item.currentStep.status === "in_progress" ? "warn" : "good"}">${escapeHtml(formatTaskStatus(item.currentStep.status))}</span>
          <strong>%${item.workflow.progressPercent}</strong>
        </div>
      </div>

      <div class="user-task-grid">
        <div class="user-task-info">
          <div class="task-detail-card">
            <span class="muted">Aktif adım</span>
            <strong>${escapeHtml(`${item.currentStep.sequenceNo}. ${item.currentStep.name}`)}</strong>
            <span>${escapeHtml(item.currentStep.description || "Açıklama girilmemiş")}</span>
          </div>
          <div class="task-detail-card">
            <span class="muted">Parça / kalem</span>
            <strong>${escapeHtml(item.workflow.itemLabel || item.workflow.name)}</strong>
            <span>${escapeHtml(item.workflow.itemCount ? `${item.workflow.itemCount} adet` : "Adet bilgisi yok")}</span>
          </div>
          <div class="task-detail-card">
            <span class="muted">Sonraki adım</span>
            <strong>${escapeHtml(item.nextStep ? `${item.nextStep.sequenceNo}. ${item.nextStep.name}` : "Akış tamamlanacak")}</strong>
            <span>${escapeHtml(item.nextStep ? (item.nextStep.description || "Sonraki adım açıklaması yok") : "Bu onay ile iş tamamlanmış olacak")}</span>
          </div>
        </div>

        <div class="user-task-action-panel">
          <label>
            Yapılan işlem
            <select data-role="task-note-preset">
              ${actionOptions.map((option, index) => `<option value="${escapeAttribute(option)}" ${index === 0 ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
            </select>
          </label>

          <label>
            Sonraki sorumlular
            <select data-role="task-next-assignees" multiple size="4" ${item.nextStep ? "" : "disabled"}>
              ${renderUserOptions(true, nextAssigneeIds)}
            </select>
          </label>

          <div class="task-assignee-note">
            <strong>Önerilen devir</strong>
            <span class="muted">${escapeHtml(nextAssigneeNames)}</span>
          </div>

          <div class="user-task-actions">
            <span class="muted">Tamamlayan kullanıcı: ${escapeHtml(selectedUser.fullName)}</span>
            <button data-action="advance-user-task" data-instance-id="${escapeAttribute(item.workflow.id)}" data-next-required="${item.nextStep ? "true" : "false"}">
              ${item.nextStep ? "Onayla ve Devret" : "İşi Tamamla"}
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

async function loadUserWorkspaceData(options = {}) {
  if (state.operations.projects.length === 0 || state.operations.users.length === 0) {
    await prepareUserWorkspacePage();
  }

  const selectedUserId = workspaceUserSelect.value || state.operations.selectedUserId || "";
  state.operations.selectedUserId = selectedUserId;
  renderUserWorkspace();

  if (!selectedUserId) {
    setUserWorkspaceStatus("Önce kullanıcı seç.");
    return;
  }

  if (!options.silent) {
    setUserWorkspaceStatus("Kullanıcı işleri yükleniyor...");
  }

  const dashboards = await Promise.all(
    state.operations.projects.map((project) => requestJson(`/api/operations/projects/${encodeURIComponent(project.id)}`)),
  );

  state.operations.userWorkItems = collectUserWorkItems(selectedUserId, dashboards);
  renderUserWorkspace();

  const selectedUser = state.operations.users.find((user) => user.id === selectedUserId);
  const userLabel = selectedUser ? selectedUser.fullName : "Seçili kullanıcı";
  setUserWorkspaceStatus(`${userLabel} için ${state.operations.userWorkItems.length} aktif iş hazırlandı.`);
}

async function prepareUserWorkspacePage() {
  setUserWorkspaceStatus("Kullanıcı listesi hazırlanıyor...");

  const [projects, userData] = await Promise.all([
    requestJson("/api/operations/projects"),
    requestJson("/api/operations/users"),
  ]);

  state.operations.projects = projects;
  state.operations.departments = userData.departments;
  state.operations.users = userData.users;
  renderUserManagement();
  renderUserWorkspace();
  setUserWorkspaceStatus("Kullanıcı seçildiğinde işler otomatik yüklenecek.");
}

function collectUserWorkItems(userId, dashboards) {
  const selectedUser = state.operations.users.find((user) => user.id === userId);
  const selectedUserName = selectedUser ? normalizeText(selectedUser.fullName) : "";

  return dashboards.flatMap((dashboard) => {
    const project = dashboard.project;
    return dashboard.workflows.flatMap((workflow) => {
      const currentStep = workflow.steps.find((step) => (
        (step.status === "ready" || step.status === "in_progress")
        && (step.assigneeIds.includes(userId) || (selectedUserName && normalizeText(step.assignee || "").includes(selectedUserName)))
      ));

      if (!currentStep) {
        return [];
      }

      const nextStep = workflow.steps.find((step) => step.sequenceNo > currentStep.sequenceNo) || null;
      return [{ project, workflow, currentStep, nextStep }];
    });
  });
}

async function handleUserWorkspaceClick(event) {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget || actionTarget.dataset.action !== "advance-user-task") {
    return;
  }

  try {
    const card = actionTarget.closest(".user-task-card");
    await advanceUserTask(card, actionTarget.dataset.instanceId, actionTarget.dataset.nextRequired === "true");
  } catch (error) {
    setUserWorkspaceStatus(`İşlem hatası: ${error.message}`);
  }
}

async function advanceUserTask(card, instanceId, nextRequired) {
  const selectedUserId = state.operations.selectedUserId || workspaceUserSelect.value;
  const selectedUser = state.operations.users.find((user) => user.id === selectedUserId);
  if (!selectedUser) {
    setUserWorkspaceStatus("Önce kullanıcı seç.");
    return;
  }

  const notePreset = card.querySelector('[data-role="task-note-preset"]').value.trim();
  const nextAssigneeIds = getSelectedValues(card.querySelector('[data-role="task-next-assignees"]'));

  if (nextRequired && nextAssigneeIds.length === 0) {
    setUserWorkspaceStatus("Sonraki adım için en az bir sorumlu seç.");
    return;
  }

  const handoverTo = nextAssigneeIds.map(getUserNameById).filter(Boolean).join(", ");
  await requestJson(`/api/operations/workflow-instances/${encodeURIComponent(instanceId)}/advance`, {
    method: "POST",
    body: JSON.stringify({
      completedBy: selectedUser.fullName,
      note: notePreset,
      handoverTo,
      nextAssigneeIds,
    }),
  });

  await loadOperationsData();
  await loadUserWorkspaceData({ silent: true });
  setUserWorkspaceStatus(nextRequired ? "İş onaylandı ve bir sonraki kullanıcıya devredildi." : "İş tamamlandı.");
  setOperationsStatus("Kullanıcı ekranından yapılan onay operasyon verisine işlendi.");
}
