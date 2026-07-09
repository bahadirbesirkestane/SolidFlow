const {
  folderInput: workflowFolderInput,
  scanButton: workflowScanButton,
  statusText: workflowStatusText,
  stats: workflowStats,
  searchInput: workflowSearchInput,
  resultsBody: workflowResultsBody,
  partListBody: workflowPartListBody,
  partListStats: workflowPartListStats,
  partListSearchInput: workflowPartListSearchInput,
  partListCountText: workflowPartListCountText,
  scanInsightsSummary: workflowScanInsightsSummary,
  scanImpactList: workflowScanImpactList,
  uncertainFilesList: workflowUncertainFilesList,
  bulkWorkOrderCodeInput: workflowBulkWorkOrderCodeInput,
  bulkWorkOrderNameInput: workflowBulkWorkOrderNameInput,
  bulkWorkOrderDescriptionInput: workflowBulkWorkOrderDescriptionInput,
  bulkUploadPreview: workflowBulkUploadPreview,
} = window.workflowPageRefs;

function getWorkflowFolder() {
  return workflowFolderInput.value.trim();
}

function setWorkflowStatus(message) {
  workflowStatusText.textContent = message;
}

function resetWorkflowTableState() {
  workflowStats.innerHTML = "";
  workflowResultsBody.innerHTML = "";
  workflowPartListStats.innerHTML = "";
  workflowPartListCountText.textContent = "0 kalem";
  workflowPartListBody.innerHTML = "";
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
    createStatCard("Süreç atanmış", summary.assignedFiles),
    createStatCard("Belirsiz", summary.uncertainFiles, "warning"),
    createStatCard("Süreçler", topProcesses || "-"),
    createStatCard("Hizmetler", topServices || "-"),
  ].join("");
}

function renderRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    workflowResultsBody.innerHTML = `
      <tr>
        <td colspan="8" class="muted">Henüz iş akışı sonucu yok. Sayfa açıldığında klasör bilgisi varsa ilk tarama otomatik yapılır.</td>
      </tr>
    `;
    return;
  }

  workflowResultsBody.innerHTML = rows.map((row) => {
    const badgeClass = row.confidence === "Belirsiz" ? "warn" : "good";
    return `
      <tr>
        <td>${escapeHtml(row.partCode || "-")}</td>
        <td>
          <div class="cell-stack">
            <strong>${escapeHtml(row.fileName)}</strong>
            <span class="muted">${escapeHtml(row.folder)}</span>
            ${row.fileNameRule ? `<span class="muted">Dosya adı kuralı: ${escapeHtml(row.fileNameRule.name)} -> ${escapeHtml(row.fileNameRule.effectiveFileName)}</span>` : ""}
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
  const query = workflowSearchInput.value.trim().toLocaleLowerCase("tr");
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

function filteredPartList() {
  const query = workflowPartListSearchInput.value.trim().toLocaleLowerCase("tr");
  if (!query) {
    return state.partList.map((item, index) => ({ ...item, _sourceIndex: index }));
  }

  return state.partList.flatMap((item, index) => {
    const haystack = [
      item.partCode,
      item.fileName,
      item.mainGroup,
      item.suggestedProcess,
      item.serviceType,
      item.note,
    ].join(" ").toLocaleLowerCase("tr");

    return haystack.includes(query) ? [{ ...item, _sourceIndex: index }] : [];
  });
}

function renderPartListStats(partList) {
  const totalQuantity = partList.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const distinctGroups = new Set(partList.map((item) => item.mainGroup).filter(Boolean)).size;
  const notedCount = partList.filter((item) => String(item.note || "").trim()).length;

  workflowPartListStats.innerHTML = [
    createStatCard("Parça kalemi", String(partList.length)),
    createStatCard("Toplam adet", String(totalQuantity)),
    createStatCard("Ana grup", String(distinctGroups || 0)),
    createStatCard("Not girilen", String(notedCount || 0)),
  ].join("");
}

function renderPartList(partList) {
  if (!Array.isArray(partList) || partList.length === 0) {
    workflowPartListStats.innerHTML = "";
    workflowPartListCountText.textContent = "0 kalem";
    workflowPartListBody.innerHTML = `
      <tr>
        <td colspan="8" class="muted">Parça listesi henüz oluşmadı. Tarama tamamlandığında burada otomatik oluşur.</td>
      </tr>
    `;
    renderBulkUploadPreview();
    return;
  }

  workflowPartListCountText.textContent = partList.length === state.partList.length
    ? `${partList.length} kalem`
    : `${partList.length} / ${state.partList.length} kalem`;
  renderPartListStats(partList);

  workflowPartListBody.innerHTML = partList.map((item, index) => `
    <tr>
      <td><input class="inline-input" data-entity="partList" data-index="${item._sourceIndex ?? index}" data-field="partCode" value="${escapeAttribute(item.partCode || "")}" placeholder="Parça Kodu" /></td>
      <td>
        <div class="cell-stack">
          <strong>${escapeHtml(item.fileName || "-")}</strong>
          <span class="muted">${escapeHtml(item.files?.join(", ") || item.fileName || "-")}</span>
        </div>
      </td>
      <td><input class="inline-input" data-entity="partList" data-index="${item._sourceIndex ?? index}" data-field="mainGroup" value="${escapeAttribute(item.mainGroup || "")}" placeholder="Ana Grup" /></td>
      <td><input class="inline-input" data-entity="partList" data-index="${item._sourceIndex ?? index}" data-field="suggestedProcess" value="${escapeAttribute(item.suggestedProcess || "")}" placeholder="Süreç" /></td>
      <td><input class="inline-input" data-entity="partList" data-index="${item._sourceIndex ?? index}" data-field="serviceType" value="${escapeAttribute(item.serviceType || "")}" placeholder="Hizmet" /></td>
      <td><input class="inline-input quantity-cell" data-entity="partList" data-index="${item._sourceIndex ?? index}" data-field="quantity" type="number" min="0" value="${escapeAttribute(String(item.quantity || 0))}" /></td>
      <td>${escapeHtml(String(item.fileCount || 0))}</td>
      <td><input class="inline-input" data-entity="partList" data-index="${item._sourceIndex ?? index}" data-field="note" value="${escapeAttribute(item.note || "")}" placeholder="Opsiyonel not" /></td>
    </tr>
  `).join("");
  renderBulkUploadPreview();
}

function renderBulkUploadPreview() {
  if (!workflowBulkUploadPreview) {
    return;
  }

  if (!Array.isArray(state.partList) || state.partList.length === 0) {
    workflowBulkUploadPreview.innerHTML = [
      createStatCard("Hazır kalem", "0"),
      createStatCard("Yüklenecek workflow", "0"),
      createStatCard("Süreç", "0"),
      createStatCard("Not", "Önce tarama yap", "warning"),
    ].join("");
    return;
  }

  const processSet = new Set();
  let workflowCount = 0;
  for (const item of state.partList) {
    if (item.suggestedProcess) {
      processSet.add(item.suggestedProcess);
    }

    if (canCreateWorkflowFromPart(item)) {
      workflowCount += 1;
    }
  }

  workflowBulkUploadPreview.innerHTML = [
    createStatCard("Hazır kalem", String(state.partList.length)),
    createStatCard("Yüklenecek workflow", String(workflowCount), workflowCount === 0 ? "warning" : ""),
    createStatCard("Süreç", String(processSet.size)),
    createStatCard("Toplam adet", String(state.partList.reduce((total, item) => total + Number(item.quantity || 0), 0))),
  ].join("");
}

function renderScanInsights(insights) {
  if (!insights) {
    scanInsightsSummary.innerHTML = "";
    scanImpactList.innerHTML = `<div class="empty-state">Kural etkisini görmek için önce klasör tara.</div>`;
    uncertainFilesList.innerHTML = `<div class="empty-state">Belirsiz dosya listesi tarama sonrasında dolacak.</div>`;
    return;
  }

  const quality = insights.quality || {};
  const uncertainRows = Array.isArray(insights.uncertainRows) ? insights.uncertainRows : [];
  const fileNameRuleHits = insights.fileNameRuleHits || {};
  const confidenceCounts = insights.confidenceCounts || {};
  const matchedBy = insights.matchedBy || {};

  scanInsightsSummary.innerHTML = [
    createStatCard("Belirsiz dosya", String(quality.uncertainFiles || 0), (quality.uncertainFiles || 0) > 0 ? "warning" : ""),
    createStatCard("Dosya adı dönüşümü", String(quality.transformedFiles || 0)),
    createStatCard("Override", String(quality.manualOverrides || 0)),
    createStatCard("Kesin eşleşme", String(quality.exactMatches || 0)),
    createStatCard("Tahmini eşleşme", String(quality.estimatedMatches || 0)),
  ].join("");

  scanImpactList.innerHTML = [
    createInsightSection("Kural Kaynakları", Object.entries(matchedBy)),
    createInsightSection("Güven Dağılımı", Object.entries(confidenceCounts)),
    createInsightSection("Dosya Adı Kuralı Etkisi", Object.entries(fileNameRuleHits)),
  ].join("");

  uncertainFilesList.innerHTML = uncertainRows.length === 0
    ? `<div class="empty-state">Belirsiz dosya kalmadı. Yeni kurallar beklendiği gibi çalışıyor.</div>`
    : uncertainRows.map((row) => `
      <article class="insight-card">
        <strong>${escapeHtml(row.fileName)}</strong>
        <p class="muted">${escapeHtml(row.folder)}</p>
        <p>Eşleşme: ${escapeHtml(row.matchedBy || "Belirsiz")}</p>
      </article>
    `).join("");
}

function createInsightSection(title, collection) {
  const lines = collection
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([label, value]) => `<p class="muted">${escapeHtml(label || "Belirsiz")}: <strong>${escapeHtml(String(value))}</strong></p>`)
    .join("");

  return `
    <article class="insight-card">
      <strong>${escapeHtml(title)}</strong>
      <div class="cell-stack">
        ${lines || `<p class="muted">Veri yok.</p>`}
      </div>
    </article>
  `;
}

function handlePartListInput(event) {
  const target = event.target;
  const index = Number(target.dataset.index);
  const field = target.dataset.field;
  if (target.dataset.entity !== "partList" || Number.isNaN(index) || !field) {
    return;
  }

  const normalizedValue = target.type === "number"
    ? Number(target.value || 0)
    : target.value;

  state.partList[index][field] = normalizedValue;
  renderPartList(filteredPartList());
}

async function scanFolder() {
  if (window.location.protocol === "file:") {
    setWorkflowStatus("Bu ekran doğrudan dosya olarak açılmış. Lütfen BASLAT.bat veya npm start ile sunucuyu başlat.");
    return;
  }

  workflowScanButton.disabled = true;
  setWorkflowStatus("Tarama başlatıldı...");

  try {
    const folder = getWorkflowFolder();
    const response = await requestJson(`/api/scan?folder=${encodeURIComponent(folder)}`);
    state.rows = response.rows;
    state.partListBase = clonePartList(Array.isArray(response.partList) ? response.partList : []);
    state.partList = clonePartList(state.partListBase);
    state.scanInsights = response.insights || null;
    renderStats(response.summary);
    renderRows(filteredRows());
    renderPartList(filteredPartList());
    renderScanInsights(state.scanInsights);
    if (!workflowBulkWorkOrderCodeInput.value.trim() || !workflowBulkWorkOrderNameInput.value.trim()) {
      prefillBulkWorkOrderForm();
    }
    setWorkflowStatus(`${response.scannedFolder} klasörü tarandı. ${response.rows.length} dosya bulundu, ${state.partList.length} parça kalemi oluşturuldu.`);
  } catch (error) {
    resetWorkflowTableState();
    renderScanInsights(null);
    setWorkflowStatus(`Hata: ${error.message}. Sunucunun http://127.0.0.1:3000 üzerinde çalıştığından emin ol.`);
  } finally {
    workflowScanButton.disabled = false;
  }
}

