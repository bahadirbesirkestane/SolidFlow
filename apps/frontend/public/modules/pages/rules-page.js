const {
  fileTypeRulesBody: rulesFileTypeRulesBody,
  keywordRulesBody: rulesKeywordRulesBody,
  fileNameRulesBody: rulesFileNameRulesBody,
  overrideRulesBody: rulesOverrideRulesBody,
  overrideMatchMode: rulesOverrideMatchMode,
  overridePartCode: rulesOverridePartCode,
  overrideFileName: rulesOverrideFileName,
  overrideProcess: rulesOverrideProcess,
  overrideServiceType: rulesOverrideServiceType,
  overrideNote: rulesOverrideNote,
} = window.rulesPageRefs;
const { statusText: rulesStatusText } = window.workflowPageRefs;

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

async function loadFileNameRules() {
  state.fileNameRules = await requestJson("/api/config/file-name-rules");
  await loadRuleResolverConfig();
  renderFileNameRules();
  return state.fileNameRules;
}

async function loadOverrides() {
  state.overrides = await requestJson("/api/config/part-overrides");
  renderOverrides();
  return state.overrides;
}

async function loadRuleResolverConfig() {
  state.ruleResolverConfig = await requestJson("/api/config/rule-resolver");
  renderRuleResolverConfig();
  return state.ruleResolverConfig;
}

