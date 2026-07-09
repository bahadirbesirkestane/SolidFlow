function formatErpStepStatus(status) {
  if (status === "done") {
    return "Tamamlandı";
  }
  if (status === "ready") {
    return "Hazır";
  }
  if (status === "attention") {
    return "Aksiyon Gerekli";
  }
  return status || "-";
}

const {
  erpWorkOrderList: erpWorkOrderListPanel,
  erpWorkOrderCountText: erpWorkOrderCountLabel,
  erpSummary: erpSummaryPanel,
  erpDetailPanel: erpDetailContent,
} = window.erpPageRefs;

function renderErpSummary() {
  const totalOrders = state.erp.workOrders.length;
  const totalLines = state.erp.workOrders.reduce((total, workOrder) => total + Number(workOrder.lineCount || 0), 0);
  const totalQuantity = state.erp.workOrders.reduce((total, workOrder) => total + Number(workOrder.totalQuantity || 0), 0);
  const selectedReadyLines = Number(state.erp.dispatch?.summary?.readyLines || 0);
  const selectedWaitingLines = Number(state.erp.dispatch?.summary?.waitingLines || 0);

  erpSummaryPanel.innerHTML = [
    createStatCard("ERP iş emri", String(totalOrders)),
    createStatCard("Toplam satır", String(totalLines)),
    createStatCard("Toplam adet", String(totalQuantity)),
    createStatCard("Hazır yönlendirme", String(selectedReadyLines)),
    createStatCard("Kural bekleyen", String(selectedWaitingLines), selectedWaitingLines > 0 ? "warning" : ""),
  ].join("");
}

function renderErpWorkOrderList() {
  erpWorkOrderCountLabel.textContent = `${state.erp.workOrders.length} emir`;

  if (state.erp.workOrders.length === 0) {
    erpWorkOrderListPanel.innerHTML = `<div class="empty-state">Henüz ERP iş emri bulunmuyor.</div>`;
    return;
  }

  erpWorkOrderListPanel.innerHTML = state.erp.workOrders.map((workOrder) => `
    <button class="project-card ${workOrder.id === state.erp.selectedWorkOrderId ? "active" : ""}" data-action="select-erp-work-order" data-work-order-id="${workOrder.id}">
      <div class="cell-stack">
        <strong>${escapeHtml(workOrder.erpNo)}</strong>
        <span class="muted">${escapeHtml(workOrder.projectCode)} | ${escapeHtml(workOrder.customerName || "-")}</span>
        <span class="muted">Teslim: ${escapeHtml(formatDate(workOrder.dueDate))}</span>
      </div>
      <div class="project-card-meta">
        <span class="badge ${workOrder.status === "Planlandı" ? "warn" : "good"}">${escapeHtml(workOrder.status)}</span>
        <span class="muted">${workOrder.lineCount} satır</span>
      </div>
    </button>
  `).join("");
}