function resetPartListEdits() {
  state.partList = clonePartList(state.partListBase);
  workflowPartListSearchInput.value = "";
  renderPartList(filteredPartList());
  setWorkflowStatus("Parça listesi düzenlemeleri son tarama çıktısına geri alındı.");
}

function prefillBulkWorkOrderForm() {
  const folder = getWorkflowFolder();
  if (!folder) {
    setBulkWorkOrderStatus("Klasör bilgisi bulunamadı.");
    return;
  }

  const folderSegments = folder.split(/[/\\]+/).filter(Boolean);
  const folderName = folderSegments.at(-1) || "";
  const guessedCode = folderName.split(/\s+/)[0] || folderName;

  workflowBulkWorkOrderCodeInput.value = workflowBulkWorkOrderCodeInput.value.trim() || guessedCode;
  workflowBulkWorkOrderNameInput.value = workflowBulkWorkOrderNameInput.value.trim() || folderName;
  workflowBulkWorkOrderDescriptionInput.value = workflowBulkWorkOrderDescriptionInput.value.trim() || `${folderName} tarama çıktısından oluşturuldu.`;
  setBulkWorkOrderStatus("Form klasör bilgisiyle dolduruldu.");
}

async function handleBulkWorkOrderSubmit(event) {
  event.preventDefault();

  if (!Array.isArray(state.partList) || state.partList.length === 0) {
    setBulkWorkOrderStatus("Önce tarama yapıp parça listesi oluştur.");
    return;
  }

  const creatablePartList = state.partList.filter(canCreateWorkflowFromPart);
  if (creatablePartList.length === 0) {
    setBulkWorkOrderStatus("Workflow oluşturabilecek süreç eşleşmesi bulunamadı.");
    return;
  }

  setBulkWorkOrderStatus("Toplu iş emri operasyona aktarılıyor...");

  try {
    const result = await requestJson("/api/operations/projects/bulk-work-orders", {
      method: "POST",
      body: JSON.stringify({
        code: workflowBulkWorkOrderCodeInput.value.trim(),
        name: workflowBulkWorkOrderNameInput.value.trim(),
        description: workflowBulkWorkOrderDescriptionInput.value.trim(),
        partList: creatablePartList,
      }),
    });

    await loadOperationsData();
    await loadSelectedProject(result.project.id);
    navigateToPage("projects");
    setBulkWorkOrderStatus(`${result.project.code} için ${result.workflows.length} workflow oluşturuldu.`);
    setOperationsStatus(`${result.project.name} operasyona aktarıldı. Dosya, süreç ve kullanıcı yerleşimini proje panelinden inceleyebilirsin.`);
  } catch (error) {
    setBulkWorkOrderStatus(`Toplu iş emri hatası: ${error.message}`);
  }
}

