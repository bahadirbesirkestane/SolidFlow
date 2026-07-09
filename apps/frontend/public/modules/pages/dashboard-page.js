const {
  managerDashboardSummary: dashboardSummaryPanel,
  managerStageBoard: dashboardStageBoard,
  managerAttentionList: dashboardAttentionList,
  managerProjectTracker: dashboardProjectTracker,
} = window.dashboardPageRefs;

function renderManagerDashboard() {
  if (!dashboardSummaryPanel || !dashboardStageBoard || !dashboardAttentionList || !dashboardProjectTracker) {
    return;
  }

  const dashboards = Array.isArray(state.managerDashboard.dashboards) ? state.managerDashboard.dashboards : [];
  const openJobs = Array.isArray(state.operations.openJobs) ? state.operations.openJobs : [];

  if (dashboards.length === 0) {
    dashboardSummaryPanel.innerHTML = "";
    dashboardStageBoard.innerHTML = `<div class="empty-state">Gösterilecek operasyon verisi bulunamadı.</div>`;
    dashboardAttentionList.innerHTML = `<div class="empty-state">Henüz dikkat kaydı bulunmuyor.</div>`;
    dashboardProjectTracker.innerHTML = `<div class="empty-state">Proje tablosu oluşturulamadı.</div>`;
    return;
  }

  const workflows = dashboards.flatMap((dashboard) => dashboard.workflows || []);
  const steps = workflows.flatMap((workflow) => workflow.steps || []);
  const readyCount = steps.filter((step) => step.status === "ready").length;
  const inProgressCount = steps.filter((step) => step.status === "in_progress").length;
  const completedWorkflowCount = workflows.filter((workflow) => workflow.status === "completed").length;
  const activeWorkflowCount = workflows.filter((workflow) => workflow.status !== "completed").length;

  dashboardSummaryPanel.innerHTML = [
    createStatCard("Aktif proje", String(dashboards.length)),
    createStatCard("Aktif workflow", String(activeWorkflowCount)),
    createStatCard("Tamamlanan workflow", String(completedWorkflowCount)),
    createStatCard("Hazır adım", String(readyCount), readyCount > 0 ? "warning" : ""),
    createStatCard("İşlemde adım", String(inProgressCount)),
    createStatCard("Açık iş", String(openJobs.length), openJobs.length > 0 ? "warning" : ""),
  ].join("");

  const stageCounts = new Map();
  for (const workflow of workflows) {
    const activeStep = workflow.currentStep;
    const key = activeStep ? activeStep.name : "Tamamlanan Akış";
    stageCounts.set(key, (stageCounts.get(key) || 0) + 1);
  }

  dashboardStageBoard.innerHTML = Array.from(stageCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([stageName, count]) => `
      <article class="manager-stage-card">
        <span class="muted">${escapeHtml(stageName)}</span>
        <strong>${escapeHtml(String(count))}</strong>
        <span class="muted">iş akışı bu aşamada</span>
      </article>
    `)
    .join("");

  const attentionItems = [];
  if (openJobs.length > 0) {
    attentionItems.push({
      title: "Açık işler takip bekliyor",
      body: `${openJobs.length} kayıt Açık İş Takibi alanında incelenmeli.`,
    });
  }

  const unmappedCount = state.partList.filter((item) => !canCreateWorkflowFromPart(item)).length;
  if (unmappedCount > 0) {
    attentionItems.push({
      title: "Yüklenemeyecek parça kalemleri var",
      body: `${unmappedCount} kalem için süreç eşleşmesi yok. Tarama ve İş Akışı sayfasında düzenleme gerekebilir.`,
    });
  }

  const delayedProjects = dashboards
    .filter((dashboard) => Number(dashboard.progress?.completionPercentage || 0) < 100)
    .slice(0, 4)
    .map((dashboard) => ({
      title: `${dashboard.project.code} ilerliyor`,
      body: `%${dashboard.progress.completionPercentage} tamamlandı, ${dashboard.workflows.filter((workflow) => workflow.status !== "completed").length} aktif akış var.`,
    }));

  dashboardAttentionList.innerHTML = [...attentionItems, ...delayedProjects].length > 0
    ? [...attentionItems, ...delayedProjects].map((item) => `
      <article class="insight-card">
        <strong>${escapeHtml(item.title)}</strong>
        <p class="muted">${escapeHtml(item.body)}</p>
      </article>
    `).join("")
    : `<div class="empty-state">Şu an öne çıkan risk görünmüyor.</div>`;

  dashboardProjectTracker.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Proje</th>
          <th>İlerleme</th>
          <th>Aktif Workflow</th>
          <th>Aktif Aşama</th>
          <th>Açık İş</th>
        </tr>
      </thead>
      <tbody>
        ${dashboards.map((dashboard) => {
          const activeWorkflow = dashboard.workflows.find((workflow) => workflow.currentStep) || dashboard.workflows[0];
          const projectOpenJobs = openJobs.filter((job) => job.projectId === dashboard.project.id).length;
          return `
            <tr>
              <td>
                <div class="cell-stack">
                  <strong>${escapeHtml(dashboard.project.code)}</strong>
                  <span class="muted">${escapeHtml(dashboard.project.name)}</span>
                </div>
              </td>
              <td>%${escapeHtml(String(dashboard.progress.completionPercentage || 0))}</td>
              <td>${escapeHtml(String(dashboard.workflows.filter((workflow) => workflow.status !== "completed").length))}</td>
              <td>${escapeHtml(activeWorkflow?.currentStep?.name || "Tamamlanan akışlar")}</td>
              <td>${escapeHtml(String(projectOpenJobs))}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

async function loadManagerDashboardData(options = {}) {
  if (!options.silent) {
    setDashboardStatus("Yönetici görünümü hazırlanıyor...");
  }

  await loadOperationsData();

  if (state.operations.projects.length === 0) {
    state.managerDashboard.dashboards = [];
    renderManagerDashboard();
    setDashboardStatus("Gösterilecek proje bulunamadı.");
    return;
  }

  const dashboards = await Promise.all(
    state.operations.projects.map((project) => requestJson(`/api/operations/projects/${encodeURIComponent(project.id)}`)),
  );

  state.managerDashboard.dashboards = dashboards;
  renderManagerDashboard();
  setDashboardStatus(`${dashboards.length} proje için yönetici görünümü güncellendi.`);
}