function renderErpDetail() {
  if (!state.erp.selectedWorkOrder || !state.erp.dispatch) {
    erpDetailContent.innerHTML = "ERP detayını açmak için soldan bir iş emri seç.";
    return;
  }

  const { workOrder } = state.erp.selectedWorkOrder;
  const { dispatch } = state.erp;

  erpDetailContent.innerHTML = `
    <div class="selected-project-header">
      <div>
        <p class="eyebrow">${escapeHtml(workOrder.erpNo)}</p>
        <h3>${escapeHtml(workOrder.projectCode)} - ${escapeHtml(workOrder.customerName || "Müşteri bilgisi yok")}</h3>
        <p class="muted">${escapeHtml(workOrder.note || "ERP açıklaması girilmemiş")}</p>
      </div>
      <div class="project-progress-card">
        <strong>${dispatch.summary.readyLines}/${dispatch.summary.totalLines}</strong>
        <span class="muted">Hazır yönlendirme satırı</span>
      </div>
    </div>

    <div class="inline-actions top-export-actions">
      <span class="muted">Kaynak: ${escapeHtml(workOrder.sourceType || "mock")} | Termin: ${escapeHtml(formatDate(workOrder.dueDate))}</span>
      <div class="inline-actions">
        ${workOrder.linkedProjectCode ? `<span class="muted">Bağlı Proje: ${escapeHtml(workOrder.linkedProjectCode)}</span>` : ""}
        <button class="secondary" data-action="start-erp-operation" data-work-order-id="${escapeAttribute(workOrder.id)}" ${workOrder.linkedProjectId ? "disabled" : ""}>
          ${workOrder.linkedProjectId ? "Operasyona Aktarıldı" : "Operasyonu Başlat"}
        </button>
        <span class="badge ${dispatch.summary.waitingLines > 0 ? "warn" : "good"}">${dispatch.summary.waitingLines > 0 ? "Kural Bekliyor" : "Dağıtıma Hazır"}</span>
      </div>
    </div>

    <div class="erp-grid">
      <section class="ops-block">
        <div class="table-header">
          <h4>ERP'den Operasyona Geçiş</h4>
          <span class="muted">${dispatch.nextSteps.length} adım</span>
        </div>
        <div class="erp-stage-list">
          ${dispatch.nextSteps.map((step, index) => `
            <article class="erp-stage ${step.status}">
              <strong>${index + 1}. ${escapeHtml(step.title)}</strong>
              <p class="muted">${escapeHtml(step.description)}</p>
              <span class="erp-step-label">${escapeHtml(formatErpStepStatus(step.status))}</span>
            </article>
          `).join("")}
        </div>
      </section>

      <section class="ops-block">
        <div class="table-header">
          <h4>Departman Dağıtımı</h4>
          <span class="muted">${dispatch.departments.length} hedef</span>
        </div>
        <div class="erp-dispatch-list">
          ${dispatch.departments.map((bucket) => `
            <article class="erp-dispatch-card">
              <strong>${escapeHtml(bucket.departmentName || "Atamasız")}</strong>
              <p class="muted">${bucket.lineCount} satır | ${bucket.totalQuantity} adet</p>
              <p>${escapeHtml(bucket.assignees.length > 0 ? bucket.assignees.map((assignee) => assignee.fullName).join(", ") : "Atanacak kullanıcı bulunamadı")}</p>
            </article>
          `).join("")}
        </div>
      </section>
    </div>
  `;
}

async function loadErpData() {
  setErpStatus("ERP iş emirleri yükleniyor...");

  const workOrders = await requestJson("/api/erp/work-orders");
  state.erp.workOrders = workOrders;

  const stillExists = state.erp.workOrders.some((workOrder) => workOrder.id === state.erp.selectedWorkOrderId);
  if (!stillExists) {
    state.erp.selectedWorkOrderId = state.erp.workOrders[0]?.id || null;
  }

  renderErpWorkOrderList();

  if (!state.erp.selectedWorkOrderId) {
    state.erp.selectedWorkOrder = null;
    state.erp.dispatch = null;
    renderErpSummary();
    renderErpDetail();
    setErpStatus("ERP iş emri bulunamadı.");
    return;
  }

  await loadErpWorkOrder(state.erp.selectedWorkOrderId, { silent: true });
  setErpStatus("ERP önizleme ekranı güncel.");
}

async function loadErpWorkOrder(workOrderId, options = {}) {
  state.erp.selectedWorkOrderId = workOrderId;
  renderErpWorkOrderList();

  if (!options.silent) {
    setErpStatus("ERP iş emri detayı yükleniyor...");
  }

  const detail = await requestJson(`/api/erp/work-orders/${encodeURIComponent(workOrderId)}`);
  state.erp.selectedWorkOrder = detail;
  state.erp.dispatch = detail.dispatch;

  renderErpSummary();
  renderErpWorkOrderList();
  renderErpDetail();

  if (!options.silent) {
    setErpStatus(`${detail.workOrder.erpNo} için departman dağıtımı hazırlandı.`);
  }
}

async function handleErpClick(event) {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    return;
  }

  try {
    if (actionTarget.dataset.action === "select-erp-work-order") {
      await loadErpWorkOrder(actionTarget.dataset.workOrderId);
      return;
    }

    if (actionTarget.dataset.action === "start-erp-operation") {
      await startErpOperation(actionTarget.dataset.workOrderId);
    }
  } catch (error) {
    setErpStatus(`ERP işlemi tamamlanamadı: ${error.message}`);
  }
}

async function startErpOperation(workOrderId) {
  setErpStatus("ERP iş emri operasyona aktarılıyor...");

  const result = await requestJson(`/api/erp/work-orders/${encodeURIComponent(workOrderId)}/start`, {
    method: "POST",
  });

  await loadErpData();
  await loadOperationsData();
  await loadSelectedProject(result.project.id);
  switchPage("projects");
  setErpStatus(`${result.workOrder.erpNo} operasyona aktarıldı.`);
  setOperationsStatus(`${result.project.code} projesi oluşturuldu ve ${result.workflows.length} workflow hazırlandı.`);
}