function exportCurrentRowsToCsv() {
  if (state.rows.length === 0) {
    setWorkflowStatus("Aktarılacak veri yok. Önce tarama yap.");
    return;
  }

  const rows = filteredRows();
  const headers = ["Parça Kodu", "Dosya Adı", "Dosya Tipi", "Ana Grup", "Süreç", "Hizmet", "Güven", "Eşleşme", "Klasör", "Göreli Yol"];
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
  setWorkflowStatus(`${rows.length} satırlık CSV raporu indirildi.`);
}

async function exportCurrentRowsToExcel() {
  const folder = getWorkflowFolder();
  if (!folder) {
    setWorkflowStatus("Excel aktarımı için önce klasör yolu gerekli.");
    return;
  }

  setWorkflowStatus("Excel raporu hazırlanıyor...");

  try {
    const response = await apiClient.apiFetch(`/api/reports/workflow.xlsx?folder=${encodeURIComponent(folder)}`);
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
    setWorkflowStatus("Excel raporu indirildi.");
  } catch (error) {
    setWorkflowStatus(`Excel export hatası: ${error.message}`);
  }
}

async function exportPartListToExcel() {
  const folder = getWorkflowFolder();
  if (!folder) {
    setWorkflowStatus("Parça listesi Excel aktarımı için önce klasör yolu gerekli.");
    return;
  }

  if (!state.rows.length) {
    setWorkflowStatus("Parça listesi Excel aktarımı için önce tarama yap.");
    return;
  }

  setWorkflowStatus("Parça listesi Excel raporu hazırlanıyor...");

  try {
    const response = await apiClient.apiFetch("/api/reports/workflow.xlsx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scannedFolder: folder,
        summary: buildSummaryFromRows(state.rows),
        rows: state.rows,
        partList: state.partList,
      }),
    });

    if (!response.ok) {
      throw new Error(await readErrorResponse(response));
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "solid-workflow-ve-parca-listesi.xlsx";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setWorkflowStatus("Parça listesi dahil Excel raporu indirildi.");
  } catch (error) {
    setWorkflowStatus(`Parça listesi Excel export hatası: ${error.message}`);
  }
}