function renderFileTypeRules() {
  if (state.fileTypeRules.length === 0) {
    rulesFileTypeRulesBody.innerHTML = `
      <tr>
        <td colspan="5" class="muted">Henuz dosya tipi verisi yuklenmedi veya kayit bulunmuyor.</td>
      </tr>
    `;
    return;
  }

  rulesFileTypeRulesBody.innerHTML = state.fileTypeRules.map((rule, index) => `
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
    rulesKeywordRulesBody.innerHTML = `
      <tr>
        <td colspan="5" class="muted">Henuz keyword verisi yuklenmedi veya kayit bulunmuyor.</td>
      </tr>
    `;
    return;
  }

  rulesKeywordRulesBody.innerHTML = state.keywordRules.map((rule, index) => `
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

function renderFileNameRules() {
  if (state.fileNameRules.length === 0) {
    rulesFileNameRulesBody.innerHTML = `
      <article class="rule-card-empty">
        <strong>Henuz dosya adi stratejisi yok.</strong>
        <p class="muted">Yeni Strateji butonuyla ilk kurali ekleyebilir veya kayitli verileri yenileyebilirsin.</p>
      </article>
    `;
    return;
  }

  rulesFileNameRulesBody.innerHTML = state.fileNameRules.map((rule, index) => `
    <article class="rule-editor-card">
      <div class="rule-editor-card-head">
        <div>
          <p class="eyebrow">Kural ${index + 1}</p>
          <input class="inline-input rule-title-input" data-entity="fileNameRule" data-index="${index}" data-field="name" value="${escapeAttribute(rule.name || "")}" placeholder="Kural adi" />
        </div>
        <div class="rule-editor-card-actions">
          <label class="rule-active-toggle">
            <input type="checkbox" data-entity="fileNameRule" data-index="${index}" data-field="isActive" ${rule.isActive ? "checked" : ""} />
            <span>Aktif</span>
          </label>
          <button class="secondary link-button" data-action="delete-file-name-rule" data-index="${index}">Sil</button>
        </div>
      </div>

      <div class="rule-editor-grid">
        <label>
          <span>Strateji</span>
          <select class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="strategyType">
            <option value="normalize" ${rule.strategyType === "normalize" ? "selected" : ""}>Normalize</option>
            <option value="classify" ${rule.strategyType === "classify" ? "selected" : ""}>Siniflandir</option>
            <option value="route" ${rule.strategyType === "route" ? "selected" : ""}>Yonlendir</option>
            <option value="hybrid" ${rule.strategyType === "hybrid" ? "selected" : ""}>Karma</option>
          </select>
        </label>
        <label>
          <span>Esleme Tipi</span>
          <select class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="patternMode">
            <option value="prefix" ${rule.patternMode === "prefix" ? "selected" : ""}>On Ek</option>
            <option value="suffix" ${rule.patternMode === "suffix" ? "selected" : ""}>Son Ek</option>
            <option value="contains" ${rule.patternMode === "contains" ? "selected" : ""}>Icerir</option>
            <option value="template" ${rule.patternMode === "template" ? "selected" : ""}>Sablon</option>
            <option value="regex" ${rule.patternMode === "regex" ? "selected" : ""}>Regex</option>
          </select>
        </label>
        <label>
          <span>Hedef Alan</span>
          <select class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="applyTo">
            <option value="fileName" ${rule.applyTo === "fileName" ? "selected" : ""}>Tam Dosya Adi</option>
            <option value="baseName" ${rule.applyTo === "baseName" ? "selected" : ""}>Uzantisiz Ad</option>
          </select>
        </label>
        <label>
          <span>Oncelik</span>
          <input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="priority" type="number" value="${escapeAttribute(String(rule.priority || 0))}" />
        </label>
      </div>

      <div class="rule-editor-grid">
        <label class="rule-span-2">
          <span>Desen</span>
          <input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="patternValue" value="${escapeAttribute(rule.patternValue || "")}" placeholder="Ornek: SA_" />
        </label>
        <label class="rule-span-2">
          <span>Donusum</span>
          <input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="replacementValue" value="${escapeAttribute(rule.replacementValue || "")}" placeholder="Bos ise yakalanan deger kullanilir" />
        </label>
      </div>

      <div class="rule-editor-grid">
        <label>
          <span>Surec</span>
          <input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="process" value="${escapeAttribute(rule.process || "")}" placeholder="Opsiyonel surec" />
        </label>
        <label>
          <span>Hizmet</span>
          <input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="serviceType" value="${escapeAttribute(rule.serviceType || "")}" placeholder="Opsiyonel hizmet" />
        </label>
        <label>
          <span>Workflow Template</span>
          <input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="workflowTemplateId" value="${escapeAttribute(rule.workflowTemplateId || "")}" placeholder="template-production-flow" />
        </label>
        <label>
          <span>Grup Modu</span>
          <select class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="flowGroupMode">
            <option value="auto" ${rule.flowGroupMode === "auto" ? "selected" : ""}>Otomatik</option>
            <option value="mainGroup" ${rule.flowGroupMode === "mainGroup" ? "selected" : ""}>Ana Grup</option>
            <option value="folder" ${rule.flowGroupMode === "folder" ? "selected" : ""}>Klasor</option>
            <option value="partCode" ${rule.flowGroupMode === "partCode" ? "selected" : ""}>Parca Kodu</option>
            <option value="fileName" ${rule.flowGroupMode === "fileName" ? "selected" : ""}>Dosya Adi</option>
            <option value="fixed" ${rule.flowGroupMode === "fixed" ? "selected" : ""}>Sabit</option>
          </select>
        </label>
      </div>

      <div class="rule-editor-grid">
        <label class="rule-span-2">
          <span>Grup Degeri</span>
          <input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="flowGroupValue" value="${escapeAttribute(rule.flowGroupValue || "")}" placeholder="Sabit grup degeri" />
        </label>
        <label class="rule-span-2">
          <span>Etiket Sablonu</span>
          <input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="itemLabelTemplate" value="${escapeAttribute(rule.itemLabelTemplate || "")}" placeholder="{group} / {partCode}" />
        </label>
      </div>

      <label>
        <span>Not</span>
        <input class="inline-input" data-entity="fileNameRule" data-index="${index}" data-field="note" value="${escapeAttribute(rule.note || "")}" placeholder="Kural amaci ve ornek kullanim" />
      </label>
    </article>
  `).join("");
}

function renderRuleResolverConfig() {
  const summaryElement = document.getElementById("ruleResolverSummary");
  const precedenceElement = document.getElementById("ruleResolverPrecedence");
  const sourceListElement = document.getElementById("ruleResolverSourceList");
  if (!summaryElement || !precedenceElement || !sourceListElement) {
    return;
  }

  if (!state.ruleResolverConfig) {
    summaryElement.innerHTML = "";
    precedenceElement.innerHTML = "";
    sourceListElement.innerHTML = `<div class="empty-state">Resolver yapisi yuklenemedi.</div>`;
    return;
  }

  const counts = state.ruleResolverConfig.counts || {};
  const precedence = Array.isArray(state.ruleResolverConfig.precedence) ? state.ruleResolverConfig.precedence : [];
  const sources = state.ruleResolverConfig.sources || {};

  summaryElement.innerHTML = [
    createStatCard("Toplam aktif kural", String(counts.totalActiveRules || 0)),
    createStatCard("Override", String(counts.overrides || 0)),
    createStatCard("Dosya adi", String(counts.fileNameRules || 0)),
    createStatCard("Keyword", String(counts.keywordRules || 0)),
    createStatCard("Uzanti", String(counts.fileTypeRules || 0)),
  ].join("");

  precedenceElement.innerHTML = precedence.map((step, index) => `
    <span class="badge ${index === 0 ? "warn" : "good"}">${escapeHtml(`${index + 1}. ${formatResolverStep(step)}`)}</span>
  `).join("");

  sourceListElement.innerHTML = [
    createResolverSourceCard("Override katmani", sources.overrides || []),
    createResolverSourceCard("Dosya adi stratejileri", sources.fileNameRules || []),
    createResolverSourceCard("Keyword kurallari", sources.keywordRules || []),
  ].join("");
}

function formatResolverStep(step) {
  const labels = {
    override: "Override",
    fileName: "Dosya Adi",
    keyword: "Keyword",
    fileType: "Uzanti",
    fallback: "Fallback",
  };

  return labels[step] || step;
}

function createResolverSourceCard(title, collection) {
  const lines = collection.slice(0, 5).map((item) => {
    const detail = [item.process, item.serviceType, item.routingKey].filter(Boolean).join(" | ");
    return `<p class="muted">${escapeHtml(item.label || item.matchValue || item.id)}${detail ? `: <strong>${escapeHtml(detail)}</strong>` : ""}</p>`;
  }).join("");

  return `
    <article class="insight-card adminlte-feed-card">
      <strong>${escapeHtml(title)}</strong>
      <div class="cell-stack">
        ${lines || `<p class="muted">Aktif kural yok.</p>`}
      </div>
    </article>
  `;
}

function renderOverrides() {
  if (state.overrides.length === 0) {
    rulesOverrideRulesBody.innerHTML = `
      <tr>
        <td colspan="8" class="muted">Henuz override kaydi bulunmuyor.</td>
      </tr>
    `;
    return;
  }

  rulesOverrideRulesBody.innerHTML = state.overrides.map((override, index) => `
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

async function saveFileTypeRules() {
  state.fileTypeRules = await requestJson("/api/config/file-types", {
    method: "PUT",
    body: JSON.stringify(state.fileTypeRules),
  });
  await loadRuleResolverConfig();
  renderFileTypeRules();
  rulesStatusText.textContent = "Dosya tipi kurallari kaydedildi.";
}

async function saveKeywordRules() {
  state.keywordRules = await requestJson("/api/config/keyword-rules", {
    method: "PUT",
    body: JSON.stringify(state.keywordRules),
  });
  await loadRuleResolverConfig();
  renderKeywordRules();
  rulesStatusText.textContent = "Keyword kurallari kaydedildi.";
}

async function saveFileNameRules() {
  state.fileNameRules = await requestJson("/api/config/file-name-rules", {
    method: "PUT",
    body: JSON.stringify(state.fileNameRules),
  });
  await loadRuleResolverConfig();
  renderFileNameRules();
  rulesStatusText.textContent = "Dosya adi stratejileri kaydedildi.";
}

async function saveOverrides() {
  maybePersistDraftOverride();
  state.overrides = await requestJson("/api/config/part-overrides", {
    method: "PUT",
    body: JSON.stringify(state.overrides),
  });
  await loadRuleResolverConfig();
  state.editingOverrideId = null;
  clearOverrideForm();
  renderOverrides();
  rulesStatusText.textContent = "Override kurallari kaydedildi.";
}

function appendNewFileTypeRule() {
  state.fileTypeRules.push({
    extension: ".NEW",
    displayName: "Yeni Dosya",
    defaultProcess: "Belirsiz",
    defaultServiceType: "Belirsiz",
    isActive: true,
  });
  renderFileTypeRules();
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

function appendFileNameRule() {
  state.fileNameRules.unshift({
    id: `file-name-rule-${Date.now()}`,
    name: "Yeni dosya adi stratejisi",
    strategyType: "normalize",
    patternMode: "prefix",
    patternValue: "",
    replacementValue: "",
    process: "",
    serviceType: "",
    workflowTemplateId: "",
    flowGroupMode: "auto",
    flowGroupValue: "",
    itemLabelTemplate: "",
    priority: 0,
    applyTo: "fileName",
    note: "",
    isActive: true,
  });
  renderFileNameRules();
}

function clearOverrideForm() {
  rulesOverrideMatchMode.value = "partCode";
  rulesOverridePartCode.value = "";
  rulesOverrideFileName.value = "";
  rulesOverrideProcess.value = "";
  rulesOverrideServiceType.value = "";
  rulesOverrideNote.value = "";
  state.editingOverrideId = null;
}

function prefillOverrideForm(payload) {
  rulesOverrideMatchMode.value = payload.partCode ? "partCode" : "fileName";
  rulesOverridePartCode.value = payload.partCode || "";
  rulesOverrideFileName.value = payload.fileName || "";
  rulesOverrideProcess.value = payload.process || "";
  rulesOverrideServiceType.value = payload.serviceType || "";
  rulesOverrideNote.value = payload.note || "";
}

function createOverrideFromForm() {
  return {
    id: state.editingOverrideId || `override-${Date.now()}`,
    matchMode: rulesOverrideMatchMode.value,
    partCode: rulesOverridePartCode.value.trim(),
    fileName: rulesOverrideFileName.value.trim(),
    process: rulesOverrideProcess.value.trim(),
    serviceType: rulesOverrideServiceType.value.trim(),
    note: rulesOverrideNote.value.trim(),
    isActive: true,
  };
}

function upsertOverrideFromForm() {
  const override = createOverrideFromForm();
  const index = state.overrides.findIndex((item) => item.id === override.id);

  if (index >= 0) {
    state.overrides[index] = override;
  } else {
    state.overrides.unshift(override);
  }

  state.editingOverrideId = null;
  clearOverrideForm();
  renderOverrides();
}

function hasDraftOverride() {
  return Boolean(
    rulesOverridePartCode.value.trim()
    || rulesOverrideFileName.value.trim()
    || rulesOverrideProcess.value.trim()
    || rulesOverrideServiceType.value.trim()
    || rulesOverrideNote.value.trim()
  );
}

function maybePersistDraftOverride() {
  if (hasDraftOverride()) {
    upsertOverrideFromForm();
  }
}

function handleTableInput(event) {
  const target = event.target;
  const entity = target.dataset.entity;
  const index = Number(target.dataset.index);
  const field = target.dataset.field;
  if (!entity || Number.isNaN(index) || !field) {
    return;
  }

  const collection = entity === "fileTypeRule"
    ? state.fileTypeRules
    : entity === "keywordRule"
      ? state.keywordRules
      : state.fileNameRules;

  collection[index][field] = target.type === "checkbox" ? target.checked : target.value;
}

function handleOverrideTableInput(event) {
  const target = event.target;
  const index = Number(target.dataset.index);
  const field = target.dataset.field;
  if (Number.isNaN(index) || !field) {
    return;
  }

  state.overrides[index][field] = target.type === "checkbox" ? target.checked : target.value;
}

function handleBodyClick(event) {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) {
    return;
  }

  if (actionTarget.dataset.action === "prefill-override") {
    prefillOverrideForm({
      partCode: actionTarget.dataset.partCode,
      fileName: actionTarget.dataset.fileName,
      process: actionTarget.dataset.process,
      serviceType: actionTarget.dataset.serviceType,
    });
    switchPage("rule-overrides");
    navigateToPage("rule-overrides");
    return;
  }

  if (actionTarget.dataset.action === "open-scan-model-preview") {
    openScanModelPreview(getWorkflowFolder(), {
      partCode: actionTarget.dataset.partCode,
      fileName: actionTarget.dataset.fileName,
      effectiveFileName: actionTarget.dataset.effectiveFileName,
      title: actionTarget.dataset.title,
    });
    return;
  }

  if (actionTarget.dataset.action === "delete-file-name-rule") {
    state.fileNameRules.splice(Number(actionTarget.dataset.index), 1);
    renderFileNameRules();
    return;
  }

  if (actionTarget.dataset.action === "edit-override") {
    const override = state.overrides[Number(actionTarget.dataset.index)];
    if (override) {
      state.editingOverrideId = override.id;
      prefillOverrideForm(override);
    }
    return;
  }

  if (actionTarget.dataset.action === "delete-override") {
    state.overrides.splice(Number(actionTarget.dataset.index), 1);
    renderOverrides();
  }
}
